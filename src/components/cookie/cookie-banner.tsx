"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ConsentControls } from "./consent-controls";
import { useCookieConsent } from "@/lib/cookie-consent";
import { useIsHydrated } from "@/hooks/use-is-hydrated";

/**
 * Site geneli çerez bildirimi. Kullanıcı seçim yapana kadar görünür;
 * seçim yapıldıktan sonra bir daha çıkmaz ve tercihler footer'daki
 * "Çerez Tercihleri" sayfasından değiştirilebilir.
 *
 * "Tümünü Reddet" kabul düğmesiyle aynı görsel ağırlıkta — gizlenmiyor.
 */
export function CookieBanner() {
  const { decided, acceptAll, rejectAll } = useCookieConsent();
  const [manage, setManage] = useState(false);
  const reduced = useReducedMotion();
  const hydrated = useIsHydrated();

  // Yerel depolama okunana kadar hiç render etme: aksi halde tercihini çoktan
  // vermiş kullanıcıda bildirim her sayfa yüklemesinde bir an görünür.
  const visible = hydrated && !decided;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cookie-banner"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          role="dialog"
          aria-label="Çerez tercihleri"
          className="fixed inset-x-3 bottom-3 z-[45] mx-auto max-w-2xl rounded-product bg-background p-5 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_20px_50px_-28px_rgb(0_0_0/0.35)] sm:p-6"
        >
          {!manage ? (
            <>
              <p className="micro">Çerezler</p>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                Sitenin çalışması için gereken verileri tarayıcında saklıyoruz.
                Zorunlu olmayan kategoriler sen izin vermeden etkinleştirilmez.{" "}
                <Link
                  href="/cerez-politikasi"
                  className="underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  Çerez Politikası
                </Link>
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={acceptAll}
                  className="inline-flex h-11 items-center rounded-full bg-foreground px-6 micro text-background transition-colors hover:bg-foreground/90"
                >
                  Tümünü Kabul Et
                </button>
                <button
                  type="button"
                  onClick={rejectAll}
                  className="inline-flex h-11 items-center rounded-full border border-foreground/20 px-6 micro transition-colors hover:border-foreground/60"
                >
                  Tümünü Reddet
                </button>
                <button
                  type="button"
                  onClick={() => setManage(true)}
                  className="inline-flex h-11 items-center px-2 micro text-foreground/50 transition-colors hover:text-foreground"
                >
                  Tercihleri Yönet
                </button>
              </div>
            </>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <p className="micro">Çerez Tercihleri</p>
              <div className="mt-4">
                <ConsentControls compact onDone={() => setManage(false)} />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
