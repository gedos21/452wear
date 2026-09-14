"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Heart, X } from "lucide-react";
import { Accordion } from "./accordion";
import { SizeGuide } from "./size-guide";
import { PRODUCT_ASPECT, PRODUCT_SURFACE } from "./product-surface";
import { productMediaLayoutId } from "./product-media-id";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { formatPrice } from "@/lib/format";
import {
  colorInStock,
  defaultColor,
  imagesForColor,
  sizeAvailability,
} from "@/lib/product-variants";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/data/products";
import type { Product, ProductSize } from "@/types/product";

/** Sakin, "pop" yapmayan geçiş. */
const PANEL_SPRING = { type: "spring", stiffness: 240, damping: 30 } as const;

export function ProductDetailPanel({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();

  const [color, setColor] = useState(() => defaultColor(product));
  const [size, setSize] = useState<ProductSize | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const images = useMemo(() => imagesForColor(product, color), [product, color]);
  const sizes = useMemo(() => sizeAvailability(product, color), [product, color]);
  const categoryLabel =
    CATEGORIES.find((c) => c.slug === product.category)?.label ?? "";
  const favorite = isFavorite(product.id);
  const cover = images[Math.min(imageIndex, images.length - 1)];

  // ESC ile kapat + açılışta odağı panele al
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (guideOpen) setGuideOpen(false);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [guideOpen, onClose]);

  /**
   * Renk değişimi: galeri başa döner, seçili beden yeni renkte yoksa düşer.
   * Efektle senkronlamak yerine olayın kendisinde türetiliyor.
   */
  function selectColor(next: string) {
    setColor(next);
    setImageIndex(0);
    setError(null);
    setSize((current) =>
      current &&
      sizeAvailability(product, next).some(
        (s) => s.size === current && s.inStock,
      )
        ? current
        : null,
    );
  }

  // "Sepete eklendi" geri bildirimi kendiliğinden söner.
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2200);
    return () => clearTimeout(t);
  }, [added]);

  function handleAdd() {
    if (!size) {
      setError("Lütfen bir beden seç.");
      return;
    }
    setError(null);
    add({
      productId: product.id,
      size,
      color,
      price: product.price,
      currency: product.currency,
    });
    setAdded(true);
  }

  return (
    <>
      {/* Arka plan — dışına tıklayınca kapanır */}
      <motion.div
        className="fixed inset-0 z-[60] bg-foreground/25 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        aria-hidden
      />

      <div className="pointer-events-none fixed inset-0 z-[61] flex items-end justify-center sm:items-center sm:p-6">
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
          className={cn(
            "pointer-events-auto relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-background",
            "rounded-t-product sm:max-h-[86vh] sm:w-[90vw] sm:max-w-6xl sm:rounded-product",
            // Üst sınır: 4:5 görselin genişliği sol kolonu aşmasın diye.
            "lg:max-h-[min(86vh,780px)]",
            "shadow-[0_1px_2px_rgb(0_0_0/0.06),0_24px_60px_-30px_rgb(0_0_0/0.35)]",
          )}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={PANEL_SPRING}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full bg-background/85 text-foreground/60 backdrop-blur-sm transition-colors hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.8} />
          </button>

          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
            {/* Sol: görseller.
                Masaüstünde yükseklik panelden gelir ve görsel kalan alana
                sığar — oranla (aspect) yükseklik vermek geniş panellerde
                görseli taşırıyordu. Mobilde ise 4:5 oran korunur. */}
            <div className="flex min-w-0 flex-col p-4 sm:p-6 lg:h-full lg:min-h-0">
              <div className="lg:flex lg:min-h-0 lg:flex-1 lg:items-center lg:justify-center">
                <motion.div
                  layoutId={reduced ? undefined : productMediaLayoutId(product.id)}
                  className={cn(
                    "relative w-full",
                    PRODUCT_SURFACE,
                    PRODUCT_ASPECT,
                    // Masaüstünde ölçü yükseklikten gelir; oran korunur,
                    // fotoğraf kırpılmaz, artan yer iki yana boşluk olur.
                    "lg:h-full lg:w-auto",
                  )}
                  transition={PANEL_SPRING}
                >
                  <Image
                    key={cover.src}
                    src={cover.src}
                    alt={cover.alt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 34vw, 92vw"
                    className="object-cover"
                  />
                </motion.div>
              </div>

              {images.length > 1 && (
                <div className="mt-3 flex shrink-0 gap-3 lg:justify-center">
                  {images.map((image, i) => (
                    <button
                      key={image.src}
                      type="button"
                      onClick={() => setImageIndex(i)}
                      aria-label={`${i + 1}. görsel`}
                      aria-current={i === imageIndex}
                      className={cn(
                        "relative w-16 shrink-0 overflow-hidden rounded-product ring-1 transition-[box-shadow]",
                        PRODUCT_ASPECT,
                        i === imageIndex
                          ? "ring-2 ring-foreground"
                          : "ring-foreground/15 hover:ring-foreground/40",
                      )}
                    >
                      <Image
                        src={image.src}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sağ: bilgi ve aksiyonlar */}
            <div className="relative min-w-0 px-4 pb-8 sm:px-6 lg:overflow-y-auto lg:py-10 lg:pr-10">
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...PANEL_SPRING, delay: 0.08 }}
              >
                <p className="micro text-foreground/45">{categoryLabel}</p>

                <h2 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
                  {product.name}
                </h2>

                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className="text-lg font-medium">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.compareAtPrice, product.currency)}
                    </span>
                  )}
                </div>

                {/* Renk */}
                <div className="mt-8">
                  <p className="micro text-foreground/45">
                    Renk — <span className="text-foreground/70">{color}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {product.colors.map((c) => {
                      const active = c.name === color;
                      const available = colorInStock(product, c.name);
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => selectColor(c.name)}
                          aria-pressed={active}
                          title={c.name}
                          className={cn(
                            "size-6 rounded-full ring-1 transition-[box-shadow]",
                            active
                              ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                              : "ring-foreground/15 hover:ring-foreground/40",
                            !available && "opacity-40",
                          )}
                          style={{ backgroundColor: c.hex }}
                        >
                          <span className="sr-only">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Beden */}
                <div className="mt-8">
                  <div className="flex items-center justify-between gap-4">
                    <p className="micro text-foreground/45">Beden</p>
                    <button
                      type="button"
                      onClick={() => setGuideOpen(true)}
                      className="micro text-foreground/60 underline underline-offset-4 transition-colors hover:text-foreground"
                    >
                      Beden Rehberi
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {sizes.map(({ size: s, inStock }) => {
                      const active = s === size;
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={!inStock}
                          onClick={() => {
                            setSize(s);
                            setError(null);
                          }}
                          aria-pressed={active}
                          className={cn(
                            "h-10 min-w-12 rounded-full px-3 text-[13px] transition-colors",
                            active
                              ? "bg-foreground text-background"
                              : "bg-muted text-foreground/75 hover:text-foreground",
                            !inStock &&
                              "cursor-not-allowed bg-transparent text-foreground/25 line-through ring-1 ring-border hover:text-foreground/25",
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>

                  {error && (
                    <p className="mt-3 text-[13px] text-brand" role="alert">
                      {error}
                    </p>
                  )}
                </div>

                {/* Aksiyonlar */}
                <div className="mt-8 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="group inline-flex h-13 flex-1 items-center justify-center gap-2.5 rounded-full bg-foreground px-7 micro text-background transition-colors hover:bg-foreground/90"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {added ? (
                        <motion.span
                          key="added"
                          className="inline-flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Check className="size-4" strokeWidth={2} />
                          Sepete Eklendi
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          className="inline-flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          Sepete Ekle
                          <ArrowRight className="size-4" strokeWidth={1.8} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggle(product.id)}
                    aria-pressed={favorite}
                    aria-label={
                      favorite
                        ? `${product.name} favorilerden çıkar`
                        : `${product.name} favorilere ekle`
                    }
                    className={cn(
                      "grid size-13 shrink-0 place-items-center rounded-full border transition-colors",
                      favorite
                        ? "border-brand/40 text-brand"
                        : "border-foreground/20 text-foreground/60 hover:border-foreground/50 hover:text-foreground",
                    )}
                  >
                    <Heart
                      className="size-4.5"
                      strokeWidth={1.8}
                      fill={favorite ? "currentColor" : "none"}
                    />
                  </button>
                </div>

                <div className="mt-10">
                  <Accordion
                    items={[
                      {
                        title: "Ürün Detayları",
                        content: (
                          <>
                            <p>{product.description}</p>
                            <p className="mt-2">
                              Model 1.85 m boyunda ve M beden giymektedir.
                            </p>
                          </>
                        ),
                      },
                      {
                        title: "Teslimat & İade",
                        content: (
                          <>
                            <p>1–3 iş günü içinde kargoya verilir.</p>
                            <p className="mt-2">
                              1.500 ₺ üzeri siparişlerde kargo ücretsiz. 14 gün
                              içinde koşulsuz iade.
                            </p>
                          </>
                        ),
                      },
                      {
                        title: "Bakım",
                        content: (
                          <>
                            <p>30°C&apos;de tersten yıkayın.</p>
                            <p className="mt-2">
                              Çamaşır suyu kullanmayın, baskı üzerine ütü
                              yapmayın, kurutma makinesinde kurutmayın.
                            </p>
                          </>
                        ),
                      },
                    ]}
                  />
                </div>
              </motion.div>
            </div>
          </div>

          <SizeGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
        </motion.div>
      </div>
    </>
  );
}
