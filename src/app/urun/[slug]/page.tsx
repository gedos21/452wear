import { notFound, redirect } from "next/navigation";
import { PRODUCT_PARAM } from "@/components/layout/nav-links";
import { katalogOku } from "@/lib/catalog-store";

/**
 * Ürün bağlantısı. Ayrı bir ürün sayfası yok: ürün detayı mağazadaki panelde
 * gösterilir. Bu rota yeni sekmede açılan kart bağlantılarını, "Keşfet"
 * düğmelerini ve paylaşılan linkleri mağazaya, ürün paneli açık olarak
 * yönlendirir. Katalogda olmayan slug 404 döner.
 */
export default async function UrunBaglantisi({
  params,
}: PageProps<"/urun/[slug]">) {
  const { slug } = await params;
  const urun = (await katalogOku()).find((p) => p.slug === slug);
  if (!urun) notFound();
  redirect(`/magaza?${PRODUCT_PARAM}=${encodeURIComponent(urun.slug)}`);
}
