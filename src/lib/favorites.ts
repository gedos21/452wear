"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Sitedeki TEK favori kaynağı. Ürün kartı, favoriler sayfası ve header
 * sayacı hep buradan okur — paralel bir state kurma.
 *
 * Modül seviyesinde küçük bir store: Provider gerekmiyor, sekmeler arası
 * senkron çalışıyor ve `useSyncExternalStore` sayesinde SSR/hydration
 * uyuşmazlığı oluşmuyor (sunucu anlık görüntüsü her zaman boş liste).
 *
 * Backend geldiğinde yalnızca read/persist değişecek; tüketen bileşenler aynı kalacak.
 */

const STORAGE_KEY = "452wear:favorites";

/** Sunucu anlık görüntüsü — referansı sabit olmalı. */
const EMPTY: readonly string[] = Object.freeze([]);

let snapshot: readonly string[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): readonly string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return EMPTY;
    const ids = parsed.filter((v): v is string => typeof v === "string");
    return ids.length > 0 ? Object.freeze(ids) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function persist(ids: readonly string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Depolama kapalıysa favoriler yalnızca bu oturumda yaşar.
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  // Aynı sitenin diğer sekmelerinde yapılan değişiklikleri de yakala.
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

function setIds(next: readonly string[]) {
  snapshot = Object.freeze(next);
  persist(snapshot);
  emit();
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((productId: string) => {
    const current = getSnapshot();
    setIds(
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }, []);

  const clear = useCallback(() => setIds(EMPTY), []);

  const isFavorite = useCallback(
    (productId: string) => ids.includes(productId),
    [ids],
  );

  return { ids, isFavorite, toggle, clear, count: ids.length };
}
