import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ActionButton } from "@/components/ui/action-button";
import {
  PRODUCT_ASPECT,
  PRODUCT_SURFACE,
} from "@/components/product/product-surface";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "452WEAR'ın giyim anlayışı.",
};

/**
 * Marka sayfası. Doğrulanmamış hiçbir bilgi (kuruluş yılı, şehir, üretim,
 * ekip, materyal, sürdürülebilirlik) yazılmaz; metinler yalnızca markanın
 * tasarım yaklaşımı ve estetiği üzerinedir. Görseller mevcut ürün
 * görsellerinden gelir.
 */

const APPROACH = [
  {
    no: "01",
    title: "Kalıp önce gelir.",
    body: "Bir parçanın nasıl durduğu, üzerinde ne yazdığından önce gelir. Omuz nereye oturuyor, kol nerede bitiyor — gerisi sonra.",
  },
  {
    no: "02",
    title: "Baskı imzadır, süs değil.",
    body: "Bir işaret yeter. Her yüzeyi doldurmak, söyleyecek bir şeyin olmadığını gösterir.",
  },
  {
    no: "03",
    title: "Renk az, doğru olsun.",
    body: "Siyah, kırık beyaz, haki, indigo. Birbiriyle yarışan değil, birbirini bekleyen renkler.",
  },
  {
    no: "04",
    title: "Sezon değil, sıra.",
    body: "Takvim öyle istediği için değil; parça hazır olduğu için çıkar.",
  },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Açılış */}
        <section className="pt-16 pb-24 sm:pt-24 sm:pb-32 lg:pt-32 lg:pb-40">
          <Container>
            <Reveal trigger="mount">
              <h1 className="font-display text-[clamp(2.5rem,11vw,7rem)] font-extrabold leading-[0.86] tracking-[-0.045em]">
                452WEAR
              </h1>
            </Reveal>

            <Reveal trigger="mount" delay={0.08}>
              <p className="mt-10 max-w-md font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
                Herkese göre değil<span className="text-brand">.</span>
              </p>
              <p className="mt-5 max-w-sm text-muted-foreground">
                Sana göre olup olmadığını, giydiğinde anlarsın.
              </p>
            </Reveal>
          </Container>
        </section>

        {/* Manifesto */}
        <section className="border-t border-border/70 py-20 sm:py-28 lg:py-36">
          <Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-24">
            <Reveal>
              <h2 className="font-display text-[clamp(1.75rem,6.2vw,3.75rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
                GİYİNMEK BİR
                <br />
                AÇIKLAMA DEĞİL<span className="text-brand">.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.08} className="lg:pt-4">
              <p className="text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Bir parçayı üstüne aldığında kendini anlatmak zorunda
                kalmamalısın. İyi duran şey konuşmaz; sadece durur.
              </p>
              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                452WEAR bağırmayan ama fark edilen şeyler yapıyor. Bir odaya
                girdiğinde önce sen görünürsün, sonra üstündeki.
              </p>
            </Reveal>
          </Container>
        </section>

        {/* Yaklaşım */}
        <section className="border-t border-border/70 py-20 sm:py-28 lg:py-36">
          <Container className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-24">
            <div>
              <Reveal>
                <p className="micro text-foreground/45">Yaklaşım</p>
              </Reveal>

              <Stagger className="mt-10 space-y-12 sm:space-y-14" stagger={0.07}>
                {APPROACH.map((item) => (
                  <StaggerItem key={item.no} as="div">
                    <div className="grid gap-x-8 gap-y-3 sm:grid-cols-[3rem_minmax(0,1fr)]">
                      <span className="micro text-brand">{item.no}</span>
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-extrabold tracking-[-0.02em] sm:text-2xl">
                          {item.title}
                        </h3>
                        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>

            <Reveal delay={0.1} className="lg:pt-16">
              <div className={cn("relative", PRODUCT_SURFACE, PRODUCT_ASPECT)}>
                <Image
                  src="/products/eye-dagger-tee.jpg"
                  alt="Kırık beyaz tişört üzerinde gravür tarzı baskı"
                  fill
                  sizes="(min-width: 1024px) 22rem, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Ürünlerin karakteri */}
        <section className="border-t border-border/70 py-20 sm:py-28 lg:py-36">
          <Container>
            <Reveal>
              <h2 className="max-w-3xl font-display text-[clamp(1.75rem,6.2vw,3.75rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
                AĞIR KUMAŞ.
                <br />
                SAKİN RENK.
                <br />
                TEK BİR İŞARET.
              </h2>
            </Reveal>

            <Reveal delay={0.08}>
              <p className="mt-10 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Parçalar ilk günden sonra daha iyi görünsün diye tasarlanıyor.
                Yıkandıkça kaybolan değil, yerine oturan şeyler.
              </p>
            </Reveal>

            <Stagger
              className="mt-16 grid grid-cols-2 gap-4 sm:gap-6 lg:mt-20 lg:grid-cols-4"
              stagger={0.06}
            >
              {[
                { src: "/products/p-001-a.png", alt: "Siyah oversize tişört" },
                { src: "/products/p-002-a.png", alt: "Gri kapüşonlu sweatshirt" },
                { src: "/products/p-003-a.png", alt: "Haki kargo pantolon" },
                { src: "/products/p-004-a.png", alt: "İndigo yıkanmış jean" },
              ].map((image) => (
                <StaggerItem key={image.src} as="div">
                  <div className={cn("relative", PRODUCT_SURFACE, PRODUCT_ASPECT)}>
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 1024px) 23vw, 45vw"
                      className="object-cover"
                    />
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        {/* Kapanış */}
        <section className="border-t border-border/70 py-24 sm:py-32 lg:py-40">
          <Container>
            <Reveal>
              <h2 className="max-w-4xl font-display text-[clamp(1.6rem,5.4vw,3.75rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
                DOLABINDA YER KAPLAMAYAN,
                <br />
                SIRTINDA KALAN PARÇALAR<span className="text-brand">.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.1} className="mt-12">
              <ActionButton href="/magaza">Koleksiyonu Keşfet</ActionButton>
            </Reveal>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
