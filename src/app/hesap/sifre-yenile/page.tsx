import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { ResetPasswordForm } from "@/components/account/reset-password-form";
import { MAIN_CONTENT_ID } from "@/components/layout/skip-link";

export const metadata: Metadata = {
  title: "Yeni Şifre",
  robots: { index: false },
};

/** E-postadaki sıfırlama bağlantısı buraya `?token=` ile döner. */
export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/hesap/sifre-yenile">) {
  const { token, error } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1">
        <Container className="pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
          <Reveal trigger="mount">
            <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              YENİ ŞİFRE<span className="text-brand">.</span>
            </h1>
          </Reveal>

          <div className="mt-12 sm:mt-16">
            <ResetPasswordForm
              token={typeof token === "string" && !error ? token : null}
            />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
