/**
 * Sitenin tam adresi: sitemap, robots ve paylaşım (Open Graph) bağlantıları
 * buradan üretilir.
 *
 * Alan adı belli olunca NEXT_PUBLIC_SITE_URL ortam değişkeni ayarlanır
 * (ör. https://452wear.com). Ayarlanmamışsa Vercel'in üretim adresi, o da
 * yoksa yerel geliştirme adresi kullanılır.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/+$/, "");
