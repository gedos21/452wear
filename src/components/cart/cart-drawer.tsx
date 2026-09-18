"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { CartLine, UnavailableNotice } from "./cart-line";
import { useCartLines } from "@/components/product/catalog-provider";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { shippingFor } from "@/lib/shipping";

const DRAWER_SPRING = { type: "spring", stiffness: 260, damping: 32 } as const;

export function CartDrawer({ onClose }: { onClose: () => void }) {
  const reduced = useReducedMotion();
  const { setQty, remove } = useCart();
  // Görünen satırlar, adet ve tutar aynı çözülmüş listeden gelir.
  const { lines, unavailable, count, subtotal, currency } = useCartLines();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promo, setPromo] = useState("");
  const [promoNote, setPromoNote] = useState<string | null>(null);

  const shipping = shippingFor(subtotal);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[70] bg-foreground/25 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        aria-hidden
      />

      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Sepet"
        className={[
          "fixed z-[71] flex flex-col bg-background",
          // Mobil: tam ekran. Masaüstü: kenardan boşluklu, yüzen panel.
          "inset-0 sm:inset-y-3 sm:left-auto sm:right-3 sm:rounded-product",
          "sm:w-[80vw] sm:max-w-[520px] lg:w-[38vw] lg:max-w-[600px]",
          "shadow-[0_1px_2px_rgb(0_0_0/0.06),0_24px_60px_-30px_rgb(0_0_0/0.35)]",
        ].join(" ")}
        initial={reduced ? { opacity: 0 } : { x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={reduced ? { opacity: 0 } : { x: "100%", opacity: 0 }}
        transition={DRAWER_SPRING}
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-7 sm:px-8">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em]">
              SEPET
            </h2>
            <p className="mt-1.5 micro text-foreground/45">
              {count === 0 ? "Boş" : `${count} ürün`}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Sepeti kapat"
            className="grid size-9 shrink-0 place-items-center rounded-full text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.8} />
          </button>
        </header>

        {unavailable.length > 0 && (
          <UnavailableNotice
            count={unavailable.length}
            onRemove={() => unavailable.forEach((i) => remove(i.id))}
            className="mx-6 mt-5 border-b border-border/70 pb-4 sm:mx-8"
          />
        )}

        {lines.length === 0 ? (
          <EmptyCart onClose={onClose} />
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 sm:px-8">
              <motion.ul layout className="divide-y divide-border/70">
                <AnimatePresence initial={false}>
                  {lines.map(({ item, product }) => (
                    <CartLine
                      key={item.id}
                      item={item}
                      product={product}
                      onQtyChange={(qty) => setQty(item.id, qty)}
                      onRemove={() => remove(item.id)}
                    />
                  ))}
                </AnimatePresence>
              </motion.ul>
            </div>

            <footer className="shrink-0 border-t border-border/70 px-6 pb-7 pt-5 sm:px-8">
              {/* Promosyon kodu — tıklayınca açılan küçük alan */}
              <div className="pb-5">
                {!promoOpen ? (
                  <button
                    type="button"
                    onClick={() => setPromoOpen(true)}
                    className="micro text-foreground/45 transition-colors hover:text-foreground"
                  >
                    Promosyon Kodu
                  </button>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={promo}
                        onChange={(e) => setPromo(e.target.value)}
                        placeholder="Kodu gir"
                        aria-label="Promosyon kodu"
                        className="h-10 min-w-0 flex-1 rounded-full bg-muted px-4 text-[13px] outline-none placeholder:text-foreground/35 focus-visible:ring-1 focus-visible:ring-foreground/30"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPromoNote(
                            "Kodlar ödeme adımında kontrol edilecek.",
                          )
                        }
                        className="h-10 shrink-0 rounded-full bg-muted px-4 micro text-foreground/70 transition-colors hover:text-foreground"
                      >
                        Uygula
                      </button>
                    </div>
                    {promoNote && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {promoNote}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <dl className="space-y-2.5 border-t border-border/70 pt-5 text-sm">
                <Row label="Ara Toplam">
                  <AnimatedAmount value={formatPrice(subtotal, currency)} />
                </Row>
                <Row label="Kargo">
                  <span className="text-muted-foreground">
                    {shipping.free
                      ? "Ücretsiz"
                      : formatPrice(shipping.fee, currency)}
                  </span>
                </Row>
                {!shipping.free && (
                  <p className="pt-1 text-[11px] text-muted-foreground">
                    {formatPrice(shipping.remaining, currency)} daha ekle, kargo
                    ücretsiz olsun.
                  </p>
                )}
                <div className="flex items-baseline justify-between gap-4 border-t border-border/70 pt-4">
                  <dt className="micro">Toplam</dt>
                  <dd className="text-base font-medium">
                    <AnimatedAmount
                      value={formatPrice(subtotal + shipping.fee, currency)}
                    />
                  </dd>
                </div>
              </dl>

              <Link
                href="/odeme"
                onClick={onClose}
                className="mt-6 flex h-13 w-full items-center justify-center gap-2.5 rounded-full bg-foreground micro text-background transition-colors hover:bg-foreground/90"
              >
                Ödemeye Geç
                <ArrowRight className="size-4" strokeWidth={1.8} />
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full micro text-foreground/45 transition-colors hover:text-foreground"
              >
                Alışverişe Devam Et
              </button>
            </footer>
          </>
        )}
      </motion.aside>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="micro text-foreground/45">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/**
 * Tutar değişince sert atlamak yerine yumuşak geçiş yapar.
 *
 * Tek eleman kullanılıyor: değer değişince `key` sayesinde yeniden mount olup
 * giriş animasyonunu tekrar oynatıyor. AnimatePresence ile çıkış animasyonu
 * vermek hızlı adet değişimlerinde eski değerleri üst üste bindiriyordu.
 */
function AnimatedAmount({ value }: { value: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="inline-block tabular-nums"
    >
      {value}
    </motion.span>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <h3 className="font-display text-2xl font-extrabold tracking-[-0.02em]">
        SEPETİN BOŞ<span className="text-brand">.</span>
      </h3>
      <p className="mt-4 max-w-[16rem] text-sm text-muted-foreground">
        Henüz sepetine bir şey eklemedin.
      </p>
      <Link
        href="/magaza"
        onClick={onClose}
        className="mt-9 inline-flex h-12 items-center gap-2.5 rounded-full bg-foreground px-7 micro text-background transition-colors hover:bg-foreground/90"
      >
        Mağazaya Git
        <ArrowRight className="size-4" strokeWidth={1.8} />
      </Link>
    </div>
  );
}
