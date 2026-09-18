import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Kişiye özel ve yönetim sayfaları arama motorlarına kapalı. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/hesap", "/odeme", "/favoriler"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
