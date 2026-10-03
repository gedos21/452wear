import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * İçerik Güvenliği Politikası (nonce'suz). Nonce her sayfayı dinamik
 * render'a zorlar; sayfaların çoğu statik kalsın diye Next'in satır içi
 * hidrasyon betikleri için 'unsafe-inline' kullanılır.
 *
 * Dış kaynak yok: fontlar next/font ile derlemede kendi sunucumuza alınır,
 * 3B girişin HDRI'ı ve kanyon görseli /public/intro'dan, 452 Watch kareleri
 * /public/watch'tan gelir. Vercel Analytics / Speed Insights canlıda aynı
 * origin'deki /_vercel/* yollarını kullanır; yalnızca geliştirmede
 * va.vercel-scripts.com'dan hata ayıklama betiği yüklenir. Google ile giriş
 * ve WhatsApp düğmeleri sayfa yönlendirmesidir, CSP'ye takılmaz.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // Geliştirmede HMR web soketi.
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "media-src 'self' blob: data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  // Ana klasörde (C:\Users\user) başıboş bir package-lock.json var; Next kök
  // dizini yanlış tahmin etmesin diye proje kökü açıkça verilir.
  turbopack: { root: process.cwd() },
  experimental: {
    serverActions: {
      // Admin ürün formu görselleri tek istekte gönderir; varsayılan 1 MB
      // birkaç 2048×2048 WebP için yetmez. Dosya başına sınır (8 MB) ve tür
      // kontrolü sunucuda ayrıca yapılır: bkz. src/app/admin/actions.ts.
      // Yalnızca geliştirmede: admin canlıda kapalı; canlıda bülten gibi
      // eylemler varsayılan 1 MB sınırında kalsın (büyük istekle yük bindirilemesin).
      bodySizeLimit: isDev ? "25mb" : "1mb",
    },
  },
  // public/ CDN'den sunulur; sunucu paketine kopyalanmasın. Admin'in lokalde
  // fotoğraf yazabilmesi (lib/server/storage) Next'in tüm klasörü pakete
  // katmasına yol açıyordu (fonksiyon başına ~150 MB).
  outputFileTracingExcludes: {
    "/**": ["./public/**/*"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
