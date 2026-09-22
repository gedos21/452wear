import { isAvailable, scoreProduct, type OutfitAnswers } from "@/lib/outfit";
import type { Product, ProductCategory } from "@/types/product";

/**
 * Ürün önerileri — saf fonksiyonlar, React'ten ve veri çekmeden bağımsız.
 * Hepsi elde olan katalog listesiyle çalışır; ek istek yapılmaz.
 *
 * Kurallar (hepsi için geçerli):
 *   • Ürünün kendisi önerilmez.
 *   • Stokta olmayan ürün önerilmez.
 *   • Yer doldurmak için rastgele ürün konmaz; uygun aday yoksa liste boş
 *     döner ve çağıran bölüm hiç çizilmez.
 *   • Sonuç rastgele değildir: aynı ürün için hep aynı öneriler gelir
 *     (sunucu/istemci farkı ve her yenilemede değişen liste olmasın diye).
 */

/** Kombin sıralamasında kullanılan nötr yanıtlar: metin sinyali yok, denge var. */
const NEUTRAL: OutfitAnswers = {
  occasion: "gunluk",
  vibe: "sade",
  top: "farketmez",
  bottom: "farketmez",
};

const UST: ProductCategory[] = ["tisort", "sweatshirt", "hirka"];
const ALT: ProductCategory[] = ["esofman"];
const AYAKKABI: ProductCategory[] = ["ayakkabi"];

type Slot = "ust" | "alt" | "ayakkabi";

function slotOf(product: Product): Slot | null {
  if (UST.includes(product.category)) return "ust";
  if (ALT.includes(product.category)) return "alt";
  if (AYAKKABI.includes(product.category)) return "ayakkabi";
  return null;
}

const SLOT_CATEGORIES: Record<Slot, ProductCategory[]> = {
  ust: UST,
  alt: ALT,
  ayakkabi: AYAKKABI,
};

/** Elle seçilen id'leri yayındaki, stoktaki ürünlere çevirir; sıra korunur. */
function byIds(ids: string[] | undefined, pool: Product[]): Product[] {
  if (!ids?.length) return [];
  return ids
    .map((id) => pool.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);
}

/**
 * Bir yuvadan (üst/alt/ayakkabı) en uyumlu tek ürün; yoksa null.
 * `avoid` listesindekiler (başka bölümde zaten gösterilenler) varsa elenir;
 * başka aday kalmıyorsa onlar da değerlendirilir.
 */
function bestForSlot(
  slot: Slot,
  pool: Product[],
  pairWith: Product,
  used: Set<string>,
  avoid: Set<string> = new Set(),
): Product | null {
  const hepsi = pool.filter(
    (p) => SLOT_CATEGORIES[slot].includes(p.category) && !used.has(p.id),
  );
  const tercih = hepsi.filter((p) => !avoid.has(p.id));
  const adaylar = tercih.length > 0 ? tercih : hepsi;
  if (adaylar.length === 0) return null;
  // Deterministik: en yüksek puan, eşitlikte katalog sırası.
  return adaylar.reduce((best, p) =>
    scoreProduct(p, NEUTRAL, pairWith) > scoreProduct(best, NEUTRAL, pairWith)
      ? p
      : best,
  );
}

function uygunHavuz(product: Product, all: Product[]): Product[] {
  return all.filter((p) => p.id !== product.id && isAvailable(p));
}

/**
 * "Bunu tamamla": ürünü tamamlayan parçalar. Önce elle seçilenler; yoksa
 * kombin mantığı (üst → alt + ayakkabı gibi boş yuvalar doldurulur).
 * Tamamlayıcı yuvada ürün yoksa liste boş döner — aynı kategoriden "benzer"
 * ürün buraya konmaz, orası "Buna da bak" bölümünün işi.
 */
export function complementaryFor(
  product: Product,
  all: Product[],
  limit = 3,
): Product[] {
  const pool = uygunHavuz(product, all);

  const manual = byIds(product.complementaryIds, pool);
  if (manual.length > 0) return manual.slice(0, limit);

  const slot = slotOf(product);
  if (!slot) return [];

  const used = new Set([product.id]);
  const secilen: Product[] = [];
  const digerYuvalar: Slot[] = (["ust", "alt", "ayakkabi"] as Slot[]).filter(
    (s) => s !== slot,
  );

  let pairWith = product;
  for (const s of digerYuvalar) {
    const bulunan = bestForSlot(s, pool, pairWith, used);
    if (!bulunan) continue;
    secilen.push(bulunan);
    used.add(bulunan.id);
    pairWith = bulunan;
    if (secilen.length >= limit) break;
  }
  return secilen;
}

/**
 * "Buna da bak": aynı tarza yakın parçalar. Önce elle seçilenler; yoksa aynı
 * kategoriden, fiyatı ve rengin açıklığı en yakın ürünler. Zaten başka bir
 * bölümde gösterilenler `exclude` ile dışarıda bırakılır.
 */
export function relatedFor(
  product: Product,
  all: Product[],
  limit = 4,
  exclude: string[] = [],
): Product[] {
  const disarida = new Set(exclude);
  const pool = uygunHavuz(product, all).filter((p) => !disarida.has(p.id));

  const manual = byIds(product.relatedIds, pool);
  if (manual.length > 0) return manual.slice(0, limit);

  const ayniKategori = pool.filter((p) => p.category === product.category);
  if (ayniKategori.length === 0) return [];

  // Yakınlık: fiyat farkı (oransal) + yeni olma payı. Uydurma etiket yok.
  return [...ayniKategori]
    .sort((a, b) => {
      const fark = (p: Product) =>
        Math.abs(p.price - product.price) / Math.max(product.price, 1) -
        (p.isNew ? 0.05 : 0);
      return fark(a) - fark(b);
    })
    .slice(0, limit);
}

export type OutfitSuggestion = {
  /** Kombindeki ürünler, sırayla: üst → alt → ayakkabı. */
  pieces: Product[];
  /** Kombinin toplam tutarı. */
  total: number;
};

/**
 * "Bunu tamamla": ürünün içinde yer aldığı bir kombin. Mevcut kombin
 * motorunun puanlaması kullanılır, ama seçim deterministiktir.
 *
 * Yuvalar sırayla doldurulur (üst → alt → ayakkabı) ve en fazla üç parça
 * olur. Bir yuvada katalogda uygun ürün yoksa kombin o yuvasız kurulur —
 * yer doldurmak için ürün uydurulmaz. Ürünün kendisinden başka parça
 * bulunamazsa null döner; tek parçalık "kombin" gösterilmez.
 */
export function outfitFor(
  product: Product,
  all: Product[],
  /** Başka bölümde gösterilenler: mümkünse kombinde tekrar edilmez. */
  avoid: string[] = [],
): OutfitSuggestion | null {
  const slot = slotOf(product);
  if (!slot) return null;

  const pool = uygunHavuz(product, all);
  const used = new Set([product.id]);
  const parcalar: Partial<Record<Slot, Product>> = { [slot]: product };

  let pairWith = product;
  for (const s of ["ust", "alt", "ayakkabi"] as Slot[]) {
    if (parcalar[s]) continue;
    const bulunan = bestForSlot(s, pool, pairWith, used, new Set(avoid));
    if (!bulunan) continue;
    parcalar[s] = bulunan;
    used.add(bulunan.id);
    pairWith = bulunan;
  }

  const pieces = [parcalar.ust, parcalar.alt, parcalar.ayakkabi].filter(
    (p): p is Product => p !== undefined,
  );
  if (pieces.length < 2) return null;

  return { pieces, total: pieces.reduce((t, p) => t + p.price, 0) };
}
