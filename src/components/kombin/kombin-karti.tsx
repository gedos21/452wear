import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { CozulmusKombin } from "@/lib/kombin-panolari";

/**
 * Kombin panosu kartı: parçalar beyaz bir panoda yan yana (üst/takım büyük,
 * ayakkabı küçük ve biraz aşağıda — "yere serilmiş" düzen), altında ad, kısa
 * tarif ve kombin toplamı. Tıklayınca /kombinler sayfasında o kombine gider.
 */
export function KombinKarti({
  kombin,
  sizes = "(min-width: 1024px) 26vw, 80vw",
}: {
  kombin: CozulmusKombin;
  sizes?: string;
}) {
  const [ana, ...digerleri] = kombin.urunler;
  const indirimli = kombin.indirimsizToplam > kombin.toplam;

  return (
    <Link
      href={`/kombinler#${kombin.slug}`}
      className="group block font-sf"
      aria-label={`${kombin.ad} kombini: ${kombin.urunler.map((u) => u.name).join(", ")}`}
    >
      <div className="relative flex aspect-[5/4] items-center gap-3 overflow-hidden rounded-[var(--radius-product)] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
        <div className="relative h-full flex-[3] overflow-hidden rounded-xl">
          <Image
            src={ana.images[0].src}
            alt=""
            fill
            sizes={sizes}
            className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex h-full flex-[2] flex-col justify-end gap-3">
          {digerleri.map((u) => (
            <div
              key={u.id}
              className="relative aspect-4/5 w-full overflow-hidden rounded-xl bg-muted"
            >
              <Image
                src={u.images[0].src}
                alt=""
                fill
                sizes="(min-width: 1024px) 12vw, 32vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </div>
          ))}
        </div>
        <span className="absolute left-4 top-4 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-background sm:left-5 sm:top-5">
          {kombin.urunler.length} parça
        </span>
      </div>

      <div className="mt-3.5">
        <h3 className="text-[15px] font-bold uppercase tracking-[-0.005em]">
          {kombin.ad}
        </h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-foreground/60">
          {kombin.not}
        </p>
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <p className="flex items-baseline gap-2">
            <span className="text-[17px] font-black leading-none">
              {formatPrice(kombin.toplam, ana.currency)}
            </span>
            {indirimli && (
              <span className="text-[12px] font-medium leading-none text-foreground/45 line-through">
                {formatPrice(kombin.indirimsizToplam, ana.currency)}
              </span>
            )}
          </p>
          <span className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.04em] transition-colors group-hover:text-brand">
            Kombini gör
            <ArrowRight className="size-3.5" strokeWidth={2.2} />
          </span>
        </div>
      </div>
    </Link>
  );
}
