"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

const ROWS = [
  { size: "XS", chest: "86–91", length: "66" },
  { size: "S", chest: "91–96", length: "69" },
  { size: "M", chest: "96–101", length: "72" },
  { size: "L", chest: "101–106", length: "74" },
  { size: "XL", chest: "106–111", length: "76" },
  { size: "XXL", chest: "111–117", length: "78" },
];

/** Beden rehberi — panelin içinde açılan sade bir katman. */
export function SizeGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-30 flex flex-col rounded-product bg-background p-6 sm:p-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-xl font-extrabold tracking-[-0.02em]">
              BEDEN REHBERİ
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Beden rehberini kapat"
              className="grid size-8 shrink-0 place-items-center rounded-full text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" strokeWidth={1.8} />
            </button>
          </div>

          <div className="mt-6 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="micro text-foreground/45">
                  <th className="pb-3 font-normal">Beden</th>
                  <th className="pb-3 font-normal">Göğüs (cm)</th>
                  <th className="pb-3 font-normal">Boy (cm)</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.size} className="border-t border-border/70">
                    <td className="py-3 font-medium">{row.size}</td>
                    <td className="py-3 text-muted-foreground">{row.chest}</td>
                    <td className="py-3 text-muted-foreground">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
              Ölçüler ürünün kendisine aittir, vücut ölçüsü değildir. Oversize
              kalıplarda bir beden küçük tercih edebilirsin.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
