import type { MetadataRoute } from "next";
import { katalogOku } from "@/lib/catalog-store";
import { LEGAL_PAGES } from "@/lib/legal";
import { SITE_URL } from "@/lib/site";

/**
 * Arama motorları için sayfa listesi: vitrin sayfaları, yayındaki bütün
 * ürünler ve yasal metinler. Kişiye özel sayfalar (hesap, ödeme, favoriler)
 * ve admin dahil edilmez.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urunler = await katalogOku();

  const vitrin: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/magaza`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/kombinini-bul`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/hakkimizda`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/iletisim`, changeFrequency: "monthly", priority: 0.5 },
  ];

  return [
    ...vitrin,
    ...urunler.map((urun) => ({
      url: `${SITE_URL}/urun/${urun.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...LEGAL_PAGES.map((sayfa) => ({
      url: `${SITE_URL}${sayfa.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
