import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductSurface } from "./product-surface";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/product";

/**
 * 452WEAR'ın fiziksel kartı/etiketi. İçeriğin tamamı dışarıdan gelir:
 * ileride bu kart "son baktığın ürün", "favorindeki ürün", "sepetindeki ürün"
 * ya da kişiye özel seçilmiş bir ürün için de aynı şekilde kullanılabilir —
 * yalnızca `product` ve metinleri değiştirmek yeterli.
 */
export type SpecialPickCardProps = {
  product: Product;
  /** Karttaki küçük üst etiket */
  eyebrow?: string;
  /** Ürünün altındaki tek satırlık mesaj */
  message?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function SpecialPickCard({
  product,
  eyebrow = "Sana Özel",
  message = "Bugün bunu senin için seçtik.",
  ctaLabel = "Keşfet",
  ctaHref,
}: SpecialPickCardProps) {
  const image = product.images[0];
  const href = ctaHref ?? `/urun/${product.slug}`;

  return (
    <article
      className={cn(
        "rounded-product bg-background p-3",
        // Tek katmanlı gölge tanımı:
        //   inset üst  → ışık alan kenar (bevel)
        //   inset alt  → gölgede kalan kenar
        //   inset ring → saç teli kenar çizgisi
        //   dış üçlü   → temas + orta + uzak, hepsi düşük opaklıkta
        "shadow-[inset_0_1px_0_rgb(255_255_255/0.6),inset_0_-1px_0_rgb(0_0_0/0.05),inset_0_0_0_1px_rgb(0_0_0/0.07),0_1px_2px_rgb(0_0_0/0.06),0_10px_22px_-12px_rgb(0_0_0/0.18),0_28px_54px_-30px_rgb(0_0_0/0.22)]",
      )}
    >
      {/* Delik: kartı fiziksel bir etiket gibi okutan detay */}
      <div className="mx-auto h-1.5 w-9 rounded-full bg-foreground/12" />

      <div className="mt-2.5 flex items-center justify-between">
        <span className="micro text-foreground/70">452WEAR</span>
        <span className="size-1.5 rounded-full bg-brand" aria-hidden />
      </div>

      <ProductSurface className="mt-2.5">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 240px, 60vw"
          className="object-cover"
        />
      </ProductSurface>

      <p className="micro mt-3.5 text-brand">{eyebrow}</p>

      <h3 className="mt-2.5 text-sm font-medium leading-snug">{product.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatPrice(product.price, product.currency)}
      </p>

      <p className="mt-2.5 text-[13px] leading-snug text-muted-foreground">
        {message}
      </p>

      <Link
        href={href}
        className="mt-3.5 inline-flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-background transition-colors hover:bg-foreground/90"
      >
        <span className="micro">{ctaLabel}</span>
        <ArrowRight className="size-3.5" strokeWidth={1.8} />
      </Link>
    </article>
  );
}
