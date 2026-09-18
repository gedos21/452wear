"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence } from "motion/react";
import { ProductDetailPanel } from "./product-detail-panel";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import type { Product } from "@/types/product";

/**
 * Ürün detayının, sayfadan ayrılmadan kartın üzerinden açılmasını yöneten
 * bağlam. Sağlayıcı yoksa `useQuickView()` null döner ve ürün kartı normal
 * bir bağlantı gibi davranır — yani sağlayıcıyı eklemek/çıkarmak dışında
 * hiçbir şey değişmez.
 */

type QuickViewValue = {
  /** Açık ürünün id'si; kart kendi örtü katmanlarını buna göre gizler. */
  openId: string | null;
  open: (product: Product) => void;
  close: () => void;
};

const QuickViewContext = createContext<QuickViewValue | null>(null);

export function useQuickView() {
  return useContext(QuickViewContext);
}

export function QuickViewProvider({ children }: { children: React.ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null);

  /**
   * Tarayıcının geri tuşu paneli kapatsın diye açılışta TEK bir geçmiş kaydı
   * eklenir (adres aynı kalır). Panel X/ESC/arka planla kapanınca o kayıt geri
   * alınır; geçmiş şişmez. Her açılışın kendi anahtarı var: sayfa yenilendikten
   * sonra geçmişte kalan eski bir kayıt yanlışlıkla "panel açık" sayılmaz.
   */
  const gecmisAnahtari = useRef<string | null>(null);

  const open = useCallback((next: Product) => {
    setProduct(next);
    if (gecmisAnahtari.current) return;
    const anahtar = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    gecmisAnahtari.current = anahtar;
    window.history.pushState(
      { ...window.history.state, hizliGorunum: anahtar },
      "",
      window.location.href,
    );
  }, []);

  const close = useCallback(() => {
    const anahtar = gecmisAnahtari.current;
    // Anahtar hemen bırakılır: art arda iki kapatma iki kez geri gitmesin.
    gecmisAnahtari.current = null;
    if (anahtar && window.history.state?.hizliGorunum === anahtar) {
      window.history.back(); // popstate paneli kapatır
      return;
    }
    setProduct(null);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const anahtar = gecmisAnahtari.current;
      if (anahtar && window.history.state?.hizliGorunum === anahtar) return;
      gecmisAnahtari.current = null;
      setProduct(null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useScrollLock(product !== null);

  return (
    <QuickViewContext.Provider
      value={{ openId: product?.id ?? null, open, close }}
    >
      {children}
      <AnimatePresence>
        {product && (
          <ProductDetailPanel
            key={product.id}
            product={product}
            onClose={close}
          />
        )}
      </AnimatePresence>
    </QuickViewContext.Provider>
  );
}
