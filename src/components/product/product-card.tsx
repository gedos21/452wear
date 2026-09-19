"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { PRODUCT_ASPECT, PRODUCT_SURFACE } from "./product-surface";
import { FavoriteButton } from "./favorite-button";
import { productMediaLayoutId } from "./product-media-id";
import { useQuickView } from "./quick-view";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { discountPercent, productNameParts } from "@/lib/product-filters";
import type { Product } from "@/types/product";

const MAX_DOTS = 3;

/**
 * Sitedeki tek ürün kartı: ana sayfa, mağaza, kategori, arama ve favoriler
 * hep bunu kullanır. Kart görseli ProductSurface üzerinden global yuvarlaklık
 * kuralına uyar.
 *
 * Erişilebilirlik notu: kartın tamamı tek bir bağlantı — ürün adındaki link
 * `after:inset-0` ile kartı kaplar. Favori düğmesi bunun üstünde (z-10)
 * durduğu için ayrı bir hedef olarak çalışır; iç içe <button>/<a> yok.
 */
export function ProductCard({
  product,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
}: {
  product: Product;
  sizes?: string;
}) {
  const reduced = useReducedMotion();
  const quickView = useQuickView();
  const [cover, second] = product.images;
  // Panel bu ürün için açıkken kartın örtüleri geçişe karışmasın.
  const detailOpen = quickView?.openId === product.id;
  // Yalnızca BÜTÜN varyantlar tükenmişse; stoktaki ürünlerde kart aynen kalır.
  const soldOut = !product.variants.some((v) => v.stock > 0);
  const discount = discountPercent(product);
  const nameParts = productNameParts(product);
  const dots = product.colors.slice(0, MAX_DOTS);
  const rest = product.colors.length - dots.length;

  return (
    <motion.article
      className="group relative"
      initial="rest"
      whileHover={reduced ? undefined : "hover"}
      variants={{ rest: { y: 0 }, hover: { y: -4 } }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
    >
      <motion.div
        layoutId={reduced ? undefined : productMediaLayoutId(product.id)}
        className={cn("relative", PRODUCT_SURFACE, PRODUCT_ASPECT)}
        transition={{ type: "spring", stiffness: 240, damping: 30 }}
      >
        <motion.div
          className="absolute inset-0"
          variants={{
            rest: { opacity: 1, scale: 1 },
            hover: { opacity: second ? 0 : 1, scale: second ? 1 : 1.03 },
          }}
          transition={{ duration: 0.35 }}
        >
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            sizes={sizes}
            className="object-cover"
          />
        </motion.div>

        {second && (
          <motion.div
            className="absolute inset-0"
            variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
            transition={{ duration: 0.35 }}
          >
            <Image
              src={second.src}
              alt={second.alt}
              fill
              sizes={sizes}
              className="object-cover"
            />
          </motion.div>
        )}

        {soldOut && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 rounded-full bg-background/90 px-2.5 py-1 micro backdrop-blur-sm">
            Tükendi
          </span>
        )}

        {!detailOpen && (
          <FavoriteButton
            productId={product.id}
            productName={product.name}
            className="absolute right-2.5 top-2.5 z-10"
          />
        )}

        {/* Yalnızca ipucu; tıklama kartın bağlantısına düşer. */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-full bg-background/90 px-2.5 py-1 micro backdrop-blur-sm"
          variants={{
            rest: { opacity: 0, y: 4 },
            hover: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.2 }}
        >
          İncele →
        </motion.span>
      </motion.div>

      {/* Yalnızca gerçek indirimde; oran eski ve güncel fiyattan hesaplanır.
          Görselin kırpma alanının dışında durur ki kenardan taşabilsin. */}
      {discount !== null && !detailOpen && (
        <DiscountRibbon percent={discount} />
      )}

      {/* Bilgi alanı: marka (güçlü) → model (sakin) → fiyat (en güçlü) →
          indirimde eski fiyat → renkler. */}
      <div className="mt-3.5 font-sf">
        <h3>
          <Link
            href={`/urun/${product.slug}`}
            onClick={(e) => {
              // Yeni sekmede açma kısayolları bozulmasın.
              if (!quickView || e.metaKey || e.ctrlKey || e.shiftKey) return;
              e.preventDefault();
              quickView.open(product);
            }}
            className="block after:absolute after:inset-0 after:content-['']"
          >
            {/* Marka satırı yalnızca başka markalarda (NIKE, ADIDAS…); kendi
                ürünlerimizde yazılmaz. Marka adları Latin yazımlı: Türkçe büyük
                harfte "NİKE" olmasın. */}
            {nameParts.brand && (
              <span
                lang="en"
                className="mb-0.5 block text-[13px] font-extrabold uppercase leading-tight tracking-[0.01em] sm:text-sm"
              >
                {nameParts.brand}
              </span>
            )}
            <span className="block text-[13px] font-medium leading-snug text-foreground/85 sm:text-sm">
              {nameParts.model}
            </span>
          </Link>
        </h3>

        {/* Güncel fiyat kartın en güçlü öğesi; indirimde eski fiyat hemen
            altında küçük, gri ve üstü çizili. */}
        <div className="mt-2.5 text-[17px] font-black leading-none tracking-[-0.01em] sm:text-lg">
          {formatPrice(product.price, product.currency)}
        </div>
        {discount !== null && (
          <div className="mt-1 text-[11px] font-medium leading-none text-foreground/45 line-through sm:text-xs">
            {formatPrice(product.compareAtPrice!, product.currency)}
          </div>
        )}

        <div className="mt-2 flex items-center gap-1.5">
          {dots.map((c) => (
            <span
              key={c.name}
              title={c.name}
              style={{ backgroundColor: c.hex }}
              className="size-2.5 rounded-full ring-1 ring-foreground/15"
            />
          ))}
          {rest > 0 && (
            <span className="ml-0.5 text-[11px] text-muted-foreground">
              +{rest}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/**
 * İndirim kurdelesi rengi. Kırmızıya çevirmek için yalnızca bunu değiştirmek
 * yeter (ör. "var(--destructive)"); kıvrım gölgesi bu renkten türetilir.
 */
const DISCOUNT_RIBBON_COLOR = "var(--brand)";

/**
 * Görselin sağ üstünde, sağ kenardan hafif taşan indirim kurdelesi. Favori
 * düğmesinin (sağ üst köşe, 10–38px) altından başlar; alttaki küçük üçgen,
 * kurdelenin kartın arkasına kıvrıldığı hissini verir.
 */
function DiscountRibbon({ percent }: { percent: number }) {
  return (
    <span
      className="pointer-events-none absolute -right-[5px] top-12 z-10"
      style={{ ["--ribbon" as string]: DISCOUNT_RIBBON_COLOR }}
    >
      <span className="block rounded-l-sm bg-[var(--ribbon)] py-[3px] pl-1.5 pr-1.5 font-sf text-[9px] font-bold uppercase leading-none tracking-[0.02em] text-white shadow-[0_3px_8px_-4px_rgb(0_0_0/0.35)] sm:pl-2 sm:pr-2.5 sm:text-[10px] sm:tracking-[0.03em]">
        <span aria-hidden>%{percent} İndirim</span>
        <span className="sr-only">Yüzde {percent} indirim</span>
      </span>
      <span
        aria-hidden
        className="absolute right-0 top-full size-[5px] [clip-path:polygon(0_0,100%_0,0_100%)]"
        style={{
          backgroundColor: `color-mix(in oklab, ${DISCOUNT_RIBBON_COLOR} 60%, black)`,
        }}
      />
    </span>
  );
}
