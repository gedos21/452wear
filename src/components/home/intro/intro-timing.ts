/**
 * Intro zaman çizelgesi (saniye, sahne açıldığı andan itibaren).
 * Değiştirmek için yalnızca burası düzenlenir.
 */
export const INTRO_TIMING = {
  /** Tamamen siyah bekleme. */
  black: 0.35,
  /** Siluetten krom parlaklığa geçiş. */
  lightUp: 1.8,
  /** 360° dönüşün başladığı an ve süresi. */
  spinStart: 0.7,
  spinDuration: 3.1,
  /** Buz mavisi ışık süpürmesi (dönüş bittikten hemen sonra). */
  sweepDuration: 1.1,
} as const;

/** Intro'nun bittiği an: CTA bu saniyede belirir (bkz. home-hero). */
export const INTRO_END =
  INTRO_TIMING.spinStart +
  INTRO_TIMING.spinDuration +
  INTRO_TIMING.sweepDuration;
