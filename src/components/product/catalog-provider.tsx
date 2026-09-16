"use client";

import { createContext, useContext, useMemo } from "react";
import { useCart, type CartItem } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import type { Currency, Product } from "@/types/product";

/**
 * İstemci tarafındaki TEK ürün kaynağı.
 *
 * Kök layout canlı kataloğu (tohum + data/catalog.json, bkz. lib/catalog-store)
 * sunucuda bir kez okuyup buraya verir. Sepet, ödeme özeti, favoriler ve arama
 * ürünü buradan çözer. `@/data/products` içindeki tohum listeyi doğrudan
 * okumak admin'den eklenen ürünleri kaçırır.
 */

type CatalogValue = {
  products: Product[];
  byId: ReadonlyMap<string, Product>;
};

const CatalogContext = createContext<CatalogValue | null>(null);

export function CatalogProvider({
  products,
  children,
}: {
  products: Product[];
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ products, byId: new Map(products.map((p) => [p.id, p])) }),
    [products],
  );
  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog, CatalogProvider içinde kullanılmalı.");
  return ctx;
}

export type ResolvedCartLine = { item: CartItem; product: Product };

/**
 * Sepet satırlarını katalogla eşleştirir.
 *
 * Katalogda olmayan ürünün ya da ürünün artık sunmadığı renk/beden
 * kombinasyonunun satırı gösterilmez; adede ve tutara da girmez. Ekranda
 * görünen satırlar ile hesaplanan tutar her zaman aynı listeden türer.
 *
 * Satır depodan SİLİNMEZ: açık kalmış bir sekmenin eski kataloğu, sonradan
 * eklenmiş geçerli bir ürünü yanlışlıkla düşürmesin.
 */
export function useCartLines() {
  const { items } = useCart();
  const { byId } = useCatalog();

  return useMemo(() => {
    const lines: ResolvedCartLine[] = [];
    for (const item of items) {
      const product = byId.get(item.productId);
      const hasVariant = product?.variants.some(
        (v) => v.size === item.size && v.color === item.color,
      );
      if (product && hasVariant) lines.push({ item, product });
    }
    const currency: Currency = lines[0]?.item.currency ?? "TRY";
    return {
      lines,
      count: lines.reduce((total, l) => total + l.item.qty, 0),
      subtotal: lines.reduce((total, l) => total + l.item.price * l.item.qty, 0),
      currency,
    };
  }, [items, byId]);
}

/** Favori ürünler, katalog sırasıyla. Katalogda olmayan id sayılmaz. */
export function useFavoriteProducts() {
  const { ids } = useFavorites();
  const { products } = useCatalog();
  return useMemo(
    () => products.filter((p) => ids.includes(p.id)),
    [products, ids],
  );
}
