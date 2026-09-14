import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { CHARACTER_CANVAS } from "@/lib/character";
import type { TryOnLayer } from "@/types/product";

/**
 * Pixel Fit asset doğrulama ve kaydetme.
 *
 * Kurallar CHARACTER_CANVAS'tan gelir — ikinci bir ölçü tanımı yok.
 * Doğrulama sunucuda yapılır: istemci kontrolü atlanabilir.
 */

export type AssetSonuc =
  { ok: true; yol: string } | { ok: false; hata: string };

const KLASOR: Record<TryOnLayer, string> = {
  top: "tops",
  bottom: "bottoms",
};

export async function pixelAssetKaydet(
  dosya: File,
  layer: TryOnLayer,
  urunId: string,
): Promise<AssetSonuc> {
  if (dosya.size === 0) return { ok: false, hata: "Dosya boş." };
  if (dosya.size > 4 * 1024 * 1024)
    return { ok: false, hata: "Dosya 4 MB'ı aşıyor." };

  const buf = Buffer.from(await dosya.arrayBuffer());

  let meta;
  try {
    meta = await sharp(buf).metadata();
  } catch {
    return { ok: false, hata: "Dosya okunamadı; geçerli bir görsel değil." };
  }

  if (meta.format !== "png")
    return { ok: false, hata: "Pixel Fit asset PNG olmalı." };

  const { width: G, height: Y } = CHARACTER_CANVAS;
  if (meta.width !== G || meta.height !== Y)
    return {
      ok: false,
      hata: `Pixel Fit asset ${G}×${Y} olmalı. (Yüklenen: ${meta.width}×${meta.height})`,
    };

  if (!meta.hasAlpha)
    return {
      ok: false,
      hata: "Pixel Fit asset şeffaf (alpha kanallı) PNG olmalı.",
    };

  // Alpha kanalı var ama her piksel opaksa arka plan kesilmemiş demektir.
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let saydam = 0;
  for (let i = 3; i < data.length; i += info.channels)
    if (data[i] < 16) saydam++;
  const oran = saydam / (info.width * info.height);
  if (oran < 0.05)
    return {
      ok: false,
      hata:
        "Asset'in arka planı şeffaf değil: neredeyse tüm pikseller opak. " +
        "Checkerboard veya düz zemin içeren dosya karakterin üzerini kapatır.",
    };

  // İçerik hash'li ad: aynı yola farklı içerik yazılmaz, tarayıcı önbelleği
  // eski katmanı göstermez.
  const hash = createHash("sha1").update(buf).digest("hex").slice(0, 8);
  const ad = `${urunId}-${hash}.png`;
  const klasor = path.join(process.cwd(), "public", "character", KLASOR[layer]);
  await fs.mkdir(klasor, { recursive: true });
  await fs.writeFile(path.join(klasor, ad), buf);

  return { ok: true, yol: `/character/${KLASOR[layer]}/${ad}` };
}

/** Bu yol, admin'in bu ürün için yüklediği bir dosya mı? */
export function yuklenenAssetMi(yol: string, urunId: string): boolean {
  return (
    yol.startsWith("/character/") &&
    new RegExp(`^${urunId}-[0-9a-f]{8}\\.png$`).test(path.basename(yol))
  );
}

/**
 * Ürünün YÜKLENMİŞ asset dosyasını diskten siler. Ürünü SİLMEZ.
 *
 * Yalnızca admin'in bu ürün için yüklediği `<urunId>-<hash>.png` silinir;
 * tohum asset'leri (ör. tshirt-black.png) birden fazla ürün tarafından
 * kullanılabileceği için diskte bırakılır — bağlantı yine de kaldırılır.
 */
export async function pixelAssetSil(
  yol: string,
  urunId: string,
): Promise<void> {
  if (!yuklenenAssetMi(yol, urunId)) return;
  const tam = path.join(process.cwd(), "public", yol.replace(/^\//, ""));
  try {
    await fs.unlink(tam);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
}
