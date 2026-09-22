import Link from "next/link";
import { Container } from "./container";
import { PaymentMarks } from "@/components/payment/payment-marks";
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

        {/* Ödeme yöntemleri: kabul edilen kart şemaları. Logolar markaların
            kendi SVG'leri (public/logo/odeme), yükseklikleri eşit. */}
        <section className="mt-10">
          <h2 className="micro text-foreground/50">Ödeme Yöntemleri</h2>
          <PaymentMarks
            logoClassName="h-6 sm:h-7"
            className="mt-4 gap-5 sm:gap-6"
          />
        </section>

        <div className="mt-8 micro text-muted-foreground">
          <span>© {new Date().getFullYear()} 452WEAR</span>
        </div>
      </Container>
    </footer>
  );
}
