import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import { CartProvider } from "@/components/cart/cart-provider";
import { SearchProvider } from "@/components/search/search-provider";
import { QuickViewProvider } from "@/components/product/quick-view";
import { CookieBanner } from "@/components/cookie/cookie-banner";
import { CatalogProvider } from "@/components/product/catalog-provider";
import { katalogOku } from "@/lib/catalog-store";
import "./globals.css";

// latin-ext, Türkçe karakterler (ı, İ, ğ, ş, ç, ö, ü) için gerekli.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Başlıklar: geniş, sıkı ve iri kullanıldığında güçlü duran bir grotesk.
const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "452WEAR",
    template: "%s | 452WEAR",
  },
  description: "Ne giyeceğine birlikte karar verelim.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Canlı katalog (tohum + admin katmanı) burada bir kez okunur; sepet,
  // favoriler ve arama ürünü istemcide bu kaynaktan çözer.
  const products = await katalogOku();

  return (
    <html
      lang="tr"
      className={`${inter.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <CatalogProvider products={products}>
          {/* Sıralama önemli: Quick View en dışta, paneli aramanın üstünde
              (z-60/61 > z-55/56) çizilsin diye. */}
          <QuickViewProvider>
            <SearchProvider>
              <CartProvider>
                {children}
                <CookieBanner />
              </CartProvider>
            </SearchProvider>
          </QuickViewProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
