"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const value = useMemo(
    () => ({ products, byId: new Map(products.map((p) => [p.id, p])) }),
    [products],
  );

  // Geliştirmede admin başka sekmede ürün eklerken açık vitrin sekmesi eski
  // kataloğu tutmasın: sekmeye dönülünce sunucu verisi tazelenir. Production'da
  // katalog yalnızca yeni sürümle değiştiği için gerekmez.
  //
  // Tazeleme, sekme en az 1 sn görünür KALIRSA yapılır. Bazı ortamlar arka
  // plandaki sekmeyi milisaniyelik "görünür" anlarla yoklar (sekme önizlemesi,
  // küçük resim yakalama); her birinde tazelemek sunucuya istek yağdırıyordu.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onChange = () => {
      clearTimeout(timer);
      if (document.visibilityState !== "visible") return;
      timer = setTimeout(() => {
        if (document.visibilityState === "visible") router.refresh();
      }, 1000);
    };
    document.addEventListener("visibilitychange", onChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onChange);
    };
  }, [router]);

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
 * Tutar katalogdaki GÜNCEL fiyattan hesaplanır; ürün panelinde görülen fiyat
 * ile sepetteki fiyat hep aynıdır.
 *
 * Katalogda olmayan ürünün ya da ürünün artık sunmadığı renk/beden
 * kombinasyonunun satırı `lines`'a girmez; adede ve tutara da eklenmez.
 * Bunlar `unavailable` olarak ayrıca döner ki kullanıcı görüp sepetten
 * çıkarabilsin. Otomatik SİLİNMEZ: açık kalmış bir sekmenin eski kataloğu,
 * sonradan eklenmiş geçerli bir ürünü yanlışlıkla düşürmesin.
 */
export function useCartLines() {
  const { items } = useCart();
  const { byId } = useCatalog();

  return useMemo(() => {
    const lines: ResolvedCartLine[] = [];
    const unavailable: CartItem[] = [];
    for (const item of items) {
      const product = byId.get(item.productId);
      const hasVariant = product?.variants.some(
        (v) => v.size === item.size && v.color === item.color,
      );
      if (product && hasVariant) lines.push({ item, product });
      else unavailable.push(item);
    }
    const currency: Currency = lines[0]?.product.currency ?? "TRY";
    return {
      lines,
      unavailable,
      count: lines.reduce((total, l) => total + l.item.qty, 0),
      subtotal: lines.reduce(
        (total, l) => total + l.product.price * l.item.qty,
        0,
      ),
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
