import { NewArrivals } from "@/components/home/new-arrivals";
import { SizeFinder } from "@/components/home/size-finder";
import { BrandStrip } from "@/components/home/brand-strip";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHero } from "@/components/home/home-hero";
import { BestSellers } from "@/components/home/best-sellers";
import { CategoryTiles } from "@/components/home/category-tiles";
import { ShoeCampaign } from "@/components/home/shoe-campaign";
import { KombinOner } from "@/components/home/kombin-oner";
import { KombinPanolari } from "@/components/home/kombin-panolari";
import { RecentlyViewedOnHome } from "@/components/product/recently-viewed";
import { JoinSection } from "@/components/home/join-section";
import { MAIN_CONTENT_ID } from "@/components/layout/skip-link";

/**
 * Ana sayfa sırası: hero (yeni gelenler) → çok satanlar → kampanya bannerı →
 * ayakkabılar / giyim kategori bannerı → hazır kombinler → son baktıkların
 * (yalnızca daha önce ürün gezmiş ziyaretçide) → kombin öner → bize katıl →
 * footer.
 * Ürün ızgaraları ile editorial bannerlar dönüşümlü gider; yeni bir kampanya
 * eklemek için araya bir <CampaignBanner /> koymak yeterli.
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 pb-6 lg:pb-10">
        <HomeHero />
        <BestSellers />
        <NewArrivals />
        <SizeFinder />
        <ShoeCampaign />
        <CategoryTiles />
        <BrandStrip />
        <KombinPanolari />
        <RecentlyViewedOnHome />
        <KombinOner />
        <JoinSection />
      </main>
      <SiteFooter />
    </>
  );
}
