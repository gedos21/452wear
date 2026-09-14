"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence } from "motion/react";
import { CartDrawer } from "./cart-drawer";
import { useScrollLock } from "@/hooks/use-scroll-lock";

/**
 * Sepet çekmecesinin açık/kapalı durumu. Kök layout'ta bir kez sarmalanır,
 * böylece header'daki sepet düğmesi her sayfadan çekmeceyi açabilir.
 *
 * Sepetin VERİSİ burada değil — o lib/cart içindeki tek kaynakta. Burası
 * yalnızca görünürlüğü yönetir.
 */

type CartUiValue = {
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartUiContext = createContext<CartUiValue | null>(null);

export function useCartUi() {
  const ctx = useContext(CartUiContext);
  if (!ctx) throw new Error("useCartUi, CartProvider içinde kullanılmalı.");
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  useScrollLock(open);

  return (
    <CartUiContext.Provider value={{ open, openCart, closeCart }}>
      {children}
      <AnimatePresence>{open && <CartDrawer onClose={closeCart} />}</AnimatePresence>
    </CartUiContext.Provider>
  );
}
