import type { Metadata } from "next";
import { ShopListing } from "@/components/shop/shop-listing";

export const metadata: Metadata = {
  title: "Ayakkabılar",
  description: "452WEAR ayakkabı koleksiyonundaki tüm ürünler.",
};

export default function ShoesPage() {
  return <ShopListing category="ayakkabi" />;
}
