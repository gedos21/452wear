import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { ShopBrowser } from "@/components/shop/shop-browser";
import { CATEGORIES } from "@/data/products";
import { katalogOku } from "@/lib/catalog-store";
import { CATEGORY_PARAM } from "@/components/layout/nav-links";
import type { CategoryFilter } from "@/lib/product-filters";

export const metadata: Metadata = {
  title: "Mağaza",
  description: "452WEAR koleksiyonundaki tüm parçalar.",
};

/** URL'deki kategori değerini doğrular; tanınmayan değer "all" sayılır. */
function readCategory(value: string | string[] | undefined): CategoryFilter {
  const slug = Array.isArray(value) ? value[0] : value;
  return CATEGORIES.some((c) => c.slug === slug)
    ? (slug as CategoryFilter)
    : "all";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [products, params] = await Promise.all([katalogOku(), searchParams]);
  const category = readCategory(params[CATEGORY_PARAM]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
          <Reveal trigger="mount">
            <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              MAĞAZA<span className="text-brand">.</span>
            </h1>
          </Reveal>

          <Reveal trigger="mount" delay={0.06}>
            <p className="mt-5 max-w-sm text-muted-foreground">
              Sezonun parçalarını keşfet.
            </p>
          </Reveal>

          <div className="mt-12 sm:mt-16">
            <ShopBrowser products={products} category={category} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
