"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, Trash2, Upload } from "lucide-react";
import {
  pixelAssetKaldir,
  pixelAssetOnayla,
  pixelAssetYukle,
  type Sonuc,
} from "@/app/admin/actions";
import { CharacterTryOn } from "@/components/tryon/character-tryon";
import { CHARACTER_CANVAS, slotForCategory } from "@/lib/character";
import { cn } from "@/lib/utils";
import type { Product, ProductCategory } from "@/types/product";
import { PixelFitRozet, pixelFitDurumu } from "./pixel-fit-durum";

const BOS: Sonuc = { durum: "bos" };
const { width: GEN, height: YUK } = CHARACTER_CANVAS;

/**
 * İstemci tarafı ön kontrol — anında geri bildirim için. Asıl doğrulama
 * sunucuda (lib/pixel-asset.ts) tekrar yapılır; burası atlanabilir.
 */
async function pngOnKontrol(dosya: File): Promise<string | null> {
  if (dosya.type !== "image/png") return "Pixel Fit asset PNG olmalı.";
  // Sunucudaki sınırla aynı (lib/pixel-asset.ts).
  if (dosya.size > 4 * 1024 * 1024) return "Dosya 4 MB'ı aşıyor.";
  const url = URL.createObjectURL(dosya);
  try {
    const img = await new Promise<HTMLImageElement>((ok, hata) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => hata(new Error("okunamadı"));
      i.src = url;
    });
    if (img.naturalWidth !== GEN || img.naturalHeight !== YUK)
      return `Pixel Fit asset ${GEN}×${YUK} olmalı. (Yüklenen: ${img.naturalWidth}×${img.naturalHeight})`;
    const c = document.createElement("canvas");
    c.width = GEN;
    c.height = YUK;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, GEN, YUK).data;
    let saydam = 0;
    for (let k = 3; k < d.length; k += 4) if (d[k] < 16) saydam++;
    if (saydam / (GEN * YUK) < 0.05)
      return "Asset'in arka planı şeffaf değil: neredeyse tüm pikseller opak.";
    return null;
  } catch {
    return "Dosya okunamadı; geçerli bir PNG değil.";
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function PixelFitPaneli({
  urun,
  kategori,
  onPixelDosya,
}: {
  /** Kaydedilmemiş yeni üründe undefined. */
  urun?: Product;
  /** Formdaki CANLI kategori — layer buradan türetilir. */
  kategori: ProductCategory;
  /**
   * Seçilen PNG'yi forma bildirir. Yeni üründe asset ancak ürünle birlikte
   * kaydedilebilir; kayıtlı üründe ise yönetici "PNG yükle" yerine ürünü
   * kaydederse seçim kaybolmasın diye aynı dosya forma da verilir.
   */
  onPixelDosya?: (dosya: File | null) => void;
}) {
  const router = useRouter();
  const layer = slotForCategory(kategori);
  const durum = urun ? pixelFitDurumu(urun) : "yok";
  const yeniUrun = !urun;

  const [yerel, setYerel] = useState<{ url: string; ad: string } | null>(null);
  const [onHata, setOnHata] = useState<string | null>(null);
  const [onizle, setOnizle] = useState(Boolean(urun?.tryOn));
  const inputRef = useRef<HTMLInputElement>(null);

  // Başarıdan sonraki temizlik action'ın içinde yapılır (effect'te setState
  // zincirleme render'a yol açar). Yerel önizleme kaldırılır çünkü kaydedilen
  // dosya aynı içeriktir ve artık sunucudaki yoldan gösterilir.
  const [yukSonuc, yukle, yukleniyor] = useActionState(
    async (onceki: Sonuc, fd: FormData) => {
      const r = await pixelAssetYukle(onceki, fd);
      if (r.durum === "ok") {
        setYerel(null);
        if (inputRef.current) inputRef.current.value = "";
        onPixelDosya?.(null);
        router.refresh();
      } else if (r.durum === "hata") {
        // React form gönderiminden sonra dosya girdisini boşaltır; önizleme
        // kalırsa "PNG yükle" boş dosya gönderirdi. Seçim de temizlenir,
        // yönetici dosyayı yeniden seçer. Blob URL'si yerel'i izleyen
        // effect'in temizliğinde bırakılır.
        setYerel(null);
        onPixelDosya?.(null);
      }
      return r;
    },
    BOS,
  );
  const [onaySonuc, onayla, onaylaniyor] = useActionState(
    async (onceki: Sonuc, fd: FormData) => {
      const r = await pixelAssetOnayla(onceki, fd);
      if (r.durum === "ok") router.refresh();
      return r;
    },
    BOS,
  );
  const [kalSonuc, kaldir, kaldiriliyor] = useActionState(
    async (onceki: Sonuc, fd: FormData) => {
      const r = await pixelAssetKaldir(onceki, fd);
      if (r.durum === "ok") {
        setOnizle(false);
        router.refresh();
      }
      return r;
    },
    BOS,
  );

  useEffect(
    () => () => {
      if (yerel) URL.revokeObjectURL(yerel.url);
    },
    [yerel],
  );

  // Kategori değişip layer uyuşmazsa kayıtlı asset yanlış yuvaya ait olur.
  const layerUyusmuyor = Boolean(urun?.tryOn && urun.tryOn.layer !== layer);

  const gosterilen = yerel?.url ?? urun?.tryOn?.asset ?? null;
  const sonMesaj = [kalSonuc, onaySonuc, yukSonuc].find(
    (s): s is Exclude<Sonuc, { durum: "bos" }> => s.durum !== "bos",
  );

  function secimiTemizle() {
    if (yerel) URL.revokeObjectURL(yerel.url);
    setYerel(null);
    if (inputRef.current) inputRef.current.value = "";
    onPixelDosya?.(null);
  }

  async function dosyaSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setOnHata(null);
    // DİKKAT: input.value'ya dokunma — seçilen dosya input'ta kalmalı ki
    // kayıtlı ürünün yükleme formu onu sunucuya gönderebilsin.
    if (yerel) URL.revokeObjectURL(yerel.url);
    setYerel(null);
    onPixelDosya?.(null);
    if (!f) return;
    const hata = await pngOnKontrol(f);
    if (hata) {
      setOnHata(hata);
      e.target.value = "";
      return;
    }
    setYerel({ url: URL.createObjectURL(f), ad: f.name });
    setOnizle(true);
    // Dosya forma da verilir: hangi kaydetme düğmesine basılırsa basılsın
    // seçim kaybolmaz.
    onPixelDosya?.(f);
  }

  /* Kaynak satırı: seçim + (kayıtlı üründe) yükleme. İleride buraya
     "PIXEL ASSET OLUŞTUR" (AI) ikinci bir kaynak olarak eklenecek; akışın
     geri kalanı (önizle → kaydet) aynı kalır. */
  const kaynak = (
    <>
      <p className="micro text-foreground/45">PNG dosyası</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label
          className={cn(
            "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-background px-4 text-[13px] ring-1 ring-border transition-colors hover:ring-foreground/40",
            yukleniyor && "pointer-events-none opacity-50",
          )}
        >
          <Upload className="size-3.5" strokeWidth={1.8} />
          {urun?.tryOn || yerel ? "Değiştir" : "PNG seç"}
          <input
            ref={inputRef}
            type="file"
            name="asset"
            accept="image/png"
            className="sr-only"
            onChange={dosyaSecildi}
          />
        </label>
        {yerel && !yeniUrun && (
          <button
            type="submit"
            disabled={yukleniyor}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-[13px] text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            {yukleniyor ? "Yükleniyor…" : "PNG yükle"}
          </button>
        )}
      </div>
      <p className="mt-2 text-[12px] text-foreground/45">
        Şeffaf PNG, {GEN}×{YUK}.{" "}
        {yeniUrun
          ? "Ürünü oluşturduğunda asset de kaydedilir."
          : "Yüklenen asset doğrudan Pixel Fit'e girer."}
      </p>
      {yerel && (
        <p className="mt-1 truncate text-[12px] text-foreground/60">
          Seçilen: {yerel.ad} — henüz kaydedilmedi
        </p>
      )}
      {onHata && (
        <p className="mt-3 text-[13px] text-brand" role="alert">
          {onHata}
        </p>
      )}
    </>
  );

  // Karakterde yuvası olmayan kategori (ayakkabı): Pixel Fit kullanılmaz.
  // Eski bir kayıtta asset kalmışsa yalnızca kaldırma seçeneği gösterilir.
  if (layer === null) {
    return (
      <section
        aria-labelledby="pixel-fit-baslik"
        className="rounded-[var(--radius-product)] bg-muted/40 p-5 ring-1 ring-border/70 sm:p-6"
      >
        {/* lang="en": micro uppercase Türkçe kipte "PİXEL FİT" üretiyor. */}
        <h2 id="pixel-fit-baslik" lang="en" className="micro text-foreground">
          Pixel Fit Asset
        </h2>
        <p className="mt-4 text-[13px] leading-relaxed text-foreground/60">
          Bu kategoride Pixel Fit kullanılmıyor; karakterde bu ürün için bir
          katman yok.
        </p>
        {urun?.tryOn && (
          <form action={kaldir} className="mt-4">
            <input type="hidden" name="urunId" value={urun.id} />
            <button
              type="submit"
              disabled={kaldiriliyor}
              className="inline-flex h-10 items-center gap-2 rounded-full px-3 micro text-foreground/50 transition-colors hover:text-brand disabled:opacity-50"
            >
              <Trash2 className="size-3.5" strokeWidth={1.8} />
              {kaldiriliyor ? "Kaldırılıyor…" : "Kayıtlı asset'i kaldır"}
            </button>
          </form>
        )}
        {sonMesaj && (
          <p
            role="status"
            className={cn(
              "mt-4 text-[13px]",
              sonMesaj.durum === "hata" ? "text-brand" : "text-foreground/70",
            )}
          >
            {sonMesaj.mesaj}
          </p>
        )}
      </section>
    );
  }

  return (
    <section
      aria-labelledby="pixel-fit-baslik"
      className="rounded-[var(--radius-product)] bg-muted/40 p-5 ring-1 ring-border/70 sm:p-6"
    >
      {/* lang="en": micro uppercase Türkçe kipte "PİXEL FİT" üretiyor. */}
        <h2 id="pixel-fit-baslik" lang="en" className="micro text-foreground">
        Pixel Fit Asset
      </h2>

      {/* Dar kenar sütununda tek kolon: bilgi + eylemler, altında önizleme. */}
      <div className="mt-5 grid gap-6">
        <div className="min-w-0">
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="micro text-foreground/45">Durum</dt>
              <dd className="mt-1.5">
                <PixelFitRozet durum={durum} />
              </dd>
            </div>
            <div>
              <dt className="micro text-foreground/45">Layer</dt>
              <dd className="mt-1.5">
                <span className="font-medium">
                  {layer === "top" ? "Üst (top)" : "Alt (bottom)"}
                </span>
                <span className="ml-2 text-[12px] text-foreground/45">
                  kategoriden otomatik
                </span>
              </dd>
            </div>
            {urun?.tryOn && (
              <div>
                <dt className="micro text-foreground/45">Mevcut asset</dt>
                <dd className="mt-1.5 break-all font-mono text-[12px] text-foreground/70">
                  {urun.tryOn.asset}
                </dd>
              </div>
            )}
          </dl>

          {layerUyusmuyor && (
            <p className="mt-4 text-[13px] text-brand" role="alert">
              Kategori değişti: kayıtlı asset &quot;{urun!.tryOn!.layer}&quot;
              yuvasına ait. Ürünü kaydedip yeni kategoriye uygun bir asset
              yükle.
            </p>
          )}

          {urun ? (
            <form action={yukle} className="mt-5">
              <input type="hidden" name="urunId" value={urun.id} />
              {kaynak}
            </form>
          ) : (
            <div className="mt-5">{kaynak}</div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnizle((v) => !v)}
              disabled={!gosterilen}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-background px-4 micro ring-1 ring-border transition-colors hover:ring-foreground/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {onizle ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              {onizle ? "Önizlemeyi gizle" : "Karakterde önizle"}
            </button>

            {urun && durum === "bekliyor" && !yerel && (
              <form action={onayla}>
                <input type="hidden" name="urunId" value={urun.id} />
                <button
                  type="submit"
                  disabled={onaylaniyor || layerUyusmuyor}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 micro text-background ring-1 ring-brand transition-colors hover:bg-foreground/90 disabled:opacity-50"
                >
                  <Check className="size-3.5" strokeWidth={2} />
                  {onaylaniyor ? "Onaylanıyor…" : "Pixel asset'i onayla"}
                </button>
              </form>
            )}

            {urun?.tryOn && (
              <form action={kaldir}>
                <input type="hidden" name="urunId" value={urun.id} />
                <button
                  type="submit"
                  disabled={kaldiriliyor}
                  className="inline-flex h-10 items-center gap-2 rounded-full px-3 micro text-foreground/50 transition-colors hover:text-brand disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.8} />
                  {kaldiriliyor ? "Kaldırılıyor…" : "Kaldır"}
                </button>
              </form>
            )}

            {yeniUrun && yerel && (
              <button
                type="button"
                onClick={() => {
                  secimiTemizle();
                  setOnizle(false);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-full px-3 micro text-foreground/50 transition-colors hover:text-brand"
              >
                <Trash2 className="size-3.5" strokeWidth={1.8} />
                Seçimi kaldır
              </button>
            )}
          </div>

          {sonMesaj && (
            <p
              role="status"
              className={cn(
                "mt-4 text-[13px]",
                sonMesaj.durum === "hata" ? "text-brand" : "text-foreground/70",
              )}
            >
              {sonMesaj.mesaj}
            </p>
          )}
        </div>

        {/* Önizleme: mevcut CharacterTryOn — base sabit, yalnızca bu yuva
            override ile çizilir. Yerel seçimde blob: yolu çizilir; next/image
            bu yolları optimize etmeden geçirir. */}
        {onizle && gosterilen && (
          <figure className="mx-auto w-fit">
            <CharacterTryOn
              outfit={{}}
              override={{ [layer]: gosterilen }}
              className="h-[clamp(13rem,28vh,17rem)]"
            />
            <figcaption className="mt-2 text-center text-[11px] text-foreground/45">
              {yerel
                ? yeniUrun
                  ? "Yerel önizleme — ürünle kaydedilecek"
                  : "Yerel önizleme (kaydedilmedi)"
                : durum === "hazir"
                  ? "Yayındaki asset"
                  : "Onay bekleyen asset"}
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
