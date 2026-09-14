/**
 * Lanyard'ın fizik çekirdeği — React'ten bağımsız, saf fonksiyonlar.
 *
 * React Bits Lanyard'ın @react-three/rapier kurulumunun 2B karşılığı:
 *   rope joint zinciri  →  Verlet noktaları + mesafe kısıtları
 *   kartın spherical joint'i  →  ipin ucuna bağlı ağırlık merkezi noktası
 *   angular/linear damping    →  hız sönümü + kartın düşük ters kütlesi
 */

export type Point = { x: number; y: number; px: number; py: number; inv: number };

/** İpi oluşturan segment sayısı (rapier'daki j1..j3 zincirine karşılık). */
export const SEGMENTS = 6;
const GRAVITY = 1900; // px/sn²
const ROPE_DAMPING = 0.972;
const CARD_DAMPING = 0.978;
/** Kart ipten ağır: kısıt çözümünde daha az itilir. */
export const CARD_INV_MASS = 0.4;

export const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

export type RopeConfig = {
  width: number;
  /** Kartın sarmalayıcıdan taşabileceği pay, kart genişliğinin oranı olarak. */
  swingSlack: number;
  strapLength: number;
  segLen: number;
  cardW: number;
  cardH: number;
};

/** Noktaları dinlenme konumuna (dümdüz aşağı) kurar. */
export function createRope(cfg: RopeConfig): Point[] {
  const ax = cfg.width / 2;
  const pts: Point[] = [];

  for (let i = 0; i <= SEGMENTS; i++) {
    const y = i * cfg.segLen;
    // İlk nokta sabit asma noktası (inv = 0 → hiç hareket etmez).
    pts.push({ x: ax, y, px: ax, py: y, inv: i === 0 ? 0 : 1 });
  }

  const comY = cfg.strapLength + cfg.cardH / 2;
  pts.push({ x: ax, y: comY, px: ax, py: comY, inv: CARD_INV_MASS });

  return pts;
}

/**
 * Kartın gidebileceği en büyük yatay mesafe: sarmalayıcıdaki boşluk + kart
 * genişliğinin `swingSlack` oranı kadar taşma payı. Sarmalayıcı karttan geniş olmazsa bu
 * değer sıfıra yaklaşır ve kart yatayda hiç hareket edemez — çağıran taraf
 * kartı sarmalayıcıdan dar tutmalı.
 */
export function swingLimit(cfg: RopeConfig) {
  return Math.max((cfg.width - cfg.cardW) / 2 + cfg.cardW * cfg.swingSlack, 24);
}

/** Tek sabit adım: Verlet entegrasyonu + kısıtların gevşetilmesi. */
export function simulateStep(
  pts: Point[],
  cfg: RopeConfig,
  dt: number,
  iterations: number,
  drag: { x: number; y: number } | null,
) {
  const ax = cfg.width / 2;

  for (const p of pts) {
    if (p.inv === 0) continue;
    const damp = p.inv === CARD_INV_MASS ? CARD_DAMPING : ROPE_DAMPING;
    const vx = (p.x - p.px) * damp;
    const vy = (p.y - p.py) * damp;
    p.px = p.x;
    p.py = p.y;
    p.x += vx;
    p.y += vy + GRAVITY * dt * dt;
  }

  // Sürükleme: kart kinematik olarak imlece bağlanır, ip kısıtlarla peşinden gelir.
  // Konumu doğrudan yazıp `px`'e dokunmuyoruz; böylece bırakıldığında
  // sürükleme hızı momentum olarak korunur.
  const com = pts[SEGMENTS + 1];
  if (drag) {
    com.x = drag.x;
    com.y = drag.y;
  }

  for (let k = 0; k < iterations; k++) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const rest = i === SEGMENTS ? cfg.cardH / 2 : cfg.segLen;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const diff = (dist - rest) / dist;
      const wa = a.inv;
      // Sürüklenirken kart sabit uçtur; kısıtı ip tarafı karşılar.
      const wb = drag && i === SEGMENTS ? 0 : b.inv;
      const sum = wa + wb || 1;
      a.x += dx * diff * (wa / sum);
      a.y += dy * diff * (wa / sum);
      b.x -= dx * diff * (wb / sum);
      b.y -= dy * diff * (wb / sum);
    }
    pts[0].x = ax;
    pts[0].y = 0;
  }

  const limit = swingLimit(cfg);
  for (let i = 1; i < pts.length; i++) {
    pts[i].x = clamp(pts[i].x, ax - limit, ax + limit);
  }
}

/** İpi noktaların orta noktalarından geçen yumuşak bir eğriye çevirir. */
export function ropePath(pts: Point[]): string {
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < SEGMENTS; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`;
  }
  const tip = pts[SEGMENTS];
  return `${d} L ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`;
}

/** Kartın transform'u: ip ucunun konumu + ip ucu→ağırlık merkezi açısı. */
export function cardTransform(pts: Point[], cfg: RopeConfig): string {
  const tip = pts[SEGMENTS];
  const com = pts[SEGMENTS + 1];

  const angle =
    (Math.atan2(com.x - tip.x, Math.max(com.y - tip.y, 1)) * 180) / Math.PI;
  const dx = tip.x - cfg.width / 2;
  const dy = tip.y - cfg.strapLength;
  // Yatay hıza göre çok hafif 3B dönüş — kartın kalınlığı hissedilsin.
  const yaw = clamp((com.x - com.px) * 2.2, -14, 14);

  return (
    `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) ` +
    `rotate(${angle.toFixed(2)}deg) rotateY(${yaw.toFixed(2)}deg)`
  );
}

/**
 * Hareket ölçüsü; eşiğin altında simülasyon durur.
 *
 * Yalnızca HIZ ve dikeyden yatay sapma sayılır. İpin yerçekimi altındaki
 * birkaç piksellik çökmesi statik dengedir, hareket değildir — enerjiye
 * katılırsa eşik hiçbir zaman aşılamaz ve döngü sonsuza kadar döner.
 */
export function restEnergy(pts: Point[], cfg: RopeConfig): number {
  const ax = cfg.width / 2;
  let energy = 0;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    energy += (Math.abs(p.x - p.px) + Math.abs(p.y - p.py)) * 4;
    energy += Math.abs(p.x - ax) * 0.5;
  }
  return energy;
}
