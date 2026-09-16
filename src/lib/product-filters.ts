import { SIZE_ORDER } from "@/lib/product-variants";
import type { Product, ProductCategory, ProductSize } from "@/types/product";

/**
 * Ürün listeleme mantığı — saf fonksiyonlar, React'ten bağımsız.
 * Mağaza, kategori sayfaları ve arama sonuçları aynı fonksiyonları kullanır.
 */

export type CategoryFilter = ProductCategory | "all";

export type ProductFilters = {
  category: CategoryFilter;
  sizes: ProductSize[];
  colors: string[];
  /** İleride fiyat aralığı filtresi için; şu an UI'da açık değil. */
  price?: { min?: number; max?: number };
};

export const EMPTY_FILTERS: ProductFilters = {
  category: "all",
  sizes: [],
  colors: [],
};

export type SortKey = "recommended" | "new" | "price-asc" | "price-desc";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Önerilen" },
  { key: "new", label: "Yeni Gelenler" },
  { key: "price-asc", label: "Fiyat: Düşük → Yüksek" },
  { key: "price-desc", label: "Fiyat: Yüksek → Düşük" },
];

/** Kaç filtre aktif — "Filtrele" düğmesindeki sayaç için. */
export function activeFilterCount(filters: ProductFilters) {
  return (
    (filters.category !== "all" ? 1 : 0) +
    filters.sizes.length +
    filters.colors.length +
    (filters.price ? 1 : 0)
  );
}

export function filterProducts(
  products: Product[],
  filters: ProductFilters,
): Product[] {
  return products.filter((product) => {
    if (filters.category !== "all" && product.category !== filters.category) {
      return false;
    }

    if (
      filters.sizes.length > 0 &&
      !product.variants.some(
        (v) => v.stock > 0 && filters.sizes.includes(v.size),
      )
    ) {
      return false;
    }

    if (
      filters.colors.length > 0 &&
      !product.colors.some((c) => filters.colors.includes(c.name))
    ) {
      return false;
    }

    if (filters.price) {
      const { min, max } = filters.price;
      if (min !== undefined && product.price < min) return false;
      if (max !== undefined && product.price > max) return false;
    }

    return true;
  });
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const list = [...products];
  switch (sort) {
    case "new":
      // Yeniler önce, kendi içlerinde katalog sırasını korur.
      return list.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "recommended":
    default:
      return list;
  }
}

/** Mevcut ürünlerden filtre seçeneklerini türetir; elle liste tutulmaz. */
export function deriveFacets(products: Product[]) {
  const sizes = new Set<ProductSize>();
  const colors = new Map<string, string>();

  for (const product of products) {
    for (const variant of product.variants) sizes.add(variant.size);
    for (const color of product.colors) colors.set(color.name, color.hex);
  }

  return {
    sizes: SIZE_ORDER.filter((s) => sizes.has(s)),
    colors: [...colors].map(([name, hex]) => ({ name, hex })),
  };
}
