/**
 * 452 Watch scroll animasyonunun kare dizisi (üretilmiş dosya, elle
 * düzenlenmez). Yeniden üretmek: node scripts/watch-frames.mjs <video>
 */
export const WATCH_FRAMES: {
  count: number;
  variants: Partial<Record<"lg" | "sm", { width: number; height: number }>>;
} = {
  "count": 120,
  "variants": {
    "lg": {
      "width": 1920,
      "height": 1080
    },
    "sm": {
      "width": 810,
      "height": 1080
    }
  }
};
