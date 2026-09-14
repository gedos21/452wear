"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { shippingFor } from "@/lib/shipping";
import { PRODUCTS } from "@/data/products";

/** Sepet özeti. Sepetle aynı tek kaynaktan okur. */
export function CheckoutSummary() {
  const { items, subtotal, count } = useCart();
  const catalog = useMemo(() => new Map(PRODUCTS.map((p) => [p.id, p])), []);
  const currency = items[0]?.currency ?? "TRY";
  const shipping = shippingFor(subtotal);

  if (count === 0) {
    return (
      <div>
        <p className="text-muted-foreground">Sepetin boş.</p>
        <Link
          href="/magaza"
          className="mt-8 inline-flex h-12 items-center gap-2.5 rounded-full bg-foreground px-7 micro text-background transition-colors hover:bg-foreground/90"
        >
          Mağazaya Git
          <ArrowRight className="size-4" strokeWidth={1.8} />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-border/70 border-y border-border/70">
        {items.map((item) => {
          const product = catalog.get(item.productId);
          if (!product) return null;
          return (
            <li key={item.id} className="flex items-start justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{product.name}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {item.color} / {item.size} · {item.qty} adet
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium">
                {formatPrice(item.price * item.qty, item.currency)}
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="mt-6 space-y-2.5 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="micro text-foreground/45">Ara Toplam</dt>
          <dd>{formatPrice(subtotal, currency)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="micro text-foreground/45">Kargo</dt>
          <dd className="text-muted-foreground">
            {shipping.free ? "Ücretsiz" : "Ödeme adımında"}
          </dd>
        </div>
      </dl>

      <p className="mt-10 text-[13px] leading-relaxed text-muted-foreground">
        Ödeme altyapısı henüz bağlı değil. Bu adım şimdilik yalnızca sipariş
        özetini gösteriyor.
      </p>
    </div>
  );
}
