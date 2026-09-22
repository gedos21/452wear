import { isInStock, productBrand } from "@/lib/product-filters";
import { SITE_URL } from "@/lib/site";
import { ozetMetin } from "@/lib/text";
import type { Product } from "@/types/product";

/**
 * Ürün sayfasının arama motoru verisi (schema.org Product + yol izi).
 *
 * Tüm alanlar KATALOGDAN gelir: fiyat, para birimi ve stok durumu sayfada
 * görünenle aynıdır — Google'ın "yapılandırılmış veri sayfayla uyuşmuyor"
 * uyarısı çıkmaması için uydurma alan (puan, yorum sayısı, teslim süresi)
 * eklenmez.
 */
export function ProductJsonLd({
  product,
  categoryLabel,
  categoryHref,
}: {
  product: Product;
  categoryLabel?: string;
  categoryHref?: string;
}) {
  const url = `${SITE_URL}/urun/${product.slug}`;
  const veri = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: product.name,
        description: ozetMetin(product.description, 300),
        sku: product.id,
        image: product.images.map((g) => `${SITE_URL}${g.src}`),
        brand: { "@type": "Brand", name: productBrand(product) },
        ...(product.colors.length > 0
          ? { color: product.colors.map((c) => c.name).join(", ") }
          : {}),
        offers: {
          "@type": "Offer",
          url,
          price: product.price,
          priceCurrency: product.currency,
          itemCondition: "https://schema.org/NewCondition",
          availability: isInStock(product)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Ana sayfa", item: SITE_URL },
          ...(categoryLabel && categoryHref
            ? [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: categoryLabel,
                  item: `${SITE_URL}${categoryHref}`,
                },
              ]
            : []),
          {
            "@type": "ListItem",
            position: categoryLabel ? 3 : 2,
            name: product.name,
            item: url,
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Veri bizim ürettiğimiz nesneden geliyor; JSON.stringify kaçışı yeterli.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(veri) }}
    />
  );
}
