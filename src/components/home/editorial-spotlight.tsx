import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types/product";
import { EditorialImage } from "./editorial-image";

/** Kart genişliği: masaüstünde görselin yanındaki alan üç kolona bölünür. */
const KART_SIZES = "(min-width: 1024px) 20vw, 45vw";

/**
 * Ana sayfa editorial vitrini: dikey editorial görsel + üç ürün kartı.
 *
 * Yerleşim:
 *  - Masaüstünde iki sütun: görsel ve yanında [başlık → ürünler → Daha Fazla].
 *    İki sütun dikeyde ortalanır; başlık ürün sütununda durduğu için sütun
 *    yükseklikleri birbirine yakındır ve ürünlerin altında boşluk kalmaz.
 *  - Görsel sütunu geniş ekranda 340px'te sabitlenir (2:3 → ~510px yükseklik):
 *    görsel ekranla büyümez, bölüm içeriği kadar yer kaplar.
 *  - `ters` verilirse masaüstünde görsel sağa geçer; ardışık vitrinler
 *    böylece zikzak bir ritimle dizilir.
 *  - Mobilde DOM sırası geçerlidir: görsel → başlık → ürünler (2 kolon).
 *
 * Başlık görselin üstüne bindirilmez: editorial görseller kendi
 * tipografisini taşır.
 */
export function EditorialSpotlight({
  href,
  title,
  subtitle,
  cta,
  image,
  products,
  ters = false,
}: {
  href: string;
  title: string;
  subtitle: string;
  cta: string;
  image: { src: string; alt: string };
  products: Product[];
  ters?: boolean;
}) {
  return (
    <section className="pt-6 pb-10 sm:pt-8 sm:pb-12 lg:pt-4 lg:pb-16">
      <Container
        className={
          ters
            ? "grid items-center lg:grid-cols-[minmax(0,70fr)_minmax(0,30fr)] lg:gap-x-12 xl:max-w-[min(88vw,96rem)] xl:grid-cols-[minmax(0,1fr)_340px]"
            : "grid items-center lg:grid-cols-[minmax(0,30fr)_minmax(0,70fr)] lg:gap-x-12 xl:max-w-[min(88vw,96rem)] xl:grid-cols-[340px_minmax(0,1fr)]"
        }
      >
        <Reveal
          className={
            ters
              ? "lg:col-start-2 lg:row-start-1"
              : "lg:col-start-1 lg:row-start-1"
          }
        >
          <EditorialImage href={href} src={image.src} alt={image.alt} />
        </Reveal>

        <div
          className={
            ters
              ? "mt-5 lg:col-start-1 lg:row-start-1 lg:mt-0"
              : "mt-5 lg:col-start-2 lg:row-start-1 lg:mt-0"
          }
        >
          <Reveal
            delay={0.06}
            className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4"
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
            <>
              <Stagger
                className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:mt-6 lg:grid-cols-3"
                stagger={0.06}
                delay={0.1}
              >
                {products.map((product) => (
                  <StaggerItem key={product.id}>
                    <ProductCard product={product} sizes={KART_SIZES} />
                  </StaggerItem>
                ))}
              </Stagger>
              <div className="mt-4 flex justify-end">
                <Link
                  href={href}
                  className="micro text-foreground/60 transition-colors hover:text-foreground"
                >
                  Daha Fazla →
                </Link>
              </div>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
