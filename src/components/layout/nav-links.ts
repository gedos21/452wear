import { CATEGORIES } from "@/data/products";
import type { ProductCategory } from "@/types/product";

/** Mağaza filtresini taşıyan sorgu parametresi. Tek yerden tanımlı. */
export const CATEGORY_PARAM = "kategori";

/** Kendi adresi olan ana kategoriler. Diğerleri mağaza filtresiyle açılır. */
export const CATEGORY_ROUTES: Record<string, string> = {
  ayakkabi: "/ayakkabilar",
  giyim: "/giyim",
};

/** Ayakkabı listesinde marka/model ön seçimini taşıyan parametreler. */
export const BRAND_PARAM = "marka";
export const MODEL_PARAM = "model";

/** Bir kategori için listeleme bağlantısı. "all" parametresiz gider. */
export function categoryHref(slug: string) {
  if (slug === "all") return "/magaza";
  return CATEGORY_ROUTES[slug] ?? `/magaza?${CATEGORY_PARAM}=${slug}`;
}

/** Ayakkabılar sayfasını markası ya da modeli seçili açan bağlantı. */
export function shoeFilterHref(
  tip: "marka" | "model",
  slug: string,
): string {
  const param = tip === "marka" ? BRAND_PARAM : MODEL_PARAM;
  return `${CATEGORY_ROUTES.ayakkabi}?${param}=${slug}`;
}

/**
 * Menü öğesi. `href` yoksa öğe henüz yayında olmayan bir koleksiyon ya da
 * kategoridir: pasif ("Yakında") görünür, tıklanmaz. Ürünleri eklenince
 * yalnızca `href` verilmesi yeterli.
 */
export type MenuLink = {
  label: string;
  href?: string;
  lang?: "en";
  /**
   * Bu öğenin altında listelenen alt bağlantılar (ör. markanın modelleri).
   * Üst öğe kendi başına da tıklanabilir: markanın tüm ürünlerine gider.
   */
  children?: MenuLink[];
};

/**
 * Navbar öğesi: bağlantı (`href`), açılır menü (`menu`; `href` ile birlikte
 * olabilir — yazı sayfaya gider, ok menüyü açar) ya da pasif öğe (ikisi de yok).
 */
export type NavItem = MenuLink & { menu?: MenuLink[] };

/** Ayakkabı modeli menü satırı; slug katalogdaki model adından türer. */
function model(label: string, slug: string): MenuLink {
  return { label, href: shoeFilterHref("model", slug), lang: "en" };
}

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
    // Marka ve model bağlantıları listeleme sayfasını o filtre seçili açar.
    // Buradaki slug'lar kataloğun marka/model alanlarıyla eşleşmeli
    // (bkz. filterSlug); karşılığı olmayan bağlantı filtresiz açılır.
    menu: [
      { label: "Tüm Ayakkabılar", href: categoryHref("ayakkabi") },
      {
        label: "Nike",
        href: shoeFilterHref("marka", "nike"),
        lang: "en",
        // Air Jordan Nike'ın alt çizgisi: ayrı marka değil, buradaki modeller.
        children: [
          model("Dunk Low", "dunk-low"),
          model("SB Dunk Low", "sb-dunk-low"),
          model("Air Force 1 '07", "air-force-1-07"),
          model("Air Force 1", "air-force-1"),
          model("Air Max Plus", "air-max-plus"),
          model("Air Jordan 1 Low", "air-jordan-1-low"),
          model("Air Jordan 1 Mid", "air-jordan-1-mid"),
          model("Air Jordan 4", "air-jordan-4"),
        ],
      },
      {
        label: "Adidas",
        href: shoeFilterHref("marka", "adidas"),
        lang: "en",
        children: [
          model("Superstar", "superstar"),
          model("Handball Spezial", "handball-spezial"),
          model("Campus 00s", "campus-00s"),
        ],
      },
      {
        label: "Vans",
        href: shoeFilterHref("marka", "vans"),
        lang: "en",
        children: [model("Old Skool", "old-skool")],
      },
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
];
