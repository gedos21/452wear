"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { slotForCategory } from "@/lib/character";
import type { Product, ProductCategory } from "@/types/product";
import { PixelFitPaneli } from "./pixel-fit-paneli";
import { UrunFormu, type Kayit } from "./urun-formu";

/**
 * Ürün formu + Pixel Fit bölümü. Kategori burada tutulur ki Pixel Fit'in
 * layer'ı formdaki seçimle canlı değişsin. İki ayrı <form> var (iç içe form
 * geçersiz HTML) ama tek sayfada tek akış olarak görünür.
 *
 * Kaydedilmemiş üründe seçilen PNG de burada tutulur: henüz bir ürün id'si
 * olmadığı için asset tek başına yüklenemez, ürünle AYNI kaydetmede gider.
 */
function formAnahtari(urun: Product): string {
  const { tryOn: _yoksay, ...bilgi } = urun;
  void _yoksay;
  return JSON.stringify(bilgi);
}

export function UrunDuzenleyici({ urun }: { urun?: Product }) {
  const [kategori, setKategori] = useState<ProductCategory>(
    urun?.category ?? "tisort",
  );
  // Panelde seçilen ama henüz yüklenmemiş PNG; kaydetmeye eklenir.
  const [pixelDosya, setPixelDosya] = useState<File | null>(null);
  // Kayıttan sonra paneli sıfırlamak için: artan sayı paneli yeniden kurar,
  // böylece yerel önizleme ve dosya girdisi temizlenir.
  const [pixelSifirla, setPixelSifirla] = useState(0);

  // Form kayıttan sonra yeniden kurulduğu için son kayıt mesajı burada tutulur.
  const [kayitMesaji, setKayitMesaji] = useState<string | null>(null);

  // Yeni ürün ekranı: her başarılı eklemede artar ve formu boş olarak yeniden
  // kurar; eklenen ürün alttaki bildirimde gösterilir.
  const [formNo, setFormNo] = useState(0);
  const [eklenen, setEklenen] = useState<{ id: string; ad: string } | null>(
    null,
  );

  const kaydedildi = useCallback(
    (kayit: Kayit) => {
      setPixelDosya(null);
      setPixelSifirla((n) => n + 1);
      if (!urun && kayit.urunId) {
        // Sıradaki ürün için temiz form.
        setEklenen({ id: kayit.urunId, ad: kayit.ad });
        setKategori("tisort");
        setFormNo((n) => n + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setKayitMesaji(kayit.mesaj);
    },
    [urun],
  );

  // Bildirim birkaç saniye sonra kendiliğinden kapanır.
  useEffect(() => {
    if (!eklenen) return;
    const t = setTimeout(() => setEklenen(null), 6000);
    return () => clearTimeout(t);
  }, [eklenen]);

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-12">
        {/* Form yalnızca ÜRÜN bilgisi değişince yeniden kurulur (kayıttan sonra
            sunucudaki normalize veriyle dolsun diye). Pixel Fit işlemleri
            yalnızca tryOn'u değiştirir; panelin mesajları kaybolmasın diye
            tryOn anahtara dahil değil. Yeni ürün ekranında her eklemeden
            sonra boş olarak yeniden kurulur. */}
        <UrunFormu
          key={urun ? formAnahtari(urun) : `yeni-${formNo}`}
          urun={urun}
          kategori={kategori}
          onKategori={setKategori}
          onKaydedildi={kaydedildi}
          kayitMesaji={kayitMesaji}
          // Karakterde yuvası olmayan kategoride seçili PNG gönderilmez.
          pixelDosya={slotForCategory(kategori) ? pixelDosya : null}
        />
        <div className="lg:sticky lg:top-20 lg:self-start">
          <PixelFitPaneli
            key={pixelSifirla}
            urun={urun}
            kategori={kategori}
            onPixelDosya={setPixelDosya}
          />
        </div>
      </div>

      {eklenen && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-md items-center gap-3 rounded-[var(--radius-product)] bg-foreground px-4 py-3.5 text-background shadow-[0_1px_2px_rgb(0_0_0/0.08),0_18px_40px_-18px_rgb(0_0_0/0.45)]"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-background/10">
            <Check className="size-4" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="micro">Ürün eklendi</p>
            <p className="mt-1 truncate text-[13px] text-background/65">
              {eklenen.ad} · {eklenen.id}
            </p>
          </div>
          <Link
            href={`/admin/urunler/${eklenen.id}`}
            className="shrink-0 micro text-background/70 transition-colors hover:text-background"
          >
            Düzenle →
          </Link>
          <button
            type="button"
            onClick={() => setEklenen(null)}
            aria-label="Bildirimi kapat"
            className="grid size-8 shrink-0 place-items-center rounded-full text-background/60 transition-colors hover:text-background"
          >
            <X className="size-4" strokeWidth={1.8} />
          </button>
        </div>
      )}
    </>
  );
}
