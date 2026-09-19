/**
 * TL fiyatını Türkçe biçimde yazar: ₺1.199 — binlik ayırıcı ".", sembol
 * önde. Kuruşu olmayan tutarda ondalık gösterilmez; kuruşlu tutar
 * yuvarlanmaz, iki haneyle yazılır (₺1.199,50).
 */
export function formatPrice(value: number, currency = "TRY") {
  const whole = Number.isInteger(value);
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(value);
}
