"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  PRODUCT_ASPECT,
  PRODUCT_SURFACE,
} from "@/components/product/product-surface";
import {
  useCartLines,
  useCatalog,
} from "@/components/product/catalog-provider";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { productNameParts } from "@/lib/product-filters";
import { complementaryFor } from "@/lib/recommendations";
import type { Product } from "@/types/product";

/** Ürünün stokta olan tek varyantı; birden fazlaysa null (beden seçtirilir). */
function tekVaryant(product: Product) {
  const stokta = product.variants.filter((v) => v.stock > 0);
  return stokta.length === 1 ? stokta[0] : null;
}

/**
 * Sepet çekmecesindeki tek öneri: sepetteki son ürünü tamamlayan bir parça.
 * Uygun öneri yoksa hiç çizilmez. Popup yok, sayaç yok, tek ürün.
 *
 * Tek varyantlı üründe doğrudan eklenir; beden/renk seçimi gerekiyorsa ürün
 * sayfasına götürür — sepete yanlış beden düşmesin.
 */
export function CartRecommendation({ onNavigate }: { onNavigate: () => void }) {
  const { products } = useCatalog();
  const { lines } = useCartLines();
  const { add } = useCart();
  const [eklendi, setEklendi] = useState(false);

  const sepettekiler = new Set(lines.map((l) => l.product.id));
  const son = lines[lines.length - 1]?.product;
  if (!son) return null;

  const oneri = complementaryFor(son, products, 3).find(
    (p) => !sepettekiler.has(p.id),
  );
  if (!oneri) return null;

  const { brand, model } = productNameParts(oneri);
  const variant = tekVaryant(oneri);

  return (
    <section className="mt-6 border-t border-border/70 pt-5 font-sf">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/45">
        Bu parçayla iyi gider
      </p>

      <div className="mt-3 flex items-center gap-3">
        <Link
          href={`/urun/${oneri.slug}`}
          onClick={onNavigate}
          className={`relative w-14 shrink-0 ${PRODUCT_SURFACE} ${PRODUCT_ASPECT}`}
        >
          <Image
            src={oneri.images[0].src}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        </Link>

        <div className="min-w-0 flex-1">
          {brand && (
            <p
              lang="en"
              className="text-[11px] font-extrabold uppercase leading-tight"
            >
              {brand}
            </p>
          )}
          <Link
            href={`/urun/${oneri.slug}`}
            onClick={onNavigate}
            className="block truncate text-[13px] font-medium text-foreground/85 transition-colors hover:text-foreground"
          >
            {model}
          </Link>
          <p className="mt-0.5 text-[13px] font-bold">
            {formatPrice(oneri.price, oneri.currency)}
          </p>
        </div>

        {variant ? (
          <button
            type="button"
            disabled={eklendi}
            onClick={() => {
              add({
                productId: oneri.id,
                size: variant.size,
                color: variant.color,
                price: oneri.price,
                currency: oneri.currency,
                max: variant.stock,
              });
              setEklendi(true);
            }}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-foreground/20 px-4 text-[12px] font-bold uppercase tracking-[0.04em] transition-colors hover:border-foreground/60 disabled:border-foreground/10 disabled:text-foreground/40"
          >
            {eklendi ? (
              "Eklendi"
            ) : (
              <>
                <Plus className="size-3.5" strokeWidth={2.4} />
                Ekle
              </>
            )}
          </button>
        ) : (
          <Link
            href={`/urun/${oneri.slug}`}
            onClick={onNavigate}
            className="inline-flex h-9 shrink-0 items-center rounded-full border border-foreground/20 px-4 text-[12px] font-bold uppercase tracking-[0.04em] transition-colors hover:border-foreground/60"
          >
            Seç
          </Link>
        )}
      </div>
    </section>
  );
}
