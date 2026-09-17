import Image from "next/image";
import Link from "next/link";
import { PRODUCT_SURFACE } from "@/components/product/product-surface";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product, ProductCategory } from "@/types/product";

const PARCA: Record<ProductCategory, string> = {
  tisort: "Üst",
  sweatshirt: "Üst",
  hirka: "Üst",
  esofman: "Alt",
  ayakkabi: "Ayakkabı",
};

/**
 * Kombin parçası kartı: ürün kartından bilerek ayrışan, editorial bir blok.
 * Uzun 2:3 yüzey (kombin afişiyle aynı oran), bilgiler görselin üstünde.
 * Ürün fotoğrafı `object-cover` ile kırpılır, oranı bozulmaz.
 */
export function OutfitPieceCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const [cover] = product.images;

  return (
    <Link
      href={`/urun/${product.slug}`}
      className={cn("group relative block aspect-2/3", PRODUCT_SURFACE)}
    >
      <Image
        src={cover.src}
        alt={cover.alt}
        fill
        sizes="(min-width: 1024px) 24vw, (min-width: 640px) 42vw, 70vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      {/* Alt bilgiler her fotoğrafta okunsun diye yumuşak karartma. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/70 via-black/25 to-transparent"
      />
      <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 micro backdrop-blur-sm lg:left-4 lg:top-4">
        {String(index + 1).padStart(2, "0")} · {PARCA[product.category]}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-4 text-white lg:p-5">
        <h3 className="font-display text-lg font-extrabold leading-tight tracking-[-0.02em] sm:text-xl">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center justify-between gap-3 text-sm">
          <span className="text-white/80">
            {formatPrice(product.price, product.currency)}
          </span>
          <span className="micro text-white/70 transition-colors group-hover:text-white">
            İncele →
          </span>
        </div>
      </div>
    </Link>
  );
}
