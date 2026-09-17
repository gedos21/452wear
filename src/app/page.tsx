import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Hero } from "@/components/home/hero";
import { CategorySpotlight } from "@/components/home/category-spotlight";
import { OutfitSpotlight } from "@/components/home/outfit-spotlight";
import { SpecialPick } from "@/components/home/special-pick";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <CategorySpotlight
          category="ayakkabi"
          title="AYAKKABI"
          subtitle="Sezonun öne çıkan modelleri"
          cta="Ayakkabıları keşfet"
          image={{
            src: "/editorial/ayakkabi.webp",
            alt: "452WEAR ayakkabı koleksiyonu: havada duran dört sneaker",
          }}
        />
        <OutfitSpotlight />
        <SpecialPick />
      </main>
      <SiteFooter />
    </>
  );
}
