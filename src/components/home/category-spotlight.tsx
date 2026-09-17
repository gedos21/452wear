import { categoryHref } from "@/components/layout/nav-links";
import { kategoriVitrini } from "@/lib/catalog-store";
import type { ProductCategory } from "@/types/product";
import { EditorialSpotlight } from "./editorial-spotlight";

/**
 * Kategori vitrini: editorial görsel + kategorinin en yeni eklenen, stokta
 * olan üç ürünü. Ürün yoksa yalnızca görsel ve bağlantı gösterilir.
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

  return (
    <EditorialSpotlight
      href={categoryHref(category)}
      title={title}
      subtitle={subtitle}
      cta={cta}
      image={image}
      products={products}
    />
  );
}
