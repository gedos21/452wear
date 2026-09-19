/**
 * Ürün ızgarasının kolon ve boşluk kuralı. Mağaza ve favoriler aynı ritmi
 * kullansın diye tek yerden geliyor: mobil 2, tablet 3, masaüstü 4 kolon.
 */
export const PRODUCT_GRID_COLUMNS =
  "grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4";

/** Izgaradaki kart genişliğine göre görsel boyut ipucu. */
export const PRODUCT_GRID_SIZES =
  "(min-width: 1024px) 23vw, (min-width: 768px) 30vw, 45vw";
