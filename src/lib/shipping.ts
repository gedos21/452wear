/**
 * Kargo kuralı — TEK KAYNAK. Sepet, ürün sayfası, yasal metinler ve ileride
 * checkout / sipariş / ödeme hep buradan okur; başka yerde tutar yazılmaz.
 *
 * Tutarlar KURUŞ cinsinden tanımlıdır: sunucu tarafı sipariş ve ödeme
 * hesabı kuruşla (tam sayı) yapılacak, ödeme sağlayıcıları da tutarı kuruşla
 * ister. Arayüzdeki TL değerleri bunlardan türetilir.
 *
 * Kural: ara toplam eşiğe EŞİT veya büyükse kargo ücretsiz, altındaysa sabit
 * ücret alınır.
 */
export const FREE_SHIPPING_THRESHOLD_KURUS = 300_000; // 3.000 TL
export const SHIPPING_FEE_KURUS = 12_000; // 120 TL

/** Arayüzde gösterim için TL karşılıkları. */
export const FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_THRESHOLD_KURUS / 100;
export const SHIPPING_FEE = SHIPPING_FEE_KURUS / 100;

export type ShippingQuoteKurus = {
  free: boolean;
  /** Alınacak kargo ücreti; ücretsizse 0. */
  feeKurus: number;
  /** Ücretsiz kargoya kalan tutar; ücretsizse 0. */
  remainingKurus: number;
};

/**
 * Kargo hesabı (kuruş). Checkout, sipariş oluşturma ve ödeme tutarı bunu
 * kullanacak; ara toplam sunucuda veritabanı fiyatlarından hesaplanıp verilir.
 */
export function shippingForKurus(subtotalKurus: number): ShippingQuoteKurus {
  if (subtotalKurus >= FREE_SHIPPING_THRESHOLD_KURUS)
    return { free: true, feeKurus: 0, remainingKurus: 0 };
  return {
    free: false,
    feeKurus: SHIPPING_FEE_KURUS,
    remainingKurus: FREE_SHIPPING_THRESHOLD_KURUS - subtotalKurus,
  };
}

export type ShippingState =
  | { free: true; fee: 0 }
  | { free: false; fee: number; remaining: number };

/** Arayüz (TL) karşılığı: aynı kural, kuruş hesabı üzerinden. */
export function shippingFor(subtotal: number): ShippingState {
  const q = shippingForKurus(Math.round(subtotal * 100));
  return q.free
    ? { free: true, fee: 0 }
    : { free: false, fee: q.feeKurus / 100, remaining: q.remainingKurus / 100 };
}
