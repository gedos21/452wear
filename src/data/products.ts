import type { ProductCategory } from "@/types/product";

// Ürünlerin kendisi veritabanında (bkz. lib/catalog-store). İlk katalog
// data/katalog-aktarim.json ile bir kez aktarıldı (scripts/db-hazirla.mjs).

/**
 * `lang`: etiket büyük harfle (micro) gösterilirken hangi dilin kuralı
 * uygulansın. Sayfa Türkçe olduğu için "Sweatshirt" → "SWEATSHİRT" oluyordu;
 * İngilizce kelimeler "en" ile "SWEATSHIRT" kalır. Türkçe etiketlerde boş.
 */
export const CATEGORIES: {
  slug: ProductCategory;
  label: string;
  lang?: "en";
}[] = [
  { slug: "ayakkabi", label: "Ayakkabı" },
  { slug: "esofman", label: "Eşofman" },
  { slug: "hirka", label: "Hırka" },
  { slug: "triko", label: "Triko" },
  { slug: "tisort", label: "Tişört" },
  { slug: "sweatshirt", label: "Sweatshirt", lang: "en" },
  { slug: "saat", label: "Saat" },
];

/**
 * Hero vitrininde gösterilecek katalog ürününün slug'ı. Ürün ayrıca
 * tanımlanmaz; katalogdaki gerçek kayıt kullanılır, böylece fiyatı ve
 * bağlantısı hep güncel kalır (bkz. lib/catalog-store vitrinUrunu).
 */
export const SHOWCASE_SLUG = "eye-dagger-tisort";
