import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { OutfitFlow } from "@/components/outfit/outfit-flow";
import { katalogOku } from "@/lib/catalog-store";

export const metadata: Metadata = {
  title: "Kombin Öner",
  description: "Birkaç soruya cevap ver, sana bir kombin kuralım.",
};

export default async function OutfitPage() {
  const products = await katalogOku();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="pt-16 pb-24 sm:pt-24 sm:pb-32 lg:pt-28">
          {/* Genişlik kelepçesi burada değil OutfitFlow içinde: soru adımları
              dar bir kolonda kalır, iki kolonlu sonuç ekranı tam genişlik
              kullanır (aksi halde ürün kartları 140px'e sıkışıyordu). */}
          <OutfitFlow products={products} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
