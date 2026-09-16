"use client";

import { useCallback, useState } from "react";
import { slotForCategory } from "@/lib/character";
import type { Product, ProductCategory } from "@/types/product";
import { PixelFitPaneli } from "./pixel-fit-paneli";
import { UrunFormu } from "./urun-formu";

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

export function UrunDuzenleyici({
  urun,
  ilkMesaj,
}: {
  urun?: Product;
  /** Sayfaya bir kayıttan sonra gelindiyse gösterilecek mesaj. */
  ilkMesaj?: string;
}) {
  const [kategori, setKategori] = useState<ProductCategory>(
    urun?.category ?? "tisort",
  );
  // Panelde seçilen ama henüz yüklenmemiş PNG; kaydetmeye eklenir.
  const [pixelDosya, setPixelDosya] = useState<File | null>(null);
  // Kayıttan sonra paneli sıfırlamak için: artan sayı paneli yeniden kurar,
  // böylece yerel önizleme ve dosya girdisi temizlenir.
  const [pixelSifirla, setPixelSifirla] = useState(0);

  // Form kayıttan sonra yeniden kurulduğu için son kayıt mesajı burada tutulur.
  const [kayitMesaji, setKayitMesaji] = useState<string | null>(
    ilkMesaj ?? null,
  );

  const kaydedildi = useCallback((mesaj: string) => {
    setPixelDosya(null);
    setPixelSifirla((n) => n + 1);
    setKayitMesaji(mesaj);
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-12">
      {/* Form yalnızca ÜRÜN bilgisi değişince yeniden kurulur (kayıttan sonra
          sunucudaki normalize veriyle dolsun diye). Pixel Fit işlemleri
          yalnızca tryOn'u değiştirir; panelin mesajları kaybolmasın diye
          tryOn anahtara dahil değil. */}
      <UrunFormu
        key={urun ? formAnahtari(urun) : "yeni"}
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
  );
}
