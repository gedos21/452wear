import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { OutfitPicker } from "@/components/product/outfit-picker";
import { formatPrice } from "@/lib/format";
import { kombinPanolari } from "@/lib/kombin-panolari";

export const metadata: Metadata = {
  title: "Kombinler",
  description:
    "452WEAR'ın hazır kombinleri: parçaları bir arada gör, bedenini seç, tek tıkla sepete ekle.",
};

/**
 * Hazır kombinler: her kombin kendi bölümünde, parçalar beden seçimiyle ve
 * "Kombini sepete ekle" ile (OutfitPicker). Ana sayfadaki kartlar buraya
 * #slug ile gelir.
 */
export default async function KombinlerSayfasi() {
  const kombinler = await kombinPanolari();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="pt-10 pb-20 sm:pt-14 sm:pb-24">
          <h1 className="font-display text-[clamp(2.25rem,9vw,4rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.03em]">
            Kombinler<span className="text-brand">.</span>
          </h1>
          <p className="mt-3 max-w-md font-sf text-[15px] text-foreground/60">
            Parçaları bir arada gör, her birinin bedenini seç, kombini tek tıkla
            sepetine ekle.
          </p>

          {kombinler.length === 0 ? (
            <p className="mt-12 font-sf text-sm text-muted-foreground">
              Şu an hazır kombin yok.{" "}
              <Link
                href="/kombinini-bul"
                className="underline underline-offset-4"
              >
                Kendi kombinini kur
              </Link>
              .
            </p>
          ) : (
            <div className="mt-10 divide-y divide-border/70 border-t border-border/70">
              {kombinler.map((k) => (
                <section
                  key={k.slug}
                  id={k.slug}
                  aria-labelledby={`${k.slug}-baslik`}
                  className="scroll-mt-24 py-10 sm:py-12 lg:scroll-mt-28"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-sf">
                    <h2
                      id={`${k.slug}-baslik`}
                      className="text-[22px] font-bold uppercase tracking-[-0.01em] sm:text-[26px]"
                    >
                      {k.ad}
                    </h2>
                    {k.indirimsizToplam > k.toplam && (
                      <p className="text-[13px] text-foreground/55">
                        İndirimsiz{" "}
                        <span className="line-through">
                          {formatPrice(
                            k.indirimsizToplam,
                            k.urunler[0].currency,
                          )}
                        </span>
                      </p>
                    )}
                  </div>
                  <p className="mt-1.5 font-sf text-[14px] text-foreground/60">
                    {k.not}
                  </p>
                  <OutfitPicker
                    pieces={k.urunler}
                    currentId=""
                    total={k.toplam}
                  />
                </section>
              ))}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
