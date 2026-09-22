"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { Container } from "./container";
import { DesktopNav, MobileMenu } from "./nav-menu";
import { useCartUi } from "@/components/cart/cart-provider";
import { useSearch } from "@/components/search/search-provider";
import { CountBadge } from "./count-badge";
import {
  useCartLines,
  useFavoriteProducts,
} from "@/components/product/catalog-provider";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * İkonların dokunma alanı: görünmez bir kenar ile büyür (ikonlar arası
 * boşluk sayesinde birbirine binmez). Görünüm aynı.
 */
const DOKUNMA = "after:absolute after:-inset-2 after:content-['']";

const ICON = "size-[21px] lg:size-6";
const ICON_STROKE = 1.8;

export function SiteHeader() {
  const pathname = usePathname();
  const { openCart } = useCartUi();
  const { openSearch } = useSearch();
  // Sayaçlar, çekmece ve favoriler sayfasıyla aynı çözülmüş listeden gelir.
  const { count: cartCount } = useCartLines();
  const favoriteCount = useFavoriteProducts().length;
  const { status: authStatus } = useAuth();

  const isActive = (href: string) => pathname === href;

  const iconLink = (active: boolean) =>
    cn(
      "relative transition-colors hover:text-brand",
      DOKUNMA,
      active ? "text-brand" : "text-foreground",
    );

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.08] bg-white">
      {/* Masaüstünde üç sütun: logo | ortalanmış navigasyon | ikonlar */}
      <Container className="flex h-16 max-w-[1440px] items-center justify-between gap-4 lg:grid lg:h-20 lg:grid-cols-[1fr_auto_1fr] lg:gap-8 xl:px-12">
        <div className="flex items-center gap-3">
          <MobileMenu pathname={pathname} />
          <Link
            href="/"
            onClick={(e) => {
              // Zaten ana sayfadaysa gidecek yer yok: sayfanın başına döner.
              if (pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            aria-label="452WEAR ana sayfa"
            className="flex items-center"
          >
            {/* Marka logosu. Harf biçimleri orijinal görselden; yalnızca
                kenarlardaki şeffaf pay kırpıldı ve WEAR'ın mürekkebi koyuya
                çevrildi — beyaz başlıkta beyaz yazı okunmuyordu. Beyaz WEAR'lı
                hâli public/logo/452wear-logo.webp olarak duruyor (koyu zemin).
                alt boş: bağlantının aria-label'ı zaten okunuyor. */}
            <Image
              src="/logo/452wear-logo-koyu.webp"
              alt=""
              width={1572}
              height={191}
              priority
              className="h-[18px] w-auto min-[375px]:h-5 lg:h-6"
            />
          </Link>
        </div>

        <DesktopNav pathname={pathname} />

        {/* 375px altında (ör. 320px) sığması için boşluklar biraz daralır. */}
        <div className="flex items-center justify-end gap-3.5 min-[375px]:gap-4 sm:gap-5 lg:gap-7">
          {/* Arama: sayfaya gitmez, global arama katmanını açar. */}
          <button
            type="button"
            onClick={openSearch}
            aria-label="Arama"
            className={iconLink(false)}
          >
            <Search className={ICON} strokeWidth={ICON_STROKE} />
          </button>

          <Link
            href="/favoriler"
            aria-label={
              favoriteCount > 0
                ? `Favoriler, ${favoriteCount} ürün`
                : "Favoriler"
            }
            aria-current={isActive("/favoriler") ? "page" : undefined}
            className={iconLink(isActive("/favoriler"))}
          >
            <Heart className={ICON} strokeWidth={ICON_STROKE} />
            <CountBadge count={favoriteCount} />
          </Link>

          {/* Hesap: oturum durumu ileride buradan farklılaştırılabilir. */}
          <Link
            href="/hesap"
            aria-label={authStatus === "signed-in" ? "Hesabım" : "Hesap"}
            aria-current={isActive("/hesap") ? "page" : undefined}
            className={iconLink(isActive("/hesap"))}
          >
            <User className={ICON} strokeWidth={ICON_STROKE} />
          </Link>

          {/* Sepet: sayfaya gitmez, sağdan çekmeceyi açar. */}
          <button
            type="button"
            onClick={openCart}
            aria-label={cartCount > 0 ? `Sepet, ${cartCount} ürün` : "Sepet"}
            className={iconLink(false)}
          >
            <ShoppingBag className={ICON} strokeWidth={ICON_STROKE} />
            <CountBadge count={cartCount} />
          </button>
        </div>
      </Container>
    </header>
  );
}
