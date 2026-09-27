/**
 * 452 Watch scroll animasyonunun kare dizisi (üretilmiş dosya, elle
 * düzenlenmez). Yeniden üretmek: node scripts/watch-frames.mjs <video>
 *
 * Henüz video yok: count 0 iken sayfa sabit poster gösterir.
 */
export const WATCH_FRAMES: {
  count: number;
  variants: Partial<Record<"lg" | "sm", { width: number; height: number }>>;
} = {
  count: 0,
  variants: {},
};
