"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Search, SlidersHorizontal, X } from "lucide-react";
import {
  SORT_OPTIONS,
  type ProductFilters,
  type SortKey,
} from "@/lib/product-filters";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Dışarı tıklayınca ve Esc ile kapanan hafif açılır panel. */
function Popover({
  label,
  badge,
  align = "start",
  triggerClassName,
  children,
}: {
  label: React.ReactNode;
  badge?: number;
  align?: "start" | "end";
  triggerClassName?: string;
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
    <div ref={ref} className="relative flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={triggerClassName}
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
          className={`absolute top-full z-30 mt-2 w-max min-w-56 rounded-product border border-border/70 bg-background p-3 shadow-[0_1px_2px_rgb(0_0_0/0.05),0_12px_28px_-16px_rgb(0_0_0/0.22)] ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/**
 * Filtrele / Sırala düğmeleri. Mobilde iki eşit, kolay dokunulan düğme;
 * geniş ekranda sade metin düğmeleri.
 */
const ACTION =
  "flex h-11 w-full items-center justify-center gap-2 rounded-full border border-foreground/15 px-4 font-sf text-[13px] font-bold uppercase tracking-[0.04em] transition-colors hover:border-foreground/50 sm:h-auto sm:w-auto sm:rounded-none sm:border-0 sm:px-0 sm:py-2 sm:hover:text-brand";

/** Yatay listede gösterilen sıralamalar; "Önerilen" varsayılan olarak dışarıda. */
const SORT_TABS = SORT_OPTIONS.filter((o) => o.key !== "recommended");

/**
 * Listeleme araç çubuğu: solda arama ve Filtrele; sağda sıralama.
 * Geniş ekranda (xl) sıralamalar yatay dizilir, aktif olanın altında ince
 * siyah çizgi durur. Daha dar ekranlarda sığmadığı için "Sırala" menüsüne
 * dönüşür.
 */
export function ShopToolbar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  onOpenFilters,
  activeCount,
}: {
  query: string;
  onQueryChange: (next: string) => void;
  sort: SortKey;
  onSortChange: (next: SortKey) => void;
  onOpenFilters: () => void;
  activeCount: number;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Ürünlerde ara</span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-foreground/45"
            strokeWidth={1.8}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Ne aramıştınız?"
            enterKeyHint="search"
            className="h-11 w-full rounded-full border border-foreground/15 bg-white pl-11 pr-10 font-sf text-[15px] outline-none transition-colors placeholder:text-foreground/40 focus:border-foreground/50 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Aramayı temizle"
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-foreground/50 transition-colors hover:text-foreground"
            >
              <X className="size-4" strokeWidth={1.8} />
            </button>
          )}
        </label>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-6">
          <button
            type="button"
            onClick={onOpenFilters}
            aria-haspopup="dialog"
            className={ACTION}
          >
            <SlidersHorizontal className="size-4" strokeWidth={2} />
            Filtrele
            {activeCount > 0 && (
              <span className="grid size-[18px] place-items-center rounded-full bg-brand text-[10px] leading-none text-white">
                {activeCount}
              </span>
            )}
          </button>

          {/* Dar ekranlarda sıralama menüsü; xl'de yatay liste görünür. */}
          <div className="xl:hidden">
            <Popover label="Sırala" align="end" triggerClassName={ACTION}>
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
                        className={cn(
                          "flex w-full items-center justify-between gap-4 rounded-full px-3 py-2 text-left font-sf text-[14px] transition-colors hover:bg-muted",
                          sort === option.key
                            ? "font-semibold"
                            : "text-foreground/75",
                        )}
                      >
                        {option.label}
                        {sort === option.key && (
                          <Check
                            className="size-3.5 shrink-0 text-brand"
                            strokeWidth={2}
                          />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Popover>
          </div>
        </div>
      </div>

      <nav aria-label="Sıralama" className="hidden xl:block">
        <ul className="flex items-center gap-5">
          {SORT_TABS.map((option) => {
            const active = sort === option.key;
            return (
              <li key={option.key}>
                <button
                  type="button"
                  // Aktif sıralamaya yeniden tıklamak varsayılana döner.
                  onClick={() =>
                    onSortChange(active ? "recommended" : option.key)
                  }
                  aria-pressed={active}
                  className={cn(
                    "relative whitespace-nowrap py-2 font-sf text-[13px] transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-foreground after:transition-transform after:content-['']",
                    active
                      ? "font-semibold text-foreground after:scale-x-100"
                      : "text-foreground/55 after:scale-x-0 hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/**
 * Uygulanan filtreler, tek tek kaldırılabilen küçük etiketler olarak
 * ızgaranın üstünde görünür.
 */
export function ActiveFilters({
  filters,
  bounds,
  onChange,
  onClear,
}: {
  filters: ProductFilters;
  bounds: { min: number; max: number };
  onChange: (next: ProductFilters) => void;
  onClear: () => void;
}) {
  const chips: { key: string; label: string; remove: () => void }[] = [
    ...filters.brands.map((brand) => ({
      key: `b-${brand}`,
      label: brand,
      remove: () =>
        onChange({
          ...filters,
          brands: filters.brands.filter((b) => b !== brand),
        }),
    })),
    ...filters.models.map((model) => ({
      key: `m-${model}`,
      label: model,
      remove: () =>
        onChange({
          ...filters,
          models: filters.models.filter((m) => m !== model),
        }),
    })),
    ...filters.colors.map((color) => ({
      key: `c-${color}`,
      label: color,
      remove: () =>
        onChange({
          ...filters,
          colors: filters.colors.filter((c) => c !== color),
        }),
    })),
    ...filters.sizes.map((size) => ({
      key: `s-${size}`,
      label: size,
      remove: () =>
        onChange({
          ...filters,
          sizes: filters.sizes.filter((s) => s !== size),
        }),
    })),
  ];

  if (filters.price) {
    chips.push({
      key: "price",
      label: `${formatPrice(filters.price.min ?? bounds.min)}–${formatPrice(
        filters.price.max ?? bounds.max,
      )}`,
      remove: () => onChange({ ...filters, price: undefined }),
    });
  }
  if (filters.inStock) {
    chips.push({
      key: "stock",
      label: "Stokta olanlar",
      remove: () => onChange({ ...filters, inStock: false }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.remove}
          aria-label={`${chip.label} filtresini kaldır`}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground/[0.06] pl-3 pr-2 font-sf text-[13px] font-semibold transition-colors hover:bg-foreground/[0.11]"
        >
          {chip.label}
          <X className="size-3.5 text-foreground/55" strokeWidth={2} />
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="ml-1 font-sf text-[12px] font-bold uppercase tracking-[0.04em] text-foreground/55 underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        Filtreleri temizle
      </button>
    </div>
  );
}
