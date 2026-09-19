"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { categoryHref } from "@/components/layout/nav-links";
import { ActiveFilters, ShopToolbar } from "./shop-controls";
import { FilterDrawer } from "./filter-drawer";
import {
  EmptyCategory,
  EmptyState,
  EndOfList,
  ProductGrid,
} from "./product-grid";
import {
  activeFilterCount,
  deriveFacets,
  EMPTY_FILTERS,
  filterProducts,
  matchesCategory,
  sortProducts,
  type CategoryFilter,
  type ProductFilters,
  type SortKey,
} from "@/lib/product-filters";
import { buildSearchIndex, searchProducts } from "@/lib/product-search";
import { CATEGORIES } from "@/data/products";
import type { Product, ProductCategory } from "@/types/product";

/** Bir seferde gösterilen ürün sayısı. */
const PAGE_SIZE = 8;

const categoryLabel = (slug: ProductCategory) =>
  CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

/**
 * Mağazanın etkileşimli katmanı. Filtreleme/sıralama/arama mantığı
 * lib/product-filters ve lib/product-search içindeki saf fonksiyonlarda;
 * burada yalnızca durum yönetimi var.
 *
 * KATEGORİ URL'den gelir (sunucuda okunup prop olarak iner; navbar'dan
 * seçilir). Arama, filtreler ve sıralama yerel durumda kalır.
 */
export function ShopBrowser({
  products,
  category,
  title,
}: {
  products: Product[];
  category: CategoryFilter;
  title: { label: string; lang?: "en" };
}) {
  const router = useRouter();

  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const categoryProducts = useMemo(
    () =>
      category === "all"
        ? products
        : products.filter((p) => matchesCategory(p.category, category)),
    [products, category],
  );

  // Filtre seçenekleri (marka, renk, beden, fiyat aralığı) seçili kategorinin
  // ürünlerinden türer: ayakkabıda numaralar, giyimde harf bedenler görünür.
  const facets = useMemo(
    () => deriveFacets(categoryProducts),
    [categoryProducts],
  );

  // URL'deki kategori, yerel filtrelerin üzerine yazar. Kategori değişince
  // yeni kategoride karşılığı olmayan seçimler (ör. ayakkabıdan tişörte
  // geçerken "42") düşer; yoksa görünmeyen bir filtre sonucu boşaltırdı.
  const activeFilters = useMemo<ProductFilters>(() => {
    const min = filters.price?.min;
    const max = filters.price?.max;
    const price = {
      min: min !== undefined && min > facets.price.min ? min : undefined,
      max: max !== undefined && max < facets.price.max ? max : undefined,
    };
    return {
      ...filters,
      sizes: filters.sizes.filter((s) => facets.sizes.includes(s)),
      colors: filters.colors.filter((c) =>
        facets.colors.some((f) => f.name === c),
      ),
      brands: filters.brands.filter((b) =>
        facets.brands.some((f) => f.name === b),
      ),
      price:
        price.min === undefined && price.max === undefined ? undefined : price,
      category,
    };
  }, [filters, facets, category]);

  // Sayfa içi arama, global aramanın index'ini ve Türkçe katlamasını kullanır.
  const searchIndex = useMemo(
    () => buildSearchIndex(products, categoryLabel),
    [products],
  );
  const matchedIds = useMemo(() => {
    if (!query.trim()) return null;
    return new Set(searchProducts(searchIndex, query).map((p) => p.id));
  }, [searchIndex, query]);

  const results = useMemo(() => {
    const filtered = filterProducts(products, activeFilters);
    const searched = matchedIds
      ? filtered.filter((p) => matchedIds.has(p.id))
      : filtered;
    return sortProducts(searched, sort);
  }, [products, activeFilters, matchedIds, sort]);

  // Kategori navbar'dan gelir; filtre sayacına dahil değil.
  const activeCount = activeFilterCount({ ...activeFilters, category: "all" });

  // Kategoride hiç ürün yoksa filtre arayüzü anlamsız.
  const kategoriBos = categoryProducts.length === 0;

  /**
   * Sayfalama, seçim değiştiğinde başa döner. Efektle sıfırlamak yerine
   * anahtardan türetiliyor: kategori URL'den geldiği için geri/ileri
   * tuşlarında da doğru sıfırlanır.
   */
  const resetKey = `${sort}|${query}|${JSON.stringify(activeFilters)}`;
  const [page, setPage] = useState({ key: resetKey, visible: PAGE_SIZE });
  const visible = page.key === resetKey ? page.visible : PAGE_SIZE;

  const shown = results.slice(0, visible);
  const hasMore = results.length > shown.length;

  // Kategori navbar'dan seçildiği için temizleme onu korur.
  const clearFilters = () => setFilters(EMPTY_FILTERS);
  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setQuery("");
  };

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <h1
          lang={title.lang}
          className="font-sf text-[28px] font-bold uppercase leading-none tracking-[-0.01em] sm:text-[36px]"
        >
          {title.label}
        </h1>
        <span className="shrink-0 pb-0.5 font-sf text-[13px] font-semibold uppercase tracking-[0.06em] text-foreground/45">
          {results.length} ürün
        </span>
      </div>

      {kategoriBos ? (
        <EmptyCategory onShowAll={() => router.push(categoryHref("all"))} />
      ) : (
        <>
          <div className="mt-6 sm:mt-8">
            <ShopToolbar
              query={query}
              onQueryChange={setQuery}
              sort={sort}
              onSortChange={setSort}
              onOpenFilters={() => setDrawerOpen(true)}
              activeCount={activeCount}
            />
          </div>

          <ActiveFilters
            filters={activeFilters}
            bounds={facets.price}
            onChange={setFilters}
            onClear={clearFilters}
          />

          {results.length === 0 ? (
            <EmptyState onClear={clearAll} />
          ) : (
            <>
              <div className="mt-8 lg:mt-10">
                {/* key: seçim değişince ızgara yeniden mount olur.
                Stagger'ın giriş animasyonu `once: true` ile çalıştığından,
                remount olmadan yeni kartlar gizli durumda kalıyordu. */}
                <ProductGrid key={resetKey} products={shown} />
              </div>

              {hasMore ? (
                <div className="mt-16 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setPage({ key: resetKey, visible: visible + PAGE_SIZE })
                    }
                    className="inline-flex h-12 items-center rounded-full border border-foreground/20 px-7 micro transition-colors hover:border-foreground/60"
                  >
                    Daha Fazla Göster
                  </button>
                </div>
              ) : (
                // Listenin sonu. Arama/filtre açıkken "tüm ürünlerimiz" demek
                // yanlış olur; mesaj yalnızca süzülmemiş listede görünür.
                !query.trim() && activeCount === 0 && <EndOfList />
              )}
            </>
          )}
        </>
      )}

      <AnimatePresence>
        {drawerOpen && (
          <FilterDrawer
            filters={activeFilters}
            facets={facets}
            resultCount={results.length}
            onChange={setFilters}
            onClear={clearFilters}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
