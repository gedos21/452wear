import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { AdminNav } from "@/components/admin/admin-nav";
import { MAIN_CONTENT_ID } from "@/components/layout/skip-link";
import { adminOturumu } from "@/lib/server/admin";
import { GORSEL_YUKLEME_ACIK } from "@/lib/server/storage";

// absolute: kök şablon ("%s | 452WEAR") başlığa ikinci kez eklenmesin.
export const metadata = {
  title: { absolute: "Admin | 452WEAR", template: "%s | Admin" },
};

/**
 * Admin kabuğu.
 *
 * ERİŞİM: yalnızca admin hesabı (ADMIN_EMAILS + doğrulanmış e-posta, bkz.
 * lib/server/admin). Başkasına 404 verilir; panelin varlığı bile görünmez.
 * Eylemler yetkiyi ayrıca kendileri de kontrol eder (app/admin/actions.ts).
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const oturum = await adminOturumu();
  if (!oturum) notFound();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <Container className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/urunler"
                className="font-display text-sm font-extrabold tracking-[-0.02em]"
              >
                452WEAR
              </Link>
              <span className="hidden micro text-foreground/40 sm:inline">
                Admin
              </span>
            </div>
            <AdminNav />
          </div>
          <Link
            href="/"
            className="micro text-foreground/50 transition-colors hover:text-foreground"
          >
            Siteye dön →
          </Link>
        </Container>
      </header>

      <main id={MAIN_CONTENT_ID} tabIndex={-1}>
        <Container className="pt-8 pb-24">
          <p className="mb-8 rounded-[var(--radius-product)] bg-muted/60 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground ring-1 ring-border/60">
            <span className="micro text-brand">
              {process.env.NODE_ENV === "production" ? "Canlı site" : "Lokal (test veritabanı)"}
            </span>
            <span className="mt-1.5 block">
              {oturum.user.email} olarak giriş yaptın. Kaydettiğin değişiklikler
              {process.env.NODE_ENV === "production"
                ? " anında sitede görünür."
                : " yalnızca test veritabanına yazılır; canlı siteyi etkilemez."}
              {!GORSEL_YUKLEME_ACIK &&
                " Görsel yükleme şimdilik kapalı; mevcut görselleri sıralayıp kaldırabilirsin."}
            </span>
          </p>
          {children}
        </Container>
      </main>
    </div>
  );
}
