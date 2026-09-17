import Link from "next/link";
import { categoryHref } from "@/components/layout/nav-links";
import { Stagger, StaggerItem } from "@/components/motion";
import { ProductCard } from "@/components/product/product-card";
import { kategoriVitrini } from "@/lib/catalog-store";
import type { ProductCategory } from "@/types/product";
import { EditorialSpotlight } from "./editorial-spotlight";

/** Kart genişliği: masaüstünde afişin yanındaki alan üç kolona bölünür. */
const KART_SIZES = "(min-width: 1024px) 16vw, 45vw";

/**
 * Kategori vitrini: büyük editorial afiş + kategorinin en yeni eklenen, stokta
 * olan üç ürünü (kompakt ürün kartları). Ürün yoksa yalnızca afiş ve başlık.
 */
export async function CategorySpotlight({
  category,
  title,
  subtitle,
  cta,
  image,
}: {
  category: ProductCategory;
  title: string;
  subtitle: string;
  cta: string;
  image: { src: string; alt: string };
}) {
  const products = await kategoriVitrini(category, 3);
  const href = categoryHref(category);

  return (
    <EditorialSpotlight
      href={href}
      title={title}
      subtitle={subtitle}
      cta={cta}
      image={image}
    >
      {products.length > 0 && (
        <>
          <Stagger
            className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-5"
            stagger={0.06}
            delay={0.1}
          >
            {products.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} sizes={KART_SIZES} />
              </StaggerItem>
            ))}
          </Stagger>
          <div className="mt-4 flex justify-end">
            <Link
              href={href}
              className="micro text-foreground/60 transition-colors hover:text-foreground"
            >
              Daha Fazla →
            </Link>
          </div>
        </>
      )}
    </EditorialSpotlight>
  );
}
