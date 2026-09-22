import Link from "next/link";
import { categoryHref } from "@/components/layout/nav-links";
import { CATEGORIES } from "@/data/products";
import { CATEGORY_GROUPS, type CategoryFilter } from "@/lib/product-filters";
import { cn } from "@/lib/utils";
import type { Product, ProductCategory } from "@/types/product";

/**
 * Listeleme sayfalarının üstündeki kategori sekmeleri: önce Tümü / Giyim /
 * Ayakkabı, giyim dalındayken altında giyim kategorileri.
 *
 * Filtre sistemine dokunmaz — sekmeler mevcut kategori adreslerine giden
 * bağlantılardır (bkz. layout/nav-links). Kategori zaten URL'den okunduğu
 * için filtre paneli ve sayaçlar aynen çalışmaya devam eder.
 */
const GIYIM_KATEGORILERI = CATEGORY_GROUPS.giyim;

const giyimDali = (category: CategoryFilter) =>
  category === "giyim" ||
  (GIYIM_KATEGORILERI as readonly string[]).includes(category);

function Sekme({
  href,
  aktif,
  lang,
  children,
}: {
  href: string;
  aktif: boolean;
  lang?: "en";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      lang={lang}
      aria-current={aktif ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-4 micro transition-colors",
        aktif
          ? "border-foreground bg-foreground text-background"
          : "border-foreground/15 text-foreground/70 hover:border-foreground/50 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function CategoryTabs({
  category,
  products,
}: {
  category: CategoryFilter;
  /** Katalogun tamamı: ürünü olmayan alt kategori sekmesi çizilmez. */
  products: Product[];
}) {
  const giyim = giyimDali(category);
  const dolu = new Set(products.map((p) => p.category));

  return (
    <nav aria-label="Kategoriler" className="font-sf">
      <div className="flex flex-wrap gap-2">
        <Sekme href={categoryHref("all")} aktif={category === "all"}>
          Tümü
        </Sekme>
        <Sekme href={categoryHref("giyim")} aktif={giyim}>
          Giyim
        </Sekme>
        <Sekme href={categoryHref("ayakkabi")} aktif={category === "ayakkabi"}>
          Ayakkabı
        </Sekme>
      </div>

      {giyim && (
        <div className="mt-2 flex flex-wrap gap-2">
          {GIYIM_KATEGORILERI.map((slug: ProductCategory) => {
            const kategori = CATEGORIES.find((c) => c.slug === slug);
            // Seçili olan kategori boşalmış olsa bile görünür kalır; yoksa
            // sekme kullanıcının altından kaybolurdu.
            if (!kategori || (!dolu.has(slug) && category !== slug)) {
              return null;
            }
            return (
              <Sekme
                key={slug}
                href={categoryHref(slug)}
                aktif={category === slug}
                lang={kategori.lang}
              >
                {kategori.label}
              </Sekme>
            );
          })}
        </div>
      )}
    </nav>
  );
}
