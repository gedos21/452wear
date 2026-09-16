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
  return { title: urun.name, description: urun.description };
}

export default async function UrunSayfasi({
  params,
}: PageProps<"/urun/[slug]">) {
  const { slug } = await params;
  const { urun, yonlendir } = await slugIleUrun(slug);
  if (!urun) notFound();
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
            <Link href="/magaza" className="transition-colors hover:text-foreground">
              Mağaza
            </Link>
            {kategori && (
              <>
                <span aria-hidden>/</span>
                <Link
                  href={categoryHref(kategori.slug)}
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
