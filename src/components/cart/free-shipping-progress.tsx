"use client";

import { motion, useReducedMotion } from "motion/react";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, shippingFor } from "@/lib/shipping";
import type { Currency } from "@/types/product";

/**
 * Sepetin üstünde ücretsiz kargo çubuğu: eşiğe ne kadar kaldığını yazar ve
 * ara toplamla dolar. Eşik ve hesap kargo kuralından (lib/shipping) gelir.
 */
export function FreeShippingProgress({
  subtotal,
  currency,
  className,
}: {
  subtotal: number;
  currency: Currency;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const shipping = shippingFor(subtotal);
  const ratio = shipping.free
    ? 1
    : Math.min(subtotal / FREE_SHIPPING_THRESHOLD, 1);

  return (
    <div className={className}>
      <p className="font-sf text-[13px] leading-snug" role="status">
        {shipping.free ? (
          <span className="font-semibold">Kargon ücretsiz.</span>
        ) : (
          <>
            Ücretsiz kargoya{" "}
            <span className="font-bold tabular-nums">
              {formatPrice(shipping.remaining, currency)}
            </span>{" "}
            kaldı.
          </>
        )}
      </p>
      <div
        aria-hidden
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <motion.div
          className="h-full origin-left rounded-full bg-brand"
          initial={false}
          animate={{ scaleX: ratio }}
          transition={
            reduced ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
          }
        />
      </div>
    </div>
  );
}
