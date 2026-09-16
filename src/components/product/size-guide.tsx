"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { ProductCategory } from "@/types/product";

type Guide = { columns: string[]; rows: string[][]; note: string };

const APPAREL_GUIDE: Guide = {
  columns: ["Beden", "Göğüs (cm)", "Boy (cm)"],
  rows: [
    ["XS", "86–91", "66"],
    ["S", "91–96", "69"],
    ["M", "96–101", "72"],
    ["L", "101–106", "74"],
    ["XL", "106–111", "76"],
    ["XXL", "111–117", "78"],
  ],
  note: "Ölçüler ürünün kendisine aittir, vücut ölçüsü değildir. Oversize kalıplarda bir beden küçük tercih edebilirsin.",
};

const SHOE_GUIDE: Guide = {
  columns: ["Numara (EU)", "Ayak uzunluğu (cm)"],
  rows: [
    ["36", "23"],
    ["37", "23,5"],
    ["38", "24"],
    ["39", "25"],
    ["40", "25,5"],
    ["41", "26"],
    ["42", "27"],
    ["43", "27,5"],
    ["44", "28"],
    ["45", "29"],
    ["46", "29,5"],
  ],
  note: "Ayağını topuktan en uzun parmağın ucuna kadar ölç. Ölçüler yaklaşıktır ve kalıba göre değişebilir; iki numara arasında kalırsan büyük olanı seç.",
};

/** Beden rehberi — panelin içinde açılan sade bir katman. */
export function SizeGuide({
  open,
  category,
  onClose,
}: {
  open: boolean;
  /** Ayakkabıda numara tablosu, diğer kategorilerde beden tablosu gösterilir. */
  category: ProductCategory;
  onClose: () => void;
}) {
  const guide = category === "ayakkabi" ? SHOE_GUIDE : APPAREL_GUIDE;

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
                  {guide.columns.map((column) => (
                    <th key={column} className="pb-3 font-normal">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guide.rows.map(([first, ...rest]) => (
                  <tr key={first} className="border-t border-border/70">
                    <td className="py-3 font-medium">{first}</td>
                    {rest.map((cell, i) => (
                      <td key={i} className="py-3 text-muted-foreground">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
              {guide.note}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
