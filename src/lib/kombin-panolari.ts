import { KOMBIN_PANOLARI, type KombinPanosu } from "@/data/kombinler";
import { katalogOku } from "@/lib/catalog-store";
import type { Product } from "@/types/product";

export type CozulmusKombin = KombinPanosu & {
  urunler: Product[];
  /** Parçaların güncel fiyatları toplamı. */
  toplam: number;
  /** İndirimsiz fiyatlar toplamı; indirim yoksa toplamla aynı. */
  indirimsizToplam: number;
};

const stokta = (p: Product) => p.variants.some((v) => v.stock > 0);

/**
 * Kombin panolarını katalogla eşleştirir. Parçalarından biri yayında değilse
 * ya da tükendiyse kombin listeye girmez: müşteriye alınamayan bir kombin
 * gösterilmez.
 */
export async function kombinPanolari(): Promise<CozulmusKombin[]> {
  const katalog = await katalogOku();
  const bySlug = new Map(katalog.map((p) => [p.slug, p]));

  return KOMBIN_PANOLARI.flatMap((k) => {
    const urunler = k.parcalar.map((s) => bySlug.get(s));
    if (urunler.some((p) => !p || !stokta(p))) return [];
    const tam = urunler as Product[];
    return [
      {
        ...k,
        urunler: tam,
        toplam: tam.reduce((n, p) => n + p.price, 0),
        indirimsizToplam: tam.reduce(
          (n, p) => n + (p.compareAtPrice ?? p.price),
          0,
        ),
      },
    ];
  });
}
