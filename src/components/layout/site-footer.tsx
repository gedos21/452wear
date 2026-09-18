import Link from "next/link";
import { Container } from "./container";
import { LEGAL_PAGES } from "@/lib/legal";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/70 py-10">
      <Container>
        <nav className="flex flex-wrap gap-x-6 gap-y-3">
          <Link
            href="/hakkimizda"
            className="micro text-foreground/70 transition-colors hover:text-foreground"
          >
            Hakkımızda
          </Link>
          <Link
            href="/magaza"
            className="micro text-foreground/70 transition-colors hover:text-foreground"
          >
            Mağaza
          </Link>
          <Link
            href="/iletisim"
            className="micro text-foreground/70 transition-colors hover:text-foreground"
          >
            İletişim
          </Link>
        </nav>

        {/* Yasal bağlantılar tek kayıttan üretilir (lib/legal). */}
        <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
          {LEGAL_PAGES.map((page) => (
            <Link
              key={page.slug}
              href={page.slug}
              className="micro text-foreground/50 transition-colors hover:text-foreground"
            >
              {page.footerLabel}
            </Link>
          ))}
        </nav>

        <div className="mt-8 flex flex-col gap-3 micro text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} 452WEAR</span>
          <span>Türkiye&apos;de tasarlandı</span>
        </div>
      </Container>
    </footer>
  );
}
