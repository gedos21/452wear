import type { Metadata } from "next";
import { ShopListing } from "@/components/shop/shop-listing";
import { BRAND_PARAM, MODEL_PARAM } from "@/components/layout/nav-links";

export const metadata: Metadata = {
  title: "Ayakkabılar",
  description: "452WEAR ayakkabı koleksiyonundaki tüm ürünler.",
};

/** Tek değer okur; dizi gelirse ilki alınır. */
function tek(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ShoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // ?marka= / ?model= navbar menüsünden gelir; tanınmayan değer yok sayılır.
  const params = await searchParams;

  return (
    <ShopListing
      category="ayakkabi"
      brand={tek(params[BRAND_PARAM])}
      model={tek(params[MODEL_PARAM])}
    />
  );
}
