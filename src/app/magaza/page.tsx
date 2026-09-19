import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShopListing } from "@/components/shop/shop-listing";
import { CATEGORIES } from "@/data/products";
import {
  CATEGORY_PARAM,
  CATEGORY_ROUTES,
  categoryHref,
} from "@/components/layout/nav-links";
import { isCategoryGroup, type CategoryFilter } from "@/lib/product-filters";

export const metadata: Metadata = {
  title: "Mağaza",
  description: "452WEAR koleksiyonundaki tüm parçalar.",
};

/** URL'deki kategori değerini doğrular; tanınmayan değer "all" sayılır. */
function readCategory(value: string | string[] | undefined): CategoryFilter {
  const slug = Array.isArray(value) ? value[0] : value;
  if (!slug) return "all";
  return CATEGORIES.some((c) => c.slug === slug) || isCategoryGroup(slug)
    ? (slug as CategoryFilter)
    : "all";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const category = readCategory((await searchParams)[CATEGORY_PARAM]);

  // Kendi adresi olan kategoriler (/ayakkabilar, /giyim) oraya yönlenir;
  // eski ?kategori= bağlantıları da çalışmaya devam eder.
  if (category in CATEGORY_ROUTES) redirect(categoryHref(category));

  return <ShopListing category={category} />;
}
