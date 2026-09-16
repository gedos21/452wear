"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { categoryHref } from "@/components/layout/nav-links";
import { useQuickView } from "@/components/product/quick-view";
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
  openSlug,
}: {
  products: Product[];
  category: CategoryFilter;
  /** /urun/<slug> bağlantısından gelindiyse detay paneli açılacak ürün. */
  openSlug?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const quickView = useQuickView();

  // /urun/<slug> bağlantısı mağazaya ?urun=<slug> ile gelir: ürünün detay
  // paneli bir kez açılır ve parametre adresten düşer ki sayfa yenilenince
  // panel tekrar açılmasın.
  const openedSlug = useRef<string | null>(null);
  useEffect(() => {
    if (!openSlug || openedSlug.current === openSlug) return;
    openedSlug.current = openSlug;
    const product = products.find((p) => p.slug === openSlug);
    if (product) quickView?.open(product);
    router.replace(categoryHref(category), { scroll: false });
  }, [openSlug, products, quickView, router, category]);

  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("recommended");

  const facets = useMemo(() => deriveFacets(products), [products]);

  // URL'deki kategori, yerel filtrelerin üzerine yazar.
  const activeFilters = useMemo<ProductFilters>(
    () => ({ ...filters, category }),
    [filters, category],
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
  const resetKey = `${category}|${sort}|${filters.sizes.join()}|${filters.colors.join()}`;
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
