import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { EditorialImage } from "./editorial-image";

/**
 * Ana sayfa editorial vitrini: bölümün ana öğesi BÜYÜK dikey afiştir; yanında
 * başlık ve küçük kartlar (children) durur.
 *
 * Yerleşim:
 *  - Masaüstünde iki sütun: afiş (1440'ta 420px, ≥1536'da 460px genişlik; 2:3)
 *    ve yanında [başlık → kartlar]. İki sütun dikeyde ortalanır.
 *  - Bölüm genişliği 84rem ile sınırlıdır: çok geniş ekranda kartlar büyüyüp
 *    afişle yarışmaz.
 *  - `ters` verilirse masaüstünde afiş sağa geçer; ardışık vitrinler zikzak
 *    bir ritimle dizilir.
 *  - Mobilde DOM sırası geçerlidir: afiş → başlık → kartlar.
 *
 * Başlık afişin üstüne bindirilmez: editorial görseller kendi tipografisini
 * taşır.
 */
export function EditorialSpotlight({
  href,
  title,
  subtitle,
  cta,
  image,
  ters = false,
  children,
}: {
  href: string;
  title: string;
  subtitle: string;
  cta: string;
  image: { src: string; alt: string };
  ters?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className="pt-6 pb-10 sm:pt-8 sm:pb-12 lg:pt-0 lg:pb-16">
      <Container
        className={
          ters
            ? "grid items-center lg:grid-cols-[minmax(0,66fr)_minmax(0,34fr)] lg:gap-x-12 xl:max-w-[min(88vw,84rem)] xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]"
            : "grid items-center lg:grid-cols-[minmax(0,34fr)_minmax(0,66fr)] lg:gap-x-12 xl:max-w-[min(88vw,84rem)] xl:grid-cols-[420px_minmax(0,1fr)] 2xl:grid-cols-[460px_minmax(0,1fr)]"
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

          {children && <div className="mt-8 lg:mt-6">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
