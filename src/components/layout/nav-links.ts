/** Mağaza filtresini taşıyan sorgu parametresi. Tek yerden tanımlı. */
export const CATEGORY_PARAM = "kategori";

/** Mağazada detay paneli açık gelecek ürünün slug'ı (bkz. app/urun/[slug]). */
export const PRODUCT_PARAM = "urun";

/** Bir kategori için mağaza bağlantısı. "all" parametresiz gider. */
export function categoryHref(slug: string) {
  return slug === "all" ? "/magaza" : `/magaza?${CATEGORY_PARAM}=${slug}`;
}

export type NavLink = { href: string; label: string };

// Kategoriler navbar'da değil, yalnızca mağaza sayfasındaki kategori
// navigasyonunda yer alır (bkz. components/shop/category-nav.tsx).
export const NAV_LINKS: NavLink[] = [
  { href: "/magaza", label: "Mağaza" },
  { href: "/kombinini-bul", label: "Kombin Öner" },
  { href: "/hakkimizda", label: "Hakkımızda" },
];
