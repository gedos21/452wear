"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FavoritesWheel } from "./favorites-wheel";
import { ProductCard } from "@/components/product/product-card";
import {
  PRODUCT_GRID_COLUMNS,
  PRODUCT_GRID_SIZES,
} from "@/components/product/product-grid-columns";
import { useFavoriteProducts } from "@/components/product/catalog-provider";

/**
 * Favoriler listesi. Veri mevcut tek favori kaynağından (lib/favorites)
 * gelir; kart, hızlı görünüm ve ızgara kuralları mağazayla ortaktır.
 *
 * Kartlar `layout` + `exit` ile animasyonlu: kullanıcı kalbe tekrar bastığında
 * ürün aniden kaybolmaz, kalanlar yerine kayar.
 */
export function FavoritesBrowser() {
  // Katalog sırası korunur; favoriye eklenme sırası listeyi karıştırmasın.
  const products = useFavoriteProducts();
  const reduced = useReducedMotion();

  // Favori yoksa çarkın boş hali sayfanın boş durumu olarak görünür.
  if (products.length === 0) return <FavoritesWheel products={products} />;

  return (
    // QuickViewProvider kökte: ızgara, seçici ve arama sonuçları aynı paneli açar.
    <>
      <motion.div layout={!reduced} className={PRODUCT_GRID_COLUMNS}>
        <AnimatePresence mode="popLayout" initial={false}>
          {products.map((product) => (
            <motion.div
              key={product.id}
              layout={!reduced}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
            >
              <ProductCard product={product} sizes={PRODUCT_GRID_SIZES} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <div className="mt-16 sm:mt-20">
        <FavoritesWheel products={products} />
      </div>
    </>
  );
}

/** Başlığın altındaki sayaç — favori sayısı istemcide bilindiği için ayrı. */
export function FavoritesCount() {
  // Listeyle aynı kaynak: katalogda olmayan favori sayılmaz.
  const count = useFavoriteProducts().length;
  return (
    <p className="mt-5 micro text-foreground/45">
      {count === 0 ? "Henüz ürün yok" : `${count} ürün`}
    </p>
  );
}
