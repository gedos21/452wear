import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion";
import { katalogOku } from "@/lib/catalog-store";

/**
 * Hero arka planındaki ürünler (slug). Görseller bu ürünlerin kendi kapak
 * fotoğraflarıdır: mağazada, mankende çekilmiş gerçek ürün fotoğrafları.
 * Katalogda olmayan ya da görseli olmayan ürün atlanır.
 */
const HERO_SLUGS = [
  "fermuarli-sweatshirt",
  "kapusonlu-sweatshirt",
  "oversize-tisort",
  "basic-tisort",
];

/**
 * Ana sayfanın ilk ekranı: tam genişlikte gerçek ürün fotoğrafları (mobilde
 * iki, masaüstünde dört kolon), üstünde hafif karartma ve ortada kısa mesaj
 * + alışveriş düğmesi. Video yok: projede gerçek bir video kaydı bulunmuyor;
 * eklendiğinde bu arka plan katmanına konabilir.
 */
export async function HomeHero() {
  const products = await katalogOku();
  const images = HERO_SLUGS.map(
    (slug) => products.find((p) => p.slug === slug)?.images[0],
  ).filter((image) => image !== undefined);

  return (
    <section className="relative isolate mb-14 flex h-[clamp(460px,72svh,720px)] items-center justify-center overflow-hidden bg-foreground">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 grid grid-cols-2 gap-0.5 lg:grid-cols-4"
      >
        {images.map((image, i) => (
          <div
            key={image.src}
            className={i >= 2 ? "relative hidden lg:block" : "relative"}
          >
            <Image
              src={image.src}
              alt=""
              fill
              priority={i < 2}
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {/* Yazının okunması için karartma: ortada biraz daha koyu. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-black/45 [background-image:radial-gradient(ellipse_at_center,rgb(0_0_0/0.35),transparent_70%)]"
      />

      <Reveal trigger="mount" className="px-6 text-center text-white">
        <h1 className="font-sf text-[48px] font-bold uppercase leading-[0.95] tracking-[-0.03em] sm:text-[72px] lg:text-[96px]">
          Yeni Gelenler
        </h1>
        <p className="mt-4 font-sf text-[17px] text-white/85 sm:text-[19px]">
          Sezonun yeni parçalarını keşfet.
        </p>
        <Link
          href="/magaza"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 font-sf text-[13px] font-bold uppercase tracking-[0.06em] text-black transition-colors hover:bg-brand hover:text-white"
        >
          Alışverişe Başla
          <ArrowRight className="size-4" strokeWidth={2.2} />
        </Link>
      </Reveal>
    </section>
  );
}
