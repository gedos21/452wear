"use client";

import { motion } from "motion/react";
import { CharacterLayer } from "./character-layer";
import { tryOnAsset } from "@/lib/character";
import type { Product, TryOnLayer } from "@/types/product";

/**
 * Tek bir kıyafet katmanı.
 *
 * Ürünün bu yuvaya ait try-on asset'i yoksa hiçbir şey çizilmez — ne kırık
 * görsel ne de yer tutucu. Karakter base'i görünmeye devam eder.
 *
 * Geçiş kısa bir fade + çok hafif scale; pixel-art'ı yumuşatmamak için blur
 * kullanılmaz.
 */
export function GarmentLayer({
  product,
  layer,
  asset: zorlanan,
}: {
  product: Product | undefined;
  layer: TryOnLayer;
  /** Verilirse ürün datası yerine bu yol çizilir (admin önizlemesi). */
  asset?: string;
}) {
  const asset = zorlanan ?? tryOnAsset(product, layer);
  if (!asset) return null;

  return (
    <motion.div
      // key dışarıdan geliyor: asset değişince eski katman çıkar, yenisi girer.
      className="absolute inset-0"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.985 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <CharacterLayer src={asset} />
    </motion.div>
  );
}
