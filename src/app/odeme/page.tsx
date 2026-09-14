import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { CheckoutSummary } from "@/components/cart/checkout-summary";

export const metadata: Metadata = {
  title: "Ödeme",
};

/**
 * Ödeme adımının iskeleti. Ödeme altyapısı bağlı değil — sahte bir form ya da
 * sahte bir onay ekranı üretmiyoruz; sepet özeti gösterilip durum açıkça
 * belirtiliyor.
 */
export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="pt-12 pb-24 sm:pt-16 lg:pt-20">
          <Reveal trigger="mount">
            <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
              ÖDEME<span className="text-brand">.</span>
            </h1>
          </Reveal>

          <div className="mt-12 max-w-lg">
            <CheckoutSummary />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
