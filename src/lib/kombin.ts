import { normalize } from "@/lib/product-search";
import type { Product, ProductCategory } from "@/types/product";

/**
 * Kombin öner motoru — saf fonksiyonlar, React'ten bağımsız.
 *
 * KURAL: Ürün uydurulmaz. Kombin yalnızca katalogdaki, en az bir bedeni
 * STOKTA olan ürünlerden kurulur; fiyat ve ad ürünün kendi verisinden gelir.
 * Uygun kombin çıkmazsa null döner ve arayüz bunu açıkça söyler.
 */

export type Tarz = "streetwear" | "oversize" | "y2k" | "gunluk" | "basic";
export type KombinTuru = "gunluk" | "ust-alt" | "ayakkabi-ust" | "tam";

/** Bütçe üst sınırı (TL); null = fark etmez. */
export type Butce = number | null;

export type Cevaplar = {
  tarz: Tarz;
  tur: KombinTuru;
  /** Seçilen renk adları; boş dizi = fark etmez. */
  renkler: string[];
  butce: Butce;
};

/* ---------------- Sorular (arayüz bunları çizer) ---------------- */

export const TARZ_SECENEKLERI: { deger: Tarz; etiket: string }[] = [
  { deger: "streetwear", etiket: "Streetwear" },
  { deger: "oversize", etiket: "Oversize" },
  { deger: "y2k", etiket: "Y2K" },
  { deger: "gunluk", etiket: "Günlük" },
  { deger: "basic", etiket: "Basic" },
];

export const TUR_SECENEKLERI: {
  deger: KombinTuru;
  etiket: string;
  aciklama: string;
}[] = [
  { deger: "gunluk", etiket: "Günlük kombin", aciklama: "Üst + alt, bütçe yeterse ayakkabı" },
  { deger: "ust-alt", etiket: "Üst + alt", aciklama: "İki parça" },
  { deger: "ayakkabi-ust", etiket: "Ayakkabı + üst", aciklama: "İki parça" },
  { deger: "tam", etiket: "Tam kombin", aciklama: "Üst + alt + ayakkabı" },
];

/** Renk seçenekleri; "Fark etmez" arayüzde boş seçime karşılık gelir. */
export const RENK_SECENEKLERI = [
  "Siyah",
  "Beyaz",
  "Gri",
  "Lacivert",
  "Kahverengi",
  "Bej",
] as const;

export const BUTCE_SECENEKLERI: { deger: Butce; etiket: string }[] = [
  { deger: 1500, etiket: "₺1.500 altı" },
  { deger: 2500, etiket: "₺2.500 altı" },
  { deger: 3500, etiket: "₺3.500 altı" },
  { deger: 5000, etiket: "₺5.000 altı" },
  { deger: null, etiket: "Fark etmez" },
];

/* ---------------- Eşleştirme ---------------- */

/** Kombindeki yuvalar. Ayakkabı ayrı; üst ve alt kategori gruplarıdır. */
type Yuva = "ust" | "alt" | "ayakkabi";

const YUVA_KATEGORILERI: Record<Yuva, ProductCategory[]> = {
  ust: ["tisort", "sweatshirt", "hirka"],
  alt: ["esofman"],
  ayakkabi: ["ayakkabi"],
};

/** Kombin türü → hangi yuvalar zorunlu, hangisi bütçe yeterse eklenir. */
const TUR_YUVALARI: Record<
  KombinTuru,
  { zorunlu: Yuva[]; istege_bagli: Yuva[] }
> = {
  tam: { zorunlu: ["ust", "alt", "ayakkabi"], istege_bagli: [] },
  "ust-alt": { zorunlu: ["ust", "alt"], istege_bagli: [] },
  "ayakkabi-ust": { zorunlu: ["ust", "ayakkabi"], istege_bagli: [] },
  gunluk: { zorunlu: ["ust", "alt"], istege_bagli: ["ayakkabi"] },
};

/**
 * Tarz sinyalleri: ürünün ADINDA ve AÇIKLAMASINDA aranan kelimeler. Veride
 * ayrı bir stil/etiket alanı yok; bu yüzden uydurma bir etiket üretmek yerine
 * mevcut metinden okunur. Eşleşme yoksa ürün elenmez, yalnızca öne çıkmaz.
 */
const TARZ_KELIMELERI: Record<Tarz, string[]> = {
  streetwear: ["kargo", "oversize", "kapüşon", "hoodie", "jogger", "sneaker", "dunk", "jordan", "sb", "baggy"],
  oversize: ["oversize", "bol", "geniş", "salaş"],
  y2k: ["y2k", "baggy", "retro", "vintage", "yıkanmış", "acid"],
  gunluk: ["günlük", "rahat", "basic", "jogger", "tişört"],
  basic: ["basic", "düz", "sade", "klasik"],
};

/**
 * Nötr renkler birbiriyle uyumlu sayılır: siyah seçen birine beyaz/gri/lacivert
 * bir parça da önerilebilir. Liste bilerek kısa — ilk sürümde basit bir uyum.
 */
const NOTRLER = [
  "siyah",
  "beyaz",
  "gri",
  "lacivert",
  "bej",
  "kahverengi",
  "kemik",
  "antrasit",
  "kırık beyaz",
];

const notrMu = (renk: string) => NOTRLER.includes(normalize(renk));

/** En az bir bedeni stokta mı. */
export function stokta(product: Product): boolean {
  return product.variants.some((v) => v.stock > 0);
}

/** Ürünün stokta olan renk adları. */
function stoktakiRenkler(product: Product): string[] {
  return [
    ...new Set(product.variants.filter((v) => v.stock > 0).map((v) => v.color)),
  ];
}

/**
 * Ürünün cevaplara göre puanı. Yüksek puan = daha uygun.
 * Hiçbir kriter ürünü elemez (stok hariç); yalnızca sıralamayı değiştirir.
 */
export function urunPuani(product: Product, cevaplar: Cevaplar): number {
  let puan = 0;

  const metin = normalize(`${product.name} ${product.description}`);
  const isabet = TARZ_KELIMELERI[cevaplar.tarz].filter((k) =>
    metin.includes(normalize(k)),
  ).length;
  puan += Math.min(isabet * 3, 6);

  if (cevaplar.renkler.length > 0) {
    const renkler = stoktakiRenkler(product).map(normalize);
    const secilen = cevaplar.renkler.map(normalize);
    if (renkler.some((r) => secilen.includes(r))) puan += 5;
    else if (renkler.some(notrMu) && secilen.some((r) => notrMu(r))) puan += 2;
    else puan -= 2;
  }

  if (product.isNew) puan += 1;
  return puan;
}

export type Kombin = {
  parcalar: Product[];
  toplam: number;
};

/**
 * Seçilen tarza en uygun, stokta olan birkaç ürün — ilk adımdaki küçük
 * önizleme için. Kombin kurmaz, yalnızca aynı puanlamayla sıralar; mümkün
 * olduğunca farklı kategorilerden seçer ki önizleme tek tip olmasın.
 */
export function tarzOrnekleri(
  products: Product[],
  tarz: Tarz,
  limit = 3,
): Product[] {
  const cevaplar: Cevaplar = { tarz, tur: "tam", renkler: [], butce: null };
  const sirali = products
    .filter(stokta)
    .map((p) => ({ p, puan: urunPuani(p, cevaplar) }))
    .sort((a, b) => b.puan - a.puan || a.p.price - b.p.price)
    .map((x) => x.p);

  const secilen: Product[] = [];
  const kategoriler = new Set<string>();
  for (const urun of sirali) {
    if (secilen.length >= limit) break;
    if (kategoriler.has(urun.category)) continue;
    secilen.push(urun);
    kategoriler.add(urun.category);
  }
  // Kategori çeşitliliği yetmediyse kalan yerler sıradan doldurulur.
  for (const urun of sirali) {
    if (secilen.length >= limit) break;
    if (!secilen.includes(urun)) secilen.push(urun);
  }
  return secilen;
}

/** Yuvaya uyan, stokta olan ürünler; puana göre sıralı. */
function adaylar(
  products: Product[],
  yuva: Yuva,
  cevaplar: Cevaplar,
): Product[] {
  return products
    .filter(
      (p) => YUVA_KATEGORILERI[yuva].includes(p.category) && stokta(p),
    )
    .map((p) => ({ p, puan: urunPuani(p, cevaplar) }))
    .sort((a, b) => b.puan - a.puan || a.p.price - b.p.price)
    .map((x) => x.p);
}

/** Her yuvadan değerlendirilecek aday sayısı (kombinasyon sayısını sınırlar). */
const ADAY_SINIRI = 10;

/**
 * Puanı yüksek adaylar pahalı olabilir; yalnızca ilk ADAY_SINIRI ürüne bakmak
 * düşük bütçede "kombin kurulamadı" demeye yol açar. Bu yüzden havuza en ucuz
 * birkaç aday da eklenir — bütçe dar olduğunda kombin yine de çıkar.
 */
const UCUZ_ADAY = 3;

function havuzKur(liste: Product[]): Product[] {
  const secim = liste.slice(0, ADAY_SINIRI);
  const enUcuzlar = [...liste].sort((a, b) => a.price - b.price).slice(0, UCUZ_ADAY);
  for (const urun of enUcuzlar) {
    if (!secim.some((p) => p.id === urun.id)) secim.push(urun);
  }
  return secim;
}

/**
 * Cevaplara uyan kombini kurar.
 *
 * Zorunlu yuvaların her biri için en iyi adaylar denenir; bütçeyi aşmayan
 * kombinasyonlar arasından toplam puanı en yüksek olan seçilir. `varyasyon`
 * artırılırsa sıradaki en iyi kombin döner ("başka bir kombin öner").
 * Bütçeye sığan kombin yoksa null döner.
 */
export function kombinKur(
  products: Product[],
  cevaplar: Cevaplar,
  varyasyon = 0,
): Kombin | null {
  const { zorunlu, istege_bagli } = TUR_YUVALARI[cevaplar.tur];

  const havuz = zorunlu.map((y) => havuzKur(adaylar(products, y, cevaplar)));
  if (havuz.some((liste) => liste.length === 0)) return null;

  const butce = cevaplar.butce;
  const secenekler: { parcalar: Product[]; toplam: number; puan: number }[] = [];

  const gez = (i: number, secim: Product[], toplam: number, puan: number) => {
    if (butce !== null && toplam > butce) return;
    if (i === havuz.length) {
      secenekler.push({ parcalar: [...secim], toplam, puan });
      return;
    }
    for (const urun of havuz[i]) {
      gez(
        i + 1,
        [...secim, urun],
        toplam + urun.price,
        puan + urunPuani(urun, cevaplar),
      );
    }
  };
  gez(0, [], 0, 0);

  if (secenekler.length === 0) return null;

  // Puan önce; eşitlikte bütçeden geriye daha çok kalan kombin.
  secenekler.sort((a, b) => b.puan - a.puan || a.toplam - b.toplam);
  const secilen = secenekler[varyasyon % secenekler.length];

  const parcalar = [...secilen.parcalar];
  let toplam = secilen.toplam;

  // İsteğe bağlı yuva (günlük kombinde ayakkabı): yalnızca bütçeye sığarsa.
  for (const yuva of istege_bagli) {
    const kalan = butce === null ? Infinity : butce - toplam;
    const ek = adaylar(products, yuva, cevaplar).find(
      (p) => p.price <= kalan && !parcalar.some((s) => s.id === p.id),
    );
    if (ek) {
      parcalar.push(ek);
      toplam += ek.price;
    }
  }

  return { parcalar, toplam };
}
