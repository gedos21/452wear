"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * "Son baktıkların" — müşterinin son baktığı ürünler, en yenisi başta.
 *
 * lib/favorites ile aynı desen: modül seviyesinde küçük bir store, yalnızca
 * tarayıcıda (localStorage) tutulur, sunucuya gitmez; sekmeler arası senkron,
 * sunucu anlık görüntüsü her zaman boş liste (hydration uyuşmazlığı yok).
 */

const STORAGE_KEY = "452wear:recently-viewed";
/** Saklanan en fazla ürün sayısı; gösterim bundan azını kullanır. */
const LIMIT = 12;

const EMPTY: readonly string[] = Object.freeze([]);

let snapshot: readonly string[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): readonly string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return EMPTY;
    const ids = parsed
      .filter((v): v is string => typeof v === "string")
      .slice(0, LIMIT);
    return ids.length > 0 ? Object.freeze(ids) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function persist(ids: readonly string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Depolama kapalıysa liste yalnızca bu oturumda yaşar.
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

function getSnapshot(): readonly string[] {
  if (!hydrated) {
    snapshot = read();
    hydrated = true;
  }
  return snapshot;
}

function getServerSnapshot(): readonly string[] {
  return EMPTY;
}

export function useRecentlyViewed() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /** Ürünü listenin başına alır (zaten varsa yerinden taşınır). */
  const record = useCallback((productId: string) => {
    const current = getSnapshot();
    if (current[0] === productId) return;
    snapshot = Object.freeze(
      [productId, ...current.filter((id) => id !== productId)].slice(0, LIMIT),
    );
    persist(snapshot);
    emit();
  }, []);

  return { ids, record };
}
