import { SIZE_ORDER } from "@/lib/product-variants";
import type { Product, ProductCategory, ProductSize } from "@/types/product";

/**
 * Ürün listeleme mantığı — saf fonksiyonlar, React'ten bağımsız.
 * Mağaza, kategori sayfaları ve arama sonuçları aynı fonksiyonları kullanır.
 */

/**
 * Birden çok kategoriyi kapsayan üst gruplar (ör. navbar'daki "Tüm Giyim").
 * URL'de kategori gibi taşınır: /magaza?kategori=giyim.
 */
export const CATEGORY_GROUPS = {
  giyim: ["tisort", "sweatshirt", "esofman", "hirka"],
} as const satisfies Record<string, readonly ProductCategory[]>;

export type CategoryGroup = keyof typeof CATEGORY_GROUPS;

export type CategoryFilter = ProductCategory | CategoryGroup | "all";

export function isCategoryGroup(value: string): value is CategoryGroup {
  return Object.prototype.hasOwnProperty.call(CATEGORY_GROUPS, value);
}

/** Ürün kategorisi seçili filtreye (tekil kategori, grup veya tümü) uyuyor mu. */
export function matchesCategory(
  category: ProductCategory,
  filter: CategoryFilter,
): boolean {
  if (filter === "all") return true;
  if (isCategoryGroup(filter)) {
    return (CATEGORY_GROUPS[filter] as readonly ProductCategory[]).includes(
      category,
    );
  }
  return category === filter;
}

export type ProductFilters = {
  category: CategoryFilter;
  sizes: ProductSize[];
  colors: string[];
  brands: string[];
  /** Yalnızca en az bir varyantı stokta olan ürünler. */
  inStock: boolean;
  /** TL; sınırlardan biri yoksa o yönde kısıt yok. */
  price?: { min?: number; max?: number };
};

export const EMPTY_FILTERS: ProductFilters = {
  category: "all",
  sizes: [],
  colors: [],
  brands: [],
  inStock: false,
};

/**
 * Bilinen markalar. Katalogda ayrı bir marka alanı yok; marka ürün adının
 * başından okunur ("Nike Dunk Low…" → Nike). Listede olmayan bir marka
 * eklenirse ayakkabıda adın ilk kelimesi kullanılır; kendi üretimimiz olan
 * giyim ürünleri 452WEAR sayılır.
 */
const KNOWN_BRANDS = [
  "Nike",
  "Adidas",
  "Jordan",
  "New Balance",
  "Puma",
  "Converse",
  "Vans",
  "Asics",
  "Reebok",
];

/** Kendi ürünlerimizin markası (filtrede görünür, kartta yazılmaz). */
export const OWN_BRAND = "452WEAR";

export function productBrand(product: Product): string {
  const name = product.name.toLocaleLowerCase("tr-TR");
  const known = KNOWN_BRANDS.find((b) =>
    name.startsWith(b.toLocaleLowerCase("tr-TR")),
  );
  if (known) return known;
  if (product.category === "ayakkabi") return product.name.split(/\s+/)[0];
  return OWN_BRAND;
}

/**
 * Kartta iki satır halinde gösterilen ad: marka + model. Marka ürün adının
 * başındaysa modelden çıkarılır ("Nike Dunk Low" → NIKE / "Dunk Low"). Kendi
 * ürünlerimizde marka satırı yoktur (brand null); ad olduğu gibi kalır.
 */
export function productNameParts(product: Product): {
  brand: string | null;
  model: string;
} {
  const brand = productBrand(product);
  if (brand === OWN_BRAND) return { brand: null, model: product.name.trim() };
  const name = product.name.trim();
  const startsWithBrand = name
    .toLocaleLowerCase("tr-TR")
    .startsWith(brand.toLocaleLowerCase("tr-TR"));
  const model = startsWithBrand ? name.slice(brand.length).trim() : name;
  return { brand, model: model || name };
}

export function isInStock(product: Product): boolean {
  return product.variants.some((v) => v.stock > 0);
}

/** İndirim oranı (0–1); indirim yoksa 0. */
export function discountRate(product: Product): number {
  const was = product.compareAtPrice;
  return was && was > product.price ? (was - product.price) / was : 0;
}

/**
 * Kartta gösterilen indirim yüzdesi: ((eski − güncel) / eski) × 100, en
 * yakın tam sayıya yuvarlanır. Gerçek bir indirim yoksa (eski fiyat yok, eşit
 * ya da düşük) veya yuvarlanınca %1'in altında kalıyorsa null döner.
 */
export function discountPercent(product: Product): number | null {
  const percent = Math.round(discountRate(product) * 100);
  return percent >= 1 ? percent : null;
}

export type SortKey =
  | "recommended"
  | "price-asc"
  | "price-desc"
  | "discount-asc"
  | "discount-desc"
  | "oldest"
  | "newest";

/** "recommended" varsayılandır (katalog sırası); listede ilk sırada durur. */
export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Önerilen" },
  { key: "price-asc", label: "Fiyat artan" },
  { key: "price-desc", label: "Fiyat azalan" },
  { key: "discount-asc", label: "İndirim oranı artan" },
  { key: "discount-desc", label: "İndirim oranı azalan" },
  { key: "oldest", label: "İlk eklenen" },
  { key: "newest", label: "Son eklenen" },
];

/**
 * Eklenme sırası. Katalogda tarih alanı yok; id'ler ürün eklendikçe artan
 * sırayla verilir (p-001, p-002… bkz. catalog-store yeniId), sıra onlardan okunur.
 */
function addedOrder(product: Product): number {
  return Number(/^p-(\d+)/.exec(product.id)?.[1] ?? 0);
}

/** Kaç filtre aktif — "Filtrele" düğmesindeki sayaç için. */
export function activeFilterCount(filters: ProductFilters) {
  return (
    (filters.category !== "all" ? 1 : 0) +
    filters.sizes.length +
    filters.colors.length +
    filters.brands.length +
    (filters.inStock ? 1 : 0) +
    (filters.price ? 1 : 0)
  );
}

export function filterProducts(
  products: Product[],
  filters: ProductFilters,
): Product[] {
  return products.filter((product) => {
    if (!matchesCategory(product.category, filters.category)) {
      return false;
    }

    if (
      filters.brands.length > 0 &&
      !filters.brands.includes(productBrand(product))
    ) {
      return false;
    }

    if (filters.inStock && !isInStock(product)) return false;

    // Beden ve renk AYNI varyantta, stokta aranır: "M + Beyaz" seçilince
    // yalnızca beyazın M'si stokta olan ürün çıkar.
    if (
      (filters.sizes.length > 0 || filters.colors.length > 0) &&
      !product.variants.some(
        (v) =>
          v.stock > 0 &&
          (filters.sizes.length === 0 || filters.sizes.includes(v.size)) &&
          (filters.colors.length === 0 || filters.colors.includes(v.color)),
      )
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
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "discount-asc":
      return list.sort((a, b) => discountRate(a) - discountRate(b));
    case "discount-desc":
      return list.sort((a, b) => discountRate(b) - discountRate(a));
    case "oldest":
      return list.sort((a, b) => addedOrder(a) - addedOrder(b));
    case "newest":
      return list.sort((a, b) => addedOrder(b) - addedOrder(a));
    case "recommended":
    default:
      return list;
  }
}

/** Mevcut ürünlerden filtre seçeneklerini türetir; elle liste tutulmaz. */
export function deriveFacets(products: Product[]) {
  const sizes = new Set<ProductSize>();
  const colors = new Map<string, string>();
  const brands = new Map<string, number>();
  let min = Infinity;
  let max = 0;

  for (const product of products) {
    for (const variant of product.variants) sizes.add(variant.size);
    for (const color of product.colors) colors.set(color.name, color.hex);
    const brand = productBrand(product);
    brands.set(brand, (brands.get(brand) ?? 0) + 1);
    min = Math.min(min, product.price);
    max = Math.max(max, product.price);
  }

  return {
    sizes: SIZE_ORDER.filter((s) => sizes.has(s)),
    colors: [...colors].map(([name, hex]) => ({ name, hex })),
    brands: [...brands]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, "tr")),
    price: { min: products.length ? min : 0, max },
  };
}

export type Facets = ReturnType<typeof deriveFacets>;
