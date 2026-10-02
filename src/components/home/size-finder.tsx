import Link from "next/link";
import { Container } from "@/components/layout/container";
import { categoryHref, SIZE_PARAM } from "@/components/layout/nav-links";
import { numaraStoklari } from "@/lib/catalog-store";
import { cn } from "@/lib/utils";
import { HOME_WIDTH } from "./home-layout";

/**
 * Ana sayfa "Numaran kaç?": numaraya basınca ayakkabılar, o numarası stokta
 * olan ürünlerle açılır. Sayılar gerçek stoktan gelir; stokta hiç olmayan
 * numara pasif görünür (tıklanıp boş liste görülmesin).
 */
export async function SizeFinder() {
  const sizes = await numaraStoklari();
  if (!sizes.some((s) => s.count > 0)) return null;

  return (
    <section className="pb-12 sm:pb-14">
      <Container className={HOME_WIDTH}>
        <div className="rounded-product bg-muted px-5 py-8 sm:px-10 sm:py-11">
          <h2 className="font-sf text-[24px] font-bold uppercase leading-none tracking-[-0.01em] sm:text-[32px]">
            Numaran kaç?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-[15px]">
            Numaranı seç, yalnızca stokta olan ayakkabıları gör.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2.5 sm:mt-7 sm:gap-3">
            {sizes.map(({ size, count }) => {
              const label = `${size} numara: ${count > 0 ? `${count} model` : "stokta yok"}`;
              const chip =
                "flex h-14 min-w-16 flex-col items-center justify-center rounded-full border px-4 font-sf sm:h-16 sm:min-w-[4.5rem]";
              return (
                <li key={size}>
                  {count > 0 ? (
                    <Link
                      href={`${categoryHref("ayakkabi")}?${SIZE_PARAM}=${size}`}
                      aria-label={label}
                      className={cn(
                        chip,
                        "border-foreground/15 bg-background transition-colors hover:border-foreground hover:bg-foreground hover:text-background",
                      )}
                    >
                      <span className="text-[17px] font-black leading-none sm:text-lg">{size}</span>
                      <span className="mt-1 text-[10px] leading-none opacity-60">{count} model</span>
                    </Link>
                  ) : (
                    <span
                      aria-label={label}
                      className={cn(chip, "border-transparent text-foreground/30")}
                    >
                      <span className="text-[17px] font-black leading-none line-through sm:text-lg">
                        {size}
                      </span>
                      <span className="mt-1 text-[10px] leading-none">yok</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
