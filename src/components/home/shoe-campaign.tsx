import { categoryHref } from "@/components/layout/nav-links";
import { katalogOku } from "@/lib/catalog-store";
import { discountPercent, isInStock } from "@/lib/product-filters";
import { formatPrice } from "@/lib/format";
import { CampaignBanner } from "./campaign-banner";

/**
 * Ayakkabı kampanyası bannerı. Metin UYDURULMAZ: başlığın altındaki satır
 * katalogdaki gerçek indirimli ayakkabılardan hesaplanır (en düşük fiyat ve
 * en yüksek indirim oranı). Stokta indirimli ayakkabı yoksa banner hiç
 * çizilmez.
 *
 * Kampanya görseli /public/editorial altında durur ve ÜZERİNDE yazı yoktur;
 * başlık ve düğme bannerın kendi HTML'idir.
 */
export async function ShoeCampaign() {
  const indirimli = (await katalogOku()).filter(
    (p) => p.category === "ayakkabi" && isInStock(p) && discountPercent(p),
  );
  if (indirimli.length === 0) return null;

  const enUcuz = Math.min(...indirimli.map((p) => p.price));
  const enYuksekOran = Math.max(
    ...indirimli.map((p) => discountPercent(p) ?? 0),
  );

  return (
    <CampaignBanner
      eyebrow="Kampanya"
      title="Seçili modeller"
      subtitle={`${formatPrice(enUcuz)}'dan başlayan fiyatlarla · %${enYuksekOran}'e varan indirim`}
      cta="Şimdi keşfet"
      href={categoryHref("ayakkabi")}
      image={{
        src: "/editorial/kampanya-ayakkabi.webp",
        alt: "Karanlık bir mağazada taş platformlar üzerinde dizili dört sneaker",
      }}
    />
  );
}
