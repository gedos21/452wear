"use client";

import { Stagger, StaggerItem } from "@/components/motion";
import { ProductCard } from "@/components/product/product-card";
import {
  PRODUCT_GRID_COLUMNS,
  PRODUCT_GRID_SIZES,
} from "@/components/product/product-grid-columns";
import type { Product } from "@/types/product";

/**
 * Ürün ızgarası. Sayfalama dışarıdan yönetilir (`products` zaten kesilmiş
 * gelir), böylece ileride "daha fazla" düğmesi yerine sonsuz kaydırma ya da
 * sunucu sayfalaması takılabilir; bu bileşen değişmez.
 */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <Stagger
      className={PRODUCT_GRID_COLUMNS}
      stagger={0.05}
    >
      {products.map((product) => (
        <StaggerItem key={product.id} as="div">
          <ProductCard
            product={product}
            sizes={PRODUCT_GRID_SIZES}
          />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="py-20 text-center sm:py-28">
      <h3 className="font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
        ÜRÜN BULUNAMADI<span className="text-brand">.</span>
      </h3>
      <p className="mx-auto mt-4 max-w-xs text-sm text-muted-foreground">
        Filtrelerini değiştirerek tekrar deneyebilirsin.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-8 inline-flex h-11 items-center rounded-full border border-foreground/20 px-6 micro transition-colors hover:border-foreground/60"
      >
        Filtreleri Temizle
      </button>
    </div>
  );
}
