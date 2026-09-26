"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ApparelSize, ProductFit } from "@/types/product";

/**
 * "Sana uyan bedeni bul" — boy/kilo profili ve beden önerisi.
 *
 * Profil yalnızca tarayıcıda (localStorage) tutulur, sunucuya gitmez; bir kez
 * girilir, bütün giyim ürünlerinde geçerli olur (lib/favorites ile aynı
 * desen). Ayakkabıda kullanılmaz.
 */

const STORAGE_KEY = "452wear:size-profile";

/** Kullanıcının kesim tercihi: bedeni öneride yarım beden kaydırır. */
export type FitPreference = "dar" | "normal" | "bol";

export type SizeProfile = {
  /** cm */
  height: number;
  /** kg */
  weight: number;
  preference: FitPreference;
};

export const PREFERENCE_LABELS: Record<FitPreference, string> = {
  dar: "Tam oturan",
  normal: "Normal",
  bol: "Bol",
};

/** Girilebilecek aralıklar; dışında kalan değer öneri üretmez. */
export const HEIGHT_RANGE = { min: 140, max: 210 } as const;
export const WEIGHT_RANGE = { min: 35, max: 150 } as const;

/**
 * Öneri tablosu (unisex, normal kalıp). Her beden için tipik boy ve kilo
 * aralığı. Değerleri değiştirmek için yalnızca burası düzenlenir; öneri
 * formülü aralıkların ortalarından türetilir.
 */
export const SIZE_CHART: {
  size: ApparelSize;
  height: [number, number];
  weight: [number, number];
}[] = [
  { size: "XS", height: [155, 165], weight: [45, 55] },
  { size: "S", height: [163, 172], weight: [55, 65] },
  { size: "M", height: [170, 178], weight: [65, 75] },
  { size: "L", height: [176, 184], weight: [75, 85] },
  { size: "XL", height: [182, 190], weight: [85, 97] },
  { size: "XXL", height: [188, 198], weight: [97, 112] },
];

/** Kilo göğüs/bel genişliğini, boy ise ürün uzunluğunu belirler. */
const WEIGHT_SHARE = 0.7;

/**
 * Ortalama, uç profillerde bir ölçüyü fazla bastırmasın: uzun ve zayıf
 * birine kolu/boyu kısa, kısa ve kilolu birine dar gelen beden önerilmez.
 * Öneri, boyun gerektirdiğinden en fazla 1,5, kilonun gerektirdiğinden en
 * fazla 1 beden küçük olabilir.
 */
const MAX_HEIGHT_DEFICIT = 1.5;
const MAX_WEIGHT_DEFICIT = 1;

/** Ürünün kalıbı öneriyi kaydırır: dar kalıpta büyüğe, oversize'da küçüğe. */
const FIT_SHIFT: Record<ProductFit, number> = {
  dar: 0.6,
  normal: 0,
  oversize: -0.6,
};

const PREFERENCE_SHIFT: Record<FitPreference, number> = {
  dar: -0.4,
  normal: 0,
  bol: 0.4,
};

/**
 * Değerin tablodaki sürekli konumu: bedenlerin aralık ortaları arasında
 * doğrusal. 0 = XS'in ortası, 1 = S'nin ortası…
 */
function position(value: number, mids: number[]): number {
  const last = mids.length - 1;
  if (value <= mids[0]) return (value - mids[0]) / (mids[1] - mids[0]);
  if (value >= mids[last])
    return last + (value - mids[last]) / (mids[last] - mids[last - 1]);
  const i = mids.findIndex((m, k) => value >= m && value < mids[k + 1]);
  return i + (value - mids[i]) / (mids[i + 1] - mids[i]);
}

const mid = ([a, b]: [number, number]) => (a + b) / 2;
const HEIGHT_MIDS = SIZE_CHART.map((r) => mid(r.height));
const WEIGHT_MIDS = SIZE_CHART.map((r) => mid(r.weight));

export function isValidProfile(p: Partial<SizeProfile>): p is SizeProfile {
  return (
    typeof p.height === "number" &&
    typeof p.weight === "number" &&
    p.height >= HEIGHT_RANGE.min &&
    p.height <= HEIGHT_RANGE.max &&
    p.weight >= WEIGHT_RANGE.min &&
    p.weight <= WEIGHT_RANGE.max &&
    (p.preference === "dar" ||
      p.preference === "normal" ||
      p.preference === "bol")
  );
}

/** Profile ve ürünün kalıbına göre önerilen beden. */
export function recommendSize(
  profile: SizeProfile,
  fit: ProductFit = "normal",
): ApparelSize {
  const w = position(profile.weight, WEIGHT_MIDS);
  const h = position(profile.height, HEIGHT_MIDS);
  const base = Math.max(
    WEIGHT_SHARE * w + (1 - WEIGHT_SHARE) * h,
    h - MAX_HEIGHT_DEFICIT,
    w - MAX_WEIGHT_DEFICIT,
  );
  const score =
    base +
    FIT_SHIFT[fit] +
    PREFERENCE_SHIFT[profile.preference];
  const index = Math.min(
    SIZE_CHART.length - 1,
    Math.max(0, Math.round(score)),
  );
  return SIZE_CHART[index].size;
}

/* ---------------- Depolama ---------------- */

let snapshot: SizeProfile | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): SizeProfile | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return null;
    return isValidProfile(parsed as Partial<SizeProfile>)
      ? (parsed as SizeProfile)
      : null;
  } catch {
    return null;
  }
}

function persist(value: SizeProfile | null) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Depolama kapalıysa profil yalnızca bu oturumda yaşar.
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    snapshot = read();
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): SizeProfile | null {
  if (!hydrated) {
    snapshot = read();
    hydrated = true;
  }
  return snapshot;
}

function getServerSnapshot(): SizeProfile | null {
  return null;
}

export function useSizeProfile() {
  const profile = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const save = useCallback((next: SizeProfile) => {
    snapshot = next;
    persist(next);
    emit();
  }, []);

  const clear = useCallback(() => {
    snapshot = null;
    persist(null);
    emit();
  }, []);

  return { profile, save, clear };
}
