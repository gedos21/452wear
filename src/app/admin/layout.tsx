import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";

// absolute: kök şablon ("%s | 452WEAR") başlığa ikinci kez eklenmesin.
export const metadata = {
  title: { absolute: "Admin | 452WEAR", template: "%s | Admin" },
};

/**
 * Admin kabuğu.
 *
 * ERİŞİM: Projede gerçek kimlik doğrulama yok (bkz. src/lib/auth.ts). Bu yüzden
 * sahte bir "admin girişi" koymuyoruz — bunun yerine alan production'da
 * KAPALI. Gerçek bir auth sağlayıcı bağlandığında buradaki kontrol o sağlayıcının
 * oturum/rol kontrolüyle değiştirilecek.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <Container className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/urunler"
              className="font-display text-sm font-extrabold tracking-[-0.02em]"
            >
              452WEAR
            </Link>
            <span className="micro text-foreground/40">Admin</span>
          </div>
          <Link
            href="/"
            className="micro text-foreground/50 transition-colors hover:text-foreground"
          >
            Siteye dön →
          </Link>
        </Container>
      </header>

      <Container className="pt-8 pb-24">
        <p className="mb-8 rounded-[var(--radius-product)] bg-muted/60 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground ring-1 ring-border/60">
          <span className="micro text-brand">Geliştirme alanı</span>
          <span className="mt-1.5 block">
            Bu panelde kimlik doğrulama yok ve production build&apos;inde
            kapalıdır. Değişiklikler{" "}
            <code className="text-foreground">data/catalog.json</code> dosyasına
            yazılır; yazılabilir bir dosya sistemi gerekir.
          </span>
        </p>
        {children}
      </Container>
    </div>
  );
}
