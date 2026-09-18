"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { categoryHref } from "@/components/layout/nav-links";
import { CategoryNav } from "./category-nav";
import { ShopControls } from "./shop-controls";
import { EmptyState, ProductGrid } from "./product-grid";
import {
  activeFilterCount,
  deriveFacets,
  EMPTY_FILTERS,
  filterProducts,
  sortProducts,
  type CategoryFilter,
  type ProductFilters,
  type SortKey,
} from "@/lib/product-filters";
import type { Product } from "@/types/product";

/** Bir seferde gösterilen ürün sayısı. */
const PAGE_SIZE = 8;

/**
 * Mağazanın etkileşimli katmanı. Filtreleme/sıralama mantığı
 * lib/product-filters içindeki saf fonksiyonlarda; burada yalnızca durum
 * yönetimi var.
 *
 * KATEGORİ URL'den gelir (sunucuda okunup prop olarak iner). Böylece
 * yenileme, paylaşılan bağlantı ve tarayıcı geri/ileri tuşları doğru çalışır.
 * Beden/renk filtreleri ve sıralama yerel durumda kalır.
 */
export function ShopBrowser({
  products,
  category,
}: {
  products: Product[];
  category: CategoryFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("recommended");

  // Filtre seçenekleri seçili kategorinin ürünlerinden türer: ayakkabıda
  // numaralar, giyimde harf bedenler görünür; eşleşmeyen seçenek çıkmaz.
  const facets = useMemo(
    () =>
      deriveFacets(
        category === "all"
          ? products
          : products.filter((p) => p.category === category),
      ),
    [products, category],
  );

  // URL'deki kategori, yerel filtrelerin üzerine yazar. Kategori değişince
  // yeni kategoride karşılığı olmayan seçimler (ör. ayakkabıdan tişörte
  // geçerken "42") düşer; yoksa görünmeyen bir filtre sonucu boşaltırdı.
  const activeFilters = useMemo<ProductFilters>(
    () => ({
      ...filters,
      sizes: filters.sizes.filter((s) => facets.sizes.includes(s)),
      colors: filters.colors.filter((c) =>
        facets.colors.some((f) => f.name === c),
      ),
      category,
    }),
    [filters, facets, category],
  );

  const results = useMemo(
    () => sortProducts(filterProducts(products, activeFilters), sort),
    [products, activeFilters, sort],
  );

  const activeCount = activeFilterCount(activeFilters);

  /**
   * Sayfalama, seçim değiştiğinde başa döner. Efektle sıfırlamak yerine
   * anahtardan türetiliyor: kategori URL'den geldiği için geri/ileri
   * tuşlarında da doğru sıfırlanır.
   */
  const resetKey = `${category}|${sort}|${activeFilters.sizes.join()}|${activeFilters.colors.join()}`;
  const [page, setPage] = useState({ key: resetKey, visible: PAGE_SIZE });
  const visible = page.key === resetKey ? page.visible : PAGE_SIZE;

  const shown = results.slice(0, visible);
  const hasMore = results.length > shown.length;

  /** Kategori değişimi geçmişe yazılır: geri tuşu önceki kategoriye döner. */
  const setCategory = (next: CategoryFilter) => {
    router.push(categoryHref(next));
  };

  const clear = () => {
    setFilters(EMPTY_FILTERS);
    if (category !== "all") router.push(pathname);
  };

  return (
    <>
      <div className="border-b border-border/70">
        <CategoryNav value={category} onChange={setCategory} />
      </div>

      <div className="mt-6">
        <ShopControls
          count={results.length}
          sort={sort}
          onSortChange={setSort}
          filters={activeFilters}
          onFiltersChange={setFilters}
          facets={facets}
          activeCount={activeCount}
          onClear={clear}
        />
      </div>

      {results.length === 0 ? (
        <EmptyState onClear={clear} />
      ) : (
        <>
          <div className="mt-10 lg:mt-14">
            {/* key: seçim değişince ızgara yeniden mount olur.
                Stagger'ın giriş animasyonu `once: true` ile çalıştığından,
                remount olmadan yeni kartlar gizli durumda kalıyordu. */}
            <ProductGrid key={resetKey} products={shown} />
          </div>

          {hasMore && (
            <div className="mt-16 flex justify-center">
              <button
                type="button"
                onClick={() => setPage({ key: resetKey, visible: visible + PAGE_SIZE })}
                className="inline-flex h-12 items-center rounded-full border border-foreground/20 px-7 micro transition-colors hover:border-foreground/60"
              >
                Daha Fazla Göster
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
