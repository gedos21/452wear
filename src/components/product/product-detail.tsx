"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Check,
  Heart,
  RotateCcw,
  Timer,
  Truck,
} from "lucide-react";
import { Accordion } from "./accordion";
import { SizeGuide } from "./size-guide";
import { PRODUCT_ASPECT, PRODUCT_SURFACE } from "./product-surface";
import { productMediaLayoutId } from "./product-media-id";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { useFinePointer } from "@/hooks/use-fine-pointer";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { formatPrice } from "@/lib/format";
import {
  colorInStock,
  defaultColor,
  imagesForColor,
  sizeAvailability,
} from "@/lib/product-variants";
import { discountPercent, productNameParts } from "@/lib/product-filters";
import { cn } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import type { Product, ProductSize } from "@/types/product";

/** Masaüstünde büyük görselin üzerine gelince uygulanan büyütme (panel ve sayfa). */
const HOVER_ZOOM = 1.9;

/**
 * Giyim ürünlerinde "Ürün Detayları"nın altındaki manken bilgisi. Şimdilik
 * tüm ürünlerde aynı. Ürün bazlı olacağı zaman: Product'a opsiyonel bir alan
 * (ör. `modelInfo?: string`) eklenip burada `product.modelInfo ?? MODEL_BILGISI`
 * kullanılır; admin kaydında (urunKaydet) bu alanın korunması unutulmamalı.
 */
const MODEL_BILGISI = "Model 1.85 m boyunda ve M beden giymektedir.";

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
  // Varsayılan beden: yalnızca seçili renkte tek bir stoklu seçenek varsa o
  // seçili gelir (görünür şekilde). Birden fazlaysa kullanıcı seçer; fark
  // etmeden yanlış varyant sepete girmesin.
  const [size, setSize] = useState<ProductSize | null>(() =>
    onlyInStockSize(product, defaultColor(product)),
  );
  const [imageIndex, setImageIndex] = useState(0);

  // Hover zoom: panelde ve ürün sayfasında, yalnızca fare gibi hassas bir
  // imleç varken; dokunmatikte hover olmadığı için hiç devreye girmez. Her
  // fare hareketinde React render'ı olmasın diye stil doğrudan öğeye yazılır.
  const fine = useFinePointer();
  const zoomEnabled = fine;
  const zoomRef = useRef<HTMLDivElement>(null);
  const zoomFollow = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = zoomRef.current;
    if (!el?.parentElement || e.pointerType !== "mouse") return;
    // Ölçü büyümeyen çerçeveden alınır; büyümüş öğenin kutusu 1.9x ve
    // kaymış olduğundan oran yanlış çıkardı.
    const r = el.parentElement.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.transformOrigin = `${x}% ${y}%`;
  };
  const zoomIn = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !zoomRef.current) return;
    zoomFollow(e);
    zoomRef.current.style.transform = `scale(${HOVER_ZOOM})`;
  };
  const zoomOut = () => {
    if (zoomRef.current) zoomRef.current.style.transform = "";
  };
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Aynı tıklama döngüsünde ikinci ekleme olmasın (çift tık).
  const adding = useRef(false);

  const images = useMemo(
    () => imagesForColor(product, color),
    [product, color],
  );
  const sizes = useMemo(
    () => sizeAvailability(product, color),
    [product, color],
  );
  const favorite = isFavorite(product.id);
  const cover = images[Math.min(imageIndex, images.length - 1)];
  const shoe = product.category === "ayakkabi";
  const nameParts = productNameParts(product);
  const discount = discountPercent(product);
  const soldOut = !product.variants.some((v) => v.stock > 0);
  const colorSoldOut = !soldOut && !colorInStock(product, color);

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
        : onlyInStockSize(product, next),
    );
  }

  // "Sepete eklendi" geri bildirimi kendiliğinden söner.
  useEffect(() => {
    if (!added) return;
    // Kilit, "Sepete Eklendi" bildirimi bitene kadar kapalı kalır: bu sürede
    // gelen tıklar (çift tık dahil) ikinci kez eklemez.
    const t = setTimeout(() => {
      adding.current = false;
      setAdded(false);
    }, 2200);
    return () => clearTimeout(t);
  }, [added]);

  function handleAdd() {
    // Başarı bildirimi sürerken ya da aynı anda gelen ikinci tık yok sayılır.
    if (added || adding.current) return;
    // Seçili renkte hiç stok yoksa bütün bedenler kapalıdır; "beden seç"
    // demek seçilemeyen bir şeyi istemek olurdu.
    // Tükenen renk/ürün mesajı zaten seçimin altında görünüyor; tekrar
    // yazdırılmaz.
    if (!sizes.some((s) => s.inStock)) return;
    if (!size) {
      setError(shoe ? "Lütfen bir numara seç." : "Lütfen bir beden seç.");
      return;
    }
    setError(null);
    adding.current = true;
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
      adding.current = false;
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
          : // Sayfada görsel ana odak: geniş kolon (yaklaşık 7:5).
            "grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14"
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
            {/* Masaüstü hover zoom (panel ve sayfa, gerçek imleçte): görsel
                ~1.9x büyür, odak noktası imleci izler. Yüzeyin
                overflow-hidden'ı büyüyen görseli kırpar. */}
            <div
              ref={zoomRef}
              className={cn(
                "absolute inset-0 transition-transform duration-300 ease-out",
                zoomEnabled && "cursor-zoom-in",
              )}
              onPointerEnter={zoomEnabled ? zoomIn : undefined}
              onPointerMove={zoomEnabled ? zoomFollow : undefined}
              onPointerLeave={zoomEnabled ? zoomOut : undefined}
            >
              <Image
                key={cover.src}
                src={cover.src}
                alt={cover.alt}
                fill
                priority
                // Zoom'da (1.9x) da net kalsın diye görünenin ~2 katı çözünürlük;
                // panelde ve sayfada görsel ~35vw, büyüyünce ~68vw.
                sizes="(min-width: 1024px) 68vw, 92vw"
                className="object-cover"
              />
            </div>
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
          {/* Marka (güçlü) → model (sakin): listeleme kartıyla aynı dil. */}
          {nameParts.brand && (
            <p
              lang="en"
              className="font-sf text-[15px] font-extrabold uppercase leading-tight tracking-[0.01em] sm:text-base"
            >
              {nameParts.brand}
            </p>
          )}
          <Heading
            className={cn(
              "font-sf font-medium leading-tight tracking-[-0.015em] text-foreground/90",
              nameParts.brand && "mt-1",
              panel ? "text-[22px] sm:text-2xl" : "text-[26px] sm:text-[30px]",
            )}
          >
            {nameParts.model}
          </Heading>

          {/* Fiyat: güncel fiyat en güçlü öğe; indirimde eski fiyat ve
              gerçek fiyatlardan hesaplanan yüzde. */}
          <div className="mt-5 font-sf">
            <p className="text-[28px] font-black leading-none tracking-[-0.02em] sm:text-[32px]">
              {formatPrice(product.price, product.currency)}
            </p>
            {discount !== null && (
              <div className="mt-2 flex items-center gap-2.5">
                <span className="text-[15px] font-medium text-foreground/45 line-through">
                  {formatPrice(product.compareAtPrice!, product.currency)}
                </span>
                <span className="rounded-sm bg-brand px-2 py-1 text-[11px] font-bold uppercase leading-none tracking-[0.04em] text-white">
                  %{discount} İndirim
                </span>
              </div>
            )}
            {soldOut && (
              <p className="mt-3 text-[14px] font-semibold" role="status">
                Bu ürün tükendi.
              </p>
            )}
          </div>

          {/* Renk */}
          <div className="mt-8 font-sf">
            <p className="text-[13px] font-bold uppercase tracking-[0.04em]">
              Renk{" "}
              <span className="font-medium normal-case tracking-normal text-foreground/55">
                — {color}
              </span>
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {product.colors.map((c) => {
                const active = c.name === color;
                const available = colorInStock(product, c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => selectColor(c.name)}
                    aria-pressed={active}
                    aria-label={available ? c.name : `${c.name} (tükendi)`}
                    title={available ? c.name : `${c.name} — tükendi`}
                    className={cn(
                      "relative size-8 overflow-hidden rounded-full ring-1 transition-[box-shadow]",
                      active
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                        : "ring-foreground/15 hover:ring-foreground/40",
                      !available && "opacity-45",
                    )}
                    style={{ backgroundColor: c.hex }}
                  >
                    {/* Tükenen renk: çapraz çizgi */}
                    {!available && (
                      <span
                        aria-hidden
                        className="absolute left-1/2 top-1/2 h-px w-[140%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-foreground/70"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {colorSoldOut && (
              <p className="mt-3 text-[13px] font-semibold" role="status">
                Bu renk tükendi; başka bir renk seç.
              </p>
            )}
          </div>

          {/* Numara / Beden */}
          <div className="mt-8 font-sf">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[13px] font-bold uppercase tracking-[0.04em]">
                {shoe ? "Numara" : "Beden"}
              </p>
              <button
                type="button"
                onClick={onOpenGuide}
                className="text-[12px] font-semibold uppercase tracking-[0.04em] text-foreground/55 underline underline-offset-4 transition-colors hover:text-foreground"
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
                    aria-label={inStock ? s : `${s} (stokta yok)`}
                    title={inStock ? undefined : "Stokta yok"}
                    className={cn(
                      "h-11 min-w-[52px] rounded-full border px-3.5 text-[14px] font-semibold transition-colors",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground/15 hover:border-foreground/50",
                      !inStock &&
                        "cursor-not-allowed border-dashed border-foreground/15 font-medium text-foreground/25 line-through hover:border-foreground/15",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {!soldOut && !colorSoldOut && sizes.some((x) => !x.inStock) && (
              <p className="mt-2.5 text-[12px] text-foreground/45">
                Üstü çizili {shoe ? "numaralar" : "bedenler"} stokta yok.
              </p>
            )}

            {error && (
              <p
                className="mt-3 text-[13px] font-semibold text-brand"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          {/* Aksiyonlar */}
          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdd}
              disabled={soldOut}
              aria-disabled={added || undefined}
              className="group inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-full bg-foreground px-7 font-sf text-[14px] font-bold uppercase tracking-[0.05em] text-background transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:bg-foreground/25 disabled:hover:bg-foreground/25"
            >
              <AnimatePresence mode="wait" initial={false}>
                {soldOut ? (
                  <motion.span key="soldout">Tükendi</motion.span>
                ) : added ? (
                  <motion.span
                    key="added"
                    className="inline-flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Check className="size-4" strokeWidth={2.2} />
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
                    <ArrowRight className="size-4" strokeWidth={2.2} />
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
                "grid size-14 shrink-0 place-items-center rounded-full border transition-colors",
                favorite
                  ? "border-brand/40 text-brand"
                  : "border-foreground/20 text-foreground/60 hover:border-foreground/50 hover:text-foreground",
              )}
            >
              <Heart
                className="size-5"
                strokeWidth={1.8}
                fill={favorite ? "currentColor" : "none"}
              />
            </button>
          </div>

          {/* Kargo / iade — projedeki mevcut metinler (bkz. İade ve Cayma). */}
          <ul className="mt-8 space-y-3.5 border-t border-border/70 pt-6 font-sf">
            <ServiceNote icon={Truck} title="Ücretsiz kargo">
              {formatPrice(FREE_SHIPPING_THRESHOLD)} üzeri siparişlerde.
            </ServiceNote>
            <ServiceNote icon={Timer} title="Hızlı gönderim">
              1–3 iş günü içinde kargoya verilir.
            </ServiceNote>
            <ServiceNote icon={RotateCcw} title="Kolay iade">
              14 gün içinde koşulsuz iade.
            </ServiceNote>
          </ul>

          <div className="mt-10">
            <Accordion
              items={[
                {
                  title: "Ürün Detayları",
                  content: (
                    <>
                      {/* Açıklama admin'den serbest metin gelir: satır
                          sonları korunur, yoksa maddeler tek paragrafa
                          yapışıyordu. */}
                      <p className="whitespace-pre-line">
                        {product.description.replace(/\r\n?/g, "\n").trim()}
                      </p>
                      {!shoe && <p className="mt-2">{MODEL_BILGISI}</p>}
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

/** Seçili renkte tek bir stoklu beden/numara varsa onu döndürür. */
function onlyInStockSize(product: Product, color: string): ProductSize | null {
  const inStock = sizeAvailability(product, color).filter((s) => s.inStock);
  return inStock.length === 1 ? inStock[0].size : null;
}

function ServiceNote({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-0.5 size-[18px] shrink-0" strokeWidth={1.8} />
      <div>
        <p className="text-[13px] font-bold uppercase tracking-[0.04em]">
          {title}
        </p>
        <p className="mt-0.5 text-[14px] text-foreground/60">{children}</p>
      </div>
    </li>
  );
}
