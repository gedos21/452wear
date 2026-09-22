import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { categoryHref } from "@/components/layout/nav-links";
import { productNameParts } from "@/lib/product-filters";
import { ozetMetin } from "@/lib/text";
import { ProductJsonLd } from "@/components/product/product-jsonld";
import { ProductPageDetail } from "@/components/product/product-detail";
import { CATEGORIES } from "@/data/products";
import { katalogOku, slugIleUrun } from "@/lib/catalog-store";
import { complementaryFor, outfitFor, relatedFor } from "@/lib/recommendations";
import {
  ComplementaryProducts,
  OutfitRecommendation,
  RelatedProducts,
} from "@/components/product/recommendations";

/**
 * Ürün sayfası. İçerik hızlı görünüm paneliyle aynı bileşenden gelir
 * (components/product/product-detail); kart tıklaması yine paneli açar, bu
 * sayfa yeni sekmede açılan, paylaşılan ve arama motorundan gelen bağlantılar
 * içindir. Adresi değişmiş ürünün eski slug'ı yeni adrese kalıcı yönlendirilir.
 */
export async function generateMetadata({
  params,
}: PageProps<"/urun/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { urun } = await slugIleUrun(slug);
  if (!urun) return {};
  // Paylaşımda ürünün kapak görseli çıkar. openGraph alt sayfada bütünüyle
  // yeniden tanımlandığı için site adı ve dil burada da verilir.
  const kapak = urun.images[0];
  const ozet = ozetMetin(urun.description);
  return {
    title: urun.name,
    description: ozet,
    alternates: { canonical: `/urun/${urun.slug}` },
    openGraph: {
      siteName: "452WEAR",
      locale: "tr_TR",
      type: "website",
      title: urun.name,
      description: ozet,
      url: `/urun/${urun.slug}`,
      ...(kapak ? { images: [{ url: kapak.src, alt: kapak.alt }] } : {}),
    },
    ...(kapak
      ? {
          twitter: {
            card: "summary_large_image",
            images: [{ url: kapak.src, alt: kapak.alt }],
          },
        }
      : {}),
  };
}

export default async function UrunSayfasi({
  params,
}: PageProps<"/urun/[slug]">) {
  const { slug } = await params;
  const { urun, yonlendir } = await slugIleUrun(slug);
  if (!urun) {
    // Büyük harfle yazılmış adres (ör. /urun/OVERSIZE-TISORT) küçük harfli
    // asıl adrese gider. Asıl slug'lar hep küçük harf olduğu için döngü
    // oluşmaz; küçük harfte de ürün yoksa 404.
    const kucuk = slug.toLocaleLowerCase("en-US");
    if (kucuk !== slug) {
      const { urun: bulunan } = await slugIleUrun(kucuk);
      if (bulunan) permanentRedirect(`/urun/${bulunan.slug}`);
    }
    notFound();
  }
  if (yonlendir) permanentRedirect(`/urun/${urun.slug}`);

  const kategori = CATEGORIES.find((c) => c.slug === urun.category);
  // Öneriler: sayfanın zaten okuduğu katalogdan türetilir, ek istek yok.
  // Aynı ürün iki bölümde tekrar etmesin diye "buna da bak" listesi
  // tamamlayıcıları ve kombindekileri hariç tutar.
  const katalog = await katalogOku();
  const tamamlayici = complementaryFor(urun, katalog);
  const kombin = outfitFor(
    urun,
    katalog,
    tamamlayici.map((p) => p.id),
  );
  const gosterilen = [
    ...tamamlayici.map((p) => p.id),
    ...(kombin?.pieces.map((p) => p.id) ?? []),
  ];
  const benzer = relatedFor(urun, katalog, 4, gosterilen);

  const ayakkabi = urun.category === "ayakkabi";
  // Kendi ürünlerimizde marka yok; yolun son adımı kategori olur.
  const marka = productNameParts(urun).brand;

  return (
    <>
      <ProductJsonLd
        product={urun}
        categoryLabel={kategori?.label}
        categoryHref={kategori ? categoryHref(kategori.slug) : undefined}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="pt-8 pb-20 sm:pt-10 sm:pb-24 lg:pt-12 lg:pb-28">
          {/* Sade konum yolu: Ana Sayfa / Ayakkabılar|Giyim / Marka|Kategori */}
          <nav
            aria-label="Konum"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sf text-[11px] font-medium uppercase tracking-[0.08em] text-foreground/45"
          >
            <Link href="/" className="transition-colors hover:text-foreground">
              Ana Sayfa
            </Link>
            <span aria-hidden>/</span>
            <Link
              href={categoryHref(ayakkabi ? "ayakkabi" : "giyim")}
              className="transition-colors hover:text-foreground"
            >
              {ayakkabi ? "Ayakkabılar" : "Giyim"}
            </Link>
            <span aria-hidden>/</span>
            {marka ? (
              <span lang="en" className="text-foreground/70">
                {marka}
              </span>
            ) : (
              kategori && (
                <Link
                  href={categoryHref(kategori.slug)}
                  lang={kategori.lang}
                  className="text-foreground/70 transition-colors hover:text-foreground"
                >
                  {kategori.label}
                </Link>
              )
            )}
          </nav>

          <div className="mt-8 sm:mt-10">
            <ProductPageDetail product={urun} />
          </div>

          <ComplementaryProducts products={tamamlayici} />
          {kombin && <OutfitRecommendation outfit={kombin} current={urun} />}
          <RelatedProducts products={benzer} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
