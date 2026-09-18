import type { Product, ProductCategory, TryOnLayer } from "@/types/product";

/**
 * Karakter katman sisteminin TEK KAYNAĞI.
 *
 * Tüm katmanlar (base + kıyafetler) aynı piksel canvas'ını ve aynı anchor'ı
 * paylaşır: bir asset canvas'ın tamamını kaplar, kıyafetin gövdedeki yeri
 * asset'in kendi içindeki şeffaflıkla belirlenir. Böylece üst üste
 * bindirildiklerinde hizalama için ekstra koordinat hesabı gerekmez.
 *
 * Asset üretim kuralları: public/character/README.md
 */

/** Her katmanın üretileceği piksel canvas'ı. */
export const CHARACTER_CANVAS = { width: 176, height: 384 } as const;

/** CSS aspect-ratio değeri — canvas oranı tek yerden gelir. */
export const CHARACTER_ASPECT = `${CHARACTER_CANVAS.width} / ${CHARACTER_CANVAS.height}`;

/** Şimdilik tek görünüm. side/back ileride buraya eklenir. */
export type CharacterView = "front";

/** Şimdilik tek karakter. Yeni karakter = BASE_ASSETS'e yeni kayıt. */
export type CharacterId = "452-01";

export const DEFAULT_CHARACTER: CharacterId = "452-01";
export const DEFAULT_VIEW: CharacterView = "front";

/**
 * Katman çizim sırası — dizideki sıra z sırasıdır.
 * Yeni yuva (dış giyim, ayakkabı, aksesuar) eklemek için bu diziye ve
 * types/product.ts'teki TryOnLayer'a eklemek yeterli.
 */
export const LAYER_ORDER: readonly TryOnLayer[] = ["bottom", "top"] as const;

const BASE_ASSETS: Record<CharacterId, Record<CharacterView, string>> = {
  "452-01": { front: "/character/base/front.png" },
};

export function baseAsset(
  character: CharacterId = DEFAULT_CHARACTER,
  view: CharacterView = DEFAULT_VIEW,
): string {
  return BASE_ASSETS[character][view];
}

/**
 * Ürünün bu yuvaya ait try-on görseli. Ürün datası tek kaynaktır; burada
 * ikinci bir ürün tanımı YOKTUR. Asset tanımlı değilse null döner ve katman
 * hiç render edilmez (base görünmeye devam eder).
 */
export function tryOnAsset(
  product: Product | undefined,
  layer: TryOnLayer,
): string | null {
  if (!product?.tryOn) return null;
  // Onaylanmamış asset mağazaya sızmaz; admin önizlemesi override ile çizer.
  if (product.tryOn.status !== "approved") return null;
  // Kategori sonradan değiştiyse (ör. tişört → eşofman) kayıtlı asset eski
  // yuvaya aittir; yeni asset yüklenene kadar karakterde yanlış yuvada
  // çizilmez.
  if (slotForCategory(product.category) !== layer) return null;
  return product.tryOn.layer === layer ? product.tryOn.asset : null;
}

/**
 * Bir ürünün hangi katman yuvasına ait olduğu. Ürün datasında ikinci bir alan
 * tutmuyoruz — mevcut `category` tek kaynak. Karakterde yuvası olmayan
 * kategori (ayakkabı) için null döner: Pixel Fit o kategoride kullanılmaz.
 */
export function slotForCategory(category: ProductCategory): TryOnLayer | null {
  if (category === "ayakkabi") return null;
  return category === "esofman" ? "bottom" : "top";
}

/**
 * Bu yuvada karakterde GÖSTERİLEBİLEN ürünler — yani try-on katmanı olanlar.
 * "Değiştir" listesi bunu kullanır: katmanı olmayan bir ürüne geçmek karakteri
 * sessizce çıplak bırakırdı, o yüzden seçenek olarak sunulmaz.
 */
export function wearableForSlot(
  products: Product[],
  layer: TryOnLayer,
): Product[] {
  return products.filter((p) => tryOnAsset(p, layer) !== null);
}
