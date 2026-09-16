import type { Product, ProductCategory } from "@/types/product";

/**
 * Kombin motoru — saf fonksiyonlar, React'ten bağımsız.
 *
 * ÖNEMLİ: Ürün verisinde stil/etiket alanı YOK. Bu yüzden hiçbir etiket
 * uydurulmuyor; sinyaller yalnızca gerçek alanlardan türetiliyor:
 *   • category      → üst/alt eşleşmesi
 *   • variants.stock→ stokta olmayan ürün asla önerilmez
 *   • colors[].hex  → açıklık hesabıyla renk uyumu
 *   • name + description → mevcut metinden anahtar kelime sinyali
 *
 * "Nereye gidiyorsun" gibi sorular veride karşılığı olmadığı için editoryal
 * bir ağırlıklandırmaya çevrilir (bir stilistin yapacağı gibi); veri iddiası
 * olarak sunulmaz.
 */

export type Occasion = "gunluk" | "okul" | "disari" | "aksam";
export type Vibe = "sade" | "street" | "oversize" | "farkli";
export type TopChoice = "tisort" | "sweatshirt" | "hirka" | "farketmez";
export type BottomChoice = "esofman" | "farketmez";

export type OutfitAnswers = {
  occasion: Occasion;
  vibe: Vibe;
  top: TopChoice;
  bottom: BottomChoice;
};

export type QuestionKey = keyof OutfitAnswers;

export const QUESTIONS: {
  key: QuestionKey;
  prompt: string;
  options: { value: string; label: string }[];
}[] = [
  {
    key: "occasion",
    prompt: "Bugün nereye gidiyorsun?",
    options: [
      { value: "gunluk", label: "Günlük" },
      { value: "okul", label: "Okul" },
      { value: "disari", label: "Dışarı" },
      { value: "aksam", label: "Akşam" },
    ],
  },
  {
    key: "vibe",
    prompt: "Bugün nasıl bir vibe?",
    options: [
      { value: "sade", label: "Sade" },
      { value: "street", label: "Street" },
      { value: "oversize", label: "Oversize" },
      { value: "farkli", label: "Farklı" },
    ],
  },
  {
    key: "top",
    prompt: "Üstte ne tercih edersin?",
    options: [
      { value: "tisort", label: "Tişört" },
      { value: "sweatshirt", label: "Sweatshirt" },
      { value: "hirka", label: "Hırka" },
      { value: "farketmez", label: "Fark etmez" },
    ],
  },
  {
    key: "bottom",
    prompt: "Altta?",
    options: [
      { value: "esofman", label: "Eşofman" },
      { value: "farketmez", label: "Fark etmez" },
    ],
  },
];

/** Ürün metninde aranan sinyaller — hepsi mevcut ad/açıklamalardan. */
const VIBE_KEYWORDS: Record<Vibe, string[]> = {
  sade: ["düz", "basic", "klasik", "orta gramaj", "günlük"],
  street: ["kargo", "kapüşon", "jogger", "fermuar", "yan cep", "lastikli"],
  oversize: ["oversize", "geniş", "rahat", "ağır gramaj"],
  farkli: ["baskı", "gravür", "işleme"],
};

/** Ortama göre hangi vibe'ın öne çıkacağı — editoryal ağırlık. */
const OCCASION_AFFINITY: Record<Occasion, Partial<Record<Vibe, number>>> = {
  gunluk: { sade: 12, oversize: 8 },
  okul: { sade: 10, street: 8, oversize: 6 },
  disari: { street: 12, oversize: 8, farkli: 6 },
  aksam: { farkli: 12, sade: 8 },
};

const norm = (v: string) =>
  v
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");

/** Ürünün aranabilir metni (gerçek alanlardan). */
const haystack = (product: Product) =>
  norm(`${product.name} ${product.description}`);

/** hex → 0 (koyu) … 1 (açık) algısal açıklık. */
export function lightness(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Ürünün stokta olan ilk renginin açıklığı; renk yoksa nötr kabul edilir. */
function productLightness(product: Product): number {
  const inStock = product.colors.find((c) =>
    product.variants.some((v) => v.color === c.name && v.stock > 0),
  );
  return lightness((inStock ?? product.colors[0])?.hex ?? "#808080");
}

/** En az bir bedeni stokta mı. */
export function isAvailable(product: Product): boolean {
  return product.variants.some((v) => v.stock > 0);
}

/**
 * Bir ürünün cevaplara göre puanı.
 * `pairWith` verilirse renk uyumu da hesaba katılır.
 */
export function scoreProduct(
  product: Product,
  answers: OutfitAnswers,
  pairWith?: Product,
): number {
  let score = 0;
  const text = haystack(product);

  // Vibe: metinde geçen her anahtar kelime puan ekler (en çok 30).
  const hits = VIBE_KEYWORDS[answers.vibe].filter((k) =>
    text.includes(norm(k)),
  ).length;
  score += Math.min(hits * 12, 30);

  // Ortam: seçilen vibe ile ortamın uyumu.
  score += OCCASION_AFFINITY[answers.occasion][answers.vibe] ?? 0;

  // Renk uyumu: üst ile alt arasında açıklık farkı olsun (en çok 15).
  if (pairWith) {
    const diff = Math.abs(productLightness(product) - productLightness(pairWith));
    score += Math.round(Math.min(diff / 0.5, 1) * 15);
  }

  // Yeni gelenlere küçük bir tazelik payı.
  if (product.isNew) score += 4;

  return score;
}

/** Puanı en yüksek adaylardan biri; beraberlikte tekdüzelik olmasın diye. */
function pickTop(
  candidates: { product: Product; score: number }[],
): Product | null {
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const best = sorted[0].score;
  // En iyiye yakın olanlar arasından seç — hâlâ en uygunlar, ama her
  // denemede aynı sonuç gelmez.
  const pool = sorted.filter((c) => c.score >= best - 6);
  return pool[Math.floor(Math.random() * pool.length)].product;
}

/** Ayakkabı stokta uygun ürün varsa eklenir; yoksa kombin üst + alt kalır. */
export type Outfit = {
  top: Product;
  bottom: Product;
  shoes?: Product;
  total: number;
};

/**
 * Üst + alt kombin kurar. Önce üst seçilir, sonra ona göre renk uyumlu alt.
 * Stokta ayakkabı varsa alta göre bir ayakkabı eklenir; karaktere çizilmez.
 * Aynı ürün iki kez gelemez (farklı kategoriler olduğu için zaten olamaz).
 */
export function buildOutfit(
  products: Product[],
  answers: OutfitAnswers,
): Outfit | null {
  const available = products.filter(isAvailable);

  const topCategories: ProductCategory[] =
    answers.top === "farketmez"
      ? ["tisort", "sweatshirt", "hirka"]
      : [answers.top];

  const tops = available.filter((p) => topCategories.includes(p.category));
  const bottoms = available.filter((p) => p.category === "esofman");

  const top = pickTop(
    tops.map((product) => ({ product, score: scoreProduct(product, answers) })),
  );
  if (!top) return null;

  const bottom = pickTop(
    bottoms
      .filter((p) => p.id !== top.id)
      .map((product) => ({
        product,
        score: scoreProduct(product, answers, top),
      })),
  );
  if (!bottom) return null;

  const shoes = pickTop(
    available
      .filter((p) => p.category === "ayakkabi")
      .map((product) => ({
        product,
        score: scoreProduct(product, answers, bottom),
      })),
  );

  return {
    top,
    bottom,
    ...(shoes ? { shoes } : {}),
    total: top.price + bottom.price + (shoes?.price ?? 0),
  };
}
