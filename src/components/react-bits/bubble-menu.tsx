"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * React Bits — Bubble Menu (https://reactbits.dev/components/bubble-menu)
 *
 * Orijinali bir navigasyon menüsü (hamburger + logo + bağlantı balonları) ve
 * gsap'e bağlı. Burada ANİMASYON MODELİ birebir alınıp projede zaten bulunan
 * motion'a çevrildi (yeni bağımlılık yok) ve bileşen bir "seçim" bileşenine
 * uyarlandı:
 *
 *   scale 0→1, back.out(1.5), 0.5sn      → easeOutBack eğrisi, 0.5sn
 *   stagger 0.12 + random(-0.05, 0.05)   → aynı gecikme ve jitter
 *   etiket y:24→0, power3.out, %90 bindirme → aynı
 *   kapanış scale→0, 0.2sn power3.in     → aynı
 *   öğe başına rotation                   → korundu
 *
 * Yerleşim akış tabanlı (flex-wrap): baloncuklar hafif kaydırma ve dönüşle
 * dağınık durur ama mutlak konumlandırma olmadığı için ekran dışına taşmaz
 * ve birbirine girmez.
 */

/** GSAP eğrilerinin cubic-bezier karşılıkları. */
const EASE_BACK_OUT = [0.34, 1.56, 0.64, 1] as const;
const EASE_POWER3_OUT = [0.215, 0.61, 0.355, 1] as const;
const EASE_POWER3_IN = [0.55, 0.055, 0.675, 0.19] as const;

const DURATION = 0.5;
const STAGGER = 0.12;
/** Seçimden sonra bir sonraki adıma geçmeden önceki bekleme. */
export const BUBBLE_SELECT_DELAY = 380;

/** Dağınık duruş için sabit kaydırma/dönüş dizileri (rastgele değil ki her render aynı olsun). */
const OFFSETS = [-14, 10, -6, 16, -10];
const ROTATIONS = [-5, 4, -3, 6, -4];

export type BubbleOption = { value: string; label: string };

export function BubbleMenu({
  options,
  onSelect,
  className,
}: {
  options: BubbleOption[];
  /** Seçim, çıkış animasyonu başladıktan sonra bildirilir. */
  onSelect: (value: string) => void;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [chosen, setChosen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSelect(value: string) {
    if (chosen) return;
    setChosen(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => onSelect(value),
      reduced ? 0 : BUBBLE_SELECT_DELAY,
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3 sm:gap-4", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        {options.map((option, i) => {
          const offset = OFFSETS[i % OFFSETS.length];
          const rotation = ROTATIONS[i % ROTATIONS.length];
          const isChosen = chosen === option.value;
          // Orijinaldeki gsap.utils.random(-0.05, 0.05) jitter'ının
          // deterministik karşılığı.
          const jitter = ((i * 37) % 10) / 100 - 0.05;

          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              aria-pressed={isChosen}
              disabled={chosen !== null && !isChosen}
              initial={
                reduced
                  ? { opacity: 0 }
                  : { scale: 0, opacity: 0, y: offset, rotate: rotation }
              }
              animate={
                reduced
                  ? { opacity: 1 }
                  : chosen === null
                    ? { scale: 1, opacity: 1, y: offset, rotate: rotation }
                    : isChosen
                      ? { scale: 1.08, opacity: 1, y: offset, rotate: 0 }
                      : { scale: 0.86, opacity: 0.25, y: offset, rotate: rotation }
              }
              exit={
                reduced
                  ? { opacity: 0 }
                  : { scale: 0, opacity: 0, transition: { duration: 0.2, ease: EASE_POWER3_IN } }
              }
              transition={
                chosen === null
                  ? {
                      duration: DURATION,
                      ease: EASE_BACK_OUT,
                      delay: Math.max(0, i * STAGGER + jitter),
                    }
                  : { duration: 0.24, ease: EASE_POWER3_OUT }
              }
              whileHover={chosen ? undefined : { scale: 1.05, y: offset - 4 }}
              whileTap={chosen ? undefined : { scale: 0.97 }}
              className={cn(
                "h-14 rounded-full px-7 micro transition-colors sm:h-15 sm:px-9",
                "shadow-[0_1px_2px_rgb(0_0_0/0.05),0_8px_18px_-12px_rgb(0_0_0/0.28)]",
                isChosen
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground ring-1 ring-foreground/10 hover:ring-foreground/40",
                chosen !== null && !isChosen && "cursor-default",
              )}
            >
              {/* Etiket, baloncuğun hemen ardından yukarı kayarak belirir. */}
              <motion.span
                className="block"
                initial={reduced ? false : { y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: DURATION,
                  ease: EASE_POWER3_OUT,
                  delay: Math.max(0, i * STAGGER + jitter + DURATION * 0.1),
                }}
              >
                {option.label}
              </motion.span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
