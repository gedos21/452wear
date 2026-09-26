/**
 * Intro zaman çizelgesi (saniye, sahne açıldığı andan itibaren).
 * Değiştirmek için yalnızca burası düzenlenir.
 */
export const INTRO_TIMING = {
  /** Arka planın siyahtan belirmesi. */
  backdropFade: 0.6,
  /** 452'nin girişi: opaklık 0 → 1, ölçek 0.94 → 1 (0.3 sn'de ~yarı). */
  entry: 0.7,
  entryScale: 0.94,
  /** Girişte kromdan soldan sağa geçen ince buz mavisi ışık. */
  sweepStart: 0.45,
  sweepDuration: 0.6,
  /** Sürekli Y dönüşünde bir tam tur (sabit hız, sonsuz). */
  spinPeriod: 11,
} as const;

/** Çıkış: önce 452 söner, arka plan biraz gecikmeli onu izler. */
export const EXIT_TIMING = {
  model: 0.35,
  backdropDelay: 0.15,
  backdrop: 0.5,
} as const;

/** Çıkışın toplam süresi (sn); yönlendirme bundan sonra yapılır. */
export const EXIT_TOTAL = EXIT_TIMING.backdropDelay + EXIT_TIMING.backdrop;

/** Hero çıkışını başlatan pencere olayı (bkz. hero-cta). */
export const HERO_EXIT_EVENT = "452:hero-exit";

/** Intro'nun bittiği an: CTA bu saniyede belirir (bkz. home-hero). */
export const INTRO_END = INTRO_TIMING.entry + 0.3;
