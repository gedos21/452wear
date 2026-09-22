import { Reveal } from "@/components/motion";
import { ProductCard } from "./product-card";
import { OutfitPicker } from "./outfit-picker";
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
 * "Bunu tamamla" — ürünün içinde yer aldığı kombin: parçaların görselleri yan
 * yana, her parça için beden seçimi, kombin toplamı ve tek tuşla sepete ekleme.
 *
 * Kombin lib/recommendations'ta kurulur: en fazla üç parça (üst → alt →
 * ayakkabı), hepsi katalogdan ve stokta, bakılan ürün her zaman içinde.
 * Beden seçimi ve sepete ekleme istemci tarafında (outfit-picker).
 */
export function OutfitComplete({
  outfit,
  current,
}: {
  outfit: OutfitSuggestion;
  current: Product;
}) {
  return (
    <Reveal as="section" className="mt-20 sm:mt-24">
      <SectionHead
        title="Bunu tamamla"
        note="Bu parçayla kurulmuş, stoktaki ürünlerden bir kombin."
      />

      <OutfitPicker
        pieces={outfit.pieces}
        currentId={current.id}
        total={outfit.total}
      />
    </Reveal>
  );
}
