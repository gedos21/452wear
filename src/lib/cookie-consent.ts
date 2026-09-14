"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Çerez tercihleri — tek kaynak. Banner ve Çerez Tercihleri sayfası aynı
 * store'u kullanır (lib/favorites, lib/cart ile aynı desen).
 *
 * Tercih kaydının kendisi zorunlu kategoriye girer: kullanıcının seçimini
 * hatırlamak için yerel depolamada tutulur, sunucuya gönderilmez.
 *
 * Zorunlu olmayan kategoriler kullanıcı açıkça izin verene kadar KAPALI
 * kalır; hiçbiri varsayılan olarak etkin değildir.
 */

const STORAGE_KEY = "452wear:cookie-consent";

export type ConsentCategory = "necessary" | "analytics" | "functional" | "marketing";

export type Consent = {
  necessary: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  /** Kullanıcının seçim yaptığı an (ISO); null ise henüz seçim yapılmamış. */
  decidedAt: string | null;
};

export const DEFAULT_CONSENT: Consent = Object.freeze({
  necessary: true,
  analytics: false,
  functional: false,
  marketing: false,
  decidedAt: null,
});

export const CONSENT_CATEGORIES: {
  key: ConsentCategory;
  label: string;
  description: string;
  required: boolean;
}[] = [
  {
    key: "necessary",
    label: "Zorunlu",
    description:
      "Sitenin çalışması için gereklidir: sepetin, favorilerin ve çerez tercihin tarayıcında saklanır. Kapatılamaz.",
    required: true,
  },
  {
    key: "analytics",
    label: "Analitik / Performans",
    description:
      "Sitenin nasıl kullanıldığını anlamak için toplu istatistik toplanmasına izin verir. Şu anda kullanılmıyor.",
    required: false,
  },
  {
    key: "functional",
    label: "İşlevsel",
    description:
      "Dil, bölge gibi ek tercihlerin hatırlanmasını sağlar. Şu anda kullanılmıyor.",
    required: false,
  },
  {
    key: "marketing",
    label: "Reklam / Pazarlama",
    description:
      "İlgi alanına göre reklam gösterimi için kullanılır. Şu anda kullanılmıyor.",
    required: false,
  },
];

let snapshot: Consent = DEFAULT_CONSENT;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): Consent {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONSENT;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_CONSENT;
    const o = parsed as Record<string, unknown>;
    return Object.freeze({
      necessary: true,
      analytics: o.analytics === true,
      functional: o.functional === true,
      marketing: o.marketing === true,
      decidedAt: typeof o.decidedAt === "string" ? o.decidedAt : null,
    });
  } catch {
    return DEFAULT_CONSENT;
  }
}

function persist(value: Consent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Depolama kapalıysa tercih yalnızca bu oturumda geçerli olur.
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

function getSnapshot(): Consent {
  if (!hydrated) {
    snapshot = read();
    hydrated = true;
  }
  return snapshot;
}

function getServerSnapshot(): Consent {
  return DEFAULT_CONSENT;
}

function commit(next: Omit<Consent, "necessary" | "decidedAt">) {
  snapshot = Object.freeze({
    necessary: true as const,
    ...next,
    decidedAt: new Date().toISOString(),
  });
  persist(snapshot);
  emit();
}

export function useCookieConsent() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const acceptAll = useCallback(
    () => commit({ analytics: true, functional: true, marketing: true }),
    [],
  );

  const rejectAll = useCallback(
    () => commit({ analytics: false, functional: false, marketing: false }),
    [],
  );

  const save = useCallback(
    (next: { analytics: boolean; functional: boolean; marketing: boolean }) =>
      commit(next),
    [],
  );

  return {
    consent,
    /** Kullanıcı henüz seçim yapmadıysa banner gösterilir. */
    decided: consent.decidedAt !== null,
    acceptAll,
    rejectAll,
    save,
  };
}
