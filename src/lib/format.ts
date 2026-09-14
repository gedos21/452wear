/** TL fiyatını Türkçe biçimde yazar: 1.499,00 ₺ */
export function formatPrice(value: number, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
