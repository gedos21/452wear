"use server";

import { revalidatePath } from "next/cache";
import { promises as fs } from "node:fs";
import path from "node:path";
import { slotForCategory } from "@/lib/character";
import { slugYap, urunBul, urunYaz, yeniId } from "@/lib/catalog-store";
import { pixelAssetKaydet, pixelAssetSil } from "@/lib/pixel-asset";
import type {
  Product,
  ProductCategory,
  ProductColor,
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

const KATEGORILER: ProductCategory[] = [
  "ayakkabi",
  "esofman",
  "hirka",
  "tisort",
  "sweatshirt",
];

function tazele(urunId?: string) {
  revalidatePath("/admin/urunler");
  if (urunId) revalidatePath(`/admin/urunler/${urunId}`);
  revalidatePath("/");
  revalidatePath("/magaza");
  revalidatePath("/kombinini-bul");
}

type Ayiklama =
  | { ok: false; hata: string }
  | {
      ok: true;
      ad: string;
      aciklama: string;
      kategori: ProductCategory;
      fiyat: number;
      indirimOncesi?: number;
      colors: ProductColor[];
      bedenler: ProductSize[];
    };

function urunuAyikla(fd: FormData): Ayiklama {
  const ad = String(fd.get("ad") ?? "").trim();
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

  const bedenler = fd.getAll("beden").map((v) => String(v)) as ProductSize[];
  if (bedenler.length === 0) return { ok: false, hata: "En az bir beden seç." };

  return {
    ok: true,
    ad,
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

async function gorselleriKaydet(fd: FormData, id: string, ad: string) {
  const dosyalar = fd
    .getAll("gorsel")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (dosyalar.length === 0) return [];
  const klasor = path.join(process.cwd(), "public", "products");
  await fs.mkdir(klasor, { recursive: true });
  const out = [];
  for (let i = 0; i < dosyalar.length; i++) {
    const f = dosyalar[i];
    const uzanti =
      f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
    const adi = `${id}-${String.fromCharCode(97 + i)}.${uzanti}`;
    await fs.writeFile(
      path.join(klasor, adi),
      Buffer.from(await f.arrayBuffer()),
    );
    // alt metni ürün adından gelir; uydurma açıklama üretmiyoruz.
    out.push({ src: `/products/${adi}`, alt: ad });
  }
  return out;
}

export async function urunKaydet(_onceki: Sonuc, fd: FormData): Promise<Sonuc> {
  try {
    const a = urunuAyikla(fd);
    if (!a.ok) return { durum: "hata", mesaj: a.hata };

    const mevcutId = String(fd.get("urunId") ?? "").trim();
    const mevcut = mevcutId ? await urunBul(mevcutId) : null;
    if (mevcutId && !mevcut)
      return { durum: "hata", mesaj: "Ürün bulunamadı." };

    const id = mevcut?.id ?? (await yeniId());
    const yeni = await gorselleriKaydet(fd, id, a.ad);
    const images = yeni.length > 0 ? yeni : (mevcut?.images ?? []);
    if (images.length === 0)
      return { durum: "hata", mesaj: "En az bir ürün görseli yükle." };

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

    // Pixel Fit katmanı. Yeni ürün ekranında PNG ürünle AYNI kaydetmede gelir;
    // layer kategoriden türetilir (slotForCategory tek kaynak). Dosya
    // reddedilirse ürün de yazılmaz — yarım kayıt ve sahte başarı olmaz.
    const pixelDosya = fd.get("pixelAsset");
    let tryOn = mevcut?.tryOn;
    let pixelEklendi = false;
    if (pixelDosya instanceof File && pixelDosya.size > 0) {
      const layer = slotForCategory(a.kategori);
      const sonuc = await pixelAssetKaydet(pixelDosya, layer, id);
      if (!sonuc.ok)
        return {
          durum: "hata",
          mesaj: `Pixel Fit PNG reddedildi, ürün kaydedilmedi: ${sonuc.hata}`,
        };
      if (mevcut?.tryOn && mevcut.tryOn.asset !== sonuc.yol)
        await pixelAssetSil(mevcut.tryOn.asset, id);
      tryOn = { layer, asset: sonuc.yol, status: "approved" };
      pixelEklendi = true;
    }

    const urun: Product = {
      id,
      slug: mevcut?.slug ?? slugYap(a.ad),
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
      // Yeni PNG gelmediyse mevcut Pixel Fit bağlantısı aynen korunur.
      ...(tryOn ? { tryOn } : {}),
    };

    await urunYaz(urun);
    tazele(id);
    return {
      durum: "ok",
      urunId: id,
      mesaj:
        (mevcut ? "Ürün güncellendi." : `Ürün oluşturuldu (${id}).`) +
        (pixelEklendi ? " Pixel Fit hazır." : ""),
    };
  } catch (e) {
    return { durum: "hata", mesaj: `Kaydedilemedi: ${(e as Error).message}` };
  }
}

export async function pixelAssetYukle(
  _onceki: Sonuc,
  fd: FormData,
): Promise<Sonuc> {
  try {
    const urun = await urunBul(String(fd.get("urunId") ?? ""));
    if (!urun) return { durum: "hata", mesaj: "Önce ürünü kaydet." };

    const dosya = fd.get("asset");
    if (!(dosya instanceof File) || dosya.size === 0)
      return { durum: "hata", mesaj: "PNG dosyası seç." };

    const layer = slotForCategory(urun.category);
    const sonuc = await pixelAssetKaydet(dosya, layer, urun.id);
    if (!sonuc.ok) return { durum: "hata", mesaj: sonuc.hata };

    // Değiştirilen eski yüklemeyi temizle (tohum asset'lerine dokunmaz).
    if (urun.tryOn && urun.tryOn.asset !== sonuc.yol)
      await pixelAssetSil(urun.tryOn.asset, urun.id);

    // Doğrulamayı geçen asset doğrudan yayına girer: Pixel Fit = Hazır,
    // layer kategoriden gelir. (Eski "pending" kayıtlar onay düğmesiyle
    // yayına alınmaya devam eder.)
    await urunYaz({
      ...urun,
      tryOn: { layer, asset: sonuc.yol, status: "approved" },
    });
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
