import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { LEGAL_UPDATED_AT, LEGAL_VERSION, type LegalPage } from "@/lib/legal";

/** Yasal sayfa metadata'sını kayıttan üretir. */
export function legalMetadata(page: LegalPage): Metadata {
  return { title: page.metaTitle, description: page.description };
}

/**
 * Sekiz yasal sayfanın ortak iskeleti: mevcut navbar/footer, aynı tipografi
 * ve okunabilirlik için dar ölçü (max-w-2xl ≈ 65–75 karakter satır).
 */
export function LegalPageLayout({
  page,
  children,
}: {
  page: LegalPage;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="pt-12 pb-24 sm:pt-16 lg:pt-20">
          <div className="max-w-2xl">
            <Reveal trigger="mount">
              <h1 className="font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                {page.title}
                <span className="text-brand">.</span>
              </h1>
            </Reveal>

            <Reveal trigger="mount" delay={0.06}>
              <p className="mt-5 text-muted-foreground">{page.description}</p>

              <p className="mt-6 micro text-foreground/45">
                Son güncelleme: {LEGAL_UPDATED_AT} · Sürüm {LEGAL_VERSION}
              </p>

              <div className="mt-8 rounded-product bg-muted px-5 py-4">
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  Bu metin bir taslaktır ve yayına alınmadan önce hukuk
                  danışmanı tarafından gözden geçirilmelidir. Köşeli parantez
                  içindeki alanlar henüz doldurulmamıştır.
                </p>
              </div>
            </Reveal>

            <div className="mt-14 space-y-12">{children}</div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
