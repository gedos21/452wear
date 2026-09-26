/**
 * 452WEAR "452" logosunun gerçek vektör şekli (452_vector.svg).
 *
 * Path'ler SVG'den birebir kopyalanmıştır; elle düzenlenmez. Intro sahnesi
 * bunları THREE.Shape → ExtrudeGeometry ile gerçek 3B gövdeye çevirir, 2B
 * yedek aynı path'leri doğrudan çizer.
 *
 * SVG'de "4"ün üçgen iç boşluğu ayrı bir path olarak (ters yönde, "4"ün
 * içinde) gelir; aşağıda içerme testiyle delik olarak ayrılır.
 */
export const LOGO_452_VIEWBOX = { width: 528, height: 290 } as const;

export const LOGO_452_PATHS = [
  "M470.0,31.0 L386.0,49.0 L365.0,61.0 L332.0,90.0 L323.0,104.0 L322.0,110.0 L324.0,112.0 L334.0,107.0 L347.0,104.0 L359.0,107.0 L370.0,113.0 L373.0,104.0 L380.0,97.0 L394.0,91.0 L407.0,92.0 L413.0,95.0 L419.0,101.0 L420.0,107.0 L415.0,117.0 L407.0,127.0 L340.0,191.0 L299.0,245.0 L291.0,258.0 L292.0,262.0 L295.0,262.0 L316.0,247.0 L328.0,241.0 L356.0,233.0 L385.0,230.0 L407.0,232.0 L436.0,238.0 L455.0,245.0 L474.0,257.0 L476.0,256.0 L465.0,240.0 L467.0,238.0 L468.0,226.0 L478.0,212.0 L517.0,179.0 L515.0,175.0 L473.0,190.0 L468.0,187.0 L469.0,183.0 L467.0,180.0 L435.0,189.0 L394.0,193.0 L391.0,190.0 L446.0,147.0 L467.0,125.0 L475.0,108.0 L475.0,95.0 L473.0,88.0 L467.0,85.0 L459.0,74.0 L440.0,56.0 L450.0,48.0 L469.0,37.0 L472.0,34.0 Z",
  "M10.0,131.0 L16.0,135.0 L22.0,136.0 L25.0,139.0 L11.0,151.0 L10.0,154.0 L12.0,156.0 L35.0,154.0 L62.0,155.0 L96.0,159.0 L121.0,164.0 L127.0,168.0 L124.0,179.0 L123.0,197.0 L115.0,212.0 L85.0,254.0 L86.0,257.0 L89.0,257.0 L118.0,238.0 L173.0,198.0 L170.0,196.0 L163.0,196.0 L160.0,193.0 L166.0,188.0 L166.0,174.0 L169.0,171.0 L185.0,174.0 L200.0,180.0 L205.0,179.0 L205.0,176.0 L198.0,169.0 L195.0,171.0 L175.0,154.0 L189.0,138.0 L191.0,140.0 L210.0,144.0 L228.0,157.0 L232.0,150.0 L241.0,141.0 L252.0,135.0 L270.0,134.0 L276.0,137.0 L281.0,143.0 L283.0,149.0 L282.0,162.0 L276.0,178.0 L261.0,198.0 L251.0,190.0 L239.0,186.0 L234.0,182.0 L256.0,161.0 L252.0,158.0 L230.0,167.0 L213.0,178.0 L182.0,203.0 L167.0,220.0 L171.0,223.0 L183.0,218.0 L198.0,216.0 L219.0,219.0 L233.0,225.0 L251.0,242.0 L272.0,276.0 L276.0,279.0 L277.0,255.0 L283.0,236.0 L289.0,227.0 L315.0,200.0 L328.0,182.0 L334.0,168.0 L335.0,155.0 L333.0,144.0 L339.0,138.0 L352.0,132.0 L347.0,129.0 L326.0,124.0 L305.0,111.0 L301.0,107.0 L311.0,100.0 L306.0,97.0 L258.0,99.0 L242.0,105.0 L239.0,102.0 L244.0,85.0 L247.0,82.0 L281.0,81.0 L309.0,85.0 L314.0,75.0 L325.0,64.0 L358.0,41.0 L356.0,39.0 L321.0,45.0 L292.0,47.0 L245.0,46.0 L226.0,42.0 L223.0,43.0 L221.0,41.0 L212.0,59.0 L196.0,116.0 L193.0,119.0 L190.0,118.0 L176.0,127.0 L171.0,127.0 L168.0,124.0 L168.0,104.0 L173.0,66.0 L183.0,37.0 L198.0,14.0 L194.0,10.0 L43.0,126.0 L35.0,129.0 Z",
  "M126.0,98.0 L129.0,101.0 L128.0,124.0 L125.0,127.0 L103.0,126.0 L100.0,122.0 Z",
] as const;

type Ring = [number, number][];

export type Glyph = { outer: Ring; holes: Ring[] };

/** Yalnızca M/L/Z içeren path'i nokta listesine çevirir (SVG koordinatı). */
function parseRing(d: string): Ring {
  return [...d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(
    (m) => [Number(m[1]), Number(m[2])],
  );
}

function contains(ring: Ring, [x, y]: [number, number]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Path'lerden dış hat + delik grupları. Başka bir path'in içinde kalan
 * path delik sayılır. Koordinatlar SVG'deki gibidir (y aşağı doğru).
 */
export const GLYPHS_452: Glyph[] = (() => {
  const rings = LOGO_452_PATHS.map(parseRing);
  const parentOf = rings.map((r, i) =>
    rings.findIndex((o, j) => j !== i && r.every((p) => contains(o, p))),
  );
  return rings
    .map((outer, i) => ({ outer, i }))
    .filter(({ i }) => parentOf[i] === -1)
    .map(({ outer, i }) => ({
      outer,
      holes: rings.filter((_, k) => parentOf[k] === i),
    }));
})();
