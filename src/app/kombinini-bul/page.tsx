import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { KombinAkisi } from "@/components/kombin/kombin-akisi";
import { katalogOku } from "@/lib/catalog-store";
import { MAIN_CONTENT_ID } from "@/components/layout/skip-link";

export const metadata: Metadata = {
  title: "Kombin Öner",
  description: "Birkaç soruya cevap ver, mağazadaki ürünlerden kombin kuralım.",
};

/**
 * Kombin öner sayfası: dört soru, ardından katalogdaki stokta olan
 * ürünlerden kurulmuş bir kombin. Ürünler sayfada sunucudan okunur;
 * öneri istemcide bu listeden kurulur (ek istek yok).
 */
export default async function KombinSayfasi() {
  const products = await katalogOku();

  return (
    <>
      <SiteHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1">
        <Container className="pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20">
          <KombinAkisi products={products} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
