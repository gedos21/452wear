"use client";

import { useMemo } from "react";
import { Table } from "./prose";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { shippingFor } from "@/lib/shipping";
import { PRODUCTS } from "@/data/products";

/**
 * Ön Bilgilendirme Formundaki ürün/fiyat tablosu. Veriyi mevcut sepetten
 * alır — sabit ürün veya fiyat yazılmaz. Sepet boşsa yapı anlatılır.
 */
export function OrderSummaryTable() {
  const { items, subtotal } = useCart();
  const catalog = useMemo(() => new Map(PRODUCTS.map((p) => [p.id, p])), []);
  const currency = items[0]?.currency ?? "TRY";
  const shipping = shippingFor(subtotal);

  if (items.length === 0) {
    return (
      <div className="rounded-product bg-muted px-5 py-4">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Sepetin şu anda boş. Sipariş verirken bu bölümde ürün adı, adedi,
          birim fiyatı, kargo ücreti ve toplam tutar yer alır.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Table
        head={["Ürün", "Adet", "Birim Fiyat", "Ara Toplam"]}
        rows={items.map((item) => {
          const product = catalog.get(item.productId);
          return [
            `${product?.name ?? item.productId} · ${item.color} / ${item.size}`,
            String(item.qty),
            formatPrice(item.price, item.currency),
            formatPrice(item.price * item.qty, item.currency),
          ];
        })}
      />

      <dl className="space-y-2 text-[13px]">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Ara toplam</dt>
          <dd>{formatPrice(subtotal, currency)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Kargo</dt>
          <dd className="text-muted-foreground">
            {shipping.free ? "Ücretsiz" : "Ödeme adımında hesaplanır"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
