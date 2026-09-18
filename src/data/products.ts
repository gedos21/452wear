import type { Product, ProductCategory } from "@/types/product";

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
  { slug: "tisort", label: "Tişört" },
  { slug: "sweatshirt", label: "Sweatshirt", lang: "en" },
];

/**
 * Geçici mock veri. İleride gerçek bir API/DB ile değiştirilecek —
 * aşağıdaki fonksiyonlar async tutuldu ki geçişte çağıran taraf değişmesin.
 */
export const PRODUCTS: Product[] = [
  {
    id: "p-001",
    tryOn: { layer: "top", asset: "/character/tops/tshirt-black.png", status: "approved" },
    slug: "oversize-tisort",
    name: "Oversize Tişört",
    description:
      "Ağır gramajlı %100 pamuk, oversize kalıp. Yıkamada çekmeye karşı ön işlemli.",
    category: "tisort",
    price: 749,
    compareAtPrice: 899,
    currency: "TRY",
    images: [
      { src: "/products/p-001-a.png", alt: "Oversize tişört, önden görünüm" },
      { src: "/products/p-001-b.png", alt: "Oversize tişört, arkadan görünüm" },
    ],
    colors: [
      { name: "Siyah", hex: "#1A1A1A" },
      { name: "Kemik", hex: "#E6E1D6" },
    ],
    variants: [
      { id: "p-001-s", size: "S", color: "Siyah", stock: 12 },
      { id: "p-001-m", size: "M", color: "Siyah", stock: 8 },
      { id: "p-001-l", size: "L", color: "Kemik", stock: 4 },
    ],
    isNew: true,
  },
  {
    id: "p-002",
    slug: "kapusonlu-sweatshirt",
    name: "Kapüşonlu Sweatshirt",
    description: "Üç iplik şardonlu kumaş, geniş kapüşon ve ribana detay.",
    category: "sweatshirt",
    price: 1499,
    currency: "TRY",
    images: [
      {
        src: "/products/p-002-a.png",
        alt: "Kapüşonlu sweatshirt, önden görünüm",
      },
      { src: "/products/p-002-b.png", alt: "Kapüşonlu sweatshirt, detay" },
    ],
    colors: [
      { name: "Gri", hex: "#9B9B96" },
      { name: "Siyah", hex: "#1A1A1A" },
      { name: "Lacivert", hex: "#26303F" },
    ],
    variants: [
      { id: "p-002-m", size: "M", color: "Gri", stock: 5 },
      { id: "p-002-l", size: "L", color: "Gri", stock: 9 },
      { id: "p-002-xl", size: "XL", color: "Siyah", stock: 3 },
    ],
    isNew: true,
  },
  {
    id: "p-003",
    slug: "kargo-pantolon",
    name: "Kargo Pantolon",
    description: "Rahat kalıp, yan cepli kargo pantolon, ayarlanabilir paça.",
    category: "esofman",
    price: 1799,
    currency: "TRY",
    images: [
      { src: "/products/p-003-a.png", alt: "Kargo pantolon, önden görünüm" },
      { src: "/products/p-003-b.png", alt: "Kargo pantolon, detay" },
    ],
    colors: [
      { name: "Haki", hex: "#6E7358" },
      { name: "Bej", hex: "#C9B79C" },
    ],
    variants: [
      { id: "p-003-s", size: "S", color: "Bej", stock: 6 },
      { id: "p-003-m", size: "M", color: "Haki", stock: 7 },
      { id: "p-003-l", size: "L", color: "Haki", stock: 2 },
    ],
    isNew: true,
  },
  {
    id: "p-004",
    slug: "yikanmis-jean",
    name: "Yıkanmış Jean",
    description: "Orta yükseklikte bel, düz paça, taş yıkama denim.",
    category: "esofman",
    price: 1949,
    currency: "TRY",
    images: [
      { src: "/products/p-004-a.png", alt: "Yıkanmış jean, önden görünüm" },
      { src: "/products/p-004-b.png", alt: "Yıkanmış jean, detay" },
    ],
    colors: [
      { name: "Açık Mavi", hex: "#8FA3B8" },
      { name: "İndigo", hex: "#2E3B4E" },
    ],
    variants: [
      { id: "p-004-m", size: "M", color: "İndigo", stock: 4 },
      { id: "p-004-l", size: "L", color: "Açık Mavi", stock: 6 },
    ],
    isNew: true,
  },
];

// --- Mağaza için ek mock ürünler (mevcut yapıya birebir uygun) ---
PRODUCTS.push(
  {
    id: "p-006",
    tryOn: { layer: "top", asset: "/character/tops/tshirt-washed.png", status: "approved" },
    slug: "eye-dagger-tisort",
    name: "Eye & Dagger Tişört",
    description: "Kırık beyaz ağır gramaj tişört, önden gravür baskı.",
    category: "tisort",
    price: 599,
    currency: "TRY",
    images: [
      {
        src: "/products/eye-dagger-tee.jpg",
        alt: "Kırık beyaz tişört üzerinde gravür baskı",
      },
    ],
    colors: [{ name: "Kırık Beyaz", hex: "#E9E4DA" }],
    variants: [
      { id: "p-006-m", size: "M", color: "Kırık Beyaz", stock: 6 },
      { id: "p-006-l", size: "L", color: "Kırık Beyaz", stock: 4 },
    ],
    isNew: true,
  },
  {
    id: "p-007",
    tryOn: { layer: "top", asset: "/character/tops/tshirt-white.png", status: "approved" },
    slug: "basic-tisort",
    name: "Basic Tişört",
    description: "Düz kalıp, orta gramaj, günlük kullanım için.",
    category: "tisort",
    price: 549,
    currency: "TRY",
    images: [
      { src: "/products/p-002-b.png", alt: "Basic tişört, önden görünüm" },
      { src: "/products/p-001-a.png", alt: "Basic tişört, detay" },
    ],
    colors: [
      { name: "Beyaz", hex: "#F2EFE9" },
      { name: "Siyah", hex: "#1A1A1A" },
      { name: "Gri", hex: "#9B9B96" },
      { name: "Lacivert", hex: "#26303F" },
    ],
    variants: [
      { id: "p-007-s", size: "S", color: "Beyaz", stock: 14 },
      { id: "p-007-m", size: "M", color: "Siyah", stock: 11 },
      { id: "p-007-xl", size: "XL", color: "Gri", stock: 5 },
    ],
    isNew: false,
  },
  {
    id: "p-008",
    slug: "fermuarli-sweatshirt",
    name: "Fermuarlı Sweatshirt",
    description: "Tam boy fermuar, yan cepli, şardonlu iç yüzey.",
    category: "sweatshirt",
    price: 1699,
    compareAtPrice: 1999,
    currency: "TRY",
    images: [
      {
        src: "/products/p-002-a.png",
        alt: "Fermuarlı sweatshirt, önden görünüm",
      },
      { src: "/products/p-003-b.png", alt: "Fermuarlı sweatshirt, detay" },
    ],
    colors: [
      { name: "Antrasit", hex: "#3A3B3C" },
      { name: "Bej", hex: "#C9B79C" },
    ],
    variants: [
      { id: "p-008-m", size: "M", color: "Antrasit", stock: 7 },
      { id: "p-008-l", size: "L", color: "Bej", stock: 3 },
    ],
    isNew: false,
  },
  {
    id: "p-009",
    slug: "bisiklet-yaka-sweatshirt",
    name: "Bisiklet Yaka Sweatshirt",
    description: "Klasik crewneck kalıp, ribana yaka ve manşet.",
    category: "sweatshirt",
    price: 1349,
    currency: "TRY",
    images: [
      {
        src: "/products/p-003-a.png",
        alt: "Bisiklet yaka sweatshirt, önden görünüm",
      },
      { src: "/products/p-005-b.png", alt: "Bisiklet yaka sweatshirt, detay" },
    ],
    colors: [
      { name: "Kemik", hex: "#E6E1D6" },
      { name: "Haki", hex: "#6E7358" },
    ],
    variants: [
      { id: "p-009-s", size: "S", color: "Kemik", stock: 9 },
      { id: "p-009-l", size: "L", color: "Haki", stock: 6 },
      { id: "p-009-xxl", size: "XXL", color: "Kemik", stock: 2 },
    ],
    isNew: false,
  },
  {
    id: "p-010",
    slug: "jogger-pantolon",
    name: "Jogger Pantolon",
    description: "Lastikli bel ve paça, yumuşak üç iplik kumaş.",
    category: "esofman",
    price: 1249,
    currency: "TRY",
    images: [
      { src: "/products/p-004-b.png", alt: "Jogger pantolon, önden görünüm" },
      { src: "/products/p-004-a.png", alt: "Jogger pantolon, detay" },
    ],
    colors: [
      { name: "Siyah", hex: "#1A1A1A" },
      { name: "Gri", hex: "#9B9B96" },
    ],
    variants: [
      { id: "p-010-m", size: "M", color: "Siyah", stock: 8 },
      { id: "p-010-l", size: "L", color: "Gri", stock: 0 },
    ],
    isNew: false,
  },
);

export async function getProducts(): Promise<Product[]> {
  return PRODUCTS;
}

export async function getNewArrivals(limit = 4): Promise<Product[]> {
  return PRODUCTS.filter((p) => p.isNew).slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export async function getProductsByCategory(
  category: ProductCategory,
): Promise<Product[]> {
  return PRODUCTS.filter((p) => p.category === category);
}

/**
 * Hero vitrininde gösterilecek katalog ürününün slug'ı. Ürün ayrıca
 * tanımlanmaz; katalogdaki gerçek kayıt kullanılır, böylece fiyatı ve
 * bağlantısı hep güncel kalır (bkz. lib/catalog-store vitrinUrunu).
 */
export const SHOWCASE_SLUG = "eye-dagger-tisort";
