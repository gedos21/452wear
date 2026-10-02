"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth";
import { accountApi } from "@/lib/account-api";

/**
 * Sitedeki TEK favori kaynağı. Ürün kartı, favoriler sayfası ve header
 * sayacı hep buradan okur — paralel bir state kurma.
 *
 * Modül seviyesinde küçük bir store: Provider gerekmiyor, sekmeler arası
 * senkron çalışıyor ve `useSyncExternalStore` sayesinde SSR/hydration
 * uyuşmazlığı oluşmuyor (sunucu anlık görüntüsü her zaman boş liste).
 *
 * İki kip:
 * - Giriş yapılmamış: favoriler tarayıcının yerel depolamasında (eskisi gibi).
 * - Giriş yapılmış: favoriler hesapta (/api/hesap/favoriler). Değişiklik
 *   ekranda anında görünür, istek arkadan sırayla gider; başarısız olursa
 *   liste sunucudan yeniden okunur. Girişte yereldeki favoriler hesaba BİR
 *   KEZ katılır ve yerel liste boşaltılır — çıkış yapınca hesabın favorileri
 *   bu cihazda görünmez, sonraki girişte silinmiş bir favori geri dönmez.
 */

const STORAGE_KEY = "452wear:favorites";

/** Sunucu anlık görüntüsü — referansı sabit olmalı. */
const EMPTY: readonly string[] = Object.freeze([]);

let snapshot: readonly string[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

/** Hesap kipi: hangi kullanıcının favorileri gösteriliyor (null = yerel kip). */
let remoteUser: string | null = null;
/** Oturum her değiştiğinde artar; eski isteklerin sonucu yok sayılır. */
let generation = 0;
/** Son eşitlenen oturum (undefined = henüz eşitlenmedi / yeniden denenecek). */
let syncedUser: string | null | undefined;
/** Hook'un en son bildirdiği oturum; başarısız eşitleme bununla yeniden denenir. */
let sessionUser: string | null = null;
/** Sunucuya henüz ulaşmamış değişiklikler; sunucu listesine üstüne uygulanır. */
let pending: { productId: string; add: boolean }[] = [];
/** İstekler sırayla gider: hızlı ekle/çıkar sırası karışmasın. */
let queue: Promise<void> = Promise.resolve();
let lastRefresh = 0;

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
    if (ids.length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Depolama kapalıysa favoriler yalnızca bu oturumda yaşar.
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function setSnapshot(next: readonly string[]) {
  snapshot = next.length > 0 ? Object.freeze([...next]) : EMPTY;
  emit();
}

function applyPending(base: readonly string[]): string[] {
  let ids = [...base];
  for (const op of pending) {
    ids = ids.filter((id) => id !== op.productId);
    if (op.add) ids.push(op.productId);
  }
  return ids;
}

function enqueue(task: () => Promise<void>) {
  queue = queue.then(task).catch(() => {});
}

/** Hesaptaki listeyi yeniden okur (hata sonrası ya da sekmeye dönünce). */
function refresh() {
  const gen = generation;
  lastRefresh = Date.now();
  enqueue(async () => {
    if (gen !== generation || !remoteUser) return;
    const result = await accountApi<{ ids: string[] }>("GET", "/favoriler");
    if (gen !== generation) return;
    if (result.ok) setSnapshot(applyPending(result.data.ids));
    else if (result.status === 401) syncedUser = undefined;
  });
}

/**
 * Oturum değişince çağrılır (useFavorites içinden). Aynı kullanıcı için
 * tekrar çağrılırsa bir şey yapmaz.
 */
function syncWithSession(userId: string | null) {
  sessionUser = userId;
  if (userId === syncedUser) return;
  syncedUser = userId;
  generation += 1;
  pending = [];
  const gen = generation;

  if (!userId) {
    remoteUser = null;
    setSnapshot(read());
    return;
  }

  remoteUser = userId;
  const local = read();
  // Sunucu cevabına kadar yereldekiler görünür; zaten hesaba katılacaklar.
  setSnapshot(local);
  enqueue(async () => {
    const result =
      local.length > 0
        ? await accountApi<{ ids: string[] }>("POST", "/favoriler", { ids: local })
        : await accountApi<{ ids: string[] }>("GET", "/favoriler");
    lastRefresh = Date.now();
    if (gen !== generation) return;
    if (result.ok) {
      if (local.length > 0) persist(EMPTY);
      setSnapshot(applyPending(result.data.ids));
      return;
    }
    // Hesaba ulaşılamadı: yerel kipte kal, bir sonraki fırsatta yeniden dene.
    remoteUser = null;
    syncedUser = undefined;
    pending = [];
    setSnapshot(read());
  });
}

// Aynı sitenin diğer sekmelerinde yapılan değişiklikleri de yakala.
function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY || remoteUser) return;
  snapshot = read();
  emit();
}

// Hesap kipinde başka sekme/cihazdaki değişiklik: sekmeye dönünce tazele.
// Yarım kalan eşitleme de burada yeniden denenir.
function onVisible() {
  if (document.visibilityState !== "visible") return;
  if (syncedUser === undefined && sessionUser) {
    syncWithSession(sessionUser);
    return;
  }
  if (!remoteUser || Date.now() - lastRefresh < 30_000) return;
  refresh();
}

/** Pencere dinleyicileri abone sayısından bağımsız olarak bir kez kurulur. */
function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    }
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

function toggleId(productId: string) {
  const current = getSnapshot();
  const add = !current.includes(productId);
  const next = add ? [...current, productId] : current.filter((id) => id !== productId);

  if (!remoteUser) {
    persist(next);
    setSnapshot(next);
    return;
  }

  const op = { productId, add };
  pending.push(op);
  setSnapshot(next);
  const gen = generation;
  enqueue(async () => {
    if (gen !== generation) return;
    const result = await accountApi(
      add ? "PUT" : "DELETE",
      `/favoriler/${encodeURIComponent(productId)}`,
    );
    pending = pending.filter((p) => p !== op);
    if (gen !== generation) return;
    // Başarısızsa (ör. sınır doldu, oturum düştü) ekran sunucuya göre düzelir.
    if (!result.ok) {
      if (result.status === 401) syncedUser = undefined;
      refresh();
    }
  });
}

function clearAll() {
  if (!remoteUser) {
    persist(EMPTY);
    setSnapshot(EMPTY);
    return;
  }
  pending = [];
  setSnapshot(EMPTY);
  const gen = generation;
  enqueue(async () => {
    if (gen !== generation) return;
    const result = await accountApi("DELETE", "/favoriler");
    if (!result.ok && gen === generation) refresh();
  });
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Oturum belli olunca kip seçilir; oturum yüklenirken mevcut liste kalır.
  const { status, user } = useAuth();
  const userId = status === "loading" ? undefined : (user?.id ?? null);
  useEffect(() => {
    if (userId !== undefined) syncWithSession(userId);
  }, [userId]);

  const toggle = useCallback((productId: string) => toggleId(productId), []);
  const clear = useCallback(() => clearAll(), []);

  const isFavorite = useCallback(
    (productId: string) => ids.includes(productId),
    [ids],
  );

  return { ids, isFavorite, toggle, clear, count: ids.length };
}
