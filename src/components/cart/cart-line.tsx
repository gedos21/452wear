"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { PRODUCT_ASPECT, PRODUCT_SURFACE } from "@/components/product/product-surface";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/lib/cart";
import type { Product } from "@/types/product";

/** Sepetteki tek satır. Ürün bulunamazsa (katalogdan kalkmışsa) çizilmez. */
export function CartLine({
  item,
  product,
  onQtyChange,
  onRemove,
}: {
  item: CartItem;
  product: Product;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
}) {
  const image = product.images[0];

  // Bu varyantın stoğu miktarın üst sınırı.
  const stock = product.variants.find(
    (v) => v.size === item.size && v.color === item.color,
  )?.stock;
  const max = stock ?? Infinity;
  const atMax = item.qty >= max;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24, height: 0, marginTop: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="flex gap-4 overflow-hidden py-6"
    >
      <div className={cn("w-20 shrink-0", PRODUCT_SURFACE, PRODUCT_ASPECT, "relative")}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-medium leading-snug">{product.name}</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {item.color} / {item.size}
            </p>
          </div>
          <span className="shrink-0 text-sm font-medium">
            {formatPrice(product.price * item.qty, product.currency)}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="flex items-center gap-1">
            <QtyButton
              label="Adet azalt"
              disabled={item.qty <= 1}
              onClick={() => onQtyChange(item.qty - 1)}
            >
              <Minus className="size-3.5" strokeWidth={2} />
            </QtyButton>

            <span className="w-7 text-center text-[13px] tabular-nums">
              {item.qty}
            </span>

            <QtyButton
              label="Adet artır"
              disabled={atMax}
              onClick={() => onQtyChange(item.qty + 1)}
            >
              <Plus className="size-3.5" strokeWidth={2} />
            </QtyButton>
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="micro text-foreground/45 transition-colors hover:text-foreground"
          >
            Kaldır
          </button>
        </div>

        {atMax && stock !== undefined && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Bu bedende son {stock} adet.
          </p>
        )}
      </div>
    </motion.li>
  );
}

/**
 * Katalogdan kalkmış, artık sunulmayan ya da tükenmiş renk/bedendeki satırlar
 * için tek satırlık uyarı. Bu satırlar adede ve tutara girmez; buradan
 * sepetten çıkarılır.
 */
export function UnavailableNotice({
  count,
  onRemove,
  className,
}: {
  count: number;
  onRemove: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 text-[12px] text-muted-foreground",
        className,
      )}
    >
      <span>{count} ürün tükendi ya da artık satışta değil.</span>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 micro text-foreground/45 transition-colors hover:text-foreground"
      >
        Sepetten çıkar
      </button>
    </div>
  );
}

function QtyButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-full transition-colors",
        disabled
          ? "cursor-not-allowed text-foreground/25"
          : "text-foreground/70 hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
