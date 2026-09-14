import type { Product, ProductImage, ProductSize } from "@/types/product";

/** Beden sıralaması — veri hangi sırada gelirse gelsin UI hep aynı sırada gösterir. */
export const SIZE_ORDER: ProductSize[] = ["XS", "S", "M", "L", "XL", "XXL"];

/**
 * Bir rengin görselleri.
 *
 * Veri modelinde henüz renge özel görsel yok; ürünün görselleri dönüyor.
 * ProductColor'a `images` alanı eklendiğinde YALNIZCA bu fonksiyon değişecek,
 * onu tüketen bileşenler (galeri, kart) aynı kalacak.
 */
export function imagesForColor(product: Product, _color: string): ProductImage[] {
  void _color;
  return product.images;
}

/** Bedenin, seçili renkte stokta olup olmadığı. */
export function sizeAvailability(product: Product, color: string) {
  return SIZE_ORDER.filter((size) =>
    product.variants.some((v) => v.size === size),
  ).map((size) => ({
    size,
    inStock: product.variants.some(
      (v) => v.size === size && v.color === color && v.stock > 0,
    ),
  }));
}

/** Bir renkte hiç stok var mı — renk swatch'ını sönükleştirmek için. */
export function colorInStock(product: Product, color: string) {
  return product.variants.some((v) => v.color === color && v.stock > 0);
}

/** Açılışta seçili gelecek renk: stokta olan ilk renk, yoksa ilk renk. */
export function defaultColor(product: Product) {
  return (
    product.colors.find((c) => colorInStock(product, c.name))?.name ??
    product.colors[0]?.name ??
    ""
  );
}
