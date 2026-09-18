import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { ActionButton } from "@/components/ui/action-button";

export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
};

/** Hem eşleşmeyen adresler hem de notFound() (ör. olmayan ürün) buraya düşer. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center">
        <Container className="py-20 sm:py-28">
          <Reveal trigger="mount">
            <p className="micro text-foreground/45">Hata 404</p>
            <h1 className="mt-4 font-display text-[clamp(3rem,12vw,7rem)] font-extrabold leading-[0.86] tracking-[-0.045em]">
              BURADA
              <br />
              BİR ŞEY YOK<span className="text-brand">.</span>
            </h1>
          </Reveal>

          <Reveal trigger="mount" delay={0.08}>
            <p className="mt-8 max-w-sm text-muted-foreground">
              Aradığın sayfa taşınmış ya da hiç var olmamış olabilir. Ürün
              yayından kalkmış da olabilir.
            </p>
          </Reveal>

          <Reveal trigger="mount" delay={0.16} className="mt-9 flex flex-wrap gap-3">
            <ActionButton href="/magaza">Mağazaya Git</ActionButton>
            <ActionButton href="/" variant="outline">
              Ana Sayfa
            </ActionButton>
          </Reveal>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
