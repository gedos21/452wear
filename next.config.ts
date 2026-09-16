import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Admin ürün formu görselleri tek istekte gönderir; varsayılan 1 MB
      // birkaç 2048×2048 WebP için yetmez. Dosya başına sınır (8 MB) ve tür
      // kontrolü sunucuda ayrıca yapılır: bkz. src/app/admin/actions.ts.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
