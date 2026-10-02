import Link from "next/link";
import { Container } from "@/components/layout/container";
import { BRAND_PARAM, shoeFilterHref } from "@/components/layout/nav-links";
import { markaVitrini } from "@/lib/catalog-store";
import { filterSlug } from "@/lib/product-filters";
import { HOME_WIDTH } from "./home-layout";

/**
 * Ana sayfa markalar şeridi: büyük, kalın yazılarla stoktaki markalar. Logo
 * değil yazı kullanılır (marka hakkı). Yalnızca ayakkabısı olan marka
 * ayakkabılar sayfasına, diğerleri tüm mağazaya o marka seçili gider.
 */
export async function BrandStrip() {
  const brands = await markaVitrini();
  if (brands.length < 3) return null;

  return (
    <section className="pb-12 sm:pb-14">
      <Container className={HOME_WIDTH}>
        <h2 className="font-sf text-[24px] font-bold uppercase leading-none tracking-[-0.01em] sm:text-[32px]">
          Markalar
        </h2>

        <ul className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-3 border-y border-border/70 py-7 sm:mt-7 sm:gap-x-10 sm:gap-y-4 sm:py-9">
          {brands.map(({ name, count, yalnizAyakkabi }) => {
            const slug = filterSlug(name);
            const href = yalnizAyakkabi
              ? shoeFilterHref("marka", slug)
              : `/magaza?${BRAND_PARAM}=${slug}`;
            return (
              <li key={name}>
                <Link
                  href={href}
                  lang="en"
                  className="group inline-flex items-start gap-1 font-sf text-[26px] font-black uppercase leading-none tracking-[-0.02em] transition-colors hover:text-brand sm:text-[40px]"
                >
                  {name}
                  <span className="text-[11px] font-bold tracking-normal text-foreground/40 transition-colors group-hover:text-brand sm:text-xs">
                    {count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
