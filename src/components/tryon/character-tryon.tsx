"use client";

import { AnimatePresence } from "motion/react";
import { CharacterBase } from "./character-base";
import { GarmentLayer } from "./garment-layer";
import {
  CHARACTER_ASPECT,
  DEFAULT_CHARACTER,
  DEFAULT_VIEW,
  LAYER_ORDER,
  tryOnAsset,
  type CharacterId,
  type CharacterView,
} from "@/lib/character";
import { cn } from "@/lib/utils";
import type { Product, TryOnLayer } from "@/types/product";

/**
 * Giydirilebilir karakter.
 *
 *   CharacterTryOn
 *    ├── CharacterBase        (kıyafetsiz gövde — hiç değişmez)
 *    ├── GarmentLayer[bottom]
 *    └── GarmentLayer[top]
 *
 * Katman sırası LAYER_ORDER'dan gelir; yeni yuva eklemek için orayı
 * genişletmek yeterli. Ürünler dışarıdan gelir — kombin motorunun sonucu
 * doğrudan buraya bağlanır, ürün datası ikinci kez tanımlanmaz.
 */
export function CharacterTryOn({
  outfit,
  override,
  character = DEFAULT_CHARACTER,
  view = DEFAULT_VIEW,
  className,
}: {
  /** Yuva → ürün eşlemesi. Ürün yoksa o katman çizilmez. */
  outfit: Partial<Record<TryOnLayer, Product>>;
  /**
   * Yuva → asset yolu. Ürün datasını atlar; admin önizlemesinde HENÜZ
   * ONAYLANMAMIŞ bir asset'i karakterde göstermek için kullanılır.
   * Mağaza tarafı bunu kullanmaz.
   */
  override?: Partial<Record<TryOnLayer, string | null>>;
  character?: CharacterId;
  view?: CharacterView;
  className?: string;
}) {
  return (
    // Boyut YÜKSEKLİKTEN sürülür: aspect-ratio genişliği türetir, böylece
    // karakter viewport'a sığar ve oranı hiçbir ölçekte bozulmaz. Kutu dar bir
    // kapsayıcıda kırpılırsa tüm katmanlar aynı object-contain kutusunu
    // paylaştığı için hizalama yine korunur.
    <div
      className={cn("relative mx-auto w-auto max-w-full", className)}
      style={{ aspectRatio: CHARACTER_ASPECT }}
    >
      <CharacterBase character={character} view={view} />

      {LAYER_ORDER.map((layer) => {
        const product = outfit[layer];
        const asset =
          override && layer in override
            ? (override[layer] ?? null)
            : tryOnAsset(product, layer);
        return (
          // Her yuva kendi AnimatePresence'ına sahip: bir katman değişirken
          // diğeri yeniden mount olmaz.
          <AnimatePresence key={layer} initial={false}>
            {asset && (
              <GarmentLayer
                key={asset}
                product={product}
                layer={layer}
                asset={asset}
              />
            )}
          </AnimatePresence>
        );
      })}
    </div>
  );
}

/** Try-on görseli olmayan parçalar — çağıran taraf isterse bilgi verir. */
export function missingTryOn(
  outfit: Partial<Record<TryOnLayer, Product>>,
): Product[] {
  return LAYER_ORDER.map((layer) =>
    outfit[layer] && !tryOnAsset(outfit[layer], layer) ? outfit[layer] : null,
  ).filter((p): p is Product => p !== null);
}
