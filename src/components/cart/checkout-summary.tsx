"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { UnavailableNotice } from "./cart-line";
import { useCartLines } from "@/components/product/catalog-provider";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { shippingFor } from "@/lib/shipping";

/** Sepet özeti. Sepet çekmecesiyle aynı çözülmüş satırlardan okur. */
export function CheckoutSummary() {
  const { remove } = useCart();
  const { lines, unavailable, subtotal, count, currency } = useCartLines();
  const shipping = shippingFor(subtotal);

  const notice = unavailable.length > 0 && (
    <UnavailableNotice
      count={unavailable.length}
      onRemove={() => unavailable.forEach((i) => remove(i.id))}
      className="mb-6"
    />
  );

  if (count === 0) {
    return (
      <div>
        {notice}
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
      {notice}
      <ul className="divide-y divide-border/70 border-y border-border/70">
        {lines.map(({ item, product }) => {
          return (
            <li key={item.id} className="flex items-start justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{product.name}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {item.color} / {item.size} · {item.qty} adet
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium">
                {formatPrice(product.price * item.qty, product.currency)}
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
            {shipping.free ? "Ücretsiz" : formatPrice(shipping.fee, currency)}
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
