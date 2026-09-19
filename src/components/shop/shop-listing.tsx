import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { ShopBrowser } from "./shop-browser";
import { CATEGORIES } from "@/data/products";
import { katalogOku } from "@/lib/catalog-store";
import type { CategoryFilter } from "@/lib/product-filters";

/** Sayfa başlığı; tekil kategorilerde katalog etiketi kullanılır. */
function pageTitle(category: CategoryFilter): { label: string; lang?: "en" } {
  if (category === "all") return { label: "Mağaza" };
  if (category === "ayakkabi") return { label: "Ayakkabılar" };
  if (category === "giyim") return { label: "Giyim" };
  const found = CATEGORIES.find((c) => c.slug === category);
  return found ? { label: found.label, lang: found.lang } : { label: "Mağaza" };
}

/**
 * Ürün listeleme sayfası — /magaza, /ayakkabilar, /giyim ve alt kategoriler
 * aynı bileşeni kullanır. Hero yok: sayfa doğrudan başlık + ürün sayısı,
 * arama/filtre/sıralama ve ızgara ile açılır.
 */
export async function ShopListing({ category }: { category: CategoryFilter }) {
  const products = await katalogOku();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="pt-8 pb-20 sm:pt-10 sm:pb-24 lg:pb-28">
          <ShopBrowser
            products={products}
            category={category}
            title={pageTitle(category)}
          />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
