import type { Metadata } from "next";
import { ShopListing } from "@/components/shop/shop-listing";

export const metadata: Metadata = {
  title: "Giyim",
  description: "452WEAR giyim koleksiyonundaki tüm ürünler.",
};

export default function ApparelPage() {
  return <ShopListing category="giyim" />;
}
