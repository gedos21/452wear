import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { HOME_WIDTH } from "./home-layout";

export type CampaignBannerProps = {
  /** Küçük üst satır (ör. "Kampanya"). */
  eyebrow?: string;
  /** Büyük başlık — kısa tutulur, iki satırı geçmemeli. */
  title: string;
  /** Başlığın altındaki tek satır (ör. fiyat ya da indirim bilgisi). */
  subtitle?: string;
  cta: string;
  href: string;
  /**
   * Geniş yatay kampanya görseli. Görselin ÜZERİNDE yazı yoktur; başlık, alt
   * satır ve düğme bu bileşenin HTML'idir. Verilmezse banner koyu zeminde
   * yalnızca tipografiyle çizilir (yer tutucu fotoğraf kullanılmaz).
   */
  image?: { src: string; alt: string };
};

/**
 * Ürün bölümleri arasına giren geniş kampanya bannerı.
 *
 * Görsel 8:3 oranında yerleşir; kutu da 8:3 olduğu için kapak (cover) kırpma
 * yapmaz — 2000×750 kampanya görseli her ekranda TAM görünür, ayakkabılardan
 * hiçbiri kesilmez. Masaüstünde 1216px genişlikte ≈456px yükseklik.
 *
 * Metin masaüstünde görselin SOLUNDA, soldan sağa açılan karartmanın üzerinde
 * durur. Mobilde kırpmak yerine düzen değişir: görsel tam haliyle üstte, metin
 * hemen altında koyu blokta — küçük ekranda yazı da görsel de okunur kalır.
 */
export function CampaignBanner({
  eyebrow,
  title,
  subtitle,
  cta,
  href,
  image,
}: CampaignBannerProps) {
  return (
    <section className="pb-12 sm:pb-14">
      <Container className={HOME_WIDTH}>
        <Link
          href={href}
          className="group relative block overflow-hidden rounded-product bg-foreground text-white"
        >
          {image && (
            <div className="relative aspect-8/3 w-full">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority={false}
                sizes="(min-width: 1344px) 1216px, 100vw"
                className="object-cover"
              />
              {/* Yalnızca geniş ekranda: metnin arkasını koyulaştırır.
                  Görselde ayakkabılar soldan %31'de başlıyor; karartma %55'te
                  biter, ürünlerin üzerine taşmaz. */}
              <div
                aria-hidden
                className="absolute inset-0 hidden bg-gradient-to-r from-black/85 from-0% via-black/45 via-30% to-transparent to-55% lg:block"
              />
            </div>
          )}

          <div
            className={
              image
                // Geniş ekranda metin görselin SOLUNDAKİ koyu boşluğa sığar:
                // ayakkabılar %31'den sonra başlıyor, sütun en çok %26.
                // Dar ekranda (tablet ve altı) o boşluk başlığa yetmediği için
                // düzen değişir: görsel üstte, metin altında.
                ? "p-6 sm:p-8 lg:absolute lg:inset-y-0 lg:left-0 lg:flex lg:max-w-[26%] lg:flex-col lg:justify-center lg:p-10"
                : "flex flex-col justify-center p-6 sm:aspect-video sm:p-10 lg:aspect-[8/3] lg:p-14"
            }
          >
            <div className="max-w-xl">
              {eyebrow && (
                <p className="font-sf text-[12px] font-bold uppercase tracking-[0.14em] text-white/70">
                  {eyebrow}
                </p>
              )}
              {/* Geniş ekranda başlık, dar metin sütununa sığsın diye ekranla
                  birlikte ölçeklenir (en çok 44px). */}
              <h2 className="mt-3 font-sf text-[28px] font-bold uppercase leading-[0.95] tracking-[-0.02em] sm:text-[32px] lg:text-[clamp(28px,3vw,44px)]">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-3 font-sf text-[15px] text-white/85 sm:text-[16px]">
                  {subtitle}
                </p>
              )}
              <span className="mt-6 inline-flex h-12 w-fit items-center gap-2 rounded-full bg-white px-7 font-sf text-[13px] font-bold uppercase tracking-[0.06em] text-black transition-colors group-hover:bg-brand group-hover:text-white">
                {cta}
                <ArrowRight className="size-4" strokeWidth={2.2} />
              </span>
            </div>
          </div>
        </Link>
      </Container>
    </section>
  );
}
