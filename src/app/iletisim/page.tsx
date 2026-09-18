import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { Slot } from "@/components/legal/prose";
import { COMPANY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Siparişin, iaden ya da bir ürün hakkında 452WEAR'a ulaş.",
};

/** Şirket bilgisi henüz girilmemişse "[...]" değeri işaretli gösterilir. */
const bosMu = (deger: string) => deger.startsWith("[");

function Deger({ deger, href }: { deger: string; href?: string }) {
  if (bosMu(deger)) return <Slot>{deger}</Slot>;
  if (!href) return <>{deger}</>;
  return (
    <Link
      href={href}
      className="underline decoration-foreground/25 underline-offset-4 transition-colors hover:decoration-foreground"
    >
      {deger}
    </Link>
  );
}

/**
 * İletişim bilgileri tek kaynaktan (lib/legal COMPANY) gelir; yasal
 * sayfalarla aynı bilgiler. İletişim formu yok: gönderileri alacak bir
 * sunucu tarafı kurulmadan sahte bir form gösterilmez.
 */
export default function ContactPage() {
  const kanallar = [
    {
      baslik: "E-posta",
      aciklama: "Sipariş, iade ve ürün soruları",
      deger: (
        <Deger deger={COMPANY.email} href={`mailto:${COMPANY.email}`} />
      ),
    },
    {
      baslik: "Telefon",
      aciklama: "Hafta içi mesai saatlerinde",
      deger: (
        <Deger
          deger={COMPANY.phone}
          href={`tel:${COMPANY.phone.replace(/[^\d+]/g, "")}`}
        />
      ),
    },
    {
      baslik: "Adres",
      aciklama: COMPANY.legalName,
      deger: <Deger deger={COMPANY.address} />,
    },
    {
      baslik: "İade adresi",
      aciklama: "İade gönderileri için",
      deger: <Deger deger={COMPANY.returnAddress} />,
    },
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="pt-12 pb-24 sm:pt-16 lg:pt-20">
          <Reveal trigger="mount">
            <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
              İLETİŞİM<span className="text-brand">.</span>
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              Siparişin, iaden ya da bir ürün hakkında sorun mu var? Bize
              yaz; en kısa sürede dönüş yapalım.
            </p>
          </Reveal>

          <Reveal trigger="mount" delay={0.08}>
            <dl className="mt-14 grid max-w-4xl gap-x-12 gap-y-10 sm:grid-cols-2">
              {kanallar.map((k) => (
                <div key={k.baslik} className="border-t border-border/70 pt-5">
                  <dt>
                    <span className="micro text-foreground/45">
                      {k.baslik}
                    </span>
                    <span className="mt-1 block text-[13px] text-muted-foreground">
                      {bosMu(k.aciklama) ? (
                        <Slot>{k.aciklama}</Slot>
                      ) : (
                        k.aciklama
                      )}
                    </span>
                  </dt>
                  <dd className="mt-3 text-base">{k.deger}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-14 max-w-4xl border-t border-border/70 pt-5 micro text-foreground/45">
              <p className="flex flex-wrap gap-x-6 gap-y-2">
                <span>
                  Vergi dairesi / no:{" "}
                  <Deger deger={COMPANY.taxOffice} /> ·{" "}
                  <Deger deger={COMPANY.taxNumber} />
                </span>
                <span>
                  MERSİS: <Deger deger={COMPANY.mersis} />
                </span>
                <span>
                  KEP: <Deger deger={COMPANY.kep} />
                </span>
              </p>
            </div>
          </Reveal>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
