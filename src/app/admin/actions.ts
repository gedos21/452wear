"use server";

import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { slotForCategory } from "@/lib/character";
import {
  bosSlug,
  copeTasi,
  copKutusundanGeriGetir,
  kaliciSil,
  katalogOku,
  slugSahibi,
  slugYap,
  urunBul,
  urunYaz,
  yeniId,
} from "@/lib/catalog-store";
import { pixelAssetKaydet, pixelAssetSil } from "@/lib/pixel-asset";
import { sizesForCategory } from "@/lib/product-variants";
import type {
  Product,
  ProductCategory,
  ProductColor,
  ProductImage,
  ProductSize,
  ProductVariant,
} from "@/types/product";

/**
 * Admin eylemleri. Hepsi sunucuda çalışır ve girdileri güvenilmez kabul eder.
 * Başarı mesajı yalnızca disk yazımı gerçekten tamamlandığında döner.
 */
export type Sonuc =
  | { durum: "bos" }
  | { durum: "ok"; mesaj: string; urunId?: string }
  | { durum: "hata"; mesaj: string };

/**
 * Admin paneli yalnızca yerel geliştirmede açıktır (bkz. admin/layout). Sayfa
 * production'da 404 verse de bu eylemler build'e girer ve kimliği bilinirse
 * doğrudan çağrılabilir; bu yüzden her eylem kendi başına da kapanır.
 */
const KAPALI = process.env.NODE_ENV === "production";
const KAPALI_SONUC: Sonuc = {
  durum: "hata",
  mesaj: "Admin yalnızca geliştirme ortamında çalışır.",
};

const KATEGORILER: ProductCategory[] = [
  "ayakkabi",
  "esofman",
  "hirka",
  "tisort",
  "sweatshirt",
];

function tazele(urunId?: string) {
  // Kök layout da kataloğu okur (sepet, favoriler, arama): tüm ağaç tazelenir.
  revalidatePath("/", "layout");
  revalidatePath("/admin/urunler");
  if (urunId) revalidatePath(`/admin/urunler/${urunId}`);
  revalidatePath("/");
  revalidatePath("/magaza");
  revalidatePath("/ayakkabilar");
  revalidatePath("/giyim");
  revalidatePath("/kombinini-bul");
}

type Ayiklama =
  | { ok: false; hata: string }
  | {
      ok: true;
      ad: string;
      /** Elle girilen slug (sadeleştirilmiş); boşsa addan üretilir. */
      slug: string;
      aciklama: string;
      kategori: ProductCategory;
      fiyat: number;
      indirimOncesi?: number;
      colors: ProductColor[];
      bedenler: ProductSize[];
    };

function urunuAyikla(fd: FormData): Ayiklama {
  const ad = String(fd.get("ad") ?? "").trim();
  const slug = slugYap(String(fd.get("slug") ?? ""));
  const aciklama = String(fd.get("aciklama") ?? "").trim();
  const kategori = String(fd.get("kategori") ?? "") as ProductCategory;
  const fiyat = Number(fd.get("fiyat"));
  const indirimHam = String(fd.get("indirimOncesi") ?? "").trim();
  const indirimOncesi = indirimHam ? Number(indirimHam) : undefined;

  if (!ad) return { ok: false, hata: "Ürün adı zorunlu." };
  if (!aciklama) return { ok: false, hata: "Açıklama zorunlu." };
  if (!KATEGORILER.includes(kategori))
    return { ok: false, hata: "Geçersiz kategori." };
  if (!Number.isFinite(fiyat) || fiyat <= 0)
    return { ok: false, hata: "Fiyat sıfırdan büyük bir sayı olmalı." };
  if (
    indirimOncesi !== undefined &&
    (!Number.isFinite(indirimOncesi) || indirimOncesi <= fiyat)
  )
    return { ok: false, hata: "İndirim öncesi fiyat, fiyattan büyük olmalı." };

  const adlar = fd.getAll("renkAd").map((v) => String(v).trim());
  const hexler = fd.getAll("renkHex").map((v) => String(v).trim());
  const colors: ProductColor[] = adlar
    .map((name, i) => ({ name, hex: hexler[i] ?? "#000000" }))
    .filter((c) => c.name.length > 0);
  if (colors.length === 0) return { ok: false, hata: "En az bir renk gir." };
  // Aynı ad iki satırda olursa aynı renk+beden iki varyant olur; sepet
  // satırları ve stok birbirine karışır.
  const gorulen = new Set<string>();
  for (const c of colors) {
    const anahtar = c.name.toLocaleLowerCase("tr");
    if (gorulen.has(anahtar))
      return { ok: false, hata: `"${c.name}" rengi iki kez girilmiş.` };
    gorulen.add(anahtar);
    if (!/^#[0-9a-f]{6}$/i.test(c.hex))
      return { ok: false, hata: `"${c.name}" için renk kodu geçersiz.` };
  }

  // Yalnızca kategorinin beden sistemindeki değerler kabul edilir
  // (ayakkabıda numara, diğerlerinde harf beden).
  const gecerliBedenler = sizesForCategory(kategori);
  const bedenler = fd
    .getAll("beden")
    .map((v) => String(v) as ProductSize)
    .filter((b) => gecerliBedenler.includes(b));
  if (bedenler.length === 0) return { ok: false, hata: "En az bir beden seç." };

  return {
    ok: true,
    ad,
    slug,
    aciklama,
    kategori,
    fiyat,
    indirimOncesi,
    colors,
    bedenler,
  };
}

/**
 * Renk × beden stok ızgarasından varyant üretir.
 *
 * Kayıpsız: yalnızca DOLU hücreler varyant olur (boş = o kombinasyon yok,
 * 0 = var ama tükendi). Aynı renk+beden daha önce varsa id'si korunur. Böylece
 * tohum ürün (ör. p-001: S/M yalnız Siyah, L yalnız Kemik) değiştirilmeden
 * kaydedildiğinde varyantları birebir aynı kalır.
 */
function varyantlar(
  id: string,
  colors: ProductColor[],
  bedenler: ProductSize[],
  fd: FormData,
  eski: ProductVariant[],
): ProductVariant[] {
  const out: ProductVariant[] = [];
  colors.forEach((c, ci) => {
    for (const b of bedenler) {
      const ham = String(fd.get(`stok-${ci}-${b}`) ?? "").trim();
      if (ham === "") continue;
      const stok = Number(ham);
      const onceki = eski.find((v) => v.color === c.name && v.size === b);
      out.push({
        id: onceki?.id ?? `${id}-${slugYap(c.name)}-${b.toLowerCase()}`,
        size: b,
        color: c.name,
        stock: Number.isFinite(stok) && stok > 0 ? Math.floor(stok) : 0,
      });
    }
  });
  return out;
}

/** Kabul edilen ürün görseli türleri ve kaydedilecek uzantıları. */
const GORSEL_TURLERI: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
};

/** Tek görsel için üst sınır. İsteğin toplamı next.config.ts'te sınırlı. */
const GORSEL_MAKS_MB = 8;

/** Seçilen görselleri doğrular; diske hiçbir şey yazmaz. */
function gorselleriDogrula(fd: FormData): File[] {
  const dosyalar = fd
    .getAll("gorsel")
    .filter((f): f is File => f instanceof File && f.size > 0);
  for (const f of dosyalar) {
    if (!GORSEL_TURLERI[f.type])
      throw new Error(`"${f.name}" desteklenmiyor; WebP, PNG veya JPG yükle.`);
    if (f.size > GORSEL_MAKS_MB * 1024 * 1024)
      throw new Error(`"${f.name}" ${GORSEL_MAKS_MB} MB'ı aşıyor.`);
  }
  return dosyalar;
}

async function gorselleriYaz(dosyalar: File[], id: string, ad: string) {
  if (dosyalar.length === 0) return [];
  const klasor = path.join(process.cwd(), "public", "products");
  await fs.mkdir(klasor, { recursive: true });
  const out = [];
  for (const f of dosyalar) {
    const buf = Buffer.from(await f.arrayBuffer());
    // İçerik hash'li ad: mevcut bir dosyanın (başka ürünün görseli dahil)
    // üzerine asla yazılmaz; aynı içerik zaten varsa dosya yeniden yazılmaz.
    const hash = createHash("sha1").update(buf).digest("hex").slice(0, 8);
    const adi = `${id}-${hash}.${GORSEL_TURLERI[f.type]}`;
    try {
      await fs.writeFile(path.join(klasor, adi), buf, { flag: "wx" });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
    }
    // alt metni ürün adından gelir; uydurma açıklama üretmiyoruz.
    out.push({ src: `/products/${adi}`, alt: ad });
  }
  return out;
}

type GorselSirasi =
  | { tip: "mevcut"; gorsel: ProductImage }
  | { tip: "yeni"; index: number };

const SIRA_HATASI = "Görsel sırası geçersiz; sayfayı yenileyip tekrar dene.";

/**
 * Formdaki görsel sırasını çözer: "m:<yol>" kayıtlı bir görseli, "y:<n>" bu
 * kayıtta yüklenen n. dosyayı gösterir. Kayıtlı görsel yalnızca ürünün kendi
 * görsellerinden olabilir ve her yeni dosya tam bir kez yer almalıdır; böylece
 * sıraya girmeyen dosya diske yazılmaz. Boş sıra "hiç görsel yok" demektir:
 * kullanıcının kaldırdığı kayıtlı görseller kendiliğinden geri gelmez.
 */
function gorselSirasi(
  fd: FormData,
  mevcut: ProductImage[],
  yeniSayisi: number,
): { ok: true; liste: GorselSirasi[] } | { ok: false; hata: string } {
  const ham = fd.getAll("gorselSira").map(String);
  const liste: GorselSirasi[] = [];
  const kullanilanYeni = new Set<number>();
  for (const oge of ham) {
    const deger = oge.slice(2);
    if (oge.startsWith("m:")) {
      const gorsel = mevcut.find((g) => g.src === deger);
      const tekrar = liste.some(
        (s) => s.tip === "mevcut" && s.gorsel.src === deger,
      );
      if (!gorsel || tekrar) return { ok: false, hata: SIRA_HATASI };
      liste.push({ tip: "mevcut", gorsel });
    } else if (oge.startsWith("y:")) {
      const index = Number(deger);
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= yeniSayisi ||
        kullanilanYeni.has(index)
      )
        return { ok: false, hata: SIRA_HATASI };
      kullanilanYeni.add(index);
      liste.push({ tip: "yeni", index });
    } else {
      return { ok: false, hata: SIRA_HATASI };
    }
  }
  if (kullanilanYeni.size !== yeniSayisi) return { ok: false, hata: SIRA_HATASI };
  return { ok: true, liste };
}

/**
 * Artık hiçbir ürünün kullanmadığı, bu ürün için YÜKLENMİŞ görselleri siler.
 * Yalnızca `<urunId>-<hash>.<uzantı>` biçimindeki dosyalara dokunur: tohum
 * görselleri (ör. p-001-a.png ya da p-009'un kullandığı p-005-b.png) birden
 * fazla ürün tarafından paylaşılabildiği için asla silinmez.
 */
async function kullanilmayanGorselleriSil(yollar: string[], urunId: string) {
  const kullanilan = new Set(
    (await katalogOku()).flatMap((p) => p.images.map((g) => g.src)),
  );
  const yuklenen = new RegExp(`^/products/${urunId}-[0-9a-f]{8}\\.(webp|png|jpg)$`);
  for (const yol of yollar) {
    if (kullanilan.has(yol) || !yuklenen.test(yol)) continue;
    try {
      await fs.unlink(path.join(process.cwd(), "public", yol.slice(1)));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }
}

/** Formdan gelen öneri id'lerini temizler; boş liste hiç yazılmaz. */
function oneriAlanlari(fd: FormData, id: string) {
  const oku = (ad: string, limit: number) => {
    const temiz = [
      ...new Set(
        fd
          .getAll(ad)
          .map((v) => String(v).trim())
          .filter((v) => v && v !== id),
      ),
    ].slice(0, limit);
    return temiz;
  };
  const complementaryIds = oku("complementaryIds", 3);
  const relatedIds = oku("relatedIds", 8);
  return {
    ...(complementaryIds.length ? { complementaryIds } : {}),
    ...(relatedIds.length ? { relatedIds } : {}),
  };
}

export async function urunKaydet(_onceki: Sonuc, fd: FormData): Promise<Sonuc> {
  if (KAPALI) return KAPALI_SONUC;
  // Diske yazılan yeni Pixel Fit PNG'si; ürün yazılamazsa sahipsiz kalmasın
  // diye hata yolunda silinir.
  let yetimPixel: { yol: string; urunId: string } | null = null;
  try {
    const a = urunuAyikla(fd);
    if (!a.ok) return { durum: "hata", mesaj: a.hata };

    const mevcutId = String(fd.get("urunId") ?? "").trim();
    const mevcut = mevcutId ? await urunBul(mevcutId) : null;
    if (mevcutId && !mevcut)
      return { durum: "hata", mesaj: "Ürün bulunamadı." };

    const id = mevcut?.id ?? (await yeniId());

    // Slug: elle girildiyse başka üründe olmamalı; boşsa addan üretilir ve
    // çakışırsa sonuna -2, -3… eklenir.
    let slug = a.slug;
    if (slug) {
      const sahip = await slugSahibi(slug, id);
      if (sahip)
        return {
          durum: "hata",
          mesaj: `"${slug}" adresi zaten "${sahip.name}" ürününde kullanılıyor.`,
        };
    } else {
      const taban = slugYap(a.ad);
      if (!taban)
        return {
          durum: "hata",
          mesaj: "Ürün adından adres üretilemedi; slug alanını doldur.",
        };
      slug = await bosSlug(taban, id);
    }

    // Önce diske hiçbir şey yazmayan kontroller: biri reddedilirse sahipsiz
    // görsel ya da asset dosyası oluşmaz.
    const variants = varyantlar(
      id,
      a.colors,
      a.bedenler,
      fd,
      mevcut?.variants ?? [],
    );
    if (variants.length === 0)
      return {
        durum: "hata",
        mesaj: "Stok ızgarasında en az bir hücre doldur.",
      };
    // Hiç bedeni olmayan renk sitede seçilemeyen, sönük bir renk olarak
    // görünür ve filtrede yanlış eşleşir.
    const bosRenk = a.colors.find(
      (c) => !variants.some((v) => v.color === c.name),
    );
    if (bosRenk)
      return {
        durum: "hata",
        mesaj: `"${bosRenk.name}" rengi için stok ızgarasında en az bir hücre doldur ya da rengi kaldır.`,
      };

    const dosyalar = gorselleriDogrula(fd);
    const sira = gorselSirasi(fd, mevcut?.images ?? [], dosyalar.length);
    if (!sira.ok) return { durum: "hata", mesaj: sira.hata };
    if (sira.liste.length === 0)
      return { durum: "hata", mesaj: "En az bir ürün görseli yükle." };

    const layer = slotForCategory(a.kategori);
    const pixelDosya = fd.get("pixelAsset");
    const pixelSecildi = pixelDosya instanceof File && pixelDosya.size > 0;
    if (!layer && (pixelSecildi || mevcut?.tryOn))
      return {
        durum: "hata",
        mesaj: pixelSecildi
          ? "Bu kategoride Pixel Fit kullanılmıyor; seçilen PNG'yi kaldır."
          : "Bu kategoride Pixel Fit kullanılmıyor; önce kayıtlı Pixel Fit asset'ini kaldır.",
      };

    // Pixel Fit: en sık reddedilen dosya bu olduğu için görsellerden ÖNCE
    // işlenir. Reddedilirse ne ürün ne de görseller yazılır.
    let tryOn = mevcut?.tryOn;
    let pixelEklendi = false;
    if (pixelDosya instanceof File && pixelDosya.size > 0 && layer) {
      const sonuc = await pixelAssetKaydet(pixelDosya, layer, id);
      if (!sonuc.ok)
        return {
          durum: "hata",
          mesaj: `Pixel Fit PNG reddedildi, ürün kaydedilmedi: ${sonuc.hata}`,
        };
      tryOn = { layer, asset: sonuc.yol, status: "approved" };
      pixelEklendi = true;
      // Aynı içerik zaten kayıtlıysa yol aynıdır; o dosya silinmemeli.
      if (sonuc.yol !== mevcut?.tryOn?.asset)
        yetimPixel = { yol: sonuc.yol, urunId: id };
    }

    const yuklenen = await gorselleriYaz(dosyalar, id, a.ad);
    const images = sira.liste.map((s) =>
      s.tip === "mevcut" ? s.gorsel : yuklenen[s.index],
    );

    const urun: Product = {
      id,
      slug,
      name: a.ad,
      description: a.aciklama,
      category: a.kategori,
      price: Math.round(a.fiyat),
      ...(a.indirimOncesi
        ? { compareAtPrice: Math.round(a.indirimOncesi) }
        : {}),
      currency: "TRY",
      images,
      colors: a.colors,
      variants,
      isNew: fd.get("isNew") === "on",
      // Öneri ilişkileri: isteğe bağlı, kendi id'si ve tekrarlar elenir.
      ...oneriAlanlari(fd, id),
      // Yeni PNG gelmediyse mevcut Pixel Fit bağlantısı aynen korunur.
      ...(tryOn ? { tryOn } : {}),
    };

    await urunYaz(urun);
    yetimPixel = null;

    // Eski dosyalar ürün yazıldıktan SONRA temizlenir: yazım başarısız olsaydı
    // ürün hâlâ onları gösteriyor olurdu.
    if (mevcut?.tryOn && tryOn && mevcut.tryOn.asset !== tryOn.asset)
      await pixelAssetSil(mevcut.tryOn.asset, id);
    // Kaldırılan görseller de burada gider (yalnızca başka ürün kullanmıyorsa).
    if (mevcut)
      await kullanilmayanGorselleriSil(
        mevcut.images.map((g) => g.src),
        id,
      );

    tazele(id);
    return {
      durum: "ok",
      urunId: id,
      mesaj:
        (mevcut ? "Ürün güncellendi." : `Ürün oluşturuldu (${id}).`) +
        (pixelEklendi ? " Pixel Fit hazır." : ""),
    };
  } catch (e) {
    if (yetimPixel)
      await pixelAssetSil(yetimPixel.yol, yetimPixel.urunId).catch(() => {});
    return { durum: "hata", mesaj: `Kaydedilemedi: ${(e as Error).message}` };
  }
}

/** Ürünü çöp kutusuna taşır. Verisi ve görselleri durur; geri getirilebilir. */
export async function urunSil(_onceki: Sonuc, fd: FormData): Promise<Sonuc> {
  if (KAPALI) return KAPALI_SONUC;
  try {
    const urun = await copeTasi(String(fd.get("urunId") ?? ""));
    if (!urun) return { durum: "hata", mesaj: "Ürün bulunamadı." };
    tazele();
    return {
      durum: "ok",
      mesaj: `"${urun.name}" silindi; Silinenler'den geri getirebilirsin.`,
    };
  } catch (e) {
    return { durum: "hata", mesaj: `Silinemedi: ${(e as Error).message}` };
  }
}

export async function urunGeriGetir(
  _onceki: Sonuc,
  fd: FormData,
): Promise<Sonuc> {
  if (KAPALI) return KAPALI_SONUC;
  try {
    const urun = await copKutusundanGeriGetir(String(fd.get("urunId") ?? ""));
    if (!urun) return { durum: "hata", mesaj: "Ürün çöp kutusunda değil." };
    tazele(urun.id);
    return { durum: "ok", mesaj: `"${urun.name}" geri getirildi.` };
  } catch (e) {
    return {
      durum: "hata",
      mesaj: `Geri getirilemedi: ${(e as Error).message}`,
    };
  }
}

/**
 * Çöp kutusundaki ürünü kalıcı siler. Bu ürün için yüklenmiş dosyalar da
 * temizlenir; tohum görsellerine ve başka ürünlerin kullandığı dosyalara
 * dokunulmaz.
 */
export async function urunKaliciSil(
  _onceki: Sonuc,
  fd: FormData,
): Promise<Sonuc> {
  if (KAPALI) return KAPALI_SONUC;
  try {
    const urun = await kaliciSil(String(fd.get("urunId") ?? ""));
    if (!urun) return { durum: "hata", mesaj: "Ürün çöp kutusunda değil." };
    await kullanilmayanGorselleriSil(
      urun.images.map((g) => g.src),
      urun.id,
    );
    if (urun.tryOn) await pixelAssetSil(urun.tryOn.asset, urun.id);
    tazele();
    return { durum: "ok", mesaj: `"${urun.name}" kalıcı olarak silindi.` };
  } catch (e) {
    return { durum: "hata", mesaj: `Silinemedi: ${(e as Error).message}` };
  }
}

export async function pixelAssetYukle(
  _onceki: Sonuc,
  fd: FormData,
): Promise<Sonuc> {
  if (KAPALI) return KAPALI_SONUC;
  try {
    const urun = await urunBul(String(fd.get("urunId") ?? ""));
    if (!urun) return { durum: "hata", mesaj: "Önce ürünü kaydet." };

    const dosya = fd.get("asset");
    if (!(dosya instanceof File) || dosya.size === 0)
      return { durum: "hata", mesaj: "PNG dosyası seç." };

    const layer = slotForCategory(urun.category);
    if (!layer)
      return { durum: "hata", mesaj: "Bu kategoride Pixel Fit kullanılmıyor." };
    const sonuc = await pixelAssetKaydet(dosya, layer, urun.id);
    if (!sonuc.ok) return { durum: "hata", mesaj: sonuc.hata };

    // Doğrulamayı geçen asset doğrudan yayına girer: Pixel Fit = Hazır,
    // layer kategoriden gelir. (Eski "pending" kayıtlar onay düğmesiyle
    // yayına alınmaya devam eder.) Ürün yazılamazsa yeni dosya sahipsiz
    // kalmasın diye silinir; aynı içerik zaten kayıtlıysa dokunulmaz.
    try {
      await urunYaz({
        ...urun,
        tryOn: { layer, asset: sonuc.yol, status: "approved" },
      });
    } catch (e) {
      if (sonuc.yol !== urun.tryOn?.asset)
        await pixelAssetSil(sonuc.yol, urun.id).catch(() => {});
      throw e;
    }

    // Değiştirilen eski yükleme, ürün yazıldıktan sonra temizlenir (tohum
    // asset'lerine dokunmaz).
    if (urun.tryOn && urun.tryOn.asset !== sonuc.yol)
      await pixelAssetSil(urun.tryOn.asset, urun.id);

    tazele(urun.id);
    return { durum: "ok", mesaj: "Asset yüklendi. Pixel Fit hazır." };
  } catch (e) {
    return { durum: "hata", mesaj: `Yüklenemedi: ${(e as Error).message}` };
  }
}

export async function pixelAssetOnayla(
  _onceki: Sonuc,
  fd: FormData,
): Promise<Sonuc> {
  if (KAPALI) return KAPALI_SONUC;
  try {
    const urun = await urunBul(String(fd.get("urunId") ?? ""));
    if (!urun?.tryOn) return { durum: "hata", mesaj: "Onaylanacak asset yok." };
    await urunYaz({ ...urun, tryOn: { ...urun.tryOn, status: "approved" } });
    tazele(urun.id);
    return { durum: "ok", mesaj: "Asset onaylandı; karakterde kullanılıyor." };
  } catch (e) {
    return { durum: "hata", mesaj: `Onaylanamadı: ${(e as Error).message}` };
  }
}

export async function pixelAssetKaldir(
  _onceki: Sonuc,
  fd: FormData,
): Promise<Sonuc> {
  if (KAPALI) return KAPALI_SONUC;
  try {
    const urun = await urunBul(String(fd.get("urunId") ?? ""));
    if (!urun?.tryOn)
      return { durum: "hata", mesaj: "Kaldırılacak asset yok." };
    await pixelAssetSil(urun.tryOn.asset, urun.id);
    // Ürün silinmez; yalnızca Pixel Fit bağlantısı düşer.
    const kalan: Product = { ...urun };
    delete kalan.tryOn;
    await urunYaz(kalan);
    tazele(urun.id);
    return {
      durum: "ok",
      mesaj: "Pixel Fit bağlantısı kaldırıldı. Ürün duruyor.",
    };
  } catch (e) {
    return { durum: "hata", mesaj: `Kaldırılamadı: ${(e as Error).message}` };
  }
}
