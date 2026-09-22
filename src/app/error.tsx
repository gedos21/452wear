"use client";

import { useEffect } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { ActionButton } from "@/components/ui/action-button";

/**
 * Beklenmeyen bir hata olduğunda sayfanın yerine bu ekran çizilir (Next.js
 * hata sınırı). Kullanıcıya teknik ayrıntı gösterilmez; "Tekrar dene"
 * bileşeni yeniden kurar, bağlantılar mağazaya döndürür.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sunucu kaydında izini sürebilmek için tarayıcı konsoluna yazılır.
    console.error(error);
  }, [error]);

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center">
        <Container className="py-20 sm:py-28">
          <p className="micro text-foreground/45">Bir sorun çıktı</p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,10vw,5rem)] font-extrabold leading-[0.9] tracking-[-0.04em]">
            BEKLENMEYEN
            <br />
            BİR HATA<span className="text-brand">.</span>
          </h1>
          <p className="mt-8 max-w-sm text-muted-foreground">
            Sayfa yüklenirken bir şeyler ters gitti. Tekrar deneyebilir ya da
            mağazaya dönebilirsin.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-12 items-center rounded-full bg-foreground px-7 micro text-background transition-colors hover:bg-foreground/90"
            >
              Tekrar Dene
            </button>
            <ActionButton href="/magaza" variant="outline">
              Mağazaya Git
            </ActionButton>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
