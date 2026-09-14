/**
 * Kargo kuralı. Tutar uydurmuyoruz: eşiğin altındaki siparişlerde ücret
 * ödeme adımında hesaplanır, burada kesin bir rakam gösterilmez.
 * Eşik, ürün detayındaki "Teslimat & İade" metniyle aynı olmalı.
 */
export const FREE_SHIPPING_THRESHOLD = 1500;

export type ShippingState =
  | { free: true }
  | { free: false; remaining: number };

export function shippingFor(subtotal: number): ShippingState {
  return subtotal >= FREE_SHIPPING_THRESHOLD
    ? { free: true }
    : { free: false, remaining: FREE_SHIPPING_THRESHOLD - subtotal };
}
