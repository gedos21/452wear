"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { useFinePointer } from "@/hooks/use-fine-pointer";
import { cn } from "@/lib/utils";
import {
  cardTransform,
  clamp,
  createRope,
  restEnergy,
  ropePath,
  SEGMENTS,
  simulateStep,
  swingLimit,
  type Point,
  type RopeConfig,
} from "./lanyard-physics";

/**
 * React Bits — Lanyard (https://reactbits.dev/components/lanyard)
 *
 * Orijinali three.js + @react-three/rapier üzerinde çalışıyor ve React Bits'in
 * göndermediği bir `card.glb` modeline bağlı. Burada aynı fizik modeli 2B'de
 * kuruldu (bkz. lanyard-physics.ts): ip rijit bir çubuk değil — bükülüyor,
 * geriliyor, kart ucunda ayrıca sallanıyor ve bırakıldığında momentumla
 * yerine oturuyor. Bu dosya yalnızca ölçüm, döngü ve girdiyi yönetir.
 */

const REST_EPSILON = 2;

type LanyardProps = {
  children: React.ReactNode;
  /** İpin dinlenme uzunluğu (piksel) */
  strapLength?: number;
  /** Bölüm görünür olduğunda verilen ilk dürtme (px/sn); 0 = kapalı */
  revealImpulse?: number;
  /** Dış sarmalayıcı — kartın sallanacağı alan. Kartın kendisinden geniş olmalı. */
  className?: string;
  /** Kartın kendi genişliği/hizası. Sarmalayıcıdan dar tutulmalı ki salınıma yer kalsın. */
  cardClassName?: string;
};

export function Lanyard({
  children,
  strapLength = 110,
  revealImpulse = 190,
  className,
  cardClassName,
}: LanyardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const ropeRef = useRef<SVGPathElement>(null);
  const rafRef = useRef<number | null>(null);
  const stepRef = useRef<(() => void) | null>(null);

  const ptsRef = useRef<Point[] | null>(null);
  const cfgRef = useRef<RopeConfig | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const grabRef = useRef({ dx: 0, dy: 0 });
  const clockRef = useRef({ acc: 0, last: 0, running: false });

  const reduced = useReducedMotion();
  const finePointer = useFinePointer();

  /**
   * Yalnızca ölçüm — nokta konumlarına dokunmaz.
   * Ayrı tutuluyor ki sarmalayıcı simülasyon çalışırken yeniden boyutlansa
   * bile ölçüm tazelensin; aksi halde bayat genişlikle çalışılır ve hem ip
   * yanlış merkeze çizilir hem de yatay clamp neredeyse sıfıra iner.
   */
  const measure = useCallback((): RopeConfig | null => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card || wrap.clientWidth === 0) return null;

    const cfg: RopeConfig = {
      width: wrap.clientWidth,
      // Dokunmatikte daha dar pay: kart ekran kenarından taşıp kırpılmasın.
      swingSlack: finePointer ? 0.15 : 0.06,
      strapLength,
      segLen: strapLength / SEGMENTS,
      cardW: card.clientWidth,
      cardH: card.clientHeight,
    };
    cfgRef.current = cfg;
    return cfg;
  }, [finePointer, strapLength]);

  /** Ölçüp ipi dinlenme konumunda yeniden kurar. */
  const layout = useCallback(() => {
    const cfg = measure();
    if (cfg) ptsRef.current = createRope(cfg);
  }, [measure]);


  const render = useCallback(() => {
    const pts = ptsRef.current;
    const cfg = cfgRef.current;
    if (!pts || !cfg) return;
    ropeRef.current?.setAttribute("d", ropePath(pts));
    if (cardRef.current) {
      cardRef.current.style.transform = cardTransform(pts, cfg);
    }
  }, []);

  /**
   * Ölçüm bayatladıysa ipi yeniden kurar; her etkileşimin başında çağrılır.
   * ResizeObserver tek başına yeterli değil: callback'i render hattında
   * teslim edilir, yani sekme görünmezken hiç çalışmaz. Bayat genişlikle
   * kalınırsa ip yanlış merkeze çizilir ve yatay sürükleme clamp'e takılır.
   */
  const sync = useCallback(() => {
    const prev = cfgRef.current;
    const cfg = measure();
    if (!cfg || dragRef.current) return;

    const stale =
      !ptsRef.current ||
      !prev ||
      prev.width !== cfg.width ||
      prev.cardW !== cfg.cardW ||
      prev.cardH !== cfg.cardH;

    if (stale) {
      ptsRef.current = createRope(cfg);
      render();
    }
  }, [measure, render]);

  const step = useCallback(() => {
    const pts = ptsRef.current;
    const cfg = cfgRef.current;
    const clock = clockRef.current;
    if (!pts || !cfg) return;

    const now = performance.now();
    clock.acc = Math.min(clock.acc + (now - clock.last) / 1000, 0.2);
    clock.last = now;

    // Sabit adım — referanstaki timeStep ile aynı mantık: mobilde yarı çözünürlük.
    const dt = finePointer ? 1 / 60 : 1 / 30;
    const iterations = finePointer ? 6 : 3;

    while (clock.acc >= dt) {
      simulateStep(pts, cfg, dt, iterations, dragRef.current);
      clock.acc -= dt;
    }

    render();

    if (dragRef.current || restEnergy(pts, cfg) > REST_EPSILON) {
      rafRef.current = requestAnimationFrame(() => stepRef.current?.());
    } else {
      // Olduğu yerde bırak ve dur; boşta rAF yakma.
      // (layout() ile sıfırlamıyoruz — ipin doğal çökmesi korunsun, zıplama olmasın.)
      clock.running = false;
      rafRef.current = null;
    }
  }, [finePointer, render]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const start = useCallback(() => {
    const clock = clockRef.current;
    if (clock.running || reduced || !ptsRef.current) return;
    clock.running = true;
    clock.acc = 0;
    clock.last = performance.now();
    rafRef.current = requestAnimationFrame(() => stepRef.current?.());
  }, [reduced]);

  // İlk ölçüm + yeniden boyutlanma
  useEffect(() => {
    layout();
    render();
    const wrap = wrapRef.current;
    if (!wrap) return;
    // Sürükleme sırasında yalnızca ölçüm tazelenir, ip sıfırlanmaz.
    const ro = new ResizeObserver(() => {
      if (dragRef.current) measure();
      else sync();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [layout, measure, render, sync]);

  // Görünür alana girince bir kez hafif dürtme
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reduced || revealImpulse === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        sync();
        const com = ptsRef.current?.[SEGMENTS + 1];
        if (!com) return;
        // Verlet'te hız = konum − önceki konum: geçmişi kaydırarak ivme veriyoruz.
        com.px = com.x - revealImpulse / 60;
        start();
      },
      { threshold: 0.3 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [reduced, revealImpulse, start, sync]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const localPoint = (clientX: number, clientY: number) => {
    const r = wrapRef.current!.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (reduced) return;
    sync();
    const com = ptsRef.current?.[SEGMENTS + 1];
    if (!com) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const p = localPoint(e.clientX, e.clientY);
    grabRef.current = { dx: com.x - p.x, dy: com.y - p.y };
    dragRef.current = { x: com.x, y: com.y };
    start();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const cfg = cfgRef.current;
    if (!dragRef.current || !cfg) return;

    const p = localPoint(e.clientX, e.clientY);
    const grab = grabRef.current;
    const ax = cfg.width / 2;
    const limit = swingLimit(cfg);
    const restY = cfg.strapLength + cfg.cardH / 2;

    dragRef.current = {
      x: clamp(p.x + grab.dx, ax - limit, ax + limit),
      y: clamp(p.y + grab.dy, restY - cfg.strapLength * 0.5, restY + 56),
    };
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <div
      ref={wrapRef}
      className={cn("relative mx-auto w-full select-none", className)}
      style={{ perspective: "1200px", paddingTop: strapLength }}
    >
      {/* İp: noktalardan geçen, bükülebilen eğri */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-foreground/75"
        aria-hidden
      >
        <path
          ref={ropeRef}
          fill="none"
          stroke="currentColor"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Asma noktası */}
      <div className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-foreground/25" />

      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn("relative will-change-transform", cardClassName)}
        style={{
          transformOrigin: "top center",
          // Dikey kaydırma sayfaya geçsin, yatay sürükleme karta gelsin.
          touchAction: "pan-y",
          cursor: reduced ? undefined : "grab",
        }}
      >
        {children}
      </div>
    </div>
  );
}
