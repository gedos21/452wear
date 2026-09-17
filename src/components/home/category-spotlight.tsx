import Link from "next/link";
import { Container } from "@/components/layout/container";
import { categoryHref } from "@/components/layout/nav-links";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ProductCard } from "@/components/product/product-card";
import { kategoriVitrini } from "@/lib/catalog-store";
import type { ProductCategory } from "@/types/product";
import { EditorialImage } from "./editorial-image";

/** Sağdaki kart genişliği: masaüstünde bölümün ~%63'ü üç kolona bölünür. */
const KART_SIZES = "(min-width: 1024px) 20vw, 45vw";

/**
 * Ana sayfa kategori vitrini: solda büyük editorial görsel, sağda o
 * kategorinin en yeni eklenen üç ürünü. Ürünler canlı katalogdan gelir;
 * kategoride stokta ürün yoksa yalnızca görsel ve bağlantı gösterilir.
 *
 * Yerleşim:
 *  - Bölüm, sayfanın standart içerik genişliğinden daha geniştir (96rem):
 *    editorial görsel içerik alanının soluna taşar ve büyük kalır.
 *  - Masaüstünde ızgara iki satırdır: 1. satırda görsel (~%37) ve ürünler
 *    (~%63), 2. satırda görselin altındaki başlık. Ürünler böylece başlığa
 *    göre değil görselin kendisine göre dikeyde ortalanır.
 *  - Mobilde DOM sırası geçerlidir: görsel → başlık → ürünler (2 kolon).
 *
 * Başlık görselin ALTINDA durur: editorial görseller (ör. ayakkabı afişi)
 * kendi tipografisini taşıyabildiği için üstüne yazı bindirilmez.
 */
export async function CategorySpotlight({
  category,
  title,
  subtitle,
  cta,
  image,
}: {
  category: ProductCategory;
  title: string;
  subtitle: string;
  cta: string;
  image: { src: string; alt: string };
}) {
  const products = await kategoriVitrini(category, 3);
  const href = categoryHref(category);

  return (
    <section className="pt-8 pb-12 sm:pt-10 sm:pb-14 lg:pt-10 lg:pb-14">
      <Container className="grid lg:grid-cols-[minmax(0,37fr)_minmax(0,63fr)] lg:gap-x-12 xl:max-w-[min(88vw,96rem)]">
        <Reveal className="lg:col-start-1 lg:row-start-1">
          <EditorialImage href={href} src={image.src} alt={image.alt} />
        </Reveal>

        <Reveal
          delay={0.06}
          className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 lg:col-start-1 lg:row-start-2"
        >
          <div>
            <h2 className="font-display text-4xl font-extrabold leading-none tracking-[-0.03em] sm:text-5xl">
              {title}
              <span className="text-brand">.</span>
            </h2>
            <p className="mt-3 text-muted-foreground">{subtitle}</p>
          </div>
          <Link
            href={href}
            className="micro text-foreground transition-colors hover:text-foreground/60"
          >
            {cta} →
          </Link>
        </Reveal>

        {products.length > 0 && (
          <div className="mt-10 lg:col-start-2 lg:row-start-1 lg:mt-0 lg:self-center">
            <Stagger
              className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3"
              stagger={0.06}
              delay={0.1}
            >
              {products.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} sizes={KART_SIZES} />
                </StaggerItem>
              ))}
            </Stagger>
            <div className="mt-6 flex justify-end">
              <Link
                href={href}
                className="micro text-foreground/60 transition-colors hover:text-foreground"
              >
                Daha Fazla →
              </Link>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
