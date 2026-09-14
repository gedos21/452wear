import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { AccountView } from "@/components/account/account-view";

export const metadata: Metadata = {
  title: "Hesap",
  description: "452WEAR hesabın.",
};

export default function AccountPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
          <Reveal trigger="mount">
            <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              HESABIN<span className="text-brand">.</span>
            </h1>
          </Reveal>

          <Reveal trigger="mount" delay={0.06}>
            <p className="mt-5 max-w-sm text-muted-foreground">
              Siparişlerini, favorilerini ve adreslerini tek yerden yönet.
            </p>
          </Reveal>

          <div className="mt-12 sm:mt-16">
            <AccountView />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
