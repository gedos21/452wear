"use client";

import { useEffect, type RefObject } from "react";

const ODAKLANABILIR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Açık katman üst üste bindiğinde yalnızca EN ÜSTTEKİ tuzak çalışsın diye
 * açık katmanların yığını. (Ör. aramanın üzerine hızlı görünüm açılır.)
 */
const yigin: HTMLElement[] = [];

/**
 * Bir katman açıkken klavye odağını içeride tutar (Tab ve Shift+Tab döner),
 * katman kapanınca odağı katmanı açan öğeye geri verir.
 *
 * Katman kapatma (ESC, düğme, arka plan) çağıran bileşende kalır; bu kanca
 * yalnızca odakla ilgilenir.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active = true,
) {
  useEffect(() => {
    const kap = ref.current;
    if (!active || !kap) return;

    const oncekiOdak = document.activeElement as HTMLElement | null;
    yigin.push(kap);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      // Üstte başka bir katman varsa odağı o yönetir.
      if (yigin[yigin.length - 1] !== kap) return;

      const ogeler = [
        ...kap.querySelectorAll<HTMLElement>(ODAKLANABILIR),
      ].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (ogeler.length === 0) {
        e.preventDefault();
        return;
      }

      const ilk = ogeler[0];
      const son = ogeler[ogeler.length - 1];
      const aktif = document.activeElement;

      if (!kap.contains(aktif)) {
        e.preventDefault();
        ilk.focus();
      } else if (e.shiftKey && aktif === ilk) {
        e.preventDefault();
        son.focus();
      } else if (!e.shiftKey && aktif === son) {
        e.preventDefault();
        ilk.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const i = yigin.lastIndexOf(kap);
      if (i >= 0) yigin.splice(i, 1);
      // Katmanı açan öğe hâlâ sayfadaysa odak ona döner.
      if (oncekiOdak && document.contains(oncekiOdak)) oncekiOdak.focus();
    };
  }, [ref, active]);
}
