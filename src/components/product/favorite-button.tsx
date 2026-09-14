"use client";

import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";

/**
 * Favori düğmesi. Tek favori kaynağına (lib/favorites) bağlıdır.
 * Masaüstünde kart hover/focus edilince belirir; dokunmatikte ve ürün zaten
 * favorideyse her zaman görünür.
 */
export function FavoriteButton({
  productId,
  productName,
  className,
}: {
  productId: string;
  productName: string;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(productId);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      transition={{ type: "spring", stiffness: 600, damping: 22 }}
      aria-pressed={active}
      aria-label={
        active
          ? `${productName} favorilerden çıkar`
          : `${productName} favorilere ekle`
      }
      onClick={(e) => {
        // Kartın tamamı bir bağlantı; tıklama oraya gitmesin.
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      className={cn(
        "grid size-7 place-items-center rounded-full bg-background/85 backdrop-blur-sm transition-[opacity,color]",
        // Dokunmatikte hover yok — düğme her zaman görünür.
        "[@media(hover:none)]:opacity-100",
        // Tek dal: aynı sınıfı iki kez yazıp çakıştırmıyoruz, aksi halde
        // hangisinin kazandığı sınıf birleştiricisine kalıyor.
        active
          ? "text-brand opacity-100"
          : "text-foreground/70 opacity-0 hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
        className,
      )}
    >
      <motion.span
        // Favoriye eklenince kısa bir "pop"; çıkarınca sessizce döner.
        key={String(active)}
        initial={active ? { scale: 0.6 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 620, damping: 18 }}
        className="grid place-items-center"
      >
        <Heart
          className="size-3.5"
          strokeWidth={1.8}
          fill={active ? "currentColor" : "none"}
        />
      </motion.span>
    </motion.button>
  );
}
