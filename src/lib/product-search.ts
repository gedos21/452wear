import type { Product } from "@/types/product";

/**
 * İstemci tarafı ürün araması — saf fonksiyonlar, React'ten bağımsız.
 *
 * Türkçe karakterler katlanır: "tisort" yazınca "Tişört" de eşleşir.
 * Ürün başına arama metni bir kez hazırlanır (index), her tuşta yeniden
 * kurulmaz; katalog büyüdüğünde de tuş başına maliyet tek geçişte kalır.
 */

const FOLD: Record<string, string> = {
  ı: "i",
  İ: "i",
  ş: "s",
  Ş: "s",
  ğ: "g",
  Ğ: "g",
  ü: "u",
  Ü: "u",
  ö: "o",
  Ö: "o",
  ç: "c",
  Ç: "c",
  â: "a",
  î: "i",
  û: "u",
};

/** Küçük harfe indirir ve Türkçe karakterleri sadeleştirir. */
export function normalize(value: string): string {
  let out = "";
  for (const char of value) out += FOLD[char] ?? char;
  return out.toLocaleLowerCase("en-US").trim();
}

/** Eşleşmenin nereden geldiğine göre ağırlık — isim, açıklamadan önemli. */
const WEIGHT = { name: 4, category: 3, color: 3, tag: 2, description: 1 } as const;

export type SearchEntry = {
  product: Product;
  fields: { text: string; weight: number }[];
};

/** Aramadan önce bir kez kurulur. */
export function buildSearchIndex(
  products: Product[],
  categoryLabel: (slug: Product["category"]) => string,
): SearchEntry[] {
  return products.map((product) => ({
    product,
    fields: [
      { text: normalize(product.name), weight: WEIGHT.name },
      { text: normalize(categoryLabel(product.category)), weight: WEIGHT.category },
      { text: normalize(product.category), weight: WEIGHT.category },
      {
        text: normalize(product.colors.map((c) => c.name).join(" ")),
        weight: WEIGHT.color,
      },
      { text: normalize(product.description), weight: WEIGHT.description },
    ],
  }));
}

/**
 * Sorguyu kelimelere böler; her kelime en az bir alanda geçmeli.
 * Puan, eşleşen alanların ağırlıklarının toplamı.
 */
export function searchProducts(
  index: SearchEntry[],
  query: string,
): Product[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored: { product: Product; score: number }[] = [];

  for (const entry of index) {
    let score = 0;
    let matchesAll = true;

    for (const term of terms) {
      let best = 0;
      for (const field of entry.fields) {
        if (field.text.includes(term)) best = Math.max(best, field.weight);
      }
      if (best === 0) {
        matchesAll = false;
        break;
      }
      score += best;
    }

    if (matchesAll) scored.push({ product: entry.product, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product);
}
