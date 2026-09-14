import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { ActionButton } from "@/components/ui/action-button";
import { ProductShowcase } from "./product-showcase";
import { getShowcaseProducts } from "@/data/products";

export async function Hero() {
  const showcase = await getShowcaseProducts();

  return (
    <section className="pt-10 pb-12 sm:pt-14 sm:pb-16 lg:pt-16 lg:pb-16">
      <Container className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-16">
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
            <span className="mt-6 block max-w-sm text-base text-muted-foreground sm:text-lg">
              Ne giyeceğine birlikte karar verelim.
            </span>
          </Reveal>

          <Reveal trigger="mount" delay={0.16} className="mt-9 flex flex-wrap gap-3">
            <ActionButton href="/kombinini-bul">Kombinini Bul</ActionButton>
            <ActionButton href="/magaza" variant="outline">
              Alışverişe Başla
            </ActionButton>
          </Reveal>
        </div>

        <Reveal trigger="mount" delay={0.1}>
          <ProductShowcase products={showcase} />
        </Reveal>
      </Container>
    </section>
  );
}
