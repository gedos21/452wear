import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";
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
   * Geniş yatay görsel. Verilmezse banner koyu zeminde yalnızca tipografiyle
   * çizilir: kampanya görseli hazır olmadan da yapı bozulmaz, yer tutucu ya
   * da alakasız bir fotoğraf gösterilmez.
   */
  image?: { src: string; alt: string; focus?: string };
};

/**
 * Ürün bölümleri arasına giren geniş kampanya bannerı.
 *
 * Oran responsive: mobilde dik (4:5), tablette 16:9, masaüstünde geniş şerit
 * (21:9). Metin ve CTA görselin üzerinde durur; okunabilirlik için soldan
 * sağa açılan bir karartma kullanılır (görselin sağ tarafı görünür kalır).
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
          className={cn(
            "group relative block overflow-hidden rounded-product",
            "aspect-4/5 sm:aspect-video lg:aspect-[21/9]",
            image ? "bg-muted" : "bg-foreground",
          )}
        >
          {image && (
            <>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1280px) 1216px, 100vw"
                style={image.focus ? { objectPosition: image.focus } : undefined}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/30 to-transparent sm:bg-gradient-to-r sm:from-black/70 sm:via-black/35 sm:to-transparent"
              />
            </>
          )}

          <div className="absolute inset-0 flex flex-col justify-end p-6 text-white sm:justify-center sm:p-10 lg:p-14">
            <div className="max-w-xl">
              {eyebrow && (
                <p className="font-sf text-[12px] font-bold uppercase tracking-[0.14em] text-white/70">
                  {eyebrow}
                </p>
              )}
              <h2 className="mt-3 font-sf text-[32px] font-bold uppercase leading-[0.95] tracking-[-0.02em] sm:text-[44px] lg:text-[56px]">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-3 font-sf text-[15px] text-white/85 sm:text-[17px]">
                  {subtitle}
                </p>
              )}
              <span className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 font-sf text-[13px] font-bold uppercase tracking-[0.06em] text-black transition-colors group-hover:bg-brand group-hover:text-white">
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
