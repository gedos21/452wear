export type Currency = "TRY";

export type ProductSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export type ProductCategory =
  | "ayakkabi"
  | "esofman"
  | "hirka"
  | "tisort"
  | "sweatshirt";

export type ProductImage = {
  /** /public altındaki yol veya uzak URL */
  src: string;
  alt: string;
};

export type ProductColor = {
  name: string;
  /** Kartlardaki minik renk noktası için */
  hex: string;
};

/** Katman yuvası. Yeni yuvalar (dış giyim, ayakkabı) buraya eklenir. */
export type TryOnLayer = "top" | "bottom";

/**
 * Karakter üzerine bindirilecek şeffaf katman görseli.
 *
 * `asset`, /public altındaki yoldur ve CHARACTER_CANVAS ölçüsünde,
 * base ile aynı anchor'a sahip şeffaf bir PNG olmalıdır
 * (bkz. src/lib/character.ts ve public/character/README.md).
 *
 * Alan opsiyoneldir: try-on görseli olmayan ürün normal ürün olarak çalışır,
 * yalnızca ilgili katman çizilmez.
 */
/**
 * Asset onay durumu. Yüklenen bir katman admin onaylayana kadar "pending"
 * kalır ve mağazada/karakterde GÖSTERİLMEZ — bkz. tryOnAsset().
 */
export type TryOnStatus = "pending" | "approved";

export type ProductTryOn = {
  layer: TryOnLayer;
  asset: string;
  status: TryOnStatus;
};

export type ProductVariant = {
  id: string;
  size: ProductSize;
  /** ProductColor.name ile eşleşir */
  color: string;
  /** Stok adedi; 0 ise tükendi */
  stock: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ProductCategory;
  /** TL cinsinden tam fiyat */
  price: number;
  /** İndirim öncesi fiyat; yoksa undefined */
  compareAtPrice?: number;
  currency: Currency;
  /** İlk görsel kapak, ikincisi hover'da gösterilir */
  images: ProductImage[];
  colors: ProductColor[];
  variants: ProductVariant[];
  isNew: boolean;
  /** Karakter try-on katmanı — opsiyonel, yoksa katman çizilmez. */
  tryOn?: ProductTryOn;
};
