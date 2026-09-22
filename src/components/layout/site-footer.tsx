import Link from "next/link";
import { Container } from "./container";
import { LEGAL_PAGES } from "@/lib/legal";

/**
 * Footer'daki ödeme yöntemi logoları. Genişlikler bu yükseklikteki gerçek
 * oranlarından gelir; yer tutucu olarak verilir ki logo yüklenirken satır
 * zıplamasın. Görünen boyut sınıflardan (h-6 / sm:h-7) belirlenir.
 */
const ODEME_LOGO_YUKSEKLIGI = 28;

const ODEME_LOGOLARI = [
  { ad: "Visa", dosya: "/logo/odeme/visa.svg", genislik: 86 },
  { ad: "Mastercard", dosya: "/logo/odeme/mastercard.svg", genislik: 45 },
  { ad: "Troy", dosya: "/logo/odeme/troy.svg", genislik: 61 },
];

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
          <ul className="mt-4 flex flex-wrap items-center gap-5 sm:gap-6">
            {ODEME_LOGOLARI.map((logo) => (
              <li key={logo.ad} className="flex">
                {/* next/image SVG'yi servis etmek için dangerouslyAllowSVG
                    ister; dosyalar kendi public klasörümüzde ve boyut sabit. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.dosya}
                  alt={logo.ad}
                  width={logo.genislik}
                  height={ODEME_LOGO_YUKSEKLIGI}
                  className="h-6 w-auto sm:h-7"
                />
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8 micro text-muted-foreground">
          <span>© {new Date().getFullYear()} 452WEAR</span>
        </div>
      </Container>
    </footer>
  );
}
