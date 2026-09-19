"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useQuickView } from "@/components/product/quick-view";
import { formatPrice } from "@/lib/format";
import { productNameParts } from "@/lib/product-filters";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

/** Çarkta en fazla kaç dilim olur; fazlası okunmaz hale gelir. */
const MAX_SLICES = 12;
/**
 * Bu sayıya kadar dilimlerde ürün adı da yazılır; üstünde yalnızca görsel.
 * Küçük ekranda çark daha dar olduğundan adlar daha az dilimde gösterilir.
 */
const LABEL_MAX = 6;
const LABEL_MAX_MOBILE = 4;
/**
 * Dönüş: tam tur sayısı rastgele MIN–MAX; üstüne hedefe kalan açı (<1 tur)
 * eklenir. Toplam dönüş böylece hep 3–5 tur arasında kalır.
 */
const MIN_TURNS = 3;
const MAX_TURNS = 4;
const SPIN_SECONDS = 4.6;
/** Başta hızlı, uzun bir kuyrukla yavaşlayan eğri — çark sürtünmesi hissi. */
const SPIN_EASE = [0.12, 0.72, 0.16, 1] as const;

const SLICE_COLORS = ["#ffffff", "#ececec"];
/** Tek sayıda dilimde son dilim ilkine komşu olur; aynı renk yan yana gelmesin. */
const ODD_LAST_COLOR = "#dcdcdc";

/** Kısa ad: dilimde yer dar, uzun modeller kesilir. */
function shortName(product: Product) {
  const { model } = productNameParts(product);
  return model.length > 16 ? `${model.slice(0, 15)}…` : model;
}

/**
 * "Favorilerini çevir" — favorilerdeki ürünler çarkın dilimleridir. Kazanan
 * dilim önce eşit olasılıkla seçilir, çark birkaç tur dönüp o dilimde durur;
 * sonuç yapay olarak değiştirilmez (aynı ürün arka arkaya gelebilir).
 *
 * Ürünler dışarıdan (mevcut favori kaynağından) gelir: favori eklenince çarka
 * girer, çıkarılınca çarktan düşer. Dönüş sürerken liste dondurulur ki çark
 * dönerken dilimler kaymasın.
 */
export function FavoritesWheel({ products }: { products: Product[] }) {
  const reduced = useReducedMotion();
  const quickView = useQuickView();

  const [spinList, setSpinList] = useState<Product[] | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  // Aynı ürün arka arkaya gelse de sonuç kartı yeniden belirsin.
  const [spinCount, setSpinCount] = useState(0);
  const rotation = useMotionValue(0);
  const runId = useRef(0);

  useEffect(
    () => () => {
      runId.current += 1;
    },
    [],
  );

  const spinning = spinList !== null;
  const live = products.slice(0, MAX_SLICES);
  const slices = spinList ?? live;
  const hidden = products.length - live.length;

  // Kazanan favorilerden çıkarıldıysa sonuç düşer (türetilir, efekt yok).
  const winner = spinning
    ? null
    : (products.find((p) => p.id === winnerId) ?? null);

  async function spin() {
    if (spinning || live.length === 0) return;
    const run = ++runId.current;
    const list = live;
    const n = list.length;
    const slice = 360 / n;
    const index = Math.floor(Math.random() * n);

    setWinnerId(null);
    setSpinList(list);

    // Dilim i'nin merkezi i·slice derecede (0 = tepe). Çark R kadar dönünce
    // tepede (ibre) merkez açısı −R olan dilim durur. Dilimin içinde rastgele
    // ama kenara yapışmayan bir nokta hedeflenir.
    // Dilimin tam ortasına değil, yakınına iner; az dilimde (1–2) dilim çok
    // geniş olduğundan sapma 10°'yle sınırlı, ürün ibrenin altında durur.
    const spread = Math.min(slice * 0.3, 10);
    const jitter = (Math.random() * 2 - 1) * spread;
    const current = rotation.get();
    const turns =
      MIN_TURNS + Math.floor(Math.random() * (MAX_TURNS - MIN_TURNS + 1));
    // Şu anki konumdan hedef dilime kalan açı, 0–360 aralığında.
    const wanted = ((360 - index * slice) % 360) + jitter;
    const offset = (((wanted - (current % 360)) % 360) + 360) % 360;
    const target = current + turns * 360 + offset;

    if (reduced) {
      rotation.set(target);
    } else {
      await animate(rotation, target, {
        duration: SPIN_SECONDS,
        ease: SPIN_EASE,
      });
    }
    if (runId.current !== run) return;

    setWinnerId(list[index].id);
    setSpinCount((c) => c + 1);
    setSpinList(null);
  }

  if (products.length === 0) return <WheelEmpty />;

  const n = slices.length;
  const slice = 360 / n;
  const gradient =
    n === 1
      ? SLICE_COLORS[0]
      : `conic-gradient(from ${-slice / 2}deg, ${slices
          .map((_, i) => {
            const color =
              n % 2 === 1 && i === n - 1 ? ODD_LAST_COLOR : SLICE_COLORS[i % 2];
            return `${color} ${i * slice}deg ${(i + 1) * slice}deg`;
          })
          .join(", ")})`;
  const showLabels = n <= LABEL_MAX;
  const winnerIndex = winner ? slices.findIndex((p) => p.id === winner.id) : -1;

  return (
    <section className="rounded-product bg-muted/60 px-5 py-8 sm:px-10 sm:py-12">
      <div className="max-w-lg">
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
          FAVORİLERİNİ ÇEVİR<span className="text-brand">.</span>
        </h2>
        <p className="mt-3 font-sf text-[15px] text-foreground/60 sm:text-base">
          Favorilerine eklediklerinden bugün neyi seçeceğini çark belirlesin.
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-8 sm:mt-10 lg:flex-row lg:items-center lg:gap-16">
        {/* Çark */}
        <div className="relative w-[min(84vw,440px)] shrink-0 pt-4">
          {/* Sabit ibre: tepede, çarkın üstüne biner */}
          <div
            aria-hidden
            className="absolute left-1/2 top-0 z-20 -translate-x-1/2 drop-shadow-[0_3px_4px_rgb(0_0_0/0.3)]"
          >
            <div className="h-0 w-0 border-x-[13px] border-t-[22px] border-x-transparent border-t-brand" />
          </div>

          <div className="relative aspect-square rounded-full bg-foreground p-2.5 shadow-[0_24px_48px_-24px_rgb(0_0_0/0.45)] sm:p-3">
            <motion.div
              className="relative size-full overflow-hidden rounded-full"
              style={{ rotate: rotation, background: gradient }}
            >
              {/* Dilim ayraçları */}
              {n > 1 &&
                slices.map((p, i) => (
                  <span
                    key={`sep-${p.id}`}
                    aria-hidden
                    className="absolute left-1/2 top-0 h-1/2 w-px origin-bottom -translate-x-1/2 bg-foreground/10"
                    style={{ rotate: `${i * slice + slice / 2}deg` }}
                  />
                ))}

              {/* Kazanan dilim vurgusu */}
              {winnerIndex >= 0 && n > 1 && (
                <motion.span
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0"
                  style={{
                    background: `conic-gradient(from ${winnerIndex * slice - slice / 2}deg, color-mix(in oklab, var(--brand) 18%, transparent) 0deg ${slice}deg, transparent ${slice}deg)`,
                  }}
                />
              )}

              {slices.map((product, i) => {
                const isWinner = i === winnerIndex;
                return (
                  <div
                    key={product.id}
                    className="absolute inset-0"
                    style={{ rotate: `${i * slice}deg` }}
                  >
                    <div className="absolute left-1/2 top-[7%] flex -translate-x-1/2 flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          "relative overflow-hidden rounded-full bg-muted ring-2 transition-[box-shadow,transform] duration-300",
                          n <= 4
                            ? "size-14 sm:size-[72px]"
                            : n <= 8
                              ? "size-11 sm:size-14"
                              : "size-8 sm:size-10",
                          isWinner
                            ? "scale-110 ring-brand"
                            : "ring-foreground/10",
                        )}
                      >
                        <Image
                          src={product.images[0].src}
                          alt=""
                          fill
                          sizes="72px"
                          className="object-cover"
                        />
                      </div>
                      {showLabels && (
                        <span
                          className={cn(
                            "max-w-[92px] text-center font-sf text-[10px] font-bold uppercase leading-tight sm:max-w-[110px] sm:text-[11px]",
                            n > LABEL_MAX_MOBILE && "hidden sm:block",
                            isWinner ? "text-brand" : "text-foreground/80",
                          )}
                        >
                          {shortName(product)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Ortadaki ÇEVİR düğmesi (dönmez) */}
            <button
              type="button"
              onClick={() => void spin()}
              disabled={spinning}
              aria-label={spinning ? "Çark dönüyor" : "Çarkı çevir"}
              className="absolute left-1/2 top-1/2 z-10 grid size-[26%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-background bg-foreground font-sf text-[13px] font-black uppercase tracking-[0.06em] text-background shadow-[0_8px_20px_-8px_rgb(0_0_0/0.5)] transition-[transform,background-color] hover:bg-brand active:scale-95 disabled:cursor-wait disabled:bg-foreground/80 sm:text-[15px]"
            >
              {spinning ? "…" : "Çevir"}
            </button>
          </div>
        </div>

        {/* Sonuç */}
        <div
          className="w-full min-w-0 text-center lg:max-w-sm lg:text-left"
          aria-live="polite"
          aria-atomic="true"
        >
          <AnimatePresence mode="wait" initial={false}>
            {winner ? (
              <motion.div
                key={`${winner.id}-${spinCount}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
              >
                <p className="font-sf text-[12px] font-bold uppercase tracking-[0.08em] text-brand">
                  Bugünün favorin
                </p>
                <div className="mt-4 flex items-center justify-center gap-4 lg:justify-start">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-product bg-muted ring-2 ring-brand">
                    <Image
                      src={winner.images[0].src}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 text-left font-sf">
                    <p className="text-[18px] font-extrabold leading-tight sm:text-xl">
                      {winner.name}
                    </p>
                    <p className="mt-1 text-[16px] font-black">
                      {formatPrice(winner.price, winner.currency)}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                  <button
                    type="button"
                    onClick={() => quickView?.open(winner)}
                    className="inline-flex h-12 items-center gap-2.5 rounded-full bg-foreground px-7 font-sf text-[13px] font-bold uppercase tracking-[0.04em] text-background transition-colors hover:bg-brand"
                  >
                    İncele
                    <ArrowRight className="size-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void spin()}
                    className="inline-flex h-12 items-center gap-2 rounded-full px-4 font-sf text-[13px] font-bold uppercase tracking-[0.04em] text-foreground/55 transition-colors hover:text-foreground"
                  >
                    <RotateCcw className="size-4" strokeWidth={2} />
                    Tekrar çevir
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-sf"
              >
                <p className="text-[18px] font-extrabold sm:text-xl">
                  {spinning ? "Çark dönüyor…" : "Hazır mısın?"}
                </p>
                <p className="mt-2 text-[15px] text-foreground/60">
                  {spinning
                    ? "Bakalım bugün hangisi."
                    : `Çarkta ${n} favorin var. Ortadaki düğmeye bas ve çevir.`}
                </p>
                {hidden > 0 && !spinning && (
                  <p className="mt-2 text-[13px] text-foreground/45">
                    Okunaklı kalsın diye çarkta ilk {MAX_SLICES} favorin var
                    (toplam {products.length}).
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function WheelEmpty() {
  return (
    <section className="rounded-product bg-muted/60 px-6 py-12 text-center sm:px-10 sm:py-16">
      <h2 className="font-display text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        FAVORİLERİNİ EKLE<span className="text-brand">.</span>
      </h2>
      <p className="mx-auto mt-3 max-w-sm font-sf text-[15px] text-foreground/60">
        Beğendiğin ürünleri favorilerine ekle, sonra çarkı çevir.
      </p>
      <Link
        href="/magaza"
        className="mt-8 inline-flex h-12 items-center gap-2.5 rounded-full bg-foreground px-7 font-sf text-[13px] font-bold uppercase tracking-[0.04em] text-background transition-colors hover:bg-brand"
      >
        Ürünlere göz at
        <ArrowRight className="size-4" strokeWidth={2} />
      </Link>
    </section>
  );
}
