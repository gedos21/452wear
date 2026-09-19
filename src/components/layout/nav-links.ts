import { CATEGORIES } from "@/data/products";
import type { ProductCategory } from "@/types/product";

/** Mağaza filtresini taşıyan sorgu parametresi. Tek yerden tanımlı. */
export const CATEGORY_PARAM = "kategori";

/** Kendi adresi olan ana kategoriler. Diğerleri mağaza filtresiyle açılır. */
export const CATEGORY_ROUTES: Record<string, string> = {
  ayakkabi: "/ayakkabilar",
  giyim: "/giyim",
};

/** Bir kategori için listeleme bağlantısı. "all" parametresiz gider. */
export function categoryHref(slug: string) {
  if (slug === "all") return "/magaza";
  return CATEGORY_ROUTES[slug] ?? `/magaza?${CATEGORY_PARAM}=${slug}`;
}

/**
 * Menü öğesi. `href` yoksa öğe henüz yayında olmayan bir koleksiyon ya da
 * kategoridir: pasif ("Yakında") görünür, tıklanmaz. Ürünleri eklenince
 * yalnızca `href` verilmesi yeterli.
 */
export type MenuLink = { label: string; href?: string; lang?: "en" };

/**
 * Navbar öğesi: bağlantı (`href`), açılır menü (`menu`; `href` ile birlikte
 * olabilir — yazı sayfaya gider, ok menüyü açar) ya da pasif öğe (ikisi de yok).
 */
export type NavItem = MenuLink & { menu?: MenuLink[] };

/** Mevcut bir ürün kategorisini menü öğesine çevirir; etiket tek kaynaktan. */
function categoryItem(slug: ProductCategory): MenuLink {
  const category = CATEGORIES.find((c) => c.slug === slug)!;
  return {
    label: category.label,
    href: categoryHref(slug),
    lang: category.lang,
  };
}

// Masaüstü navbar ve mobil menü aynı listeyi kullanır.
export const NAV_ITEMS: NavItem[] = [
  { label: "Anasayfa", href: "/" },
  { label: "Mağaza", href: "/magaza" },
  {
    label: "Ayakkabılar",
    href: categoryHref("ayakkabi"),
    menu: [
      { label: "Tüm Ayakkabılar", href: categoryHref("ayakkabi") },
      // Gelecek koleksiyonlar — henüz ürün/route yok.
      { label: "Nike Dunk", lang: "en" },
      { label: "Adidas Superstar", lang: "en" },
      { label: "Air Force", lang: "en" },
      { label: "Jordan", lang: "en" },
      { label: "Air Max", lang: "en" },
    ],
  },
  {
    label: "Giyim",
    href: categoryHref("giyim"),
    menu: [
      { label: "Tüm Giyim", href: categoryHref("giyim") },
      categoryItem("tisort"),
      categoryItem("sweatshirt"),
      categoryItem("esofman"),
      categoryItem("hirka"),
    ],
  },
  // Aksesuar kategorisi henüz yok; ürünleri gelince href verilecek.
  { label: "Aksesuarlar" },
];
