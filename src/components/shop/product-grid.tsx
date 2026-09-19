"use client";

import { Stagger, StaggerItem } from "@/components/motion";
import { ProductCard } from "@/components/product/product-card";
import {
  PRODUCT_GRID_COLUMNS,
  PRODUCT_GRID_SIZES,
} from "@/components/product/product-grid-columns";
import { INSTAGRAM_URL } from "@/lib/community";
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

/**
 * Kategoride hiç ürün yokken gösterilir (filtre sonucu değil). Kategori
 * menüde kalır; kullanıcı boş bir ızgara yerine ne olduğunu görür.
 */
export function EmptyCategory({ onShowAll }: { onShowAll: () => void }) {
  return (
    <div className="py-20 text-center sm:py-28">
      <h3 className="font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
        ÇOK YAKINDA<span className="text-brand">.</span>
      </h3>
      <p className="mx-auto mt-4 max-w-xs text-sm text-muted-foreground">
        Bu kategoride henüz ürün bulunmuyor.
      </p>
      <button
        type="button"
        onClick={onShowAll}
        className="mt-8 inline-flex h-11 items-center rounded-full border border-foreground/20 px-6 micro transition-colors hover:border-foreground/60"
      >
        Tüm Ürünleri Gör
      </button>
    </div>
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

/**
 * Listenin sonu: gösterilecek başka ürün kalmadığında "Daha Fazla" yerine
 * görünür. Arama/filtre açıkken "tüm ürünlerimiz" demek yanlış olur; o zaman
 * seçime göre konuşur. Instagram adresi tanımlıysa takip bağlantısı olur.
 */
export function EndOfList({ filtered = false }: { filtered?: boolean }) {
  return (
    <div
      role="status"
      className="mt-12 border-t border-border/70 pt-10 text-center sm:mt-14"
    >
      <p className="font-sf text-[15px] font-semibold">
        {filtered
          ? "Seçimine uyan tüm ürünler bu kadar."
          : "Şimdilik tüm ürünlerimiz bu kadar."}
      </p>
      <p className="mt-1.5 font-sf text-[14px] text-foreground/55">
        Yeni ürünler için{" "}
        {INSTAGRAM_URL ? (
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4 transition-colors hover:text-brand"
          >
            bizi takip etmeyi
          </a>
        ) : (
          "bizi takip etmeyi"
        )}{" "}
        unutma.
      </p>
    </div>
  );
}
