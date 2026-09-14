"use client";

import { useEffect, useRef, useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import {
  SORT_OPTIONS,
  type ProductFilters,
  type SortKey,
} from "@/lib/product-filters";
import type { ProductSize } from "@/types/product";

type Facets = {
  sizes: ProductSize[];
  colors: { name: string; hex: string }[];
};

/** Dışarı tıklayınca ve Esc ile kapanan hafif açılır panel. */
function Popover({
  label,
  badge,
  align = "start",
  children,
}: {
  label: React.ReactNode;
  badge?: number;
  align?: "start" | "end";
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 py-2 micro text-foreground/70 transition-colors hover:text-foreground"
      >
        {label}
        {badge ? (
          <span className="grid size-4 place-items-center rounded-full bg-brand text-[10px] leading-none text-background">
            {badge}
          </span>
        ) : null}
      </button>

      {open && (
        <div
          className={`absolute top-full z-30 mt-2 min-w-56 rounded-product border border-border/70 bg-background p-3 shadow-[0_1px_2px_rgb(0_0_0/0.05),0_12px_28px_-16px_rgb(0_0_0/0.22)] ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function ShopControls({
  count,
  sort,
  onSortChange,
  filters,
  onFiltersChange,
  facets,
  activeCount,
  onClear,
}: {
  count: number;
  sort: SortKey;
  onSortChange: (next: SortKey) => void;
  filters: ProductFilters;
  onFiltersChange: (next: ProductFilters) => void;
  facets: Facets;
  activeCount: number;
  onClear: () => void;
}) {
  const toggleSize = (size: ProductSize) =>
    onFiltersChange({
      ...filters,
      sizes: filters.sizes.includes(size)
        ? filters.sizes.filter((s) => s !== size)
        : [...filters.sizes, size],
    });

  const toggleColor = (name: string) =>
    onFiltersChange({
      ...filters,
      colors: filters.colors.includes(name)
        ? filters.colors.filter((c) => c !== name)
        : [...filters.colors, name],
    });

  return (
    <div className="flex items-center justify-between gap-6">
      <span className="micro text-foreground/45">{count} ürün</span>

      <div className="flex items-center gap-6">
        <Popover
          label={
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="size-3.5" strokeWidth={1.8} />
              Filtrele
            </span>
          }
          badge={activeCount}
        >
          {() => (
            <div className="space-y-4">
              <div>
                <p className="micro text-foreground/45">Beden</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {facets.sizes.map((size) => {
                    const on = filters.sizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        aria-pressed={on}
                        className={`h-7 min-w-9 rounded-full px-2 text-[11px] transition-colors ${
                          on
                            ? "bg-foreground text-background"
                            : "bg-muted text-foreground/70 hover:text-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="micro text-foreground/45">Renk</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {facets.colors.map((color) => {
                    const on = filters.colors.includes(color.name);
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => toggleColor(color.name)}
                        aria-pressed={on}
                        title={color.name}
                        className={`size-5 rounded-full ring-1 transition-[box-shadow] ${
                          on
                            ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                            : "ring-foreground/15"
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        <span className="sr-only">{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={onClear}
                  className="micro text-foreground/50 transition-colors hover:text-foreground"
                >
                  Temizle
                </button>
              )}
            </div>
          )}
        </Popover>

        <Popover label="Sırala" align="end">
          {(close) => (
            <ul className="space-y-0.5">
              {SORT_OPTIONS.map((option) => (
                <li key={option.key}>
                  <button
                    type="button"
                    onClick={() => {
                      onSortChange(option.key);
                      close();
                    }}
                    className="flex w-full items-center justify-between gap-4 rounded-full px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-muted"
                  >
                    {option.label}
                    {sort === option.key && (
                      <Check className="size-3.5 shrink-0 text-brand" strokeWidth={2} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Popover>
      </div>
    </div>
  );
}
