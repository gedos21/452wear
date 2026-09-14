"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { Container } from "./container";
import { NAV_LINKS } from "./nav-links";
import { useCartUi } from "@/components/cart/cart-provider";
import { useSearch } from "@/components/search/search-provider";
import { CountBadge } from "./count-badge";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";



export function SiteHeader() {
  const [hovered, setHovered] = useState<string | null>(null);
  const pathname = usePathname();
  const { openCart } = useCartUi();
  const { openSearch } = useSearch();
  const { count: cartCount } = useCart();
  const { count: favoriteCount } = useFavorites();
  const { status: authStatus } = useAuth();

  // Aktif sayfa yalnızca ton farkıyla belli olur; ayrı bir vurgu eklenmiyor.
  // Navbar'da sorgulu bağlantı kalmadığı için yol karşılaştırması yeterli:
  // /magaza, kategori filtresi seçiliyken de aktif görünür.
  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <Container className="flex h-14 items-center justify-between gap-6">
        <Link
          href="/"
          className="font-display text-[15px] font-extrabold tracking-[0.18em]"
        >
          452WEAR
        </Link>

        <nav
          className="hidden lg:flex lg:items-center lg:gap-7"
          onMouseLeave={() => setHovered(null)}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onMouseEnter={() => setHovered(link.href)}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "relative py-1 micro transition-colors hover:text-foreground",
                isActive(link.href) ? "text-foreground" : "text-foreground/55",
              )}
            >
              {link.label}
              {hovered === link.href && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-0.5 left-0 right-0 h-px bg-brand"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 md:gap-6">
          {/* Arama: sayfaya gitmez, global arama katmanını açar. */}
          <button
            type="button"
            onClick={openSearch}
            aria-label="Arama"
            className="text-foreground/70 transition-colors hover:text-foreground"
          >
            <Search className="size-[18px] md:hidden" strokeWidth={1.6} />
            <span className="hidden micro md:inline">Arama</span>
          </button>

          <Link
            href="/favoriler"
            aria-label={
              favoriteCount > 0
                ? `Favoriler, ${favoriteCount} ürün`
                : "Favoriler"
            }
            aria-current={isActive("/favoriler") ? "page" : undefined}
            className={cn(
              "relative transition-colors hover:text-foreground",
              isActive("/favoriler") ? "text-foreground" : "text-foreground/70",
            )}
          >
            <Heart className="size-[18px] md:hidden" strokeWidth={1.6} />
            <span className="hidden micro md:inline">Favoriler</span>
            <CountBadge count={favoriteCount} />
          </Link>

          {/* Hesap: oturum durumu ileride buradan farklılaştırılabilir. */}
          <Link
            href="/hesap"
            aria-label={authStatus === "signed-in" ? "Hesabım" : "Hesap"}
            aria-current={isActive("/hesap") ? "page" : undefined}
            className={cn(
              "transition-colors hover:text-foreground",
              isActive("/hesap") ? "text-foreground" : "text-foreground/70",
            )}
          >
            <User className="size-[18px] md:hidden" strokeWidth={1.6} />
            <span className="hidden micro md:inline">Hesap</span>
          </Link>

          {/* Sepet: sayfaya gitmez, sağdan çekmeceyi açar. */}
          <button
            type="button"
            onClick={openCart}
            aria-label={cartCount > 0 ? `Sepet, ${cartCount} ürün` : "Sepet"}
            className="relative text-foreground/70 transition-colors hover:text-foreground"
          >
            <ShoppingBag className="size-[18px] md:hidden" strokeWidth={1.6} />
            <span className="hidden micro md:inline">Sepet</span>
            <CountBadge count={cartCount} />
          </button>
        </div>
      </Container>

      {/* Mobil/tablet: kategoriler ikinci satırda, yatay kaydırmalı */}
      <div className="border-t border-border/60 lg:hidden">
        <Container className="no-scrollbar flex gap-6 overflow-x-auto py-2.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "shrink-0 micro",
                isActive(link.href) ? "text-foreground" : "text-foreground/60",
              )}
            >
              {link.label}
            </Link>
          ))}
        </Container>
      </div>
    </header>
  );
}
