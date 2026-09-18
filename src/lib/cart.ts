"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Currency, ProductSize } from "@/types/product";

/**
 * Sitedeki TEK sepet kaynağı. Ürün detay paneli, sepet sayfası ve header
 * sayacı hep buradan okur — paralel bir state kurma.
 *
 * lib/favorites ile aynı desen: modül seviyesinde küçük bir store, Provider
 * gerekmiyor, sekmeler arası senkron ve `useSyncExternalStore` sayesinde
 * SSR/hydration uyuşmazlığı yok.
 */

const STORAGE_KEY = "452wear:cart";

export type CartItem = {
  /** productId + beden + renk; aynı kombinasyon tekrar eklenirse adet artar. */
  id: string;
  productId: string;
  size: ProductSize;
  color: string;
  qty: number;
  /** Sepete eklendiği andaki birim fiyat; yalnızca kayıt olarak saklanır.
   *  Gösterim ve toplamlar katalogdaki güncel fiyattan hesaplanır
   *  (bkz. components/product/catalog-provider). */
  price: number;
  currency: Currency;
};

const EMPTY: readonly CartItem[] = Object.freeze([]);

let snapshot: readonly CartItem[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

const lineId = (productId: string, size: string, color: string) =>
  `${productId}:${size}:${color}`;

function isItem(v: unknown): v is CartItem {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.productId === "string" &&
    typeof o.size === "string" &&
    typeof o.color === "string" &&
    typeof o.qty === "number" &&
    typeof o.price === "number"
  );
}

function read(): readonly CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return EMPTY;
    const items = parsed.filter(isItem);
    return items.length > 0 ? Object.freeze(items) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function persist(items: readonly CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Depolama kapalıysa sepet yalnızca bu oturumda yaşar.
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

function getSnapshot(): readonly CartItem[] {
  if (!hydrated) {
    snapshot = read();
    hydrated = true;
  }
  return snapshot;
}

function getServerSnapshot(): readonly CartItem[] {
  return EMPTY;
}

function setItems(next: readonly CartItem[]) {
  snapshot = Object.freeze(next);
  persist(snapshot);
  emit();
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /**
   * Sepete ekler ve GERÇEKTEN eklenen adedi döndürür. `max` (varyantın stoğu)
   * verilirse satırın toplam adedi bunu aşamaz; sınıra dayanmışsa 0 döner.
   */
  const add = useCallback(
    (input: {
      productId: string;
      size: ProductSize;
      color: string;
      price: number;
      currency: Currency;
      qty?: number;
      max?: number;
    }): number => {
      const id = lineId(input.productId, input.size, input.color);
      const current = getSnapshot();
      const existing = current.find((i) => i.id === id);
      const onceki = existing?.qty ?? 0;
      const qty =
        Math.min(onceki + (input.qty ?? 1), input.max ?? Infinity) - onceki;
      if (qty <= 0) return 0;

      setItems(
        existing
          ? current.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i))
          : [
              ...current,
              {
                id,
                productId: input.productId,
                size: input.size,
                color: input.color,
                price: input.price,
                currency: input.currency,
                qty,
              },
            ],
      );
      return qty;
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setItems(getSnapshot().filter((i) => i.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setItems(getSnapshot().filter((i) => i.id !== id));
      return;
    }
    setItems(getSnapshot().map((i) => (i.id === id ? { ...i, qty } : i)));
  }, []);

  const clear = useCallback(() => setItems(EMPTY), []);

  return {
    items,
    add,
    remove,
    setQty,
    clear,
    count: items.reduce((total, item) => total + item.qty, 0),
    subtotal: items.reduce((total, item) => total + item.price * item.qty, 0),
  };
}
