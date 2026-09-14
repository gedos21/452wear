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
};

const BOS: Katman = { eklenen: [], degisen: {} };

async function katmanOku(): Promise<Katman> {
  try {
    const ham = await fs.readFile(DOSYA, "utf8");
    const v = JSON.parse(ham) as Partial<Katman>;
    return { eklenen: v.eklenen ?? [], degisen: v.degisen ?? {} };
  } catch (e) {
    // Dosya yoksa katman boştur; başka bir hata varsa yut­mayalım.
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return BOS;
    throw e;
  }
}

async function katmanYaz(k: Katman): Promise<void> {
  await fs.mkdir(path.dirname(DOSYA), { recursive: true });
  await fs.writeFile(DOSYA, JSON.stringify(k, null, 2) + "\n", "utf8");
}

/** Tohum + admin katmanı birleşmiş canlı katalog. */
export async function katalogOku(): Promise<Product[]> {
  const k = await katmanOku();
  const tohum = SEED.map((p) => k.degisen[p.id] ?? p);
  return [...tohum, ...k.eklenen];
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

/** Çakışmayan yeni ürün id'si (p-0NN biçimini korur). */
export async function yeniId(): Promise<string> {
  const mevcut = new Set((await katalogOku()).map((p) => p.id));
  for (let n = 1; n < 1000; n++) {
    const id = `p-${String(n).padStart(3, "0")}`;
    if (!mevcut.has(id)) return id;
  }
  throw new Error("Boş ürün id'si kalmadı");
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

/* ---- Sunucu tarafı okuma yardımcıları (canlı katalog) ---- */

export async function yeniGelenler(limit = 4): Promise<Product[]> {
  return (await katalogOku()).filter((p) => p.isNew).slice(0, limit);
}
