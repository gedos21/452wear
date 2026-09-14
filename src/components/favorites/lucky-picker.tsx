"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { ArrowRight, ChevronDown, RotateCcw } from "lucide-react";
import { PRODUCT_ASPECT, PRODUCT_SURFACE } from "@/components/product/product-surface";
import { useQuickView } from "@/components/product/quick-view";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

/** Makara penceresinin yüksekliği; şerit ötelemesi bunun katlarıyla hesaplanır. */
const CELL_H = 88;
/** Şerit kaç tur döner — süre değil, kat eden yol. */
const LOOPS = 5;
/**
 * Kolun inebileceği en fazla mesafe ve seçimi tetikleyen eşik.
 * Görsel ölçekle birlikte oransal olarak küçültüldü (~%35): direnç eğrisi,
 * eşiğin tetiklemesi ve yaya dönüş davranışı aynı, yalnızca mesafeler kısaldı.
 * Topuz ile parmak 1:1 hareket etsin diye bu değerler görselle aynı ölçekte.
 */
const LEVER_MAX = 62;
const LEVER_SOFT = 46;
const LEVER_THRESHOLD = 40;
/** Kol yatağının yüksekliği: topuz taban plakasına kadar inebilsin. */
const LEVER_TRACK_H = 104;
/** Duraktan hemen önceki minik aşma — mandalın oturma hissi. */
const OVERSHOOT = 10;

function shuffled<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * "Şansını Dene" — favoriler arasından rastgele bir ürün seçen mekanik seçici.
 *
 * Ürünler dışarıdan gelir, bu yüzden favoriler dışında başka bir listeyle de
 * kullanılabilir. Seçim gerçekten verilen listeden yapılır; sahte ürün yok.
 */
export function LuckyPicker({ products }: { products: Product[] }) {
  const reduced = useReducedMotion();
  const quickView = useQuickView();

  // Şerit yalnızca dönüş sırasında kullanılır; boştayken pencere doğrudan
  // türetilir, böylece favoriler değişince bayat ürün kalmaz.
  const [strip, setStrip] = useState<Product[]>([]);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);

  const y = useMotionValue(0);
  const leverY = useMotionValue(0);
  const dragStart = useRef<number | null>(null);
  const dragMoved = useRef(0);
  const pulled = useRef(false);
  const busy = useRef(false);
  // Dönüş sırasında bileşen sökülürse ya da yeni dönüş başlarsa eskisi susar.
  const runId = useRef(0);

  useEffect(() => () => {
    runId.current += 1;
  }, []);

  const single = products.length === 1;
  const canSpin = products.length >= 2;

  // Favori listesi değişip seçilen ürün çıkarıldıysa sonuç düşer.
  // Efektle senkronlamak yerine türetiliyor.
  const chosen =
    chosenId !== null ? products.find((p) => p.id === chosenId) ?? null : null;

  async function spin() {
    if (busy.current || !canSpin) return;
    busy.current = true;
    const run = ++runId.current;
    setChosenId(null);
    setSpinning(true);

    const pick = products[Math.floor(Math.random() * products.length)];

    if (reduced) {
      setChosenId(pick.id);
      setSpinning(false);
      busy.current = false;
      return;
    }

    const cells: Product[] = [];
    for (let i = 0; i < LOOPS; i++) cells.push(...shuffled(products));
    cells.push(pick);

    setStrip(cells);
    y.set(0);

    const target = -(cells.length - 1) * CELL_H;

    // Hızlı başlayıp uzun bir kuyrukla yavaşlar…
    await animate(y, target - OVERSHOOT, {
      duration: 2.1,
      ease: [0.16, 1, 0.3, 1],
    });
    // …sonra mandala oturur.
    if (runId.current !== run) return;

    await animate(y, target, { type: "spring", stiffness: 420, damping: 26 });
    if (runId.current !== run) return;

    setChosenId(pick.id);
    setSpinning(false);
    busy.current = false;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (!canSpin) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = e.clientY;
    dragMoved.current = 0;
    pulled.current = false;
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (dragStart.current === null) return;

    const raw = Math.max(0, e.clientY - dragStart.current);
    dragMoved.current = Math.max(dragMoved.current, raw);

    // Son bölümde direnç artar: kol dibe vurmuş gibi hissedilir.
    const eased = raw <= LEVER_SOFT ? raw : LEVER_SOFT + (raw - LEVER_SOFT) * 0.3;
    const value = Math.min(eased, LEVER_MAX);
    leverY.set(value);

    if (!pulled.current && value >= LEVER_THRESHOLD) {
      pulled.current = true;
      void spin();
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (dragStart.current === null) return;
    dragStart.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    animate(leverY, 0, { type: "spring", stiffness: 380, damping: 20 });
  }

  function handleLeverClick() {
    // Sürükleme zaten tetiklediyse tekrar çalıştırma; klavye ve basit tık için.
    if (dragMoved.current > 4 || pulled.current) return;
    void spin();
  }

  return (
    <section className="rounded-product bg-muted/60 px-6 py-8 sm:px-10 sm:py-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <div className="min-w-0 lg:max-w-xs">
          <p className="micro text-foreground/45">
            Favorilerin arasında karar veremedin mi?
          </p>
          <h2 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
            ŞANSINI DENE<span className="text-brand">.</span>
          </h2>
          {single && (
            <p className="mt-4 text-sm text-muted-foreground">
              Zaten tek favorin var.
            </p>
          )}
        </div>

        <div className="flex items-start gap-5 sm:gap-8 lg:flex-1 lg:max-w-md">
          {/* Makara penceresi */}
          <div className="min-w-0 flex-1">
            <div
              className="relative overflow-hidden rounded-product bg-background ring-1 ring-foreground/8"
              style={{ height: CELL_H }}
              aria-live="polite"
              aria-atomic="true"
            >
              {spinning ? (
                <motion.div style={{ y }}>
                  {strip.map((product, i) => (
                    <ReelCell key={`${product.id}-${i}`} product={product} />
                  ))}
                </motion.div>
              ) : (
                // Dönüş bitince şeridin son hücresiyle birebir aynı ürün
                // duruyor; sabit hücreye geçiş görsel olarak fark etmez.
                <ReelCell product={chosen ?? products[0]} />
              )}

              {/* Pencere kenarlarındaki hafif gölge — derinlik hissi */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-product shadow-[inset_0_8px_10px_-10px_rgb(0_0_0/0.35),inset_0_-8px_10px_-10px_rgb(0_0_0/0.35)]"
              />
            </div>

            <AnimatePresence initial={false}>
              {chosen && !spinning && (
                <motion.div
                  key={chosen.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="mt-5"
                >
                  <p className="micro text-brand">Bugünün Seçimi</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => quickView?.open(chosen)}
                      className="inline-flex h-11 items-center gap-2.5 rounded-full bg-foreground px-6 micro text-background transition-colors hover:bg-foreground/90"
                    >
                      İncele
                      <ArrowRight className="size-4" strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void spin()}
                      className="inline-flex h-11 items-center gap-2 rounded-full px-4 micro text-foreground/50 transition-colors hover:text-foreground"
                    >
                      <RotateCcw className="size-3.5" strokeWidth={1.8} />
                      Tekrar Dene
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Kol */}
          <Lever
            leverY={leverY}
            disabled={!canSpin}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={handleLeverClick}
          />
        </div>
      </div>
    </section>
  );
}

function ReelCell({ product }: { product: Product }) {
  const image = product.images[0];
  return (
    <div
      className="flex items-center gap-4 px-4"
      style={{ height: CELL_H }}
    >
      <div className={cn("w-12 shrink-0 relative", PRODUCT_SURFACE, PRODUCT_ASPECT)}>
        <Image src={image.src} alt="" fill sizes="48px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {formatPrice(product.price, product.currency)}
        </p>
      </div>
    </div>
  );
}

function Lever({
  leverY,
  disabled,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
}: {
  leverY: ReturnType<typeof useMotionValue<number>>;
  disabled: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onClick: () => void;
}) {
  return (
    <div className="flex w-16 shrink-0 flex-col items-center">
      {/* Mekanizma: taban plakası + yuva + mil + topuz */}
      <div className="relative w-11" style={{ height: LEVER_TRACK_H }}>
        {/* Taban plakası */}
        <div className="absolute inset-x-0 bottom-0 h-3 rounded-full bg-[linear-gradient(180deg,#ededed,#c4c4c4_45%,#949494)] shadow-[0_1px_2px_rgb(0_0_0/0.16)]" />

        {/* Yuva: milin içinde kaydığı metal kanal */}
        <div className="absolute inset-x-[13px] bottom-2 top-3 rounded-full bg-[linear-gradient(90deg,#8d8d8d,#dadada_36%,#f1f1f1_50%,#c6c6c6_66%,#888)] shadow-[inset_0_1px_2px_rgb(0_0_0/0.22)]" />

        {/* Mil */}
        <div className="absolute inset-x-[17px] bottom-3 top-4 rounded-full bg-[linear-gradient(90deg,#9c9c9c,#efefef_42%,#c3c3c3_62%,#8e8e8e)]" />

        <motion.button
          type="button"
          aria-label={
            disabled ? "Şansını dene (en az iki favori gerekli)" : "Kolu aşağı çek"
          }
          disabled={disabled}
          style={{ y: leverY, touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onClick}
          whileTap={disabled ? undefined : { scale: 0.94 }}
          className={cn(
            // Görsel topuz 28px; dokunma hedefi 40px kalsın diye düğme daha geniş.
            "absolute left-1/2 top-0 grid size-10 -translate-x-1/2 place-items-center",
            disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "relative block size-7 rounded-full",
              disabled
                ? "bg-[radial-gradient(circle_at_32%_26%,#c9c9c9,#a6a6a6_55%,#8f8f8f)]"
                : "bg-[radial-gradient(circle_at_32%_26%,#6b6b6b,#1d1d1d_52%,#000)] shadow-[0_1px_2px_rgb(0_0_0/0.28),0_6px_12px_-7px_rgb(0_0_0/0.5)]",
            )}
          >
            {/* Küresellik hissi için yumuşak yansıma — ayrı bir nokta değil,
                yüzeye karışan bir geçiş */}
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_22%,rgb(255_255_255/0.40),rgb(255_255_255/0)_46%)]" />
            {/* Marka accent detayı: topuzun tepe merkezinde */}
            <span
              className={cn(
                "absolute left-1/2 top-[20%] size-[5px] -translate-x-1/2 rounded-full",
                disabled ? "bg-background/70" : "bg-brand",
              )}
            />
          </span>
        </motion.button>
      </div>

      {/* Yönlendirme: kola değil, altına; tasarımın önüne geçmeyecek incelikte */}
      {!disabled && (
        <p className="mt-3 flex flex-col items-center gap-1 text-center text-[10px] leading-tight text-foreground/40">
          <ChevronDown className="size-3" strokeWidth={1.8} aria-hidden />
          Kolu aşağı çek
        </p>
      )}
    </div>
  );
}
