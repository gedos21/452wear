// 452 Watch scroll animasyonu için videodan kare dizisi üretir.
//
//   node scripts/watch-frames.mjs <video.mp4> [--frames 120] [--forward]
//
// Varsayılan olarak video TERSTEN dizilir: Kling/Veo'da üretilen klip
// "parçalar kasaya iniyor" (birleşme) olduğu için, scroll'da "saat açılıyor"
// görünsün diye son kare başa gelir. Video zaten açılma yönündeyse --forward.
//
// Çıktı:
//   public/watch/frames/lg/0001.webp …  (masaüstü, 1920 px genişlik, 16:9)
//   public/watch/frames/sm/0001.webp …  (mobil, ortadan dikey kırpılmış)
//   src/components/watch/watch-frames.ts (kare sayısı ve boyutlar)
//
// Gerekli: ffmpeg ve ffprobe (brew install ffmpeg). WebP'ye çevirme için
// projede Next.js ile gelen sharp kullanılır (ffmpeg'de libwebp olmayabilir).

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith("--"));
if (!input) {
  console.error("Kullanım: node scripts/watch-frames.mjs <video.mp4> [--frames 120] [--forward]");
  process.exit(1);
}
const flag = (name) => args.includes(name);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};

const FRAMES = opt("--frames", 120);
const REVERSE = !flag("--forward");
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public/watch/frames");

// Masaüstü ve mobil çıktılar. Mobilde saat ortadaki dikey şeritte durduğu
// için 16:9 kare ortadan ~3:4 oranında kırpılır.
const VARIANTS = [
  { name: "lg", width: 1920, crop: null, quality: 84 },
  { name: "sm", width: 810, crop: 3 / 4, quality: 82 },
];

const probe = JSON.parse(
  execFileSync("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height:format=duration",
    "-of", "json", input,
  ]).toString(),
);
const duration = Number(probe.format.duration);
const { width: srcW, height: srcH } = probe.streams[0];
const fps = FRAMES / duration;
console.log(`Video: ${srcW}x${srcH}, ${duration.toFixed(2)} sn → ${FRAMES} kare (${fps.toFixed(2)} fps), ${REVERSE ? "tersten" : "düz"}`);

const manifest = { count: 0, variants: {} };

for (const v of VARIANTS) {
  const dir = path.join(OUT, v.name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const filters = [];
  if (REVERSE) filters.push("reverse");
  filters.push(`fps=${fps}`);
  if (v.crop) filters.push(`crop=trunc(ih*${v.crop}/2)*2:ih`);
  // Kaynaktan büyük ölçeklenmez: büyütmek kalite katmaz, dosyayı şişirir.
  const cropW = v.crop ? Math.floor((srcH * v.crop) / 2) * 2 : srcW;
  filters.push(`scale=${Math.min(v.width, cropW)}:-2:flags=lanczos`);

  // Önce kayıpsız PNG, sonra sharp ile WebP.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `watch-${v.name}-`));
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-i", input, "-an",
    "-vf", filters.join(","),
    "-frames:v", String(FRAMES),
    path.join(tmp, "%04d.png"),
  ], { stdio: "inherit" });

  const pngs = fs.readdirSync(tmp).filter((f) => f.endsWith(".png")).sort();
  let bytes = 0;
  let dims = [0, 0];
  for (const f of pngs) {
    const out = path.join(dir, f.replace(".png", ".webp"));
    // Hafif keskinleştirme: yapay zekâ videosunun yumuşak kenarlarını
    // (kadran işaretleri, rakamlar, ibreler) toparlar; hale oluşturmaz.
    const info = await sharp(path.join(tmp, f))
      .sharpen({ sigma: 0.9, m1: 0.6, m2: 2.2 })
      .webp({ quality: v.quality, effort: 5 })
      .toFile(out);
    bytes += info.size;
    dims = [info.width, info.height];
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  const files = pngs;

  manifest.count = files.length;
  manifest.variants[v.name] = { width: dims[0], height: dims[1] };
  console.log(`  ${v.name}: ${files.length} kare, ${dims[0]}x${dims[1]}, toplam ${(bytes / 1024 / 1024).toFixed(1)} MB`);
}

const ts = `/**
 * 452 Watch scroll animasyonunun kare dizisi (üretilmiş dosya, elle
 * düzenlenmez). Yeniden üretmek: node scripts/watch-frames.mjs <video>
 */
export const WATCH_FRAMES: {
  count: number;
  variants: Partial<Record<"lg" | "sm", { width: number; height: number }>>;
} = ${JSON.stringify(manifest, null, 2)};
`;
fs.writeFileSync(path.join(ROOT, "src/components/watch/watch-frames.ts"), ts);
console.log("Kare listesi yazıldı: src/components/watch/watch-frames.ts");
