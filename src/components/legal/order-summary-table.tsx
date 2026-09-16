"use client";

import { Table } from "./prose";
import { useCartLines } from "@/components/product/catalog-provider";
import { formatPrice } from "@/lib/format";
import { shippingFor } from "@/lib/shipping";

/**
 * Ön Bilgilendirme Formundaki ürün/fiyat tablosu. Veriyi mevcut sepetten
 * alır — sabit ürün veya fiyat yazılmaz. Sepet boşsa yapı anlatılır.
 */
export function OrderSummaryTable() {
  const { lines, subtotal, currency } = useCartLines();
  const shipping = shippingFor(subtotal);

  if (lines.length === 0) {
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
        rows={lines.map(({ item, product }) => {
          return [
            `${product.name} · ${item.color} / ${item.size}`,
            String(item.qty),
            formatPrice(product.price, product.currency),
            formatPrice(product.price * item.qty, product.currency),
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
