import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { kombinVitrini } from "@/lib/catalog-store";
import { EditorialImage } from "./editorial-image";
import { OutfitPieceCard } from "./outfit-piece-card";

const HREF = "/kombinini-bul";

/**
 * Kombinler vitrini: katalogdan kurulmuş hazır bir kombin (üst + eşofman +
 * ayakkabı) ve kombin afişi.
 *
 * Ürün vitrinlerinden bilerek ayrışır: parçalar küçük ürün kartı değil, uzun
 * editorial bloklardır. Masaüstünde üç parça ve afiş, afişteki dört panel
 * gibi eşit genişlik ve yükseklikte yan yana dizilir (4 sütun). Mobilde afiş
 * üstte, parçalar yana kaydırılan bir şerit olur.
 */
export async function OutfitSpotlight() {
  const products = await kombinVitrini();

  return (
    <section className="pt-6 pb-10 sm:pt-8 sm:pb-12 lg:pt-0 lg:pb-16">
      <Container className="xl:max-w-[min(92vw,96rem)]">
        <Reveal className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div>
            <h2 className="font-display text-4xl font-extrabold leading-none tracking-[-0.03em] sm:text-5xl">
              KOMBİNLER<span className="text-brand">.</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Birbirini tamamlayan parçalar
            </p>
          </div>
          <Link
            href={HREF}
            className="micro text-foreground transition-colors hover:text-foreground/60"
          >
            Kombinini bul →
          </Link>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-4">
          <Reveal className="lg:col-start-4 lg:row-start-1">
            <EditorialImage
              href={HREF}
              src="/editorial/kombinler.webp"
              alt="452WEAR kombinleri: askıda duran dört tam kombin ve sneaker'ları"
            />
          </Reveal>

          {products.length > 0 && (
            <Stagger
              className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 [scrollbar-width:none] sm:-mx-6 sm:gap-4 sm:scroll-px-6 sm:px-6 lg:col-span-3 lg:col-start-1 lg:row-start-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0"
              stagger={0.08}
              delay={0.1}
            >
              {products.map((product, i) => (
                <StaggerItem
                  key={product.id}
                  className="w-[68%] shrink-0 snap-start sm:w-[42%] lg:w-auto"
                >
                  <OutfitPieceCard product={product} index={i} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </Container>
    </section>
  );
}
