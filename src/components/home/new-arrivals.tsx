import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { sonEklenenler } from "@/lib/catalog-store";
import { HOME_WIDTH } from "./home-layout";

/** Ana sayfa "Yeni Gelenler": stoktaki en son eklenen 8 ürün (bkz. sonEklenenler). */
export async function NewArrivals() {
  const products = await sonEklenenler(8);
  if (products.length === 0) return null;

  return (
    <section className="pb-12 sm:pb-14">
      <Container className={HOME_WIDTH}>
        {/* Çok dar ekranda "Tümünü gör" başlığı kırmak yerine alta iner. */}
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <h2 className="whitespace-nowrap font-sf text-[24px] font-bold uppercase leading-none tracking-[-0.01em] sm:text-[32px]">
            Yeni Gelenler
          </h2>
          <Link
            href="/magaza"
            className="shrink-0 pb-0.5 font-sf text-[13px] font-bold uppercase tracking-[0.04em] transition-colors hover:text-brand"
          >
            Tümünü gör →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:mt-7 sm:gap-x-5 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              sizes="(min-width: 1024px) 23vw, 45vw"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
