"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { LuckyPicker } from "./lucky-picker";
import { ProductCard } from "@/components/product/product-card";
import {
  PRODUCT_GRID_COLUMNS,
  PRODUCT_GRID_SIZES,
} from "@/components/product/product-grid-columns";
import { useFavorites } from "@/lib/favorites";
import { PRODUCTS } from "@/data/products";

/**
 * Favoriler listesi. Veri mevcut tek favori kaynağından (lib/favorites)
 * gelir; kart, hızlı görünüm ve ızgara kuralları mağazayla ortaktır.
 *
 * Kartlar `layout` + `exit` ile animasyonlu: kullanıcı kalbe tekrar bastığında
 * ürün aniden kaybolmaz, kalanlar yerine kayar.
 */
export function FavoritesBrowser() {
  const { ids } = useFavorites();
  const reduced = useReducedMotion();

  // Katalog sırası korunur; favoriye eklenme sırası listeyi karıştırmasın.
  const products = useMemo(
    () => PRODUCTS.filter((p) => ids.includes(p.id)),
    [ids],
  );

  if (products.length === 0) return <EmptyFavorites />;

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
        <LuckyPicker products={products} />
      </div>
    </>
  );
}

function EmptyFavorites() {
  return (
    <div className="py-16 sm:py-24">
      <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
        FAVORİLERİN BOŞ<span className="text-brand">.</span>
      </h2>
      <p className="mt-4 max-w-xs text-sm text-muted-foreground">
        Beğendiğin ürünleri burada saklayabilirsin.
      </p>
      <Link
        href="/magaza"
        className="mt-9 inline-flex h-12 items-center gap-2.5 rounded-full bg-foreground px-7 micro text-background transition-colors hover:bg-foreground/90"
      >
        Mağazaya Git
        <ArrowRight className="size-4" strokeWidth={1.8} />
      </Link>
    </div>
  );
}

/** Başlığın altındaki sayaç — favori sayısı istemcide bilindiği için ayrı. */
export function FavoritesCount() {
  const { count } = useFavorites();
  return (
    <p className="mt-5 micro text-foreground/45">
      {count === 0 ? "Henüz ürün yok" : `${count} ürün`}
    </p>
  );
}
