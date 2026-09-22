"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { categoryHref } from "@/components/layout/nav-links";
import { ActiveFilters, ShopToolbar } from "./shop-controls";
import { CategoryTabs } from "./category-tabs";
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
  filterSlug,
  matchesCategory,
  productBrand,
  productModel,
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
  initialBrand,
  initialModel,
}: {
  products: Product[];
  category: CategoryFilter;
  title: { label: string; lang?: "en" };
  /** Adresten gelen marka/model (slug); navbar menüsü bunları kullanır. */
  initialBrand?: string;
  initialModel?: string;
}) {
  const router = useRouter();

  // Adresteki slug katalogdaki gerçek ada çevrilir; karşılığı yoksa yok
  // sayılır (yanlış bağlantı listeyi boşaltmasın).
  const [filters, setFilters] = useState<ProductFilters>(() => {
    const eslestir = (slug: string | undefined, deger: (p: Product) => string | null) => {
      if (!slug) return [];
      const ad = products
        .map(deger)
        .find((v): v is string => !!v && filterSlug(v) === slug);
      return ad ? [ad] : [];
    };
    return {
      ...EMPTY_FILTERS,
      brands: eslestir(initialBrand, productBrand),
      models: eslestir(initialModel, productModel),
    };
  });
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
      // Model seçimi markasına bağlıdır: marka değişince ya da kategori
      // dışında kalınca düşer, yoksa görünmeyen bir filtre listeyi boşaltır.
      models: filters.models.filter((m) =>
        facets.models.some(
          (f) =>
            f.name === m &&
            (filters.brands.length === 0 || filters.brands.includes(f.brand)),
        ),
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
  const filtered = query.trim() !== "" || activeCount > 0;

  // Son ürünler yüklenince kısa bir bildirim: yeni kartlar liste sonu
  // mesajını ekranın altına ittiği için kullanıcı onu hemen görmeyebilir.
  const [endNotice, setEndNotice] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  // Tek tıkla kalan bütün ürünler açılır; düğmeye tekrar tekrar basılmaz.
  const loadMore = () => {
    setPage({ key: resetKey, visible: results.length });
    setEndNotice(true);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setEndNotice(false), 3200);
  };

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

      {/* Kategori sekmeleri: filtre panelinden bağımsız, adres tabanlı. */}
      <div className="mt-5 sm:mt-6">
        <CategoryTabs category={category} products={products} />
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
                <div className="mt-12 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    className="inline-flex h-12 items-center rounded-full border border-foreground/20 px-7 micro transition-colors hover:border-foreground/60"
                  >
                    Tümünü Göster ({results.length - shown.length})
                  </button>
                </div>
              ) : (
                // Listenin sonu; arama/filtre açıkken mesaj ona göre değişir.
                <EndOfList filtered={filtered} />
              )}
            </>
          )}
        </>
      )}

      <AnimatePresence>
        {endNotice && (
          <motion.div
            key="end-notice"
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-4 bottom-6 z-40 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-full bg-foreground px-5 py-3 text-center font-sf text-[14px] font-semibold text-background shadow-[0_12px_32px_-12px_rgb(0_0_0/0.45)]"
          >
            {filtered
              ? "Seçimine uyan tüm ürünler bu kadar."
              : "Şimdilik tüm ürünlerimiz bu kadar."}
          </motion.div>
        )}
      </AnimatePresence>

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
