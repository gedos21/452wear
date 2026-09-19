import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHero } from "@/components/home/home-hero";
import { BestSellers } from "@/components/home/best-sellers";
import { CategoryTiles } from "@/components/home/category-tiles";
import { KombinOner } from "@/components/home/kombin-oner";
import { JoinSection } from "@/components/home/join-section";

/**
 * Ana sayfa sırası: hero (yeni gelenler) → çok satanlar → ayakkabılar /
 * giyim → kombin öner → bize katıl → footer. Önce ürünler ve alışveriş,
 * sonra kombin deneyimi.
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-6 lg:pb-10">
        <HomeHero />
        <BestSellers />
        <CategoryTiles />
        <KombinOner />
        <JoinSection />
      </main>
      <SiteFooter />
    </>
  );
}
