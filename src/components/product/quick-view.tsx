"use client";

import { createContext, useCallback, useContext, useState } from "react";
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

  const open = useCallback((next: Product) => setProduct(next), []);
  const close = useCallback(() => setProduct(null), []);

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
