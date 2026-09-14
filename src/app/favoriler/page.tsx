import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import {
  FavoritesBrowser,
  FavoritesCount,
} from "@/components/favorites/favorites-browser";

export const metadata: Metadata = {
  title: "Favoriler",
  description: "Beğendiğin 452WEAR parçaları.",
};

export default function FavoritesPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
          <Reveal trigger="mount">
            <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              FAVORİLER<span className="text-brand">.</span>
            </h1>
          </Reveal>

          <Reveal trigger="mount" delay={0.06}>
            <FavoritesCount />
          </Reveal>

          <div className="mt-12 sm:mt-16">
            <FavoritesBrowser />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
