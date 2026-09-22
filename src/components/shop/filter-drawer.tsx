"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import type { Facets, ProductFilters } from "@/lib/product-filters";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductSize } from "@/types/product";

const SPRING = { type: "spring", stiffness: 280, damping: 34 } as const;

/** Fiyat kaydırıcısının adımı (TL); uçlar da bu adıma yuvarlanır. */
const PRICE_STEP = 50;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

/**
 * Filtre paneli. Masaüstünde sağdan kayan panel, mobilde alttan açılan
 * sayfa (bottom sheet). Seçimler anında uygulanır; alttaki düğme güncel
 * sonuç sayısını gösterir ve paneli kapatır.
 */
export function FilterDrawer({
  filters,
  facets,
  resultCount,
  onChange,
  onClear,
  onClose,
}: {
  filters: ProductFilters;
  facets: Facets;
  resultCount: number;
  onChange: (next: ProductFilters) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  // Panel yalnızca açıkken (istemcide) mount olur; ölçüm hydration'ı etkilemez.
  const [desktop] = useState(
    () => window.matchMedia("(min-width: 640px)").matches,
  );

  useScrollLock(true);

  // onClose her render'da yeni fonksiyon; efekt yalnızca açılışta çalışsın
  // (yoksa her seçimde odak kapatma düğmesine sıçrar).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const offscreen = desktop ? { x: "100%" } : { y: "100%" };
  // Model listesi marka seçimini izler: marka seçiliyken yalnızca o markanın
  // modelleri görünür, hiç marka seçili değilse hepsi listelenir.
  const models =
    filters.brands.length > 0
      ? facets.models.filter((m) => filters.brands.includes(m.brand))
      : facets.models;

  const hasFilters =
    filters.brands.length +
      filters.models.length +
      filters.colors.length +
      filters.sizes.length +
      (filters.inStock ? 1 : 0) +
      (filters.price ? 1 : 0) >
    0;

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[70] bg-foreground/25 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        aria-hidden
      />

      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Filtrele"
        className={cn(
          "fixed z-[71] flex flex-col bg-background font-sf",
          // Mobil: alttan açılan sayfa. Masaüstü: sağda tam boy panel.
          "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl",
          "sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:rounded-none",
          "shadow-[0_-12px_40px_-20px_rgb(0_0_0/0.3)] sm:shadow-[0_24px_60px_-30px_rgb(0_0_0/0.35)]",
        )}
        initial={reduced ? { opacity: 0 } : offscreen}
        animate={{ x: 0, y: 0, opacity: 1 }}
        exit={reduced ? { opacity: 0 } : offscreen}
        transition={SPRING}
      >
        <header className="flex items-center justify-between border-b border-foreground/10 px-5 py-4 sm:px-7 sm:py-5">
          <h2 className="text-[18px] font-bold uppercase">Filtrele</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Filtreleri kapat"
            className="grid size-9 place-items-center rounded-full text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" strokeWidth={1.8} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7">
          <Section title="Fiyat">
            <PriceFilter
              bounds={facets.price}
              value={filters.price}
              onChange={(price) => onChange({ ...filters, price })}
            />
          </Section>

          {facets.brands.length > 0 && (
            <Section title="Marka">
              <ul className="space-y-1">
                {facets.brands.map((brand) => (
                  <li key={brand.name}>
                    <CheckRow
                      checked={filters.brands.includes(brand.name)}
                      onChange={() =>
                        onChange({
                          ...filters,
                          brands: toggle(filters.brands, brand.name),
                        })
                      }
                      label={brand.name}
                      meta={brand.count}
                    />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {models.length > 0 && (
            <Section title="Model">
              <ul className="space-y-1">
                {models.map((model) => (
                  <li key={`${model.brand}-${model.name}`}>
                    <CheckRow
                      checked={filters.models.includes(model.name)}
                      onChange={() =>
                        onChange({
                          ...filters,
                          models: toggle(filters.models, model.name),
                        })
                      }
                      label={model.name}
                      meta={model.count}
                    />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {facets.colors.length > 0 && (
            <Section title="Renk">
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                {facets.colors.map((color) => (
                  <li key={color.name}>
                    <CheckRow
                      checked={filters.colors.includes(color.name)}
                      onChange={() =>
                        onChange({
                          ...filters,
                          colors: toggle(filters.colors, color.name),
                        })
                      }
                      label={color.name}
                      swatch={color.hex}
                    />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {facets.sizes.length > 0 && (
            <Section title="Beden">
              <div className="flex flex-wrap gap-2">
                {facets.sizes.map((size: ProductSize) => {
                  const on = filters.sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...filters,
                          sizes: toggle(filters.sizes, size),
                        })
                      }
                      aria-pressed={on}
                      className={cn(
                        "h-10 min-w-12 rounded-full border px-3 text-[14px] font-semibold transition-colors",
                        on
                          ? "border-foreground bg-foreground text-background"
                          : "border-foreground/15 hover:border-foreground/50",
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          <Section title="Stok">
            <CheckRow
              checked={filters.inStock}
              onChange={() =>
                onChange({ ...filters, inStock: !filters.inStock })
              }
              label="Stokta olanlar"
            />
          </Section>
        </div>

        <footer className="flex items-center gap-3 border-t border-foreground/10 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
          <button
            type="button"
            onClick={onClear}
            disabled={!hasFilters}
            className="h-12 shrink-0 px-2 text-[13px] font-bold uppercase tracking-[0.04em] text-foreground/60 transition-colors hover:text-foreground disabled:opacity-40"
          >
            Temizle
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-full bg-foreground text-[13px] font-bold uppercase tracking-[0.04em] text-background transition-opacity hover:opacity-90"
          >
            {resultCount} ürünü gör
          </button>
        </footer>
      </motion.aside>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-foreground/10 py-5 last:border-b-0">
      <h3 className="mb-3 text-[13px] font-bold uppercase tracking-[0.04em]">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Onay kutulu satır; renkte küçük bir örnek nokta, markada adet gösterir. */
function CheckRow({
  checked,
  onChange,
  label,
  meta,
  swatch,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  meta?: number;
  swatch?: string;
}) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-3 text-[15px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40",
          checked
            ? "border-foreground bg-foreground text-background"
            : "border-foreground/25",
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      {swatch && (
        <span
          aria-hidden
          className="size-3.5 shrink-0 rounded-full ring-1 ring-foreground/15"
          style={{ backgroundColor: swatch }}
        />
      )}
      <span className={cn("min-w-0 truncate", checked && "font-semibold")}>
        {label}
      </span>
      {meta !== undefined && (
        <span className="ml-auto text-[13px] text-foreground/40">{meta}</span>
      )}
    </label>
  );
}

/**
 * Fiyat aralığı: çift tutamaçlı kaydırıcı ve iki sayı alanı. Sınırlar
 * kategorideki gerçek fiyatlardan gelir. Alanlar yazarken değil, odaktan
 * çıkınca / Enter'da uygulanır; kaydırıcı anında uygular.
 */
function PriceFilter({
  bounds,
  value,
  onChange,
}: {
  bounds: { min: number; max: number };
  value: ProductFilters["price"];
  onChange: (next: ProductFilters["price"]) => void;
}) {
  // Kaydırıcı uçları adıma yuvarlanır ki değerler 549, 599… yerine 500,
  // 550… gibi düzgün olsun. Gerçek sınırların dışı "kısıt yok" sayılır.
  const floor = Math.floor(bounds.min / PRICE_STEP) * PRICE_STEP;
  const ceil = Math.ceil(bounds.max / PRICE_STEP) * PRICE_STEP;
  const lo = value?.min ?? floor;
  const hi = value?.max ?? ceil;

  if (bounds.min >= bounds.max) {
    return (
      <p className="text-[14px] text-foreground/55">
        Bu listedeki tüm ürünler {formatPrice(bounds.min)}.
      </p>
    );
  }

  const set = (min: number, max: number) => {
    const clampedMin = Math.max(floor, Math.min(min, max));
    const clampedMax = Math.min(ceil, Math.max(max, min));
    onChange({ min: clampedMin, max: clampedMax });
  };

  const span = ceil - floor;
  const left = ((lo - floor) / span) * 100;
  const right = ((hi - floor) / span) * 100;

  return (
    <div>
      <div className="dual-range relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-foreground/10" />
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-brand"
          style={{ left: `${left}%`, right: `${100 - right}%` }}
        />
        <input
          type="range"
          min={floor}
          max={ceil}
          step={PRICE_STEP}
          value={lo}
          onChange={(e) => set(Number(e.target.value), hi)}
          aria-label="Minimum fiyat"
        />
        <input
          type="range"
          min={floor}
          max={ceil}
          step={PRICE_STEP}
          value={hi}
          onChange={(e) => set(lo, Number(e.target.value))}
          aria-label="Maksimum fiyat"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <PriceInput label="Min" value={lo} onCommit={(v) => set(v, hi)} />
        <PriceInput label="Maks" value={hi} onCommit={(v) => set(lo, v)} />
      </div>
    </div>
  );
}

function PriceInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
}) {
  // Yazılan taslak; odak dışındayken dışarıdaki değeri gösterir.
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const n = Number(draft.replace(/\D/g, ""));
    if (draft.trim() !== "" && Number.isFinite(n)) onCommit(n);
    setDraft(null);
  };

  return (
    <label className="flex h-11 items-center gap-2 rounded-full border border-foreground/15 px-4 focus-within:border-foreground/50">
      <span className="text-[12px] font-semibold uppercase text-foreground/45">
        {label}
      </span>
      <input
        inputMode="numeric"
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
        className="min-w-0 flex-1 bg-transparent text-right text-[15px] font-semibold outline-none"
      />
      <span className="text-[14px] text-foreground/45">₺</span>
    </label>
  );
}
