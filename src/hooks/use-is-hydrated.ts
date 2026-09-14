"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Sunucuda ve ilk (hydration) render'ında false, sonrasında true döner.
 *
 * Yerel depolamadan okuyan katmanlar için gerekli: sunucu anlık görüntüsü
 * her zaman "boş" olduğundan, kontrol edilmezse kullanıcı zaten karar vermiş
 * olsa bile çerez bildirimi her sayfa yüklemesinde bir an görünür.
 */
export function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
