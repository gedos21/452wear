export type Currency = "TRY";

/** Giyim bedenleri. */
export type ApparelSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

/** Ayakkabı numaraları (EU, tam numara). */
export type ShoeSize =
  | "36"
  | "37"
  | "38"
  | "39"
  | "40"
  | "41"
  | "42"
  | "43"
  | "44"
  | "45"
  | "46";

export type ProductSize = ApparelSize | ShoeSize;

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
  /**
   * Marka ve model — filtrelerin kullandığı düzenli alanlar. Boş bırakılırsa
   * marka eskisi gibi ürün adının başından okunur (bkz. lib/product-filters),
   * model filtresi de o üründe görünmez. Kart görünümü bu alanlardan
   * etkilenmez; kartta ad neyse o yazar.
   */
  brand?: string;
  model?: string;
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

  /**
   * "Bunu tamamla" için elle seçilen ürünler (id). Boşsa öneri kategorilere
   * ve mevcut kombin mantığına göre otomatik türetilir — bkz. lib/recommendations.
   */
  complementaryIds?: string[];
  /** "Buna da bak" için elle seçilen benzer ürünler (id). Boşsa otomatik. */
  relatedIds?: string[];
};
