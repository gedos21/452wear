import { cn } from "@/lib/utils";

/**
 * SİTE GENELİ ÜRÜN GÖRSELİ KURALI.
 *
 * Her ürün görseli bu yüzeyin içinde durur:
 *  - taşma kırpılır (`overflow-hidden`), böylece görsel kartın köşe
 *    yuvarlaklığını birebir takip eder; kart ile görsel arasında keskin köşe
 *    oluşamaz,
 *  - yuvarlaklık tek bir yerden gelir: `--radius-product` (globals.css).
 *
 * Yeni bir ürün listesi eklerken (kategori, arama, favoriler, sepet, öneriler)
 * görseli doğrudan <Image> ile değil bu bileşenle — ya da özel bir kapsayıcı
 * gerekiyorsa PRODUCT_SURFACE sınıfıyla — sar. Radius değişirse tek bir
 * değişiklik bütün siteyi günceller.
 */
/**
 * Kuralın kendisi: kırpma + global yuvarlaklık + boş alan zemini.
 * Konumlandırma (relative/absolute) bilerek dışarıda — çağıran taraf kendi
 * yerleşimini kurar, sınıf çakışması olmaz.
 */
export const PRODUCT_SURFACE = "overflow-hidden rounded-product bg-muted";

/** Ürün görsellerinin standart oranı. */
export const PRODUCT_ASPECT = "aspect-4/5";

export function ProductSurface({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative", PRODUCT_SURFACE, PRODUCT_ASPECT, className)}>
      {children}
    </div>
  );
}
