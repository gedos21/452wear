import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { ProductGrid } from "@/components/shop/product-grid";
import { WatchScroll } from "@/components/watch/watch-scroll";
import { katalogOku } from "@/lib/catalog-store";
import { MAIN_CONTENT_ID } from "@/components/layout/skip-link";

export const metadata: Metadata = {
  title: "452 Watch",
  description:
    "452WEAR'ın saat koleksiyonu: 452 Watch. Seçili saat modelleri tek sayfada.",
};

/**
 * 452 Watch koleksiyonu: scroll ile parçalarına ayrılan saat girişi, altında
 * "saat" kategorisindeki ürünler. Stokta olanlar önce.
 */
export default async function WatchPage() {
  const saatler = (await katalogOku())
    .filter((p) => p.category === "saat")
    .sort(
      (a, b) =>
        Number(b.variants.some((v) => v.stock > 0)) -
        Number(a.variants.some((v) => v.stock > 0)),
    );

  return (
    <>
      <SiteHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1">
        <WatchScroll />

        <section id="koleksiyon" className="scroll-mt-20 lg:scroll-mt-24">
          <Container className="pt-14 pb-20 sm:pt-20 sm:pb-24">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-extrabold uppercase tracking-[-0.02em] sm:text-4xl">
                Koleksiyon
              </h2>
              {saatler.length > 0 && (
                <p className="micro text-foreground/45">
                  {saatler.length} ürün
                </p>
              )}
            </div>

            {saatler.length > 0 ? (
              <div className="mt-8 sm:mt-10">
                <ProductGrid products={saatler} />
              </div>
            ) : (
              <div className="py-20 text-center sm:py-28">
                <h3 className="font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
                  ÇOK YAKINDA<span className="text-brand">.</span>
                </h3>
                <p className="mx-auto mt-4 max-w-xs text-sm text-muted-foreground">
                  452 Watch koleksiyonu hazırlanıyor.
                </p>
              </div>
            )}
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
