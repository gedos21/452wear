import { promises as fs } from "node:fs";
import path from "node:path";
import { PRODUCTS as SEED } from "@/data/products";
import type { Product } from "@/types/product";

/**
 * Katalog kalıcılığı — GELİŞTİRME ORTAMI İÇİN.
 *
 * Projede gerçek bir veritabanı veya CMS yok. Bu modül, koddaki tohum
 * katalogun (src/data/products.ts) üzerine diskteki bir JSON katmanı bindirir:
 *
 *   tohum (kodda, salt okunur)  +  data/catalog.json (admin yazıyor)
 *
 * Böylece mevcut ürünler (p-001, p-006, p-007 dahil) kodda kalmaya devam eder,
 * admin'in eklediği/düzenlediği ürünler ise dosyada saklanır ve sunucu yeniden
 * başlasa da kaybolmaz.
 *
 * SINIR: Bu, dosya sistemine yazılabilen bir ortam gerektirir (yerel `next dev`
 * veya kendi sunucunda `next start`). Vercel benzeri salt-okunur/serverless bir
 * ortamda yazma başarısız olur ve eylem hata döndürür — sahte başarı mesajı
 * göstermiyoruz. Gerçek bir veritabanına geçilince yalnızca bu dosya değişir.
 */

const DOSYA = path.join(process.cwd(), "data", "catalog.json");

type Katman = {
  /** Admin'in eklediği yeni ürünler. */
  eklenen: Product[];
  /** Tohum üründe yapılan değişiklikler: id → ürün. */
  degisen: Record<string, Product>;
  /**
   * Silinen ürünlerin id'leri. Tohum ürün kodda durduğu için ancak burada
   * işaretlenerek gizlenir; admin ürünü listeden çıkarılır ama id'si yine
   * burada kalır ki yeni bir ürüne verilmesin (bkz. yeniId).
   */
  silinen: string[];
};

async function katmanOku(): Promise<Katman> {
  try {
    const ham = await fs.readFile(DOSYA, "utf8");
    const v = JSON.parse(ham) as Partial<Katman>;
    return {
      eklenen: v.eklenen ?? [],
      degisen: v.degisen ?? {},
      silinen: v.silinen ?? [],
    };
  } catch (e) {
    // Dosya yoksa katman boştur; başka bir hata varsa yut­mayalım.
    if ((e as NodeJS.ErrnoException).code === "ENOENT")
      return { eklenen: [], degisen: {}, silinen: [] };
    throw e;
  }
}

async function katmanYaz(k: Katman): Promise<void> {
  await fs.mkdir(path.dirname(DOSYA), { recursive: true });
  // Boş silinen listesi dosyaya yazılmaz; dosya elle okunurken sade kalsın.
  const { silinen, ...digerleri } = k;
  const veri = silinen.length > 0 ? k : digerleri;
  await fs.writeFile(DOSYA, JSON.stringify(veri, null, 2) + "\n", "utf8");
}

/** Silinmemiş tohum ürünler, varsa admin'in yaptığı değişikliklerle. */
function tohumUrunler(k: Katman): Product[] {
  const silinen = new Set(k.silinen);
  return SEED.filter((p) => !silinen.has(p.id)).map(
    (p) => k.degisen[p.id] ?? p,
  );
}

/** Tohum + admin katmanı birleşmiş canlı katalog. */
export async function katalogOku(): Promise<Product[]> {
  const k = await katmanOku();
  return [...tohumUrunler(k), ...k.eklenen];
}

export async function urunBul(id: string): Promise<Product | null> {
  return (await katalogOku()).find((p) => p.id === id) ?? null;
}

/** Ürünü ekler veya günceller. Tohum ürünler dosyada override edilir. */
export async function urunYaz(urun: Product): Promise<void> {
  const k = await katmanOku();
  const tohumMu = SEED.some((p) => p.id === urun.id);
  if (tohumMu) {
    k.degisen[urun.id] = urun;
  } else {
    const i = k.eklenen.findIndex((p) => p.id === urun.id);
    if (i >= 0) k.eklenen[i] = urun;
    else k.eklenen.push(urun);
  }
  await katmanYaz(k);
}

/**
 * Ürünü katalogdan kaldırır ve silinen ürünü döndürür (dosya temizliği için).
 * Admin ürünü listeden çıkar; tohum ürün kodda durduğu için gizlenir. İki
 * durumda da id `silinen` listesine girer ve bir daha kullanılmaz.
 */
export async function katalogdanSil(id: string): Promise<Product | null> {
  const k = await katmanOku();
  const urun = [...tohumUrunler(k), ...k.eklenen].find((p) => p.id === id);
  if (!urun) return null;
  k.eklenen = k.eklenen.filter((p) => p.id !== id);
  delete k.degisen[id];
  if (!k.silinen.includes(id)) k.silinen.push(id);
  await katmanYaz(k);
  return urun;
}

/**
 * Yeni ürün id'si (p-NNN): şimdiye kadar kullanılmış en büyük numaranın bir
 * fazlası. Aradaki boşluklar ve silinen id'ler BİLEREK kullanılmaz:
 *   • silinmiş bir ürünün id'si tarayıcılardaki sepet/favorilerde kalmış
 *     olabilir; yeni ürüne verilirse orada başka bir ürün olarak dirilir,
 *   • public/ altında o numarayla başlayan dosyalar olabilir (ör. p-005-b.png
 *     p-009'un görseli) ve yeni ürünle karışır.
 * Bu yüzden katalogdaki ve silinen id'lerin yanında görsel klasörlerindeki
 * dosya adlarına da bakılır.
 */
export async function yeniId(): Promise<string> {
  const k = await katmanOku();
  const adlar = [
    ...SEED.map((p) => p.id),
    ...k.eklenen.map((p) => p.id),
    ...k.silinen,
  ];
  for (const klasor of ["products", "character"]) {
    try {
      const dosyalar = await fs.readdir(
        path.join(process.cwd(), "public", klasor),
        { recursive: true },
      );
      adlar.push(...dosyalar.map((d) => path.basename(d)));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }
  const enBuyuk = Math.max(
    0,
    ...adlar.map((ad) => Number(/^p-(\d+)(?=[-.]|$)/.exec(ad)?.[1] ?? 0)),
  );
  return `p-${String(enBuyuk + 1).padStart(3, "0")}`;
}

/** Ürün adından slug — Türkçe karakterler sadeleştirilir. */
export function slugYap(ad: string): string {
  const harita: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    Ç: "c",
    Ğ: "g",
    İ: "i",
    I: "i",
    Ö: "o",
    Ş: "s",
    Ü: "u",
  };
  return ad
    .split("")
    .map((c) => harita[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Bu slug'ı kullanan başka bir ürün (haricId dışında) varsa onu döndürür. */
export async function slugSahibi(
  slug: string,
  haricId: string,
): Promise<Product | null> {
  return (
    (await katalogOku()).find((p) => p.slug === slug && p.id !== haricId) ??
    null
  );
}

/** Addan üretilen slug başka üründe varsa sonuna -2, -3… eklenir. */
export async function bosSlug(taban: string, haricId: string): Promise<string> {
  const dolu = new Set(
    (await katalogOku()).filter((p) => p.id !== haricId).map((p) => p.slug),
  );
  if (!dolu.has(taban)) return taban;
  for (let n = 2; ; n++) if (!dolu.has(`${taban}-${n}`)) return `${taban}-${n}`;
}

/* ---- Sunucu tarafı okuma yardımcıları (canlı katalog) ---- */

/**
 * Ana sayfa "Yeni Gelenler": admin'in eklediği ürünler en yeniden eskiye önce
 * gelir, ardından tohum katalog kendi sırasıyla.
 */
export async function yeniGelenler(limit = 4): Promise<Product[]> {
  const k = await katmanOku();
  return [...[...k.eklenen].reverse(), ...tohumUrunler(k)]
    .filter((p) => p.isNew)
    .slice(0, limit);
}
