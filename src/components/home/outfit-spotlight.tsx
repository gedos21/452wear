import { kombinVitrini } from "@/lib/catalog-store";
import { EditorialSpotlight } from "./editorial-spotlight";

/**
 * Kombinler vitrini: editorial görsel sağda, solda katalogdan kurulmuş hazır
 * bir kombin (üst + eşofman + ayakkabı). Bağlantılar kombin sihirbazına gider.
 */
export async function OutfitSpotlight() {
  const products = await kombinVitrini();

  return (
    <EditorialSpotlight
      ters
      href="/kombinini-bul"
      title="KOMBİNLER"
      subtitle="Birbirini tamamlayan parçalar"
      cta="Kombinini bul"
      image={{
        src: "/editorial/kombinler.webp",
        alt: "452WEAR kombinleri: askıda duran dört tam kombin ve sneaker'ları",
      }}
      products={products}
    />
  );
}
