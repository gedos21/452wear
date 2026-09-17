import { Stagger, StaggerItem } from "@/components/motion";
import { kombinVitrini } from "@/lib/catalog-store";
import { EditorialSpotlight } from "./editorial-spotlight";
import { OutfitPieceCard } from "./outfit-piece-card";

/**
 * Kombinler vitrini: büyük kombin afişi sağda, solda katalogdan kurulmuş hazır
 * bir kombin (üst + eşofman + ayakkabı) küçük editorial kartlarla. Mobilde
 * kartlar yana kaydırılan bir şerit olur.
 */
export async function OutfitSpotlight() {
  const products = await kombinVitrini();

  return (
    <EditorialSpotlight
      ters
      href="/kombinini-bul"
      title="KOMBİNLER"
      subtitle="Birbirini tamamlayan parçalar"
      cta="Kombinini bul"
      image={{
        src: "/editorial/kombinler.webp",
        alt: "452WEAR kombinleri: askıda duran dört tam kombin ve sneaker'ları",
      }}
    >
      {products.length > 0 && (
        <Stagger
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 [scrollbar-width:none] sm:-mx-6 sm:gap-4 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0"
          stagger={0.08}
          delay={0.1}
        >
          {products.map((product, i) => (
            <StaggerItem
              key={product.id}
              className="w-[62%] shrink-0 snap-start sm:w-[38%] lg:w-auto"
            >
              <OutfitPieceCard product={product} index={i} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </EditorialSpotlight>
  );
}
