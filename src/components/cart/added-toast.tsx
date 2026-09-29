"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import { useCatalog } from "@/components/product/catalog-provider";
import { onCartAdd, type CartAddEvent } from "@/lib/cart";
import { variantLabel } from "@/lib/product-variants";

/** Bildirimin ekranda kalma süresi (ms). */
const VISIBLE_MS = 3500;

/**
 * "Sepete eklendi" bildirimi: ürün nereden eklenirse eklensin (ürün sayfası,
 * kombin, hızlı görünüm) header'ın altında kısa süre görünür ve sepete tek
 * tıkla geçirir. Sepet çekmecesi açıkken gösterilmez; orada eklenen zaten
 * görünüyor.
 *
 * Mobilde üstte durur: altta ürün sayfasının yapışkan "Sepete Ekle" çubuğu var.
 */
export function AddedToast({
  drawerOpen,
  onOpenCart,
}: {
  drawerOpen: boolean;
  onOpenCart: () => void;
}) {
  const reduced = useReducedMotion();
  const { byId } = useCatalog();
  const [last, setLast] = useState<(CartAddEvent & { n: number }) | null>(null);

  useEffect(() => {
    let n = 0;
    return onCartAdd((e) => setLast({ ...e, n: ++n }));
  }, []);

  // Her yeni eklemede süre baştan başlar.
  useEffect(() => {
    if (!last) return;
    const t = setTimeout(() => setLast(null), VISIBLE_MS);
    return () => clearTimeout(t);
  }, [last]);

  const product = last ? byId.get(last.productId) : undefined;
  const show = !!last && !!product && !drawerOpen;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-[4.5rem] z-[65] flex justify-center sm:inset-x-auto sm:right-6 lg:top-[5.75rem]"
    >
      <AnimatePresence>
        {show && (
          <motion.div
            key="added"
            role="status"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-background p-2.5 font-sf shadow-[0_1px_2px_rgb(0_0_0/0.06),0_18px_40px_-18px_rgb(0_0_0/0.35)] ring-1 ring-foreground/10"
          >
            <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Image
                src={product.images[0].src}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.04em] text-foreground/60 sm:text-[12px]">
                <Check className="size-3.5 text-brand" strokeWidth={2.4} />
                Sepete eklendi
              </span>
              <span className="mt-0.5 block truncate text-[14px] font-semibold">
                {product.name}
              </span>
              <span className="block truncate text-[12px] text-foreground/50">
                {variantLabel(last.color, last.size)}
                {last.qty > 1 && ` · ${last.qty} adet`}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setLast(null);
                onOpenCart();
              }}
              className="h-10 shrink-0 rounded-full bg-foreground px-3.5 text-[12px] sm:px-4 font-bold uppercase tracking-[0.05em] text-background transition-colors hover:bg-brand"
            >
              Sepete git
            </button>
            <button
              type="button"
              onClick={() => setLast(null)}
              aria-label="Bildirimi kapat"
              className="hidden size-8 shrink-0 place-items-center sm:grid rounded-full text-foreground/45 transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" strokeWidth={1.8} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
