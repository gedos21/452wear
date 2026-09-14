"use client";

import { AnimatePresence, motion } from "motion/react";

/**
 * Navbar aksiyonlarındaki minik sayaç. Sepet ve favoriler aynı bileşeni
 * kullanır.
 *
 * Rozetin VARLIĞI tek bir elemanla yönetilir; sayı değişimi içeride yeniden
 * mount edilerek küçük bir "pop" yapar. Rozeti sayıya göre key'lemek her
 * değişimde yeni eleman doğurup üst üste binmelerine yol açıyor.
 */
export function CountBadge({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key="badge"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 24 }}
          className="absolute -right-2.5 -top-2 grid size-4 place-items-center rounded-full bg-brand text-[10px] leading-none text-background md:-right-3.5"
          aria-hidden
        >
          <motion.span
            key={count}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 600, damping: 20 }}
          >
            {count}
          </motion.span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}
