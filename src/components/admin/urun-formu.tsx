"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { urunKaydet, urunSil, type Sonuc } from "@/app/admin/actions";
import { CATEGORIES } from "@/data/products";
import { SIZE_ORDER } from "@/lib/product-variants";
import { cn } from "@/lib/utils";
import type { Product, ProductCategory, ProductSize } from "@/types/product";

const BOS: Sonuc = { durum: "bos" };

type RenkSatiri = { key: number; name: string; hex: string };

const girdi =
  "h-11 w-full rounded-lg bg-background px-3 text-sm ring-1 ring-border outline-none transition-shadow placeholder:text-foreground/30 focus-visible:ring-2 focus-visible:ring-ring";
const etiket = "micro text-foreground/45";

export function UrunFormu({
  urun,
  kategori,
  onKategori,
  onKaydedildi,
  pixelDosya,
}: {
  urun?: Product;
  kategori: ProductCategory;
  onKategori: (k: ProductCategory) => void;
  /** Kayıt başarılıysa çağrılır; Pixel Fit paneli seçimini sıfırlar. */
  onKaydedildi?: () => void;
  /**
   * Pixel Fit panelinde seçilmiş ama henüz yüklenmemiş PNG.
   *
   * Her iki ekranda da gönderilir: yeni üründe asset ürünle aynı kaydetmede
   * oluşur, kayıtlı üründe ise yönetici "PNG yükle" yerine "Değişiklikleri
   * kaydet"e bastığında seçim sessizce kaybolmaz. Dosya adı içerik hash'i
   * olduğu için aynı dosyanın iki yoldan da kaydedilmesi aynı sonucu verir.
   */
  pixelDosya?: File | null;
}) {
  const router = useRouter();
  const [sonuc, kaydet, kaydediliyor] = useActionState(
    async (onceki: Sonuc, fd: FormData) => {
      if (pixelDosya) fd.append("pixelAsset", pixelDosya);
      return urunKaydet(onceki, fd);
    },
    BOS,
  );

  // Silme iki adımlı: ilk tık onay ister, ikincisi siler.
  const [silOnay, setSilOnay] = useState(false);
  const [silSonuc, sil, siliniyor] = useActionState(
    async (onceki: Sonuc, fd: FormData) => {
      const r = await urunSil(onceki, fd);
      if (r.durum === "ok") router.push("/admin/urunler");
      return r;
    },
    BOS,
  );

  // Renkler: sıra değişse de stok hücreleri kaymasın diye kararlı anahtar.
  const [renkler, setRenkler] = useState<RenkSatiri[]>(() =>
    (urun?.colors ?? [{ name: "", hex: "#1a1a1a" }]).map((c, i) => ({
      key: i,
      ...c,
    })),
  );
  const [sonrakiKey, setSonrakiKey] = useState(renkler.length);

  const [bedenler, setBedenler] = useState<Set<ProductSize>>(
    () => new Set(urun?.variants.map((v) => v.size) ?? []),
  );

  // Stok ızgarası: "renkKey-beden" → metin. Boş = o kombinasyon yok.
  const [stok, setStok] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    urun?.colors.forEach((c, i) =>
      urun.variants
        .filter((v) => v.color === c.name)
        .forEach((v) => (out[`${i}-${v.size}`] = String(v.stock))),
    );
    return out;
  });

  useEffect(() => {
    if (sonuc.durum !== "ok") return;
    // Kaydedilen PNG artık sunucudaki yoldan gösterilir; paneldeki "henüz
    // kaydedilmedi" seçimi burada düşer.
    onKaydedildi?.();
    if (!urun && sonuc.urunId) router.push(`/admin/urunler/${sonuc.urunId}`);
    else router.refresh();
  }, [sonuc, urun, router, onKaydedildi]);

  const secilenBedenler = SIZE_ORDER.filter((b) => bedenler.has(b));

  return (
    <form action={kaydet} className="grid gap-8">
      {urun && <input type="hidden" name="urunId" value={urun.id} />}

      {/* Temel bilgiler */}
      <fieldset className="grid gap-5">
        <legend className="sr-only">Temel bilgiler</legend>
        <label className="grid gap-2">
          <span className={etiket}>Ürün adı</span>
          <input
            name="ad"
            required
            defaultValue={urun?.name}
            className={girdi}
          />
        </label>
        <label className="grid gap-2">
          <span className={etiket}>Slug (ürün adresi)</span>
          <input
            name="slug"
            defaultValue={urun?.slug}
            placeholder="Boş bırakılırsa ürün adından üretilir"
            className={girdi}
          />
        </label>
        <label className="grid gap-2">
          <span className={etiket}>Açıklama</span>
          <textarea
            name="aciklama"
            required
            rows={3}
            defaultValue={urun?.description}
            className={cn(girdi, "h-auto py-2.5 leading-relaxed")}
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-3">
          <label className="grid gap-2">
            <span className={etiket}>Fiyat (₺)</span>
            <input
              name="fiyat"
              type="number"
              min={1}
              step={1}
              required
              defaultValue={urun?.price}
              className={girdi}
            />
          </label>
          <label className="grid gap-2">
            <span className={etiket}>İndirim öncesi (ops.)</span>
            <input
              name="indirimOncesi"
              type="number"
              min={1}
              step={1}
              defaultValue={urun?.compareAtPrice}
              className={girdi}
            />
          </label>
          <label className="grid gap-2">
            <span className={etiket}>Kategori</span>
            <select
              name="kategori"
              value={kategori}
              onChange={(e) => onKategori(e.target.value as ProductCategory)}
              className={girdi}
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="inline-flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            name="isNew"
            defaultChecked={urun?.isNew ?? true}
            className="size-4 accent-[var(--brand)]"
          />
          Yeni gelenlerde göster
        </label>
      </fieldset>

      {/* Renkler */}
      <fieldset className="grid gap-3">
        <legend className={etiket}>Renkler</legend>
        {renkler.map((r, i) => (
          <div key={r.key} className="flex items-center gap-2">
            <input
              type="color"
              name="renkHex"
              value={r.hex}
              onChange={(e) =>
                setRenkler((l) =>
                  l.map((x) =>
                    x.key === r.key ? { ...x, hex: e.target.value } : x,
                  ),
                )
              }
              aria-label={`${i + 1}. renk kodu`}
              className="size-11 shrink-0 cursor-pointer rounded-lg bg-background p-1 ring-1 ring-border"
            />
            <input
              name="renkAd"
              value={r.name}
              placeholder="Renk adı (ör. Siyah)"
              onChange={(e) =>
                setRenkler((l) =>
                  l.map((x) =>
                    x.key === r.key ? { ...x, name: e.target.value } : x,
                  ),
                )
              }
              className={girdi}
            />
            {renkler.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setRenkler((l) => l.filter((x) => x.key !== r.key))
                }
                aria-label="Rengi kaldır"
                className="grid size-11 shrink-0 place-items-center rounded-lg text-foreground/40 transition-colors hover:text-brand"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setRenkler((l) => [
              ...l,
              { key: sonrakiKey, name: "", hex: "#1a1a1a" },
            ]);
            setSonrakiKey((k) => k + 1);
          }}
          className="inline-flex w-fit items-center gap-1.5 micro text-foreground/55 transition-colors hover:text-foreground"
        >
          <Plus className="size-3.5" /> Renk ekle
        </button>
      </fieldset>

      {/* Bedenler + stok */}
      <fieldset className="grid gap-3">
        <legend className={etiket}>Bedenler</legend>
        <div className="flex flex-wrap gap-1.5">
          {SIZE_ORDER.map((b) => {
            const aktif = bedenler.has(b);
            return (
              <label
                key={b}
                className={cn(
                  "inline-flex h-9 min-w-11 cursor-pointer items-center justify-center rounded-full px-3 text-[13px] transition-colors",
                  aktif
                    ? "bg-foreground text-background ring-1 ring-brand"
                    : "bg-muted text-foreground/75 hover:text-foreground",
                )}
              >
                <input
                  type="checkbox"
                  name="beden"
                  value={b}
                  checked={aktif}
                  onChange={() =>
                    setBedenler((s) => {
                      const n = new Set(s);
                      if (n.has(b)) n.delete(b);
                      else n.add(b);
                      return n;
                    })
                  }
                  className="sr-only"
                />
                {b}
              </label>
            );
          })}
        </div>

        {secilenBedenler.length > 0 && (
          <div className="mt-2">
            <p className="text-[12px] text-foreground/45">
              Stok — boş hücre o renk/beden yok demek, 0 tükendi demek.
            </p>
            <div className="mt-2 overflow-x-auto">
              <table className="text-sm">
                <thead>
                  <tr>
                    <th className="pr-3 text-left font-normal" />
                    {secilenBedenler.map((b) => (
                      <th
                        key={b}
                        className="px-1 pb-1.5 text-center micro font-normal text-foreground/45"
                      >
                        {b}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {renkler.map((r, ci) => (
                    <tr key={r.key}>
                      <td className="max-w-32 truncate py-1 pr-3 text-[13px] text-foreground/70">
                        {r.name || `Renk ${ci + 1}`}
                      </td>
                      {secilenBedenler.map((b) => {
                        const k = `${r.key}-${b}`;
                        return (
                          <td key={b} className="px-1 py-1">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              // Sunucu hücreyi renk SIRASIYLA okur.
                              name={`stok-${ci}-${b}`}
                              value={stok[k] ?? ""}
                              onChange={(e) =>
                                setStok((s) => ({ ...s, [k]: e.target.value }))
                              }
                              aria-label={`${r.name || `Renk ${ci + 1}`} ${b} stok`}
                              className="h-9 w-14 rounded-md bg-background text-center text-[13px] ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </fieldset>

      {/* Görseller */}
      <fieldset className="grid gap-3">
        <legend className={etiket}>Ürün görselleri</legend>
        {urun && urun.images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {urun.images.map((g) => (
              <div
                key={g.src}
                className="relative size-20 overflow-hidden rounded-lg bg-muted"
              >
                <Image
                  src={g.src}
                  alt={g.alt}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          name="gorsel"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="text-[13px] file:mr-3 file:h-9 file:cursor-pointer file:rounded-full file:border-0 file:bg-muted file:px-4 file:text-[13px] file:text-foreground"
        />
        <p className="text-[12px] text-foreground/45">
          {urun
            ? "Yeni görsel seçersen mevcut görsellerin yerini alır. İlk görsel kapak olur."
            : "En az bir görsel gerekli. İlk görsel kapak olur."}
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-border/70 pt-6">
        <button
          type="submit"
          disabled={kaydediliyor}
          className="inline-flex h-12 items-center rounded-full bg-foreground px-8 micro text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          {kaydediliyor
            ? "Kaydediliyor…"
            : urun
              ? "Değişiklikleri kaydet"
              : "Ürünü oluştur"}
        </button>
        {sonuc.durum !== "bos" && (
          <p
            role="status"
            className={cn(
              "text-[13px]",
              sonuc.durum === "hata" ? "text-brand" : "text-foreground/70",
            )}
          >
            {sonuc.mesaj}
          </p>
        )}
        {urun && (
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {silOnay ? (
              <>
                <span className="text-[13px] text-foreground/70">
                  Ürün katalogdan kaldırılsın mı?
                </span>
                <button
                  type="submit"
                  formAction={sil}
                  formNoValidate
                  disabled={siliniyor}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 micro text-background ring-1 ring-brand transition-colors hover:bg-foreground/90 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.8} />
                  {siliniyor ? "Siliniyor…" : "Evet, sil"}
                </button>
                <button
                  type="button"
                  onClick={() => setSilOnay(false)}
                  className="micro text-foreground/50 transition-colors hover:text-foreground"
                >
                  Vazgeç
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setSilOnay(true)}
                className="inline-flex h-10 items-center gap-2 rounded-full px-3 micro text-foreground/50 transition-colors hover:text-brand"
              >
                <Trash2 className="size-3.5" strokeWidth={1.8} />
                Ürünü sil
              </button>
            )}
          </div>
        )}
        {silSonuc.durum === "hata" && (
          <p role="alert" className="w-full text-[13px] text-brand">
            {silSonuc.mesaj}
          </p>
        )}
      </div>
    </form>
  );
}
