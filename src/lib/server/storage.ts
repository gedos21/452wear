import "server-only";

/**
 * Ürün görseli depolama. Şimdilik yalnızca geliştirmede yerel public/products
 * klasörüne yazar (eski davranış). Canlıda yükleme, nesne depolama (Cloudflare
 * R2) bağlanınca açılacak; o zamana kadar canlı admin mevcut görsellerle
 * çalışır (sıralama, kaldırma, ürün bilgileri ve stok).
 *
 * Dosya adı içerik özetinden üretilir: aynı içerik tekrar yazılmaz, başka bir
 * dosyanın üzerine yazılmaz.
 */

export const GORSEL_YUKLEME_ACIK = process.env.NODE_ENV !== "production";

export const GORSEL_YUKLEME_KAPALI_MESAJI =
  "Canlı sitede görsel yükleme henüz kapalı (depolama bağlanınca açılacak). Mevcut görsellerle kaydedebilir ya da yeni görseli lokalde yükleyebilirsin.";

async function ozet(buf: ArrayBuffer): Promise<string> {
  const h = await crypto.subtle.digest("SHA-1", buf);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 8);
}

/** Görseli kaydeder ve sitedeki yolunu döndürür (ör. /products/p-093-ab12cd34.webp). */
export async function gorselKaydet(dosya: File, onEk: string, uzanti: string): Promise<string> {
  if (!GORSEL_YUKLEME_ACIK) throw new Error(GORSEL_YUKLEME_KAPALI_MESAJI);
  const buf = await dosya.arrayBuffer();
  const adi = `${onEk}-${await ozet(buf)}.${uzanti}`;
  const { promises: fs } = await import("node:fs");
  const path = await import("node:path");
  const klasor = path.join(process.cwd(), "public", "products");
  await fs.mkdir(klasor, { recursive: true });
  try {
    await fs.writeFile(path.join(klasor, adi), Buffer.from(buf), { flag: "wx" });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
  }
  return `/products/${adi}`;
}

/** Görseli siler. Canlıda (depolama yokken) hiçbir şey yapmaz. */
export async function gorselSil(yol: string): Promise<void> {
  if (!GORSEL_YUKLEME_ACIK) return;
  const { promises: fs } = await import("node:fs");
  const path = await import("node:path");
  try {
    await fs.unlink(path.join(process.cwd(), "public", yol.replace(/^\//, "")));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
}
