"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { PANEL_SPRING, ProductDetail } from "./product-detail";
import { SizeGuide } from "./size-guide";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

/**
 * Hızlı görünüm penceresi. İçerik /urun sayfasıyla ortak bileşenden gelir
 * (product-detail); burada yalnızca pencere, kapatma ve beden rehberi var.
 */
export function ProductDetailPanel({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const [guideOpen, setGuideOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // ESC ile kapat + açılışta odağı panele al
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (guideOpen) setGuideOpen(false);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [guideOpen, onClose]);

  return (
    <>
      {/* Arka plan — dışına tıklayınca kapanır */}
      <motion.div
        className="fixed inset-0 z-[60] bg-foreground/25 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        aria-hidden
      />

      <div className="pointer-events-none fixed inset-0 z-[61] flex items-end justify-center sm:items-center sm:p-6">
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
          className={cn(
            "pointer-events-auto relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-background",
            "rounded-t-product sm:max-h-[86vh] sm:w-[90vw] sm:max-w-6xl sm:rounded-product",
            // Üst sınır: 4:5 görselin genişliği sol kolonu aşmasın diye.
            "lg:max-h-[min(86vh,780px)]",
            "shadow-[0_1px_2px_rgb(0_0_0/0.06),0_24px_60px_-30px_rgb(0_0_0/0.35)]",
          )}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={PANEL_SPRING}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full bg-background/85 text-foreground/60 backdrop-blur-sm transition-colors hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.8} />
          </button>

          <ProductDetail
            product={product}
            variant="panel"
            onOpenGuide={() => setGuideOpen(true)}
          />

          <SizeGuide
            open={guideOpen}
            category={product.category}
            onClose={() => setGuideOpen(false)}
          />
        </motion.div>
      </div>
    </>
  );
}
