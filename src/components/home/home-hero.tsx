import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion";

/**
 * Ana sayfanın ilk ekranı: tam genişlikte kampanya görseli (452WEAR ürünleri,
 * mavi ışıklı sahne), üstünde hafif karartma ve ortada kısa mesaj + alışveriş
 * düğmesi. Görselde yazı yok; metinler sitenin kendi HTML'i.
 */
export function HomeHero() {
  return (
    <section className="relative isolate mb-10 flex h-[clamp(420px,64svh,640px)] items-center justify-center overflow-hidden bg-foreground sm:mb-12">
      <Image
        src="/editorial/hero-yeni-gelenler.webp"
        alt=""
        fill
        priority
        // Dikey ekranda (mobil) kapak kırpması görseli yüksekliğe göre büyütür:
        // görünen genişlik ekranın ~3–4 katıdır. "100vw" burada küçük bir
        // sürüm seçtirip bulanıklaştırıyordu; dikeyde orijinal çözünürlük gelir.
        sizes="(orientation: portrait) 400vw, 100vw"
        // Masaüstünde hero görselden daha yatay: üstten biraz fazla kırpılmasın
        // diye odak %30'da (kapüşon kesilmez, alttaki taş görünür kalır).
        // Mobilde yalnızca ortadaki şerit görünür; ürünlerin ortası kadrajda.
        className="-z-10 object-cover object-[50%_30%]"
      />
      {/* Yazının okunması için hafif karartma: ortada (yazının arkasında)
          biraz daha koyu, kenarlardaki mavi ışıklar görünür kalır. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-black/25 [background-image:radial-gradient(ellipse_55%_45%_at_center,rgb(0_0_0/0.45),transparent_75%)]"
      />

      <Reveal
        trigger="mount"
        className="px-6 text-center text-white [text-shadow:0_2px_24px_rgb(0_0_0/0.45)]"
      >
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
