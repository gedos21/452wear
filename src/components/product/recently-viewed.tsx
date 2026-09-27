"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { HOME_WIDTH } from "@/components/home/home-layout";
import { useCatalog } from "./catalog-provider";
import { ProductCard } from "./product-card";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import type { Product } from "@/types/product";

/** Gösterilen en fazla ürün (masaüstünde tek sıra). */
const SHOW = 4;

/**
 * Son baktığı ürünler: kayıttaki id'ler canlı katalogdan çözülür; katalogdan
 * kalkmış ürünler atlanır. Tükenen ürünler de gösterilir, kart zaten
 * "Tükendi" diyor ve ürün sayfasında "Gelince haber ver" var.
 */
function useRecentProducts(excludeId?: string): Product[] {
  const { ids } = useRecentlyViewed();
  const { byId } = useCatalog();
  return useMemo(
    () =>
      ids
        .filter((id) => id !== excludeId)
        .map((id) => byId.get(id))
        .filter((p): p is Product => p !== undefined)
        .slice(0, SHOW),
    [ids, byId, excludeId],
  );
}

function Grid({ products }: { products: Product[] }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:mt-7 sm:gap-x-5 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          sizes="(min-width: 1024px) 23vw, 45vw"
        />
      ))}
    </div>
  );
}

/**
 * Ürün sayfası: bakılan ürünü listeye kaydeder ve (kendisi hariç) daha önce
 * bakılanları gösterir. İlk ziyarette liste boş, bölüm çizilmez.
 */
export function RecentlyViewedOnProduct({ productId }: { productId: string }) {
  const { record } = useRecentlyViewed();
  useEffect(() => record(productId), [record, productId]);

  const products = useRecentProducts(productId);
  if (products.length === 0) return null;

  return (
    <section className="mt-20 sm:mt-24">
      <div className="font-sf">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.08em]">
          Son baktıkların
        </h2>
        <p className="mt-2 text-[15px] text-foreground/55">
          Kaldığın yerden devam et.
        </p>
      </div>
      <Grid products={products} />
    </section>
  );
}

/** Ana sayfa: Çok Satanlar ile aynı başlık düzeni. Boşsa çizilmez. */
export function RecentlyViewedOnHome() {
  const products = useRecentProducts();
  if (products.length === 0) return null;

  return (
    <section className="pb-12 sm:pb-14">
      <Container className={HOME_WIDTH}>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <h2 className="whitespace-nowrap font-sf text-[24px] font-bold uppercase leading-none tracking-[-0.01em] sm:text-[32px]">
            Son Baktıkların
          </h2>
          <Link
            href="/favoriler"
            className="shrink-0 pb-0.5 font-sf text-[13px] font-bold uppercase tracking-[0.04em] transition-colors hover:text-brand"
          >
            Favorilerin →
          </Link>
        </div>
        <Grid products={products} />
      </Container>
    </section>
  );
}
