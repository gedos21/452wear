import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { SHOWCASE_SLUG } from "@/data/products";
import type { Product, ProductColor, ProductImage, ShoeSize } from "@/types/product";
import { OWN_BRAND, productBrand } from "@/lib/product-filters";
import { SHOE_SIZES } from "@/lib/product-variants";
import { getDb, schema } from "@/lib/server/db";

/**
 * Katalog kalıcılığı — Neon Postgres (bkz. lib/server/db/schema.ts: product,
 * product_variant, product_redirect).
 *
 * Site tarafı okumaları (katalogOku, slugIleUrun…) Next önbelleğinden gelir ve
 * "katalog" etiketiyle tazelenir: admin bir ürünü değiştirince
 * `updateTag(KATALOG_ETIKETI)` çağrılır (bkz. app/admin/actions.ts). Admin'in
 * kendi okumaları (urunBul, copKutusu, slug kontrolleri) her zaman tazedir.
 *
 * Ürün durumları: "yayinda" | "cop" (çöp kutusu) | "silindi" (kalıcı silindi;
 * satır, id'si yeni ürüne verilmesin diye kalır, hiçbir listede görünmez).
 */

export const KATALOG_ETIKETI = "katalog";

const { product, productVariant, productRedirect } = schema;

type UrunSatiri = typeof product.$inferSelect;
type VaryantSatiri = typeof productVariant.$inferSelect;

function urunYap(r: UrunSatiri, varyantlar: VaryantSatiri[]): Product {
  const p: Product = {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    category: r.category as Product["category"],
    price: r.price,
    currency: "TRY",
    images: r.images as ProductImage[],
    colors: r.colors as ProductColor[],
    variants: varyantlar
      .sort((a, b) => a.sira - b.sira)
      .map((v) => ({
        id: v.id,
        size: v.size as Product["variants"][number]["size"],
        color: v.color,
        stock: v.stock,
      })),
    isNew: r.isNew,
  };
  if (r.brand) p.brand = r.brand;
  if (r.model) p.model = r.model;
  if (r.fit === "dar" || r.fit === "oversize" || r.fit === "normal") p.fit = r.fit;
  if (r.compareAtPrice != null) p.compareAtPrice = r.compareAtPrice;
  if (r.complementaryIds?.length) p.complementaryIds = r.complementaryIds;
  if (r.relatedIds?.length) p.relatedIds = r.relatedIds;
  return p;
}

/** Verilen durumlardaki ürünler, katalog sırasıyla (her zaman taze). */
async function urunleriOku(durumlar: string[]): Promise<(Product & { _satir: UrunSatiri })[]> {
  const db = getDb();
  const satirlar = await db
    .select()
    .from(product)
    .where(inArray(product.durum, durumlar))
    .orderBy(asc(product.sira));
  if (satirlar.length === 0) return [];
  const varyantlar = await db
    .select()
    .from(productVariant)
    .where(inArray(productVariant.productId, satirlar.map((s) => s.id)));
  const grup = new Map<string, VaryantSatiri[]>();
  for (const v of varyantlar) {
    const liste = grup.get(v.productId) ?? [];
    liste.push(v);
    grup.set(v.productId, liste);
  }
  return satirlar.map((s) => ({ ...urunYap(s, grup.get(s.id) ?? []), _satir: s }));
}

function temizle(p: Product & { _satir?: UrunSatiri }): Product {
  const { _satir, ...urun } = p;
  void _satir;
  return urun;
}

/* ---------------- Site tarafı (önbellekli) ---------------- */

/**
 * Yayındaki ürünler, iki sıralamayla: katalog sırası ve "en yeni önce"
 * (admin'in eklediği ürünler en yeniden eskiye, ardından ilk katalog).
 */
const yayindakiOnbellek = unstable_cache(
  async () => {
    const urunler = await urunleriOku(["yayinda"]);
    const eklenen = urunler.filter((p) => !p._satir.tohum).reverse();
    const tohum = urunler.filter((p) => p._satir.tohum);
    return {
      katalog: urunler.map(temizle),
      enYeni: [...eklenen, ...tohum].map(temizle),
    };
  },
  ["katalog-yayinda"],
  { tags: [KATALOG_ETIKETI] },
);

const yonlendirmeOnbellek = unstable_cache(
  async () => {
    const satirlar = await getDb().select().from(productRedirect);
    return Object.fromEntries(satirlar.map((r) => [r.slug, r.productId]));
  },
  ["katalog-yonlendirme"],
  { tags: [KATALOG_ETIKETI] },
);

/** Yayındaki katalog (istek başına bir kez okunur). */
export const katalogOku = cache(async (): Promise<Product[]> => {
  return (await yayindakiOnbellek()).katalog;
});

/**
 * Slug'a karşılık gelen yayındaki ürün. Slug ürünün eski adresiyse ürün yine
 * döner ve `yonlendir` true olur; çağıran taraf yeni adrese yönlendirir.
 */
export async function slugIleUrun(
  slug: string,
): Promise<{ urun: Product | null; yonlendir: boolean }> {
  const urunler = await katalogOku();
  const dogrudan = urunler.find((p) => p.slug === slug);
  if (dogrudan) return { urun: dogrudan, yonlendir: false };
  const id = (await yonlendirmeOnbellek())[slug];
  const hedef = id ? urunler.find((p) => p.id === id) : undefined;
  return { urun: hedef ?? null, yonlendir: Boolean(hedef) };
}

/* ---------------- Admin tarafı (taze) ---------------- */

/** Yayındaki ya da çöpteki ürün (admin düzenleme ekranı için). */
export async function urunBul(id: string): Promise<Product | null> {
  const urunler = await urunleriOku(["yayinda", "cop"]);
  const u = urunler.find((p) => p.id === id);
  return u ? temizle(u) : null;
}

/** Yayındaki ve çöpteki ürünlerin kullandığı tüm görsel yolları (taze). */
export async function tumGorselYollari(): Promise<string[]> {
  return (await urunleriOku(["yayinda", "cop"])).flatMap((p) => p.images.map((g) => g.src));
}

/** Admin listesi: yayındaki ürünler, katalog sırasıyla, taze. */
export async function adminKatalog(): Promise<Product[]> {
  return (await urunleriOku(["yayinda"])).map(temizle);
}

/**
 * Ürünü ekler veya günceller; varyantlar baştan yazılır. Adres değiştiyse eski
 * adres yeni adrese yönlendirilir. Hepsi tek işlemde (batch) yazılır.
 */
export async function urunYaz(urun: Product): Promise<void> {
  const db = getDb();
  const [onceki] = await db
    .select({ slug: product.slug, sira: product.sira, tohum: product.tohum, durum: product.durum })
    .from(product)
    .where(eq(product.id, urun.id));

  let sira = onceki?.sira;
  if (sira === undefined) {
    const [{ enBuyuk }] = await db
      .select({ enBuyuk: sql<number>`coalesce(max(${product.sira}), -1)` })
      .from(product);
    sira = Number(enBuyuk) + 1;
  }

  const degerler = {
    slug: urun.slug,
    name: urun.name,
    description: urun.description,
    category: urun.category,
    brand: urun.brand ?? null,
    model: urun.model ?? null,
    fit: urun.fit ?? null,
    price: urun.price,
    compareAtPrice: urun.compareAtPrice ?? null,
    currency: urun.currency,
    images: urun.images,
    colors: urun.colors,
    isNew: urun.isNew,
    complementaryIds: urun.complementaryIds ?? null,
    relatedIds: urun.relatedIds ?? null,
    updatedAt: new Date(),
  };

  const adimlar = [
    db
      .insert(product)
      .values({ id: urun.id, ...degerler, durum: "yayinda", sira, tohum: false })
      .onConflictDoUpdate({ target: product.id, set: degerler }),
    db.delete(productVariant).where(eq(productVariant.productId, urun.id)),
    // Yeni adres artık gerçek bir ürün adresi: yönlendirmelerden düşer.
    db.delete(productRedirect).where(eq(productRedirect.slug, urun.slug)),
  ] as const;

  const ekler = [];
  if (urun.variants.length > 0)
    ekler.push(
      db.insert(productVariant).values(
        urun.variants.map((v, i) => ({
          id: v.id,
          productId: urun.id,
          size: v.size,
          color: v.color,
          stock: Math.max(0, Math.floor(v.stock)),
          sira: i,
        })),
      ),
    );
  if (onceki && onceki.slug !== urun.slug)
    ekler.push(
      db
        .insert(productRedirect)
        .values({ slug: onceki.slug, productId: urun.id })
        .onConflictDoUpdate({ target: productRedirect.slug, set: { productId: urun.id } }),
    );

  await db.batch([...adimlar, ...ekler]);
}

/** Ürünü çöp kutusuna taşır: katalogdan kalkar, verisi ve görselleri durur. */
export async function copeTasi(id: string): Promise<Product | null> {
  const urun = await urunBul(id);
  if (!urun) return null;
  const sonuc = await getDb()
    .update(product)
    .set({ durum: "cop", copeAtildi: new Date() })
    .where(and(eq(product.id, id), eq(product.durum, "yayinda")))
    .returning({ id: product.id });
  return sonuc.length ? urun : null;
}

/** Çöp kutusundaki ürünler; en son silinen başta. */
export async function copKutusu(): Promise<Product[]> {
  const urunler = await urunleriOku(["cop"]);
  return urunler
    .sort(
      (a, b) =>
        (b._satir.copeAtildi?.getTime() ?? 0) - (a._satir.copeAtildi?.getTime() ?? 0),
    )
    .map(temizle);
}

/** Çöp kutusundaki ürünü kataloğa geri getirir. */
export async function copKutusundanGeriGetir(id: string): Promise<Product | null> {
  const sonuc = await getDb()
    .update(product)
    .set({ durum: "yayinda", copeAtildi: null })
    .where(and(eq(product.id, id), eq(product.durum, "cop")))
    .returning({ id: product.id });
  return sonuc.length ? urunBul(id) : null;
}

/**
 * Çöp kutusundaki ürünü kalıcı siler ve silinen ürünü döndürür (görsel
 * temizliği için). Satır "silindi" olarak kalır ki id'si yeni ürüne verilmesin;
 * adresi boşaltılır ve yönlendirmeleri silinir.
 */
export async function kaliciSil(id: string): Promise<Product | null> {
  const urun = (await urunleriOku(["cop"])).find((p) => p.id === id);
  if (!urun) return null;
  const db = getDb();
  await db.batch([
    db
      .update(product)
      .set({ durum: "silindi", slug: `_silindi_${id}`, copeAtildi: null })
      .where(and(eq(product.id, id), eq(product.durum, "cop"))),
    db.delete(productRedirect).where(eq(productRedirect.productId, id)),
  ]);
  return temizle(urun);
}

/**
 * Yeni ürün id'si (p-NNN): şimdiye kadar kullanılmış en büyük numaranın bir
 * fazlası. Kalıcı silinenler de sayılır; aradaki boşluklar BİLEREK kullanılmaz
 * (eski id tarayıcılardaki sepet/favorilerde kalmış olabilir ve görsel dosya
 * adları id ile başlar).
 */
export async function yeniId(): Promise<string> {
  const satirlar = await getDb().select({ id: product.id }).from(product);
  const enBuyuk = Math.max(
    0,
    ...satirlar.map((s) => Number(/^p-(\d+)$/.exec(s.id)?.[1] ?? 0)),
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
export async function slugSahibi(slug: string, haricId: string): Promise<Product | null> {
  const [satir] = await getDb()
    .select({ id: product.id })
    .from(product)
    .where(and(eq(product.slug, slug), ne(product.id, haricId), ne(product.durum, "silindi")));
  return satir ? urunBul(satir.id) : null;
}

/** Addan üretilen slug başka üründe varsa sonuna -2, -3… eklenir. */
export async function bosSlug(taban: string, haricId: string): Promise<string> {
  const satirlar = await getDb()
    .select({ slug: product.slug })
    .from(product)
    .where(ne(product.id, haricId));
  const dolu = new Set(satirlar.map((s) => s.slug));
  if (!dolu.has(taban)) return taban;
  for (let n = 2; ; n++) if (!dolu.has(`${taban}-${n}`)) return `${taban}-${n}`;
}

/* ---- Sunucu tarafı okuma yardımcıları (canlı katalog) ---- */

async function enYeniOnce(): Promise<Product[]> {
  return (await yayindakiOnbellek()).enYeni;
}

/**
 * Ana sayfa "Çok satanlar" için elle seçilmiş ürünler (slug). Satış verisi
 * henüz yok (sipariş servisi bağlı değil, bkz. lib/orders.ts), bu yüzden bir
 * satış sıralaması uydurulmaz.
 */
const COK_SATAN_SECIMI = [
  // Yeni kapüşonlular: ilk dördü vitrinde, diğerleri biri tükenirse yedek.
  "bape-ape-head-hoodie-gri",
  "trapstar-london-hoodie-siyah",
  "corteiz-slaughter-gang-hoodie-beyaz",
  "sp5der-web-hoodie-siyah",
  "bape-ekose-ape-head-fermuarli-hoodie-siyah",
  "sp5der-pembe-baskili-hoodie-siyah",
  "grafik-baskili-hoodie-siyah",
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
  return (await enYeniOnce()).filter((p) => p.isNew).slice(0, limit);
}

/**
 * Ana sayfa "Yeni Gelenler": stokta olan ürünler, en son eklenen başta.
 * "Yeni" işaretine bakılmaz; ürün eklendikçe şerit kendiliğinden tazelenir.
 */
export async function sonEklenenler(limit = 10): Promise<Product[]> {
  return (await enYeniOnce())
    .filter((p) => p.variants.some((v) => v.stock > 0))
    .slice(0, limit);
}

/**
 * Ana sayfa "Numaran kaç?": her ayakkabı numarası için o numarası stokta
 * olan ayakkabı sayısı. Stokta hiç olmayan numara 0 döner (buton pasif).
 */
export async function numaraStoklari(): Promise<{ size: ShoeSize; count: number }[]> {
  const ayakkabilar = (await katalogOku()).filter((p) => p.category === "ayakkabi");
  return SHOE_SIZES.map((size) => ({
    size,
    count: ayakkabilar.filter((p) =>
      p.variants.some((v) => v.size === size && v.stock > 0),
    ).length,
  }));
}

/**
 * Ana sayfa markalar şeridi: stokta ürünü olan markalar, en çok ürünü olan
 * başta. Markası bilinmeyen (kendi adımıza düşen) ürünler şeride girmez.
 * `yalnizAyakkabi` true ise bağlantı ayakkabılar sayfasına gider.
 */
export async function markaVitrini(): Promise<
  { name: string; count: number; yalnizAyakkabi: boolean }[]
> {
  const markalar = new Map<string, { count: number; yalnizAyakkabi: boolean }>();
  for (const p of await katalogOku()) {
    if (!p.variants.some((v) => v.stock > 0)) continue;
    const marka = productBrand(p);
    if (marka === OWN_BRAND && !p.brand?.trim()) continue;
    const kayit = markalar.get(marka) ?? { count: 0, yalnizAyakkabi: true };
    kayit.count += 1;
    if (p.category !== "ayakkabi") kayit.yalnizAyakkabi = false;
    markalar.set(marka, kayit);
  }
  return [...markalar.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "tr"));
}

/**
 * "Sana Özel" bölümünün ürünü. Şimdilik sabit bir kural: yayındaki katalogun
 * ikinci ürünü. İleride kullanıcının gezdiği / favorilediği / sepetindeki
 * ürüne göre belirlenecek. Katalog boşsa null döner ve bölüm çizilmez.
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

