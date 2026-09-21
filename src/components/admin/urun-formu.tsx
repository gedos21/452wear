"use client";

import Image from "next/image";
import { startTransition, useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { urunKaydet, urunSil, type Sonuc } from "@/app/admin/actions";
import { CATEGORIES } from "@/data/products";
import { sizesForCategory } from "@/lib/product-variants";
import { cn } from "@/lib/utils";
import type { Product, ProductCategory, ProductSize } from "@/types/product";

const BOS: Sonuc = { durum: "bos" };

/** Başarılı kayıttan sonra düzenleyiciye bildirilen bilgi. */
export type Kayit = { mesaj: string; urunId?: string; ad: string };

type RenkSatiri = { key: number; name: string; hex: string };

/** Formdaki görsel: kayıtlı (sunucudaki yol) ya da bu kayıtta eklenecek dosya. */
type GorselOgesi =
  | { tip: "mevcut"; key: string; src: string }
  | { tip: "yeni"; key: string; src: string; file: File };

const girdi =
  "h-11 w-full rounded-lg bg-background px-3 text-sm ring-1 ring-border outline-none transition-shadow placeholder:text-foreground/30 focus-visible:ring-2 focus-visible:ring-ring";
const etiket = "micro text-foreground/45";

/** "Tüm bedenlere stok" tuşunun her hücreye yazdığı adet. */
const TAM_STOK = 10;

export function UrunFormu({
  urun,
  kategori,
  onKategori,
  onKaydedildi,
  kayitMesaji,
  pixelDosya,
  urunler = [],
}: {
  urun?: Product;
  kategori: ProductCategory;
  onKategori: (k: ProductCategory) => void;
  /**
   * Kayıt başarılıysa çağrılır. Düzenleyici Pixel Fit seçimini sıfırlar; yeni
   * üründe formu boşaltıp bildirim gösterir, kayıtlı üründe mesajı saklar.
   */
  onKaydedildi?: (kayit: Kayit) => void;
  /**
   * Son başarılı kaydın mesajı. Form kayıttan sonra sunucudaki veriyle yeniden
   * kurulduğu için kendi sonucu sıfırlanır; mesaj buradan gösterilir.
   */
  kayitMesaji?: string | null;
  /**
   * Pixel Fit panelinde seçilmiş ama henüz yüklenmemiş PNG.
   *
   * Her iki ekranda da gönderilir: yeni üründe asset ürünle aynı kaydetmede
   * oluşur, kayıtlı üründe ise yönetici "PNG yükle" yerine "Değişiklikleri
   * kaydet"e bastığında seçim sessizce kaybolmaz. Dosya adı içerik hash'i
   * olduğu için aynı dosyanın iki yoldan da kaydedilmesi aynı sonucu verir.
   */
  pixelDosya?: File | null;
  /**
   * Öneri alanlarında seçilebilecek ürünler (yayındaki katalog). Boş
   * gelirse bölüm çizilmez; alanlar zaten zorunlu değil.
   */
  urunler?: Product[];
}) {
  const router = useRouter();
  // Ürünün kendisi öneri listesinde çıkmasın.
  const digerUrunler = urunler.filter((p) => p.id !== urun?.id);

  // Görseller ekrandaki sırayla tutulur: kayıtlı olanlar + bu kayıtta eklenecek
  // dosyalar. Kaydedince bu sıra gönderilir; listeden kaldırılan kayıtlı görsel
  // sunucuda silinir. Seçilen dosyalar kaydedilene kadar yalnızca önizlemedir.
  const [gorseller, setGorseller] = useState<GorselOgesi[]>(() =>
    (urun?.images ?? []).map((g) => ({
      tip: "mevcut" as const,
      key: g.src,
      src: g.src,
    })),
  );
  const yeniSayac = useRef(0);

  function gorselEkle(e: React.ChangeEvent<HTMLInputElement>) {
    // Birlikte seçilen dosyalar adına göre dizilir: 01-kapak, 02-arka…
    const dosyalar = [...(e.target.files ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, "tr", { numeric: true }),
    );
    // Aynı dosya kaldırılıp yeniden seçilebilsin.
    e.target.value = "";
    const eklenen = dosyalar.map((file) => ({
      tip: "yeni" as const,
      key: `yeni-${yeniSayac.current++}`,
      src: URL.createObjectURL(file),
      file,
    }));
    setGorseller((l) => [...l, ...eklenen]);
  }

  function gorselKaldir(i: number) {
    const g = gorseller[i];
    if (g?.tip === "yeni") URL.revokeObjectURL(g.src);
    setGorseller((l) => l.filter((_, j) => j !== i));
  }

  function gorselTasi(i: number, yon: -1 | 1) {
    setGorseller((l) => {
      const j = i + yon;
      if (j < 0 || j >= l.length) return l;
      const kopya = [...l];
      [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
      return kopya;
    });
  }

  // Başarı sonrası işler action'ın İÇİNDE yapılır, effect'te değil: kayıt
  // yanıtı güncel ürün verisini de getirdiği için form (key ile) aynı anda
  // yeniden kurulur ve bu bileşenin effect'i sonucu hiç görmeden kaybolur.
  const [sonuc, kaydet, kaydediliyor] = useActionState(
    async (onceki: Sonuc, fd: FormData) => {
      if (pixelDosya) fd.append("pixelAsset", pixelDosya);
      // Görseller formdan değil bu listeden gider: sıra ve kaldırma burada.
      let yeniIndex = 0;
      for (const g of gorseller) {
        if (g.tip === "mevcut") {
          fd.append("gorselSira", `m:${g.src}`);
        } else {
          fd.append("gorsel", g.file);
          fd.append("gorselSira", `y:${yeniIndex++}`);
        }
      }
      const r = await urunKaydet(onceki, fd);
      if (r.durum === "ok") {
        // Kaydedilen PNG artık sunucudaki yoldan gösterilir; paneldeki
        // "henüz kaydedilmedi" seçimi burada düşer.
        onKaydedildi?.({
          mesaj: r.mesaj,
          urunId: r.urunId,
          ad: String(fd.get("ad") ?? ""),
        });
        // Yeni üründe form yerinde boşaltılır (bkz. UrunDuzenleyici); kayıtlı
        // üründe sunucudaki güncel veriyle yeniden kurulur.
        if (urun) router.refresh();
      }
      return r;
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


  // Kategori değişince beden sistemi de değişir (ayakkabıda numara).
  const bedenSecenekleri = sizesForCategory(kategori);
  const secilenBedenler = bedenSecenekleri.filter((b) => bedenler.has(b));

  /**
   * Form elle gönderilir: React 19 `action` ile gönderilen formun durumsuz
   * alanlarını (ad, slug, açıklama, fiyat) her gönderimden sonra sıfırlar;
   * sunucu hata döndürünce yazılanlar kayboluyordu. Başarıda form zaten
   * yeniden kurulur (bkz. UrunDuzenleyici). Silme düğmesi kendi formAction'ı
   * ile gittiği için burada karışılmaz.
   */
  function gonder(e: React.FormEvent<HTMLFormElement>) {
    const gonderen = (e.nativeEvent as SubmitEvent).submitter;
    if (gonderen?.hasAttribute("data-sil")) return;
    e.preventDefault();
    const fd = new FormData(e.currentTarget, gonderen);
    startTransition(() => kaydet(fd));
  }

  const gosterilenSonuc =
    sonuc.durum !== "bos"
      ? sonuc
      : kayitMesaji
        ? { durum: "ok" as const, mesaj: kayitMesaji }
        : null;

  return (
    <form onSubmit={gonder} className="grid gap-8">
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
          {bedenSecenekleri.map((b) => {
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] text-foreground/45">
                Stok — boş hücre o renk/beden yok demek, 0 tükendi demek.
              </p>
              {/* Kolaylık: bütün renk/beden hücrelerini tek tıkla doldurur. */}
              <button
                type="button"
                onClick={() =>
                  setStok(
                    Object.fromEntries(
                      renkler.flatMap((r) =>
                        secilenBedenler.map((b) => [
                          `${r.key}-${b}`,
                          String(TAM_STOK),
                        ]),
                      ),
                    ),
                  )
                }
                className="h-8 shrink-0 rounded-full bg-muted px-3 text-[12px] text-foreground/70 transition-colors hover:text-foreground"
              >
                Tüm bedenlere {TAM_STOK} stok
              </button>
            </div>
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

      {/* Öneriler — ikisi de isteğe bağlı; boş bırakılırsa site otomatik
          öneri üretir (bkz. lib/recommendations). */}
      {digerUrunler.length > 0 && (
        <fieldset className="grid gap-3">
          <legend className={etiket}>Öneriler</legend>
          <p className="text-[13px] text-foreground/55">
            Boş bırakırsan ürün sayfasında öneriler otomatik seçilir.
          </p>
          <UrunSecimi
            ad="complementaryIds"
            baslik="Tamamlayıcı ürünler (Bunu tamamla)"
            urunler={digerUrunler}
            secili={urun?.complementaryIds ?? []}
          />
          <UrunSecimi
            ad="relatedIds"
            baslik="Benzer ürünler (Buna da bak)"
            urunler={digerUrunler}
            secili={urun?.relatedIds ?? []}
          />
        </fieldset>
      )}

      {/* Görseller */}
      <fieldset className="grid gap-3">
        <legend className={etiket}>Ürün görselleri</legend>
        {gorseller.length > 0 && (
          <ol className="flex flex-wrap gap-2">
            {gorseller.map((g, i) => (
              <li key={g.key} className="w-20">
                <div className="relative size-20 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={g.src}
                    alt={`${i + 1}. görsel`}
                    fill
                    sizes="80px"
                    unoptimized={g.tip === "yeni"}
                    className="object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] leading-none">
                      Kapak
                    </span>
                  )}
                  {g.tip === "yeni" && (
                    <span className="absolute bottom-1 left-1 rounded-full bg-foreground/80 px-1.5 py-0.5 text-[10px] leading-none text-background">
                      Yeni
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => gorselTasi(i, -1)}
                    disabled={i === 0}
                    aria-label={`${i + 1}. görseli öne al`}
                    className="grid size-6 place-items-center rounded-full text-foreground/55 transition-colors hover:text-foreground disabled:opacity-25"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => gorselKaldir(i)}
                    aria-label={`${i + 1}. görseli kaldır`}
                    className="grid size-6 place-items-center rounded-full text-foreground/40 transition-colors hover:text-brand"
                  >
                    <X className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => gorselTasi(i, 1)}
                    disabled={i === gorseller.length - 1}
                    aria-label={`${i + 1}. görseli arkaya al`}
                    className="grid size-6 place-items-center rounded-full text-foreground/55 transition-colors hover:text-foreground disabled:opacity-25"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={gorselEkle}
          aria-label="Görsel ekle"
          className="text-[13px] file:mr-3 file:h-9 file:cursor-pointer file:rounded-full file:border-0 file:bg-muted file:px-4 file:text-[13px] file:text-foreground"
        />
        <p className="text-[12px] text-foreground/45">
          Seçilen görseller listenin sonuna eklenir. İlk görsel kapak olur,
          ikincisi kartın üzerine gelince görünür. Sırayı oklarla değiştir,
          görseli × ile kaldır; değişiklikler kaydedince uygulanır.
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
        {gosterilenSonuc && (
          <p
            role="status"
            className={cn(
              "text-[13px]",
              gosterilenSonuc.durum === "hata"
                ? "text-brand"
                : "text-foreground/70",
            )}
          >
            {gosterilenSonuc.mesaj}
          </p>
        )}
        {urun && (
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {silOnay ? (
              <>
                <span className="text-[13px] text-foreground/70">
                  Ürün silinsin mi? Silinenler&apos;den geri getirebilirsin.
                </span>
                <button
                  type="submit"
                  data-sil
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

/**
 * Öneri seçimi: katalogdaki ürünler arasından çoklu seçim. Değerler aynı
 * isimle gönderilir; sunucu tarafı `getAll` ile okur.
 */
function UrunSecimi({
  ad,
  baslik,
  urunler,
  secili,
}: {
  ad: string;
  baslik: string;
  urunler: Product[];
  secili: string[];
}) {
  return (
    <div className="grid gap-2">
      <p className="text-[13px] font-medium">{baslik}</p>
      <div className="grid max-h-44 gap-1.5 overflow-y-auto rounded-lg border border-border/70 p-3 sm:grid-cols-2">
        {urunler.map((p) => (
          <label
            key={p.id}
            className="flex items-center gap-2 text-[13px] text-foreground/80"
          >
            <input
              type="checkbox"
              name={ad}
              value={p.id}
              defaultChecked={secili.includes(p.id)}
              className="size-3.5"
            />
            <span className="truncate">{p.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
