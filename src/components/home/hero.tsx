import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { ActionButton } from "@/components/ui/action-button";
import { ProductShowcase } from "./product-showcase";
import { vitrinUrunu } from "@/lib/catalog-store";

export async function Hero() {
  const vitrin = await vitrinUrunu();

  return (
    // Masaüstünde ~65vh; çok uzun ekranlarda içerik etrafında boşluk
    // birikmesin diye 600px'te sınırlanır. İçerik dikeyde ortalanır.
    <section className="pt-8 pb-6 sm:pt-10 sm:pb-8 lg:flex lg:min-h-[clamp(520px,65vh,600px)] lg:items-center lg:py-0">
      <Container className="grid items-center gap-8 lg:grid-cols-[1fr_minmax(0,440px)] lg:gap-12 xl:max-w-[min(88vw,96rem)]">
        <div>
          <Reveal trigger="mount" as="h1">
            <span className="block font-display text-5xl font-extrabold leading-[0.9] tracking-[-0.035em] sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
              BUGÜN NE
            </span>
            <span className="block font-display text-5xl font-extrabold leading-[0.9] tracking-[-0.035em] sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
              GİYİYORSUN<span className="text-brand">?</span>
            </span>
          </Reveal>

          <Reveal trigger="mount" delay={0.08} as="p">
            <span className="mt-5 block max-w-sm text-base text-muted-foreground sm:text-lg">
              Ne giyeceğine birlikte karar verelim.
            </span>
          </Reveal>

          <Reveal trigger="mount" delay={0.16} className="mt-7 flex flex-wrap gap-3">
            <ActionButton href="/kombinini-bul">Kombinini Bul</ActionButton>
            <ActionButton href="/magaza" variant="outline">
              Alışverişe Başla
            </ActionButton>
          </Reveal>
        </div>

        {vitrin && (
          <Reveal trigger="mount" delay={0.1}>
            <ProductShowcase products={[vitrin]} />
          </Reveal>
        )}
      </Container>
    </section>
  );
}
