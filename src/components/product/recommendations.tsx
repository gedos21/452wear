import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion";
import { ProductCard } from "./product-card";
import { PRODUCT_ASPECT, PRODUCT_SURFACE } from "./product-surface";
import { formatPrice } from "@/lib/format";
import { productNameParts } from "@/lib/product-filters";
import type { OutfitSuggestion } from "@/lib/recommendations";
import type { Product } from "@/types/product";

/**
 * Ürün sayfasındaki keşif bölümleri. Hepsi mevcut ürün kartını ve mevcut
 * tipografiyi kullanır; kampanya kutusu, rozet ya da ayrı bir kart tasarımı
 * yoktur. Liste boşsa bölüm hiç çizilmez (çağıran taraf karar verir).
 */

function SectionHead({ title, note }: { title: string; note: string }) {
  return (
    <div className="font-sf">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.08em]">
        {title}
      </h2>
      <p className="mt-2 text-[15px] text-foreground/55">{note}</p>
    </div>
  );
}

/** "Bunu tamamla" — en fazla 3 parça; mobilde ilk 2'si görünür. */
export function ComplementaryProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <Reveal as="section" className="mt-20 sm:mt-24">
      <SectionHead
        title="Bunu tamamla"
        note="Bu parçayla birlikte iyi gidenler"
      />
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
        {products.slice(0, 3).map((product, i) => (
          <div key={product.id} className={i === 2 ? "hidden lg:block" : ""}>
            <ProductCard
              product={product}
              sizes="(min-width: 1024px) 28vw, 45vw"
            />
          </div>
        ))}
      </div>
    </Reveal>
  );
}

/** "Buna da bak" — 4 ürünlük sade ızgara. */
export function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <Reveal as="section" className="mt-20 sm:mt-24">
      <SectionHead title="Buna da bak" note="Aynı tarza yakın birkaç parça." />
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            sizes="(min-width: 1024px) 23vw, 45vw"
          />
        ))}
      </div>
    </Reveal>
  );
}

/**
 * "Kombini tamamla" — ürünün içinde yer aldığı kombin: parçaların görselleri
 * yan yana, altında adlar ve kombin akışına bağlantı.
 */
export function OutfitRecommendation({
  outfit,
  current,
}: {
  outfit: OutfitSuggestion;
  current: Product;
}) {
  return (
    <Reveal as="section" className="mt-20 sm:mt-24">
      <SectionHead
        title="Kombini tamamla"
        note="Bu parça şöyle bir kombinde duruyor."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:items-end lg:gap-12">
        <ul className="grid grid-cols-3 gap-3 sm:gap-4">
          {outfit.pieces.map((piece) => {
            const { brand, model } = productNameParts(piece);
            const bu = piece.id === current.id;
            return (
              <li key={piece.id}>
                <Link href={`/urun/${piece.slug}`} className="group block">
                  <div
                    className={`relative ${PRODUCT_SURFACE} ${PRODUCT_ASPECT}`}
                  >
                    <Image
                      src={piece.images[0].src}
                      alt={piece.images[0].alt}
                      fill
                      sizes="(min-width: 1024px) 18vw, 30vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-3 font-sf">
                    {brand && (
                      <p
                        lang="en"
                        className="text-[11px] font-extrabold uppercase leading-tight"
                      >
                        {brand}
                      </p>
                    )}
                    <p className="mt-0.5 truncate text-[13px] font-medium leading-snug text-foreground/85">
                      {model}
                    </p>
                    <p className="mt-1 text-[13px] font-bold">
                      {formatPrice(piece.price, piece.currency)}
                    </p>
                    {bu && (
                      <p className="mt-1 text-[11px] uppercase tracking-[0.06em] text-foreground/45">
                        Bu ürün
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="font-sf">
          <p className="text-[13px] text-foreground/55">
            Kombin toplamı{" "}
            <span className="font-bold text-foreground">
              {formatPrice(outfit.total, current.currency)}
            </span>
          </p>
          <Link
            href="/kombinini-bul"
            className="mt-4 inline-flex h-12 items-center gap-2 rounded-full border border-foreground/20 px-6 text-[13px] font-bold uppercase tracking-[0.04em] transition-colors hover:border-foreground/60"
          >
            Kombini gör
            <ArrowRight className="size-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
