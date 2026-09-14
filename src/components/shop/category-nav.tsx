"use client";

import { motion } from "motion/react";
import { CATEGORIES } from "@/data/products";
import type { CategoryFilter } from "@/lib/product-filters";

const TABS: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "Tümü" },
  ...CATEGORIES.map((c) => ({ key: c.slug as CategoryFilter, label: c.label })),
];

/**
 * Editorial kategori satırı: çip/buton değil, mikro tipografili bağlantılar.
 * Aktif olan siyahlaşır ve altına marka renginde bir çizgi kayar.
 */
export function CategoryNav({
  value,
  onChange,
}: {
  value: CategoryFilter;
  onChange: (next: CategoryFilter) => void;
}) {
  return (
    <nav className="no-scrollbar -mx-4 flex gap-7 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {TABS.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            aria-current={active ? "true" : undefined}
            className={`relative shrink-0 py-2 micro transition-colors ${
              active ? "text-foreground" : "text-foreground/50 hover:text-foreground/80"
            }`}
          >
            {tab.label}
            {active && (
              <motion.span
                layoutId="category-underline"
                className="absolute inset-x-0 -bottom-px h-px bg-brand"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
