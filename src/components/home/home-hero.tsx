import { ArrowRight } from "lucide-react";
import { HeroCta } from "./intro/hero-cta";
import { Hero452 } from "./intro/hero-452";
import { INTRO_END } from "./intro/intro-timing";

/**
 * Ana sayfanın ilk ekranı: gece kanyonunun önünde gerçek zamanlı krom 3B
 * "452". Açılışta hafifçe büyüyerek belirir, üzerinden buz mavisi ışık
 * geçer ve yavaşça sürekli döner; ardından alışveriş düğmesi belirir.
 * Düğmeye basınca 452 ve arka plan sönerek mağazaya geçilir. Sahne ve
 * zamanlama: components/home/intro.
 */
export function HomeHero() {
  return (
    <section
      className="relative isolate mb-10 flex h-[clamp(480px,76svh,760px)] items-end justify-center overflow-hidden bg-black sm:mb-12"
      style={{ ["--intro-end" as string]: `${INTRO_END}s` }}
    >
      {/* Rakamların arkasında çok hafif soğuk ışıma; silüet evresinde
          452'nin siyah zeminden ayrılmasını sağlar. */}
      <div aria-hidden className="hero-452-glow absolute inset-0 -z-10" />

      <Hero452 />

      <h1 className="sr-only">452WEAR</h1>

      <div className="hero-452-cta relative mb-[clamp(40px,9svh,88px)]">
        <HeroCta
          href="/magaza"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-white/[0.04] px-7 font-sf text-[13px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white hover:text-black"
        >
          Alışverişe Başla
          <ArrowRight className="size-4" strokeWidth={2.2} />
        </HeroCta>
      </div>
    </section>
  );
}
