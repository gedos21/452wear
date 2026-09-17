import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types/product";
import { EditorialImage } from "./editorial-image";

/** Kart genişliği: masaüstünde bölümün ~%63'ü üç kolona bölünür. */
const KART_SIZES = "(min-width: 1024px) 20vw, 45vw";

/**
 * Ana sayfa editorial vitrini: büyük dikey görsel + üç ürün kartı.
 *
 * Yerleşim:
 *  - Masaüstünde ızgara iki satırdır: 1. satırda görsel (~%37) ve ürünler
 *    (~%63), 2. satırda görselin altındaki başlık. Ürünler böylece başlığa
 *    göre değil görselin kendisine göre dikeyde ortalanır.
 *  - `ters` verilirse masaüstünde görsel sağa geçer; ardışık vitrinler
 *    böylece zikzak bir ritimle dizilir.
 *  - Mobilde DOM sırası geçerlidir: görsel → başlık → ürünler (2 kolon).
 *
 * Başlık görselin ALTINDA durur: editorial görseller kendi tipografisini
 * taşıdığı için üstüne yazı bindirilmez.
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
    <section className="pt-8 pb-12 sm:pt-10 sm:pb-14 lg:pt-10 lg:pb-14">
      <Container
        className={
          ters
            ? "grid lg:grid-cols-[minmax(0,63fr)_minmax(0,37fr)] lg:gap-x-12 xl:max-w-[min(88vw,96rem)]"
            : "grid lg:grid-cols-[minmax(0,37fr)_minmax(0,63fr)] lg:gap-x-12 xl:max-w-[min(88vw,96rem)]"
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

        <Reveal
          delay={0.06}
          className={
            ters
              ? "mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 lg:col-start-2 lg:row-start-2"
              : "mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 lg:col-start-1 lg:row-start-2"
          }
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
          <div
            className={
              ters
                ? "mt-10 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:self-center"
                : "mt-10 lg:col-start-2 lg:row-start-1 lg:mt-0 lg:self-center"
            }
          >
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
