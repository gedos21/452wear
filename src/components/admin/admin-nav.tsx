"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Admin bölümleri: giyim/ayakkabı ve 452 Watch ayrı listelenir. Ürün
 * düzenleme sayfası (/admin/urunler/[id]) iki bölümde ortaktır; hangi
 * sekmenin seçili görüneceğini orada geri bağlantısı belli eder.
 */
export function AdminNav() {
  const path = usePathname();
  const watch = path.startsWith("/admin/452-watch");

  const sekme = (aktif: boolean) =>
    cn(
      "relative py-1 micro transition-colors",
      "after:absolute after:inset-x-0 after:-bottom-[17px] after:h-0.5 after:bg-brand after:transition-transform after:content-['']",
      aktif
        ? "text-foreground after:scale-x-100"
        : "text-foreground/45 after:scale-x-0 hover:text-foreground",
    );

  return (
    <nav aria-label="Admin bölümleri" className="flex items-center gap-6">
      <Link href="/admin/urunler" className={sekme(!watch)}>
        Ürünler
      </Link>
      <Link
        href="/admin/452-watch"
        className={cn(sekme(watch), "font-bold")}
        lang="en"
      >
        <span className="nav-accent">452 Watch</span>
      </Link>
    </nav>
  );
}
