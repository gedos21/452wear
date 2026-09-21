import { promises as fs } from "node:fs";
import path from "node:path";
import { PRODUCTS as SEED, SHOWCASE_SLUG } from "@/data/products";
import type { Product, ProductCategory } from "@/types/product";

/**
 * Katalog kalıcılığı — GELİŞTİRME ORTAMI İÇİN.
 *
 * Projede gerçek bir veritabanı veya CMS yok. Bu modül, koddaki tohum
 * katalogun (src/data/products.ts) üzerine diskteki bir JSON katmanı bindirir:
 *
 *   tohum (kodda, salt okunur)  +  data/catalog.json (admin yazıyor)
 *
 * Böylece mevcut ürünler (p-001, p-006, p-007 dahil) kodda kalmaya devam eder,
 * admin'in eklediği/düzenlediği ürünler ise dosyada saklanır ve sunucu yeniden
 * başlasa da kaybolmaz.
 *
 * SINIR: Bu, dosya sistemine yazılabilen bir ortam gerektirir (yerel `next dev`
 * veya kendi sunucunda `next start`). Vercel benzeri salt-okunur/serverless bir
 * ortamda yazma başarısız olur ve eylem hata döndürür — sahte başarı mesajı
 * göstermiyoruz. Gerçek bir veritabanına geçilince yalnızca bu dosya değişir.
 */

const DOSYA = path.join(process.cwd(), "data", "catalog.json");

type Katman = {
  /** Admin'in eklediği yeni ürünler. */
  eklenen: Product[];
  /** Tohum üründe yapılan değişiklikler: id → ürün. */
  degisen: Record<string, Product>;
  /**
   * Çöp kutusu: silinen ama geri getirilebilen ürünlerin id'leri. Ürünün
   * verisi ve görselleri yerinde durur; yalnızca katalogda gösterilmez.
   */
  cop: string[];
  /**
   * Kalıcı silinen ürünlerin id'leri. Tohum ürün kodda durduğu için burada
   * işaretlenerek kalıcı gizlenir; id'ler yeni bir ürüne verilmez (bkz. yeniId).
   */
  silinen: string[];
  /** Eski slug → ürün id'si: adresi değişen ürünün eski bağlantısı yönlenir. */
  yonlendirmeler: Record<string, string>;
};

async function katmanOku(): Promise<Katman> {
  try {
    const ham = await fs.readFile(DOSYA, "utf8");
    const v = JSON.parse(ham) as Partial<Katman>;
    return {
      eklenen: v.eklenen ?? [],
      degisen: v.degisen ?? {},
      cop: v.cop ?? [],
      silinen: v.silinen ?? [],
      yonlendirmeler: v.yonlendirmeler ?? {},
    };
  } catch (e) {
    // Dosya yoksa katman boştur; başka bir hata varsa yut­mayalım.
    if ((e as NodeJS.ErrnoException).code === "ENOENT")
      return {
        eklenen: [],
        degisen: {},
        cop: [],
        silinen: [],
        yonlendirmeler: {},
      };
    throw e;
  }
}

async function katmanYaz(k: Katman): Promise<void> {
  await fs.mkdir(path.dirname(DOSYA), { recursive: true });
  // Boş listeler dosyaya yazılmaz; dosya elle okunurken sade kalsın.
  const veri: Partial<Katman> = { eklenen: k.eklenen, degisen: k.degisen };
  if (k.cop.length > 0) veri.cop = k.cop;
  if (k.silinen.length > 0) veri.silinen = k.silinen;
  if (Object.keys(k.yonlendirmeler).length > 0)
    veri.yonlendirmeler = k.yonlendirmeler;
  await fs.writeFile(DOSYA, JSON.stringify(veri, null, 2) + "\n", "utf8");
}

/** Kalıcı silinmemiş tüm ürünler (çöp kutusundakiler dahil), güncel halleriyle. */
function tumUrunler(k: Katman): Product[] {
  const silinen = new Set(k.silinen);
  const tohum = SEED.filter((p) => !silinen.has(p.id)).map(
    (p) => k.degisen[p.id] ?? p,
  );
  return [...tohum, ...k.eklenen.filter((p) => !silinen.has(p.id))];
}

/** Yayındaki ürünler: kalıcı silinenler ve çöp kutusundakiler hariç. */
function yayindakiler(k: Katman): Product[] {
  const cop = new Set(k.cop);
  return tumUrunler(k).filter((p) => !cop.has(p.id));
}

/** Tohum + admin katmanı birleşmiş canlı katalog. */
export async function katalogOku(): Promise<Product[]> {
  return yayindakiler(await katmanOku());
}

export async function urunBul(id: string): Promise<Product | null> {
  return (await katalogOku()).find((p) => p.id === id) ?? null;
}

/**
 * Slug'a karşılık gelen yayındaki ürün. Slug ürünün eski adresiyse ürün yine
 * döner ve `yonlendir` true olur; çağıran taraf yeni adrese yönlendirir.
 */
export async function slugIleUrun(
  slug: string,
): Promise<{ urun: Product | null; yonlendir: boolean }> {
  const k = await katmanOku();
  const urunler = yayindakiler(k);
  const dogrudan = urunler.find((p) => p.slug === slug);
  if (dogrudan) return { urun: dogrudan, yonlendir: false };
  const id = k.yonlendirmeler[slug];
  const hedef = id ? urunler.find((p) => p.id === id) : undefined;
  return { urun: hedef ?? null, yonlendir: Boolean(hedef) };
}

/** Ürünü ekler veya günceller. Tohum ürünler dosyada override edilir. */
export async function urunYaz(urun: Product): Promise<void> {
  const k = await katmanOku();
  // Adres değiştiyse eski slug yeni adrese yönlendirilir; yeni slug artık
  // gerçek bir ürün adresi olduğu için yönlendirmelerden düşer.
  const onceki = tumUrunler(k).find((p) => p.id === urun.id);
  if (onceki && onceki.slug !== urun.slug)
    k.yonlendirmeler[onceki.slug] = urun.id;
  delete k.yonlendirmeler[urun.slug];

  const tohumMu = SEED.some((p) => p.id === urun.id);
  if (tohumMu) {
    k.degisen[urun.id] = urun;
  } else {
    const i = k.eklenen.findIndex((p) => p.id === urun.id);
    if (i >= 0) k.eklenen[i] = urun;
    else k.eklenen.push(urun);
  }
  await katmanYaz(k);
}

/** Ürünü çöp kutusuna taşır: katalogdan kalkar, verisi ve görselleri durur. */
export async function copeTasi(id: string): Promise<Product | null> {
  const k = await katmanOku();
  const urun = yayindakiler(k).find((p) => p.id === id);
  if (!urun) return null;
  k.cop.push(id);
  await katmanYaz(k);
  return urun;
}

/** Çöp kutusundaki ürünler; en son silinen başta. */
export async function copKutusu(): Promise<Product[]> {
  const k = await katmanOku();
  const urunler = tumUrunler(k);
  return [...k.cop]
    .reverse()
    .map((id) => urunler.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
}

/** Çöp kutusundaki ürünü kataloğa geri getirir. */
export async function copKutusundanGeriGetir(
  id: string,
): Promise<Product | null> {
  const k = await katmanOku();
  if (!k.cop.includes(id)) return null;
  const urun = tumUrunler(k).find((p) => p.id === id) ?? null;
  k.cop = k.cop.filter((x) => x !== id);
  await katmanYaz(k);
  return urun;
}

/**
 * Çöp kutusundaki ürünü kalıcı siler ve silinen ürünü döndürür (dosya
 * temizliği için). Admin ürünü dosyadan çıkar; tohum ürün kodda durduğu için
 * kalıcı gizlenir. İki durumda da id `silinen` listesine girer ve bir daha
 * kullanılmaz.
 */
export async function kaliciSil(id: string): Promise<Product | null> {
  const k = await katmanOku();
  if (!k.cop.includes(id)) return null;
  const urun = tumUrunler(k).find((p) => p.id === id) ?? null;
  k.cop = k.cop.filter((x) => x !== id);
  k.eklenen = k.eklenen.filter((p) => p.id !== id);
  delete k.degisen[id];
  if (!k.silinen.includes(id)) k.silinen.push(id);
  for (const [eski, hedef] of Object.entries(k.yonlendirmeler))
    if (hedef === id) delete k.yonlendirmeler[eski];
  await katmanYaz(k);
  return urun;
}

/**
 * Yeni ürün id'si (p-NNN): şimdiye kadar kullanılmış en büyük numaranın bir
 * fazlası. Aradaki boşluklar ve silinen id'ler BİLEREK kullanılmaz:
 *   • silinmiş bir ürünün id'si tarayıcılardaki sepet/favorilerde kalmış
 *     olabilir; yeni ürüne verilirse orada başka bir ürün olarak dirilir,
 *   • public/ altında o numarayla başlayan dosyalar olabilir (ör. p-005-b.png
 *     p-009'un görseli) ve yeni ürünle karışır.
 * Bu yüzden katalogdaki ve silinen id'lerin yanında public/products altındaki
 * dosya adlarına da bakılır.
 */
export async function yeniId(): Promise<string> {
  const k = await katmanOku();
  const adlar = [
    ...SEED.map((p) => p.id),
    ...k.eklenen.map((p) => p.id),
    ...k.silinen,
  ];
  try {
    const dosyalar = await fs.readdir(
      path.join(process.cwd(), "public", "products"),
      { recursive: true },
    );
    adlar.push(...dosyalar.map((d) => path.basename(d)));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  const enBuyuk = Math.max(
    0,
    ...adlar.map((ad) => Number(/^p-(\d+)(?=[-.]|$)/.exec(ad)?.[1] ?? 0)),
  );
  return `p-${String(enBuyuk + 1).padStart(3, "0")}`;
}

/** Ürün adından slug — Türkçe karakterler sadeleştirilir. */
export function slugYap(ad: string): string {
  const harita: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    Ç: "c",
    Ğ: "g",
    İ: "i",
    I: "i",
    Ö: "o",
    Ş: "s",
    Ü: "u",
  };
  return ad
    .split("")
    .map((c) => harita[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Bu slug'ı kullanan başka bir ürün (haricId dışında) varsa onu döndürür.
 * Çöp kutusundakiler de sayılır: geri getirildiklerinde adresleri çakışmasın.
 */
export async function slugSahibi(
  slug: string,
  haricId: string,
): Promise<Product | null> {
  return (
    tumUrunler(await katmanOku()).find(
      (p) => p.slug === slug && p.id !== haricId,
    ) ?? null
  );
}

/** Addan üretilen slug başka üründe varsa sonuna -2, -3… eklenir. */
export async function bosSlug(taban: string, haricId: string): Promise<string> {
  const dolu = new Set(
    tumUrunler(await katmanOku())
      .filter((p) => p.id !== haricId)
      .map((p) => p.slug),
  );
  if (!dolu.has(taban)) return taban;
  for (let n = 2; ; n++) if (!dolu.has(`${taban}-${n}`)) return `${taban}-${n}`;
}

/* ---- Sunucu tarafı okuma yardımcıları (canlı katalog) ---- */

/**
 * Yayındaki ürünler, en yeni önce: admin'in eklediği ürünler en yeniden
 * eskiye, ardından tohum katalog kendi sırasıyla.
 */
function enYeniOnce(k: Katman): Product[] {
  const yayinda = yayindakiler(k);
  const eklenenIdler = new Set(k.eklenen.map((p) => p.id));
  const eklenen = yayinda.filter((p) => eklenenIdler.has(p.id)).reverse();
  const tohum = yayinda.filter((p) => !eklenenIdler.has(p.id));
  return [...eklenen, ...tohum];
}

/**
 * Ana sayfa "Çok satanlar" için elle seçilmiş ürünler (slug). Satış verisi
 * henüz yok (sipariş servisi bağlı değil, bkz. lib/orders.ts), bu yüzden bir
 * satış sıralaması uydurulmaz.
 */
const COK_SATAN_SECIMI = [
  "vans-siyah-beyaz",
  "oversize-tisort",
  "jordan-4-yeni",
  "kapusonlu-sweatshirt",
];

/**
 * "Çok satanlar" listesi. Şimdilik seçim listesindeki yayındaki ürünler;
 * eksik kalırsa katalogdaki diğer ürünlerle tamamlanır. Gerçek satış verisi
 * bağlandığında yalnızca bu fonksiyon satış adedine göre sıralayacak şekilde
 * değişir; ana sayfa bileşeni aynı kalır.
 */
export async function cokSatanlar(limit = 4): Promise<Product[]> {
  const urunler = await katalogOku();
  const stokta = urunler.filter((p) => p.variants.some((v) => v.stock > 0));
  const secilen = COK_SATAN_SECIMI.map((slug) =>
    stokta.find((p) => p.slug === slug),
  ).filter((p) => p !== undefined);
  // Seçimdeki bir ürün satıştan kalkarsa yeri stoktaki başka ürünle dolar;
  // vitrin hiçbir zaman eksik ya da tükenmiş ürünle çıkmaz.
  const kalan = stokta.filter((p) => !secilen.includes(p));
  return [...secilen, ...kalan].slice(0, limit);
}

/** "Yeni" işaretli ürünler, en yenisi başta (hero vitrininin yedeği). */
export async function yeniGelenler(limit = 4): Promise<Product[]> {
  return enYeniOnce(await katmanOku())
    .filter((p) => p.isNew)
    .slice(0, limit);
}

/**
 * Ana sayfa kategori vitrini: kategorinin stokta olan ürünleri, en yeni
 * eklenen başta.
 */
export async function kategoriVitrini(
  kategori: ProductCategory,
  limit = 3,
): Promise<Product[]> {
  return enYeniOnce(await katmanOku())
    .filter(
      (p) => p.category === kategori && p.variants.some((v) => v.stock > 0),
    )
    .slice(0, limit);
}

/**
 * Ana sayfa kombin vitrini: birlikte giyilecek üç parça. Her biri kendi
 * grubunun stokta olan en yeni ürünü: üst (tişört/sweatshirt/hırka), eşofman,
 * ayakkabı. Grubunda ürün olmayan parça atlanır. Hemen üstteki ayakkabı
 * vitrininde görünen ürünler, başka seçenek varsa tekrar gösterilmez.
 */
export async function kombinVitrini(): Promise<Product[]> {
  const urunler = enYeniOnce(await katmanOku()).filter((p) =>
    p.variants.some((v) => v.stock > 0),
  );
  const vitrinde = new Set(
    (await kategoriVitrini("ayakkabi", 3)).map((p) => p.id),
  );
  const gruplar: ProductCategory[][] = [
    ["tisort", "sweatshirt", "hirka"],
    ["esofman"],
    ["ayakkabi"],
  ];
  return gruplar.flatMap((grup) => {
    const aday = urunler.filter((p) => grup.includes(p.category));
    const urun = aday.find((p) => !vitrinde.has(p.id)) ?? aday[0];
    return urun ? [urun] : [];
  });
}

/**
 * "Sana Özel" bölümünün ürünü. Şimdilik sabit bir kural: yayındaki katalogun
 * ikinci ürünü (tohum katalogda Kapüşonlu Sweatshirt). İleride kullanıcının
 * gezdiği / favorilediği / sepetindeki ürüne göre belirlenecek. Katalog boşsa
 * null döner ve bölüm çizilmez.
 */
export async function sanaOzel(): Promise<Product | null> {
  const urunler = await katalogOku();
  return urunler[1] ?? urunler[0] ?? null;
}

/**
 * Hero vitrininin ürünü: katalogdaki gerçek kayıt, böylece fiyatı ve bağlantısı
 * hep güncel. Vitrin ürünü yayında değilse ilk yeni gelen, o da yoksa ilk ürün
 * gösterilir; katalog boşsa null.
 */
export async function vitrinUrunu(): Promise<Product | null> {
  const urunler = await katalogOku();
  return (
    urunler.find((p) => p.slug === SHOWCASE_SLUG) ??
    (await yeniGelenler(1))[0] ??
    urunler[0] ??
    null
  );
}
