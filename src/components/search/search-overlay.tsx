"use client";

import { useDeferredValue, useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Search, X } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { PRODUCT_GRID_COLUMNS, PRODUCT_GRID_SIZES } from "@/components/product/product-grid-columns";
import { useCatalog } from "@/components/product/catalog-provider";
import { useQuickView } from "@/components/product/quick-view";
import { buildSearchIndex, searchProducts } from "@/lib/product-search";
import { CATEGORIES } from "@/data/products";
import type { ProductCategory } from "@/types/product";

const PANEL_SPRING = { type: "spring", stiffness: 300, damping: 32 } as const;

const categoryLabel = (slug: ProductCategory) =>
  CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

export function SearchOverlay({
  query,
  onQueryChange,
  onClose,
}: {
  query: string;
  onQueryChange: (next: string) => void;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const quickView = useQuickView();
  const inputRef = useRef<HTMLInputElement>(null);
  const { products } = useCatalog();

  // Index katalog başına bir kez kurulur; her tuşta yeniden hesaplanmaz.
  const index = useMemo(
    () => buildSearchIndex(products, categoryLabel),
    [products],
  );

  // Yazma akıcı kalsın diye sonuç listesi ertelenmiş değerle çizilir.
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(
    () => searchProducts(index, deferredQuery),
    [index, deferredQuery],
  );

  const hasQuery = deferredQuery.trim().length > 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Ürün paneli açıksa ESC önce onu kapatsın; arama arkada kalsın.
      if (quickView?.openId) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, quickView?.openId]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[55] bg-foreground/20 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        aria-hidden
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-[56] flex justify-center p-0 sm:p-4">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Ürün ara"
          className={[
            "pointer-events-auto flex max-h-dvh w-full flex-col overflow-hidden bg-background",
            "sm:max-h-[86vh] sm:max-w-3xl sm:rounded-product",
            "shadow-[0_1px_2px_rgb(0_0_0/0.06),0_24px_60px_-30px_rgb(0_0_0/0.35)]",
          ].join(" ")}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
          transition={PANEL_SPRING}
        >
          {/* Arama satırı — panel kaydırılsa da üstte kalır */}
          <div className="flex shrink-0 items-center gap-4 border-b border-border/70 px-5 sm:px-7">
            <Search
              className="size-5 shrink-0 text-foreground/35"
              strokeWidth={1.6}
              aria-hidden
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Ürün ara..."
              aria-label="Ürün ara"
              autoComplete="off"
              className="h-16 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-foreground/30 sm:h-20 sm:text-xl"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Aramayı kapat"
              className="grid size-9 shrink-0 place-items-center rounded-full text-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" strokeWidth={1.8} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-8">
            {!hasQuery ? (
              <div>
                <p className="micro text-foreground/45">Popüler Aramalar</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => onQueryChange(category.label)}
                      lang={category.lang}
                      className="h-9 rounded-full bg-muted px-4 micro text-foreground/70 transition-colors hover:text-foreground"
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="py-10 sm:py-14">
                <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] sm:text-2xl">
                  SONUÇ BULUNAMADI<span className="text-brand">.</span>
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Farklı bir arama deneyebilirsin.
                </p>
              </div>
            ) : (
              <div>
                <p className="micro text-foreground/45">
                  {results.length} ürün
                </p>
                <div className={`mt-6 ${PRODUCT_GRID_COLUMNS}`}>
                  {results.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      sizes={PRODUCT_GRID_SIZES}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
