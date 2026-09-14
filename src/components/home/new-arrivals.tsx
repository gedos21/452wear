import { Container } from "@/components/layout/container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ProductCard } from "@/components/product/product-card";
import { yeniGelenler } from "@/lib/catalog-store";

export async function NewArrivals() {
  const products = await yeniGelenler(4);

  return (
    <section className="py-14 sm:py-16 lg:py-20">
      <Container>
        <Reveal>
          <h2 className="flex items-center gap-3 font-display text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
            YENİ GELENLER
            <span className="size-2 rounded-full bg-brand" aria-hidden />
          </h2>
        </Reveal>

        <Stagger
          className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:mt-14 lg:grid-cols-4"
          stagger={0.06}
        >
          {products.map((product) => (
            <StaggerItem key={product.id} as="div">
              <ProductCard product={product} />
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
