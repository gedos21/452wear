import type {
  ApparelSize,
  Product,
  ProductCategory,
  ProductImage,
  OneSize,
  ProductSize,
  ShoeSize,
} from "@/types/product";

export const APPAREL_SIZES: ApparelSize[] = ["XS", "S", "M", "L", "XL", "XXL"];

export const SHOE_SIZES: ShoeSize[] = [
  "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46",
];

/** Saat gibi tek bedenli ürünler. */
export const ONE_SIZE: OneSize = "Standart";

/** Beden sıralaması — veri hangi sırada gelirse gelsin UI hep aynı sırada gösterir. */
export const SIZE_ORDER: ProductSize[] = [
  ...APPAREL_SIZES,
  ...SHOE_SIZES,
  ONE_SIZE,
];

/** Beden seçimi olmayan (tek bedenli) kategori mi. */
export function isOneSizeCategory(category: ProductCategory): boolean {
  return category === "saat";
}

/** Sepet/sipariş satırındaki varyant yazısı; tek bedende yalnızca renk. */
export function variantLabel(color: string, size: ProductSize): string {
  return size === ONE_SIZE ? color : `${color} / ${size}`;
}

/**
 * Kategorinin beden sistemi: ayakkabıda numara, saatte tek beden, diğerlerinde
 * harf beden.
 */
export function sizesForCategory(category: ProductCategory): ProductSize[] {
  if (category === "ayakkabi") return SHOE_SIZES;
  if (isOneSizeCategory(category)) return [ONE_SIZE];
  return APPAREL_SIZES;
}

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
