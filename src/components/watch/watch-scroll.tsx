"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { WATCH_FRAMES } from "./watch-frames";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/**
 * 452 Watch girişi: sayfa kaydırıldıkça saat parçalarına ayrılır.
 *
 * Kareler (public/watch/frames) bir canvas'a çizilir; scroll ilerlemesi
 * hangi karenin görüneceğini belirler (Apple ürün sayfalarındaki teknik).
 * Kareler scripts/watch-frames.mjs ile videodan üretilir. Henüz kare yoksa
 * ya da kullanıcı hareketi azaltmayı seçtiyse sabit poster gösterilir.
 */

const POSTER = "/watch/poster.webp";

/** Sabitlenen sahnenin kaç ekran boyu kaydırılacağı (animasyonun uzunluğu). */
const SCROLL_SCREENS = 3.2;

/** Aynı anda inen kare sayısı; ağı boğmadan sırayla yüklenir. */
const LOAD_CONCURRENCY = 6;

const frameUrl = (variant: "lg" | "sm", i: number) =>
  `/watch/frames/${variant}/${String(i + 1).padStart(4, "0")}.webp`;

/**
 * Sahne yazıları: scroll ilerlemesinin hangi aralığında görünecekleri.
 * Metinler videodaki hareketi anlatır; ürün iddiası (malzeme, mekanizma
 * tipi) içermez — o bilgiler ürün sayfalarında.
 */
const CAPTIONS: {
  from: number;
  to: number;
  side: "left" | "right";
  title: string;
  text: string;
}[] = [
  {
    from: 0.22,
    to: 0.44,
    side: "left",
    title: "Cam ve bezel",
    text: "İlk bakışta görünen katman.",
  },
  {
    from: 0.44,
    to: 0.66,
    side: "right",
    title: "Kadran ve ibreler",
    text: "Zamanı okuyan yüz.",
  },
  {
    from: 0.66,
    to: 0.88,
    side: "left",
    title: "Mekanizma",
    text: "Her şeyi hareket ettiren kalp.",
  },
];

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Aralığın başında belirip sonunda kaybolan yumuşak görünürlük (0–1). */
function bandOpacity(p: number, from: number, to: number, edge = 0.05) {
  return clamp01((p - from) / edge) * clamp01((to - p) / edge);
}

export function WatchScroll() {
  const reduced = usePrefersReducedMotion();
  const hasFrames = WATCH_FRAMES.count > 0;
  const animated = hasFrames && !reduced;

  const track = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);
  const captions = useRef<(HTMLDivElement | null)[]>([]);
  // İlk kare çizilene kadar poster görünür (siyah boşluk olmasın).
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!animated) return;
    const el = track.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;

    // Dikey dar ekranda ortadan kırpılmış mobil kareler.
    const variant: "lg" | "sm" =
      window.matchMedia("(max-width: 767px) and (orientation: portrait)")
        .matches && WATCH_FRAMES.variants.sm
        ? "sm"
        : "lg";
    const count = WATCH_FRAMES.count;
    const frames: (HTMLImageElement | null)[] = Array(count).fill(null);
    let current = 0;
    let drawn = -1;
    let raf = 0;
    let disposed = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = cv.getBoundingClientRect();
      cv.width = Math.round(width * dpr);
      cv.height = Math.round(height * dpr);
      drawn = -1;
    };

    /** En yakın yüklenmiş kareyi "cover" oranıyla çizer. */
    const draw = () => {
      let img: HTMLImageElement | null = null;
      let idx = -1;
      for (let d = 0; d < count && !img; d++) {
        for (const i of [current - d, current + d]) {
          if (i >= 0 && i < count && frames[i]) {
            img = frames[i];
            idx = i;
            break;
          }
        }
      }
      if (!img || idx === drawn) return;
      const scale = Math.max(
        cv.width / img.naturalWidth,
        cv.height / img.naturalHeight,
      );
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
      drawn = idx;
    };

    /** Scroll ilerlemesi → kare ve yazıların görünürlüğü. */
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const stage = cv.getBoundingClientRect().height;
      const span = rect.height - stage;
      const p = span > 0 ? clamp01(-rect.top / span) : 0;
      current = Math.round(p * (count - 1));
      draw();

      if (intro.current) {
        const o = 1 - clamp01((p - 0.04) / 0.12);
        intro.current.style.opacity = String(o);
        intro.current.style.transform = `translateY(${(1 - o) * -24}px)`;
      }
      CAPTIONS.forEach((c, i) => {
        const node = captions.current[i];
        if (!node) return;
        const o = bandOpacity(p, c.from, c.to);
        node.style.opacity = String(o);
        node.style.transform = `translateY(${(1 - o) * 16}px)`;
      });
      if (outro.current) {
        const o = clamp01((p - 0.9) / 0.06);
        outro.current.style.opacity = String(o);
        outro.current.style.pointerEvents = o > 0.5 ? "auto" : "none";
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    // Önce ilk kare (hemen görünsün), sonra kalanlar sırayla.
    const queue = Array.from({ length: count }, (_, i) => i);
    const loadNext = () => {
      const i = queue.shift();
      if (i === undefined || disposed) return;
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(variant, i);
      img
        .decode()
        .then(() => {
          if (disposed) return;
          frames[i] = img;
          if (i === 0) setReady(true);
          // Yeni gelen kare görünmesi gerekene daha yakınsa yeniden çiz.
          if (Math.abs(i - current) < Math.abs(drawn - current)) {
            drawn = -1;
            schedule();
          }
        })
        .catch(() => {})
        .finally(loadNext);
    };
    loadNext();
    for (let k = 1; k < LOAD_CONCURRENCY; k++) loadNext();

    resize();
    update();
    const ro = new ResizeObserver(() => {
      resize();
      schedule();
    });
    ro.observe(cv);
    window.addEventListener("scroll", schedule, { passive: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
    };
  }, [animated]);

  return (
    <section
      ref={track}
      className="relative bg-black text-white"
      style={animated ? { height: `${SCROLL_SCREENS * 100}svh` } : undefined}
      aria-label="452 Watch"
    >
      {/* Sabitlenen sahne: header'ın hemen altında, ekranın kalanını kaplar. */}
      <div
        className={
          animated
            ? "sticky top-16 h-[calc(100svh-4rem)] overflow-hidden lg:top-20 lg:h-[calc(100svh-5rem)]"
            : "relative h-[clamp(480px,78svh,820px)] overflow-hidden"
        }
      >
        {/* Poster: kareler gelene kadar (ya da hareket kapalıyken) görünür. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            hasFrames
              ? frameUrl("lg", reduced ? WATCH_FRAMES.count - 1 : 0)
              : POSTER
          }
          alt=""
          aria-hidden
          fetchPriority="high"
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
        />
        {animated && (
          <canvas
            ref={canvas}
            aria-hidden
            className="absolute inset-0 size-full"
          />
        )}

        {/* Başlık: scroll başlayınca yukarı doğru kaybolur. */}
        <div
          ref={intro}
          className="pointer-events-none absolute inset-x-0 top-[9%] px-6 text-center"
        >
          <h1 className="watch-title font-sf text-[44px] font-black uppercase leading-none tracking-[-0.03em] sm:text-[72px] lg:text-[88px]">
            452 Watch
          </h1>
          <p className="mt-3 font-sf text-[15px] text-white/60 sm:text-[17px]">
            Zamanın parçaları.
          </p>
          {animated && (
            <p className="mt-6 inline-flex items-center gap-2 font-sf text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Kaydır
              <ArrowDown className="size-3.5 motion-safe:animate-bounce" />
            </p>
          )}
        </div>

        {/* Mobilde yazılar saatin üstüne denk gelir: altta hafif karartma. */}
        {animated && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/85 via-black/45 to-transparent sm:hidden"
          />
        )}

        {/* Parça yazıları: masaüstünde iki yanda, mobilde altta. */}
        {CAPTIONS.map((c, i) => (
          <div
            key={c.title}
            ref={(node) => {
              captions.current[i] = node;
            }}
            style={animated ? { opacity: 0 } : { display: "none" }}
            className={`pointer-events-none absolute bottom-[12%] inset-x-6 text-center font-sf [text-shadow:0_2px_18px_rgb(0_0_0/0.8)] sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:w-[min(28vw,320px)] sm:-translate-y-1/2 sm:text-left ${
              c.side === "left" ? "sm:left-[7%]" : "sm:right-[7%]"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8fb8f0]">
              0{i + 1}
            </p>
            <h2 className="mt-2 text-[22px] font-bold leading-tight sm:text-[28px]">
              {c.title}
            </h2>
            <p className="mt-1.5 text-[14px] text-white/60 sm:text-[15px]">
              {c.text}
            </p>
          </div>
        ))}

        {/* Son: koleksiyona in. */}
        <div
          ref={outro}
          style={animated ? { opacity: 0 } : undefined}
          className="absolute inset-x-0 bottom-[7%] flex justify-center"
        >
          <a
            href="#koleksiyon"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-white/[0.04] px-7 font-sf text-[13px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white hover:text-black"
          >
            Koleksiyonu Keşfet
            <ArrowDown className="size-4" strokeWidth={2.2} />
          </a>
        </div>
      </div>
    </section>
  );
}
