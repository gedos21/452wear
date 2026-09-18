"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import {
  PRODUCT_ASPECT,
  PRODUCT_SURFACE,
} from "@/components/product/product-surface";
import { useQuickView } from "@/components/product/quick-view";
import {
  CharacterTryOn,
  missingTryOn,
} from "@/components/tryon/character-tryon";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { defaultColor, sizeAvailability } from "@/lib/product-variants";
import { cn } from "@/lib/utils";
import { wearableForSlot } from "@/lib/character";
import { isAvailable, type Outfit } from "@/lib/outfit";
import type { Product, ProductSize, TryOnLayer } from "@/types/product";

/** Kombin parçasının yuvası: karakter katmanları + karaktere çizilmeyen ayakkabı. */
type Yuva = TryOnLayer | "shoes";

/**
 * Kombin sonucu. Sepete ekleme mevcut cart sistemini kullanır ve beden
 * seçilmeden yapılmaz — kullanıcı adına beden seçmiyoruz.
 *
 * Kombin motorunun sonucu başlangıç seçimidir; kullanıcı bir yuvayı
 * değiştirdiğinde yalnızca o yuva güncellenir (diğerleri ve karakter aynı
 * kalır). Ayakkabı yuvası karaktere çizilmez; yalnızca kart olarak gösterilir.
 */
export function OutfitResult({
  outfit,
  products,
  onRestart,
}: {
  outfit: Outfit;
  products: Product[];
  onRestart: () => void;
}) {
  const { add } = useCart();

  // Yuva → seçili ürün. Tek kaynak; karakter de fiyat da buradan okunur.
  const [secim, setSecim] = useState<{
    top: Product;
    bottom: Product;
    shoes?: Product;
  }>({
    top: outfit.top,
    bottom: outfit.bottom,
    shoes: outfit.shoes,
  });
  const [sizes, setSizes] = useState<Record<string, ProductSize | null>>({});
  const [added, setAdded] = useState(false);

  const pieces: { yuva: Yuva; product: Product }[] = [
    { yuva: "top", product: secim.top },
    { yuva: "bottom", product: secim.bottom },
    ...(secim.shoes ? [{ yuva: "shoes" as const, product: secim.shoes }] : []),
  ];
  const total = pieces.reduce((sum, p) => sum + p.product.price, 0);
  const ready = pieces.every(({ product }) => sizes[product.id]);

  /** Yalnızca verilen yuvayı değiştirir; diğer yuvalara dokunmaz. */
  function degistir(yuva: Yuva, product: Product) {
    setSecim((prev) => ({ ...prev, [yuva]: product }));
    setAdded(false);
  }

  function addAll() {
    if (!ready) return;
    for (const { product } of pieces) {
      const size = sizes[product.id];
      if (!size) return;
      const color = defaultColor(product);
      add({
        productId: product.id,
        size,
        color,
        price: product.price,
        currency: product.currency,
        // Satır, varyantın stoğunu aşamaz.
        max:
          product.variants.find((v) => v.size === size && v.color === color)
            ?.stock ?? 0,
      });
    }
    setAdded(true);
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="micro text-brand">Bugün senin kombinin</p>
        <h2 className="mt-4 font-display text-[clamp(2rem,7vw,3.75rem)] font-extrabold leading-[1] tracking-[-0.035em]">
          KOMBİN HAZIR<span className="text-brand">.</span>
        </h2>
      </motion.div>

      <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-16">
        {/* Mobilde karakter üstte, masaüstünde sağda ve büyük. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="order-first lg:order-last"
        >
          <CharacterStage top={secim.top} bottom={secim.bottom} />
        </motion.div>

        <div className="order-last lg:order-first">
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-10">
            {pieces.map(({ yuva, product }, i) => (
              <motion.div
                // key YUVA'dır, ürün değil: ürün değişince kart yeniden
                // mount olup animasyonu baştan oynatmaz.
                key={yuva}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 + i * 0.08 }}
              >
                <PieceCard
                  product={product}
                  alternatifler={
                    // Ayakkabı karaktere çizilmediği için stoktaki tüm
                    // ayakkabılar seçenektir; üst/alt ise karakterde
                    // gösterilebilen ürünlerle sınırlı. Tükenmiş ürün
                    // sunulmaz: hiçbir bedeni seçilemez, kombin sepete
                    // eklenemezdi.
                    yuva === "shoes"
                      ? products.filter(
                          (p) => p.category === "ayakkabi" && isAvailable(p),
                        )
                      : wearableForSlot(products, yuva).filter(isAvailable)
                  }
                  onDegistir={(p) => degistir(yuva, p)}
                  selectedSize={sizes[product.id] ?? null}
                  onSelectSize={(size) => {
                    setSizes((prev) => ({ ...prev, [product.id]: size }));
                    setAdded(false);
                  }}
                />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.28 }}
            className="mt-12 border-t border-border/70 pt-8"
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="micro text-foreground/45">Toplam</span>
              <span className="text-lg font-medium">
                {formatPrice(total, secim.top.currency)}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={addAll}
                disabled={!ready}
                className={cn(
                  "inline-flex h-13 items-center gap-2.5 rounded-full px-8 micro transition-colors",
                  ready
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "cursor-not-allowed bg-muted text-foreground/35",
                )}
              >
                {added ? (
                  <>
                    <Check className="size-4" strokeWidth={2} />
                    Sepete Eklendi
                  </>
                ) : (
                  <>
                    Hepsini Sepete Ekle
                    <ArrowRight className="size-4" strokeWidth={1.8} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onRestart}
                className="inline-flex h-13 items-center gap-2 rounded-full px-5 micro text-foreground/50 transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3.5" strokeWidth={1.8} />
                Baştan Dene
              </button>
            </div>

            {!ready && (
              <p className="mt-4 text-[13px] text-muted-foreground">
                Sepete eklemek için{" "}
                {pieces.length === 2 ? "her iki parçanın" : "tüm parçaların"}{" "}
                bedenini seç.
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * Karakterin sahnesi. Karakter pixel-art; çevresindeki arayüz sitenin
 * editoryal dilinde kalır — oyun arayüzü hissi verilmez.
 *
 * Ölçek viewport yüksekliğine bağlıdır: laptop ekranında karakterin tamamı
 * tek bakışta görünsün diye sabit dev bir yükseklik yerine `min()` kullanılır.
 * `100vh` değil `100vh - <üstteki içerik>` çıkarılır; başlık ve sayfa
 * boşlukları piksel sabiti olduğu için kısa ekranlarda asıl daralan onlar
 * değil karakterdir. Üst sınırlar canvas'ın tam sayı katlarıdır
 * (1,5× = 384px, 2× = 512px).
 */
function CharacterStage({ top, bottom }: { top: Product; bottom: Product }) {
  const layers = { top, bottom };
  const missing = missingTryOn(layers);

  return (
    <figure className="rounded-[var(--radius-product)] bg-muted/50 px-6 py-6 ring-1 ring-border/60 sm:px-8">
      <figcaption className="flex items-baseline justify-between gap-3">
        {/* lang="en": micro uppercase'i Türkçe kipte "PİXEL FİT" üretiyor. */}
        <span lang="en" className="micro text-foreground/45">
          Pixel fit
        </span>
        <span className="text-[13px] font-semibold uppercase leading-none tracking-[0.16em] text-foreground">
          Ön
          <span className="ml-1.5 font-normal text-foreground/35">Front</span>
        </span>
      </figcaption>

      <CharacterTryOn
        outfit={layers}
        className="mt-6 h-[clamp(16rem,calc(100vh_-_25rem),24rem)] lg:mt-7 lg:h-[clamp(16rem,calc(100vh_-_27rem),32rem)]"
      />

      {/* Katmanlar referans karakter sheet'inden gelir, ürün fotoğrafı
          değildir — kullanıcıya bunu açıkça söylüyoruz. */}
      <p className="mx-auto mt-6 max-w-[24rem] text-center text-[11px] leading-relaxed text-muted-foreground">
        Kıyafet katmanları referans çizimdir; ürünün rengini ve baskısını
        birebir yansıtmaz.
        {missing.length > 0 && (
          <>
            {" "}
            {missing.map((p) => p.name).join(" ve ")} için katman henüz
            hazırlanmadı.
          </>
        )}
      </p>
    </figure>
  );
}

function PieceCard({
  product,
  alternatifler,
  onDegistir,
  selectedSize,
  onSelectSize,
}: {
  product: Product;
  /** Aynı yuvaya ait gerçek katalog ürünleri. */
  alternatifler: Product[];
  onDegistir: (product: Product) => void;
  selectedSize: ProductSize | null;
  onSelectSize: (size: ProductSize) => void;
}) {
  const quickView = useQuickView();
  const color = defaultColor(product);
  const sizes = sizeAvailability(product, color);
  const image = product.images[0];

  return (
    <article>
      <button
        type="button"
        onClick={() => quickView?.open(product)}
        aria-label={`${product.name} — incele`}
        className={cn(
          "group block w-full",
          PRODUCT_SURFACE,
          PRODUCT_ASPECT,
          "relative",
        )}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 640px) 40vw, 90vw"
          className="object-cover"
        />
        <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-full bg-background/90 px-2.5 py-1 micro opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100">
          İncele →
        </span>
      </button>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium leading-snug">{product.name}</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">{color}</p>
        </div>
        <span className="shrink-0 text-sm font-medium">
          {formatPrice(product.price, product.currency)}
        </span>
      </div>

      <div className="mt-4">
        <p className="micro text-foreground/45">Beden</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {sizes.map(({ size, inStock }) => {
            const active = size === selectedSize;
            return (
              <button
                key={size}
                type="button"
                disabled={!inStock}
                onClick={() => onSelectSize(size)}
                aria-pressed={active}
                className={cn(
                  "h-9 min-w-11 rounded-full px-3 text-[13px] transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "bg-muted text-foreground/75 hover:text-foreground",
                  !inStock &&
                    "cursor-not-allowed bg-transparent text-foreground/25 line-through ring-1 ring-border hover:text-foreground/25",
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {alternatifler.length > 1 && (
        <div className="mt-4">
          <p className="micro text-foreground/45">Değiştir</p>
          {/* Chip'ler içerik kadar geniş; `leading-8` tek satırı 32px kutuda
              ortalar, `max-w-full` + `truncate` uzun adın kolonu taşırmasını
              engeller. Sığmayınca doğal olarak alt satıra geçer — gizli
              kaydırma yok, üç seçenek de her zaman görünür. */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {alternatifler.map((alt) => {
              const active = alt.id === product.id;
              return (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => onDegistir(alt)}
                  aria-pressed={active}
                  title={alt.name}
                  className={cn(
                    "h-8 max-w-full truncate rounded-full px-2.5 text-[12.5px] leading-8 transition-colors",
                    active
                      ? "bg-foreground text-background ring-1 ring-brand"
                      : "bg-muted text-foreground/80 hover:text-foreground",
                  )}
                >
                  {alt.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
