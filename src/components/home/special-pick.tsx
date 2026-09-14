import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { Lanyard } from "@/components/react-bits";
import { SpecialPickCard } from "@/components/product/special-pick-card";
import { ActionButton } from "@/components/ui/action-button";
import { getPersonalPick } from "@/data/products";

export async function SpecialPick() {
  const product = await getPersonalPick();
  const href = `/urun/${product.slug}`;

  return (
    // overflow-x-clip: kart salınırken sayfa asla yatay kaymasın
    // (clip, hidden'ın aksine kaydırma bağlamı oluşturmaz).
    <section className="overflow-x-clip py-16 sm:py-20 lg:py-28">
      <Container className="grid items-center gap-16 lg:grid-cols-[1fr_minmax(0,380px)] lg:gap-24">
        <div>
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
              SANA ÖZEL<span className="text-brand">.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.06}>
            <p className="mt-5 max-w-sm text-muted-foreground">
              Bugün senin için bir şey seçtik.
            </p>
          </Reveal>

          <Reveal delay={0.12} className="mt-9">
            <ActionButton href={href}>Keşfet</ActionButton>
          </Reveal>
        </div>

        <Lanyard
          strapLength={110}
          cardClassName="mx-auto w-full max-w-[224px] sm:max-w-[240px]"
        >
          <SpecialPickCard product={product} ctaHref={href} />
        </Lanyard>
      </Container>
    </section>
  );
}
