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
      "width": 1280,
      "height": 720
    },
    "sm": {
      "width": 540,
      "height": 720
    }
  }
};
