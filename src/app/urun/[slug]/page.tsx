import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { categoryHref } from "@/components/layout/nav-links";
import { ProductPageDetail } from "@/components/product/product-detail";
import { CATEGORIES } from "@/data/products";
import { slugIleUrun } from "@/lib/catalog-store";

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
  return {
    title: urun.name,
    description: urun.description,
    alternates: { canonical: `/urun/${urun.slug}` },
    openGraph: {
      siteName: "452WEAR",
      locale: "tr_TR",
      type: "website",
      title: urun.name,
      description: urun.description,
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

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="pt-8 pb-20 sm:pt-10 sm:pb-24 lg:pt-12 lg:pb-28">
          <nav
            aria-label="Konum"
            className="flex flex-wrap items-center gap-2 micro text-foreground/45"
          >
            <Link
              href="/magaza"
              className="transition-colors hover:text-foreground"
            >
              Mağaza
            </Link>
            {kategori && (
              <>
                <span aria-hidden>/</span>
                <Link
                  href={categoryHref(kategori.slug)}
                  lang={kategori.lang}
                  className="transition-colors hover:text-foreground"
                >
                  {kategori.label}
                </Link>
              </>
            )}
          </nav>

          <div className="mt-8 sm:mt-10">
            <ProductPageDetail product={urun} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
