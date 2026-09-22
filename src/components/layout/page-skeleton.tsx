import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { Container } from "./container";

/**
 * Sayfa yüklenirken gösterilen iskelet. Boş ekran yerine sayfanın kabası
 * çizilir: başlık şeridi ve ürün kartı yerleri. Renk ve ölçüler sitenin
 * kendi değerlerinden gelir; hareket azaltmada titreşim durur.
 */
export function PageSkeleton() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="pt-8 pb-16 sm:pt-10 sm:pb-20">
          <div aria-hidden className="animate-pulse motion-reduce:animate-none">
            <div className="h-9 w-48 rounded-full bg-muted sm:h-11 sm:w-64" />
            <div className="mt-6 h-11 w-full rounded-full bg-muted sm:mt-8" />
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i}>
                  <div className="aspect-4/5 w-full rounded-product bg-muted" />
                  <div className="mt-3.5 h-3 w-2/3 rounded-full bg-muted" />
                  <div className="mt-2 h-3 w-1/3 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </div>
          <p className="sr-only" role="status">
            Sayfa yükleniyor.
          </p>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
