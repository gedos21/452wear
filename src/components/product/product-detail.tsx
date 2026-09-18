"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Heart } from "lucide-react";
import { Accordion } from "./accordion";
import { SizeGuide } from "./size-guide";
import { PRODUCT_ASPECT, PRODUCT_SURFACE } from "./product-surface";
import { productMediaLayoutId } from "./product-media-id";
import { useScrollLock } from "@/hooks/use-scroll-lock";
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
export const PANEL_SPRING = { type: "spring", stiffness: 240, damping: 30 } as const;

/**
 * Ürün detayının içeriği: galeri, renk/beden seçimi, sepete ekleme, favori ve
 * açılır bilgi bölümleri. Hızlı görünüm paneli ("panel") ve /urun sayfası
 * ("page") aynı bileşeni kullanır; yalnızca yerleşim sınıfları değişir.
 * Beden rehberinin nerede açılacağına çağıran taraf karar verir.
 */
export function ProductDetail({
  product,
  variant,
  onOpenGuide,
}: {
  product: Product;
  variant: "panel" | "page";
  onOpenGuide: () => void;
}) {
  const panel = variant === "panel";
  const Heading = panel ? "h2" : "h1";
  const reduced = useReducedMotion();
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();

  const [color, setColor] = useState(() => defaultColor(product));
  const [size, setSize] = useState<ProductSize | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const images = useMemo(() => imagesForColor(product, color), [product, color]);
  const sizes = useMemo(() => sizeAvailability(product, color), [product, color]);
  const categoryLabel =
    CATEGORIES.find((c) => c.slug === product.category)?.label ?? "";
  const favorite = isFavorite(product.id);
  const cover = images[Math.min(imageIndex, images.length - 1)];
  const shoe = product.category === "ayakkabi";

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
      setError(shoe ? "Lütfen bir numara seç." : "Lütfen bir beden seç.");
      return;
    }
    setError(null);
    const stok =
      product.variants.find((v) => v.size === size && v.color === color)
        ?.stock ?? 0;
    const eklenen = add({
      productId: product.id,
      size,
      color,
      price: product.price,
      currency: product.currency,
      max: stok,
    });
    if (eklenen === 0) {
      setError(
        `Sepetinde bu ${shoe ? "numaradan" : "bedenden"} zaten ${stok} adet var; stokta daha fazlası yok.`,
      );
      return;
    }
    setAdded(true);
  }

  return (
    <div
      className={
        panel
          ? "grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden"
          : "grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16"
      }
    >
      {/* Sol: görseller.
          Panelde yükseklik panelden gelir ve görsel kalan alana sığar —
          oranla (aspect) yükseklik vermek geniş panellerde görseli
          taşırıyordu. Mobilde ve sayfada 4:5 oran korunur. */}
      <div
        className={
          panel
            ? "flex min-w-0 flex-col p-4 sm:p-6 lg:h-full lg:min-h-0"
            : "min-w-0 lg:sticky lg:top-24 lg:self-start"
        }
      >
        <div
          className={
            panel
              ? "lg:flex lg:min-h-0 lg:flex-1 lg:items-center lg:justify-center"
              : undefined
          }
        >
          <motion.div
            layoutId={
              panel && !reduced ? productMediaLayoutId(product.id) : undefined
            }
            className={cn(
              "relative w-full",
              PRODUCT_SURFACE,
              PRODUCT_ASPECT,
              // Panelde ölçü yükseklikten gelir; oran korunur, fotoğraf
              // kırpılmaz, artan yer iki yana boşluk olur.
              panel && "lg:h-full lg:w-auto",
            )}
            transition={PANEL_SPRING}
          >
            <Image
              key={cover.src}
              src={cover.src}
              alt={cover.alt}
              fill
              priority
              sizes={
                panel
                  ? "(min-width: 1024px) 34vw, 92vw"
                  : "(min-width: 1024px) 45vw, 92vw"
              }
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
      <div
        className={
          panel
            ? "relative min-w-0 px-4 pb-8 sm:px-6 lg:overflow-y-auto lg:py-10 lg:pr-10"
            : "min-w-0"
        }
      >
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...PANEL_SPRING, delay: 0.08 }}
        >
          <p className="micro text-foreground/45">{categoryLabel}</p>

          <Heading
            className={
              panel
                ? "mt-3 font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl"
                : "mt-3 font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl"
            }
          >
            {product.name}
          </Heading>

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
              <p className="micro text-foreground/45">
                {shoe ? "Numara" : "Beden"}
              </p>
              <button
                type="button"
                onClick={onOpenGuide}
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
                      {!shoe && (
                        <p className="mt-2">
                          Model 1.85 m boyunda ve M beden giymektedir.
                        </p>
                      )}
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
                  content: shoe ? (
                    <>
                      <p>Nemli, yumuşak bir bezle silin.</p>
                      <p className="mt-2">
                        Doğrudan ısı kaynağında ya da güneş altında
                        kurutmayın.
                      </p>
                    </>
                  ) : (
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
  );
}

/**
 * /urun sayfasının etkileşimli bölümü: detay içeriği ve beden rehberi.
 * Sayfada panel olmadığı için rehber ekranın ortasında bir pencerede açılır.
 */
export function ProductPageDetail({ product }: { product: Product }) {
  const [guideOpen, setGuideOpen] = useState(false);

  useScrollLock(guideOpen);

  useEffect(() => {
    if (!guideOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGuideOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [guideOpen]);

  return (
    <>
      <ProductDetail
        product={product}
        variant="page"
        onOpenGuide={() => setGuideOpen(true)}
      />

      <AnimatePresence>
        {guideOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-foreground/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setGuideOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>
      <div className="pointer-events-none fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div
          className={cn(
            "relative h-[min(36rem,86vh)] w-full max-w-lg",
            guideOpen && "pointer-events-auto",
          )}
        >
          <SizeGuide
            open={guideOpen}
            category={product.category}
            onClose={() => setGuideOpen(false)}
          />
        </div>
      </div>
    </>
  );
}
