import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHero } from "@/components/home/home-hero";
import { BestSellers } from "@/components/home/best-sellers";
import { CategoryTiles } from "@/components/home/category-tiles";
import { ShoeCampaign } from "@/components/home/shoe-campaign";
import { KombinOner } from "@/components/home/kombin-oner";
import { JoinSection } from "@/components/home/join-section";

/**
 * Ana sayfa sırası: hero (yeni gelenler) → çok satanlar → kampanya bannerı →
 * ayakkabılar / giyim kategori bannerı → kombin öner → bize katıl → footer.
 * Ürün ızgaraları ile editorial bannerlar dönüşümlü gider; yeni bir kampanya
 * eklemek için araya bir <CampaignBanner /> koymak yeterli.
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-6 lg:pb-10">
        <HomeHero />
        <BestSellers />
        <ShoeCampaign />
        <CategoryTiles />
        <KombinOner />
        <JoinSection />
      </main>
      <SiteFooter />
    </>
  );
}
