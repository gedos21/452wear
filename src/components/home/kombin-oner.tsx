import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { ActionButton } from "@/components/ui/action-button";
import { ProductShowcase } from "./product-showcase";
import { vitrinUrunu } from "@/lib/catalog-store";

/**
 * "Bugün ne giyiyorsun?" — kombin öner girişi. Ana sayfada ürünlerden sonra
 * gelir; kombin akışı /kombinini-bul sayfasındadır.
 */
export async function KombinOner() {
  const vitrin = await vitrinUrunu();

  return (
    // Ürün bölümlerinden ince bir çizgiyle ayrılır; içerik dikeyde ortalanır.
    <section className="border-t border-border/70 py-14 sm:py-16 lg:py-20">
      <Container className="grid items-center gap-8 lg:grid-cols-[1fr_minmax(0,440px)] lg:gap-12 xl:max-w-[min(88vw,96rem)]">
        <div>
          <Reveal as="h2">
            <span className="block font-display text-[clamp(2.5rem,13vw,3rem)] font-extrabold leading-[0.9] tracking-[-0.035em] sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
              BUGÜN NE
            </span>
            <span className="block font-display text-[clamp(2.5rem,13vw,3rem)] font-extrabold leading-[0.9] tracking-[-0.035em] sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
              GİYİYORSUN<span className="text-brand">?</span>
            </span>
          </Reveal>

          <Reveal delay={0.08} as="p">
            <span className="mt-5 block max-w-sm text-base text-muted-foreground sm:text-lg">
              Ne giyeceğine birlikte karar verelim.
            </span>
          </Reveal>

          <Reveal delay={0.16} className="mt-7 flex flex-wrap gap-3">
            <ActionButton href="/kombinini-bul">Kombinini Bul</ActionButton>
            <ActionButton href="/magaza" variant="outline">
              Alışverişe Başla
            </ActionButton>
          </Reveal>
        </div>

        {vitrin && (
          <Reveal delay={0.1}>
            <ProductShowcase products={[vitrin]} />
          </Reveal>
        )}
      </Container>
    </section>
  );
}
