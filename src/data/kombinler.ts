/**
 * Elle seçilmiş kombin panoları — ana sayfadaki "Kombinler" bölümü ve
 * /kombinler sayfası buradan okur.
 *
 * Parçalar ürün slug'ıyla verilir. Bir parça katalogdan kalkar ya da stoğu
 * biterse o kombin kendiliğinden gizlenir (bkz. lib/kombin-panolari); yeni
 * kombin eklemek için listeye bir satır yeterli.
 */
export type KombinPanosu = {
  slug: string;
  ad: string;
  /** Tek cümlelik tarif: kartın altında görünür. */
  not: string;
  /** Sıra önemli: önce üst/takım, sonra ayakkabı. */
  parcalar: string[];
};

export const KOMBIN_PANOLARI: KombinPanosu[] = [
  {
    slug: "siyah-tech-fleece",
    ad: "Siyah Tech Fleece",
    not: "Baştan sona siyah takım, beyaz Air Force ile kontrast.",
    parcalar: ["nike-tech-fleece-takim-siyah", "af1-beyaz"],
  },
  {
    slug: "drill",
    ad: "Drill",
    not: "Syna World takım ve TN: sahnenin üniforması.",
    parcalar: ["syna-world-tech-fleece-takim", "nike-tn-gri-siyah"],
  },
  {
    slug: "saks-mavisi",
    ad: "Saks Mavisi",
    not: "Canlı mavi takım, mavi detaylı Air Force ile tamamlanıyor.",
    parcalar: ["nike-tech-fleece-takim-saks-mavisi", "af1-mavi-logo"],
  },
  {
    slug: "sp5der-gece",
    ad: "Sp5der Gece",
    not: "Kırmızı ağ baskılı hoodie, siyah Travis Scott AJ1 ile.",
    parcalar: ["sp5der-web-hoodie-siyah", "nike-x-travis-black"],
  },
  {
    slug: "bordo",
    ad: "Bordo",
    not: "Bordo triko kazak, aynı tonda Jordan 1 Low ile.",
    parcalar: ["guess-ucgen-logo-triko-kazak-bordo", "nike-jordan-bordo-siyah"],
  },
  {
    slug: "ekru-triko",
    ad: "Ekru Triko",
    not: "Yarım fermuarlı ekru triko, kahverengi Spezial ile sakin bir görünüm.",
    parcalar: ["gant-yarim-fermuarli-triko-ekru", "spezial-kahverengi"],
  },
];
