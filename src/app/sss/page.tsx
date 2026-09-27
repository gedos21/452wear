import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { Accordion } from "@/components/product/accordion";
import { FAQ } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Sık Sorulan Sorular",
  description:
    "Kargo, ödeme, iade ve beden hakkında merak ettiklerin: 452WEAR sık sorulan sorular.",
  alternates: { canonical: "/sss" },
};

/**
 * Sık sorulan sorular. İçerik lib/faq'tan gelir; aynı veriden arama
 * motorları için FAQPage yapısal verisi de üretilir.
 */
export default function FaqPage() {
  const yapisalVeri = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.flatMap((grup) =>
      grup.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    ),
  };

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="pt-12 pb-24 sm:pt-16 lg:pt-20">
          <Reveal trigger="mount">
            <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
              SIK SORULAN SORULAR<span className="text-brand">.</span>
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              Kargo, ödeme, iade ve beden hakkında merak ettiklerin. Cevabını
              bulamazsan{" "}
              <Link
                href="/iletisim"
                className="underline decoration-foreground/25 underline-offset-4 transition-colors hover:decoration-foreground"
              >
                bize yaz
              </Link>
              .
            </p>
          </Reveal>

          <Reveal trigger="mount" delay={0.08}>
            <div className="mt-14 grid max-w-3xl gap-12">
              {FAQ.map((grup) => (
                <section key={grup.title}>
                  <h2 className="micro mb-3 text-foreground/45">
                    {grup.title}
                  </h2>
                  <Accordion
                    items={grup.items.map((item) => ({
                      title: item.q,
                      content: (
                        <>
                          <p className="text-[14px]">{item.a}</p>
                          {item.link && (
                            <Link
                              href={item.link.href}
                              // Dış bağlantı (ör. yol tarifi) yeni sekmede.
                              {...(item.link.href.startsWith("http") && {
                                target: "_blank",
                                rel: "noopener noreferrer",
                              })}
                              className="mt-3 inline-block font-semibold text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors hover:decoration-foreground"
                            >
                              {item.link.label} →
                            </Link>
                          )}
                        </>
                      ),
                    }))}
                  />
                </section>
              ))}
            </div>
          </Reveal>
        </Container>
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        // Veri bizim ürettiğimiz nesneden; "<" kaçışı script etiketinin
        // metin içinde kapanamamasını garanti eder.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(yapisalVeri).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
