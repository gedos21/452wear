"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Kullanıcı hareketi azaltmayı seçmiş mi. Sunucuda ve hydration sırasında
 * `false` döner, ardından gerçek değere geçer; böylece sunucu HTML'i ile
 * ilk istemci çizimi aynı kalır (hydration uyuşmazlığı olmaz).
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
