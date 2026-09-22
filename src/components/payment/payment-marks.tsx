import { cn } from "@/lib/utils";

/**
 * Kabul edilen kart şemalarının logoları. Footer ve ürün sayfası aynı listeyi
 * kullanır — yeni bir şema eklenince tek yer değişir.
 *
 * Dosyalar markaların kendi SVG'leri (public/logo/odeme); elle çizilmedi.
 * Genişlikler bu yükseklikteki gerçek oranlarından gelir ve yalnızca yer
 * tutucudur (logo yüklenirken satır zıplamasın); görünen boyut className ile
 * verilen yükseklikten belirlenir.
 */
const YUKSEKLIK = 28;

export const ODEME_LOGOLARI = [
  { ad: "Visa", dosya: "/logo/odeme/visa.svg", genislik: 86 },
  { ad: "Mastercard", dosya: "/logo/odeme/mastercard.svg", genislik: 45 },
  { ad: "Troy", dosya: "/logo/odeme/troy.svg", genislik: 61 },
];

export function PaymentMarks({
  /** Logo yüksekliği sınıfı, ör. "h-6 sm:h-7". */
  logoClassName,
  className,
}: {
  logoClassName: string;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center", className)}>
      {ODEME_LOGOLARI.map((logo) => (
        <li key={logo.ad} className="flex">
          {/* next/image SVG'yi servis etmek için dangerouslyAllowSVG ister;
              dosyalar kendi public klasörümüzde ve boyut sabit. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.dosya}
            alt={logo.ad}
            width={logo.genislik}
            height={YUKSEKLIK}
            className={cn("w-auto", logoClassName)}
          />
        </li>
      ))}
    </ul>
  );
}
