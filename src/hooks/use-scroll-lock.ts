"use client";

import { useEffect } from "react";

/**
 * Bir katman açıkken sayfanın kaydırmasını kilitler.
 *
 * `overflow: hidden` kullanılır — `position: fixed` hilesi kaydırma konumunu
 * kaybettirirdi; böylece katman kapanınca kullanıcı tam kaldığı yerde kalır.
 * Kaydırma çubuğunun genişliği telafi edilir ki sayfa yana zıplamasın.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const { style } = document.body;
    const prevOverflow = style.overflow;
    const prevPadding = style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;

    style.overflow = "hidden";
    if (gap > 0) style.paddingRight = `${gap}px`;

    return () => {
      style.overflow = prevOverflow;
      style.paddingRight = prevPadding;
    };
  }, [locked]);
}
