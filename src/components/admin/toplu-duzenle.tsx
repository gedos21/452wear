"use client";

import { useActionState, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, X } from "lucide-react";
import {
  topluGuncelle,
  type TopluDegisiklik,
  type TopluSonuc,
} from "@/app/admin/actions";
import { CATEGORIES } from "@/data/products";
import { productBrand, productNameParts } from "@/lib/product-filters";
import { buildSearchIndex, searchProducts } from "@/lib/product-search";
import { sizesForCategory } from "@/lib/product-variants";
import { cn } from "@/lib/utils";
import type { Product, ProductCategory, ProductSize } from "@/types/product";

const BOS: TopluSonuc = { durum: "bos" };

const girdi =
  "h-9 w-full rounded-lg bg-background px-2.5 text-[13px] ring-1 ring-border outline-none transition-shadow placeholder:text-foreground/30 focus-visible:ring-2 focus-visible:ring-ring";
const etiket = "micro text-foreground/45";

/** Hızlı seçim renkleri: ad → kod. Buradaki adlar sitedeki renklerle aynı. */
const HAZIR_RENKLER: { name: string; hex: string }[] = [
  { name: "Siyah", hex: "#1a1a1a" },
  { name: "Beyaz", hex: "#f2efe9" },
  { name: "Siyah/Beyaz", hex: "#4a4a48" },
  { name: "Gri", hex: "#9b9b96" },
  { name: "Lacivert", hex: "#26303f" },
  { name: "Kırmızı", hex: "#8f2b23" },
  { name: "Bej", hex: "#d9cdbb" },
];

/**
 * Serbest yazılan renk metnini renk listesine çevirir.
 * Biçim: "Siyah, Beyaz" ya da kendi kodunla "Antrasit #3a3a3a".
 * Tanınan adlar hazır kodları alır; tanınmayan ad kod verilmediyse nötr gri
 * olur (uydurma bir renk kodu seçilmez, yönetici kodu kendisi yazabilir).
 */
function renkleriAyristir(metin: string): { name: string; hex: string }[] {
  return metin
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((parca) => {
      const kod = parca.match(/#[0-9a-f]{6}\b/i)?.[0];
      const ad = parca.replace(/#[0-9a-f]{6}\b/i, "").trim();
      const hazir = HAZIR_RENKLER.find(
        (r) => r.name.toLocaleLowerCase("tr") === ad.toLocaleLowerCase("tr"),
      );
      return { name: ad, hex: kod ?? hazir?.hex ?? "#9b9b96" };
    })
    .filter((r) => r.name.length > 0);
}

/** Üründeki bedenler, sistem sırasına göre. */
function urunBedenleri(urun: Product): ProductSize[] {
  const set = new Set(urun.variants.map((v) => v.size));
  return sizesForCategory(urun.category).filter((b) => set.has(b));
}

type Taslak = {
  ad?: string;
  aciklama?: string;
  fiyat?: number;
  indirimOncesi?: number | null;
  kategori?: ProductCategory;
  renkler?: { name: string; hex: string }[];
  bedenler?: ProductSize[];
  stok?: number;
};

/**
 * Toplu düzenleme ekranı.
 *
 * Değişiklikler önce TASLAK olarak tutulur (tabloda hemen görünür), tek bir
 * "Kaydet" ile sunucuya gider. Böylece yönetici 50 ürünü tek tek kaydetmek
 * yerine hepsini görüp bir kerede onaylar. Sunucu her ürünü ayrı doğrular;
 * biri reddedilirse diğerleri yine kaydedilir.
 */
export function TopluDuzenle({ urunler }: { urunler: Product[] }) {
  const router = useRouter();

  const [taslaklar, setTaslaklar] = useState<Record<string, Taslak>>({});
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [acikAciklama, setAcikAciklama] = useState<string | null>(null);
  const [onayAcik, setOnayAcik] = useState(false);
  const [slugYenile, setSlugYenile] = useState(false);

  // Filtreler
  const [q, setQ] = useState("");
  const [kategoriFiltre, setKategoriFiltre] = useState<"all" | ProductCategory>(
    "all",
  );
  const [markaFiltre, setMarkaFiltre] = useState("all");

  // Toplu alanlar
  const [tAd, setTAd] = useState("");
  const [tRenk, setTRenk] = useState("");
  const [tBedenler, setTBedenler] = useState<Set<ProductSize>>(new Set());
  const [tStok, setTStok] = useState("");
  const [tFiyat, setTFiyat] = useState("");
  const [tIndirim, setTIndirim] = useState("");
  const [tIndirimKaldir, setTIndirimKaldir] = useState(false);
  const [tKategori, setTKategori] = useState<"" | ProductCategory>("");
  const [tAciklama, setTAciklama] = useState("");

  const [sonuc, kaydet, kaydediliyor] = useActionState(
    async (onceki: TopluSonuc, fd: FormData) => {
      const r = await topluGuncelle(onceki, fd);
      if (r.durum === "ok") {
        // Kaydedilenler artık sunucudaki veriden gelir; taslak kalmaz.
        setTaslaklar({});
        setSecili(new Set());
        setOnayAcik(false);
        router.refresh();
      }
      return r;
    },
    BOS,
  );

  const markalar = useMemo(
    () => [...new Set(urunler.map(productBrand))].sort((a, b) => a.localeCompare(b, "tr")),
    [urunler],
  );

  const index = useMemo(
    () =>
      buildSearchIndex(
        urunler,
        (slug) => CATEGORIES.find((c) => c.slug === slug)?.label ?? slug,
      ),
    [urunler],
  );

  const gosterilen = useMemo(() => {
    const eslesen = q.trim()
      ? new Set(searchProducts(index, q).map((p) => p.id))
      : null;
    return urunler.filter(
      (p) =>
        (kategoriFiltre === "all" || p.category === kategoriFiltre) &&
        (markaFiltre === "all" || productBrand(p) === markaFiltre) &&
        (!eslesen || eslesen.has(p.id)),
    );
  }, [urunler, q, index, kategoriFiltre, markaFiltre]);

  const degisenIdler = Object.keys(taslaklar).filter(
    (id) => Object.keys(taslaklar[id]).length > 0,
  );

  function taslakYaz(id: string, parca: Taslak) {
    setTaslaklar((t) => ({ ...t, [id]: { ...t[id], ...parca } }));
  }

  function secimDegistir(id: string) {
    setSecili((s) => {
      const y = new Set(s);
      if (y.has(id)) y.delete(id);
      else y.add(id);
      return y;
    });
  }

  const hepsiSecili =
    gosterilen.length > 0 && gosterilen.every((p) => secili.has(p.id));

  function hepsiniSec() {
    setSecili((s) => {
      const y = new Set(s);
      if (hepsiSecili) gosterilen.forEach((p) => y.delete(p.id));
      else gosterilen.forEach((p) => y.add(p.id));
      return y;
    });
  }

  /** Toplu alanlardan DOLU olanları seçili ürünlerin taslağına yazar. */
  function seciliyeUygula() {
    const parca: Taslak = {};
    if (tAd.trim()) parca.ad = tAd.trim();
    if (tRenk.trim()) parca.renkler = renkleriAyristir(tRenk);
    if (tBedenler.size > 0) parca.bedenler = [...tBedenler];
    if (tStok.trim() && Number(tStok) >= 0) parca.stok = Number(tStok);
    if (tFiyat.trim() && Number(tFiyat) > 0) parca.fiyat = Number(tFiyat);
    if (tIndirimKaldir) parca.indirimOncesi = null;
    else if (tIndirim.trim() && Number(tIndirim) > 0)
      parca.indirimOncesi = Number(tIndirim);
    if (tKategori) parca.kategori = tKategori;
    if (tAciklama.trim()) parca.aciklama = tAciklama.trim();

    if (Object.keys(parca).length === 0 || secili.size === 0) return;
    setTaslaklar((t) => {
      const y = { ...t };
      for (const id of secili) y[id] = { ...y[id], ...parca };
      return y;
    });
  }

  function taslaklariTemizle() {
    setTaslaklar({});
  }

  /** Sunucuya gidecek değişiklik listesi. */
  function degisiklikler(): TopluDegisiklik[] {
    return degisenIdler.map((id) => ({
      id,
      ...taslaklar[id],
      ...(slugYenile ? { slugYenile: true } : {}),
    }));
  }

  return (
    <div>
      {/* Filtreler */}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ürün, marka ya da model ara"
          aria-label="Ürün ara"
          className={girdi}
        />
        <select
          value={kategoriFiltre}
          onChange={(e) =>
            setKategoriFiltre(e.target.value as "all" | ProductCategory)
          }
          aria-label="Kategori filtresi"
          className={cn(girdi, "sm:w-44")}
        >
          <option value="all">Tüm kategoriler</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={markaFiltre}
          onChange={(e) => setMarkaFiltre(e.target.value)}
          aria-label="Marka filtresi"
          className={cn(girdi, "sm:w-44")}
        >
          <option value="all">Tüm markalar</option>
          {markalar.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Toplu alanlar */}
      <section className="mt-4 rounded-[var(--radius-product)] bg-muted/40 p-4 ring-1 ring-border/70 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="micro text-foreground">Seçilen ürünleri düzenle</h2>
          <p className="text-[13px] text-foreground/60">
            {secili.size} ürün seçili · boş bıraktığın alan değişmez
          </p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="grid gap-1.5">
            <span className={etiket}>Ürün adı (marka + model)</span>
            <input
              value={tAd}
              onChange={(e) => setTAd(e.target.value)}
              placeholder="ör. Vans Old Skool"
              className={girdi}
            />
          </label>

          <label className="grid gap-1.5">
            <span className={etiket}>Renk</span>
            <input
              value={tRenk}
              onChange={(e) => setTRenk(e.target.value)}
              placeholder="Siyah, Beyaz — özel renk: Antrasit #3a3a3a"
              className={girdi}
            />
            <div className="mt-1 flex flex-wrap gap-1.5">
              {HAZIR_RENKLER.map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() =>
                    setTRenk((v) => (v.trim() ? `${v.trim()}, ${r.name}` : r.name))
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-[12px] ring-1 ring-border transition-colors hover:ring-foreground/40"
                >
                  <span
                    aria-hidden
                    style={{ backgroundColor: r.hex }}
                    className="size-2.5 rounded-full ring-1 ring-foreground/15"
                  />
                  {r.name}
                </button>
              ))}
              {tRenk && (
                <button
                  type="button"
                  onClick={() => setTRenk("")}
                  className="rounded-full px-2 py-1 text-[12px] text-foreground/50 hover:text-brand"
                >
                  Temizle
                </button>
              )}
            </div>
          </label>

          <div className="grid gap-1.5 lg:col-span-2">
            <span className={etiket}>
              Numara / beden — seçili ürünlerin ızgarası buna göre kurulur
            </span>
            <BedenSecici
              kategori={tKategori || "ayakkabi"}
              secili={tBedenler}
              onDegis={setTBedenler}
            />
            <p className="text-[12px] text-foreground/45">
              Izgara TAM OLARAK seçtiklerin olur: seçmediğin numaralar seçili
              ürünlerden kalkar. Var olan renk+beden hücrelerinin stoğu korunur,
              yalnızca yeni eklenen hücrelere aşağıdaki stok yazılır.
            </p>
          </div>

          <label className="grid gap-1.5">
            <span className={etiket}>Yeni hücrelerin stoğu</span>
            <input
              type="number"
              min={0}
              value={tStok}
              onChange={(e) => setTStok(e.target.value)}
              placeholder="0"
              className={girdi}
            />
          </label>

          <label className="grid gap-1.5">
            <span className={etiket}>Kategori</span>
            <select
              value={tKategori}
              onChange={(e) =>
                setTKategori(e.target.value as "" | ProductCategory)
              }
              className={girdi}
            >
              <option value="">Değiştirme</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className={etiket}>Fiyat (₺)</span>
            <input
              type="number"
              min={1}
              value={tFiyat}
              onChange={(e) => setTFiyat(e.target.value)}
              placeholder="1200"
              className={girdi}
            />
          </label>

          <label className="grid gap-1.5">
            <span className={etiket}>İndirim öncesi fiyat (₺)</span>
            <input
              type="number"
              min={1}
              value={tIndirim}
              onChange={(e) => setTIndirim(e.target.value)}
              disabled={tIndirimKaldir}
              placeholder="1400"
              className={cn(girdi, tIndirimKaldir && "opacity-40")}
            />
            <label className="mt-1 flex items-center gap-2 text-[12px] text-foreground/60">
              <input
                type="checkbox"
                checked={tIndirimKaldir}
                onChange={(e) => setTIndirimKaldir(e.target.checked)}
              />
              İndirimi kaldır
            </label>
          </label>

          <label className="grid gap-1.5 lg:col-span-2">
            <span className={etiket}>Açıklama</span>
            <textarea
              rows={3}
              value={tAciklama}
              onChange={(e) => setTAciklama(e.target.value)}
              placeholder="Seçili tüm ürünlere aynı açıklamayı yazar."
              className={cn(girdi, "h-auto py-2 leading-relaxed")}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={seciliyeUygula}
            disabled={secili.size === 0}
            className="inline-flex h-10 items-center rounded-full bg-foreground px-5 micro text-background transition-colors hover:bg-foreground/90 disabled:opacity-40"
          >
            Seçilenlere uygula
          </button>
          <label className="flex items-center gap-2 text-[12px] text-foreground/60">
            <input
              type="checkbox"
              checked={slugYenile}
              onChange={(e) => setSlugYenile(e.target.checked)}
            />
            Ad değişirse ürün adresini de yenile (eski adres yönlendirilir)
          </label>
        </div>
      </section>

      {/* Tablo */}
      <div className="mt-5 overflow-x-auto rounded-[var(--radius-product)] ring-1 ring-border/70">
        <table className="w-full min-w-[68rem] text-left text-[13px]">
          <thead className="bg-muted/50">
            <tr className="micro text-foreground/45">
              <th className="px-3 py-3 font-normal">
                <input
                  type="checkbox"
                  checked={hepsiSecili}
                  onChange={hepsiniSec}
                  aria-label="Görünen ürünlerin hepsini seç"
                />
              </th>
              <th className="px-3 py-3 font-normal">Ürün</th>
              <th className="px-3 py-3 font-normal">Ad</th>
              <th className="px-3 py-3 font-normal">Renk</th>
              <th className="px-3 py-3 font-normal">Numara / beden</th>
              <th className="px-3 py-3 font-normal">Fiyat</th>
              <th className="px-3 py-3 font-normal">İndirim öncesi</th>
              <th className="px-3 py-3 font-normal">Kategori</th>
              <th className="px-3 py-3 font-normal">Açıklama</th>
            </tr>
          </thead>
          <tbody>
            {gosterilen.map((u) => {
              const t = taslaklar[u.id] ?? {};
              const degisti = Object.keys(t).length > 0;
              const renkler = t.renkler ?? u.colors;
              const bedenler = t.bedenler ?? urunBedenleri(u);
              const kategori = t.kategori ?? u.category;
              const aciklama = t.aciklama ?? u.description;
              const parcalar = productNameParts({ ...u, name: t.ad ?? u.name });

              return (
                <tr
                  key={u.id}
                  className={cn(
                    "border-t border-border/60 align-top",
                    degisti && "bg-brand/[0.04]",
                  )}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={secili.has(u.id)}
                      onChange={() => secimDegistir(u.id)}
                      aria-label={`${u.name} seç`}
                    />
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {u.images[0] && (
                          <Image
                            src={u.images[0].src}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/urunler/${u.id}`}
                          className="block max-w-[11rem] truncate text-foreground/70 underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground"
                        >
                          {u.name}
                        </Link>
                        <span className="text-[12px] text-foreground/40">
                          {u.id} · {parcalar.brand ?? "452WEAR"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <input
                      value={t.ad ?? u.name}
                      onChange={(e) => taslakYaz(u.id, { ad: e.target.value })}
                      aria-label={`${u.name} adı`}
                      className={cn(girdi, "min-w-[12rem]")}
                    />
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {renkler.map((c) => (
                        <span
                          key={c.name}
                          className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[12px] ring-1 ring-border"
                        >
                          <span
                            aria-hidden
                            style={{ backgroundColor: c.hex }}
                            className="size-2 rounded-full ring-1 ring-foreground/15"
                          />
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <span className="text-foreground/70">
                      {bedenler.length > 0 ? bedenler.join(", ") : "—"}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min={1}
                      value={t.fiyat ?? u.price}
                      onChange={(e) =>
                        taslakYaz(u.id, { fiyat: Number(e.target.value) })
                      }
                      aria-label={`${u.name} fiyatı`}
                      className={cn(girdi, "w-24")}
                    />
                  </td>

                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min={0}
                      value={
                        t.indirimOncesi === null
                          ? ""
                          : (t.indirimOncesi ?? u.compareAtPrice ?? "")
                      }
                      onChange={(e) =>
                        taslakYaz(u.id, {
                          indirimOncesi: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      placeholder="—"
                      aria-label={`${u.name} indirim öncesi fiyatı`}
                      className={cn(girdi, "w-24")}
                    />
                  </td>

                  <td className="px-3 py-3">
                    <select
                      value={kategori}
                      onChange={(e) =>
                        taslakYaz(u.id, {
                          kategori: e.target.value as ProductCategory,
                        })
                      }
                      aria-label={`${u.name} kategorisi`}
                      className={cn(girdi, "w-32")}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-3 py-3">
                    {acikAciklama === u.id ? (
                      <div className="w-[22rem]">
                        <textarea
                          autoFocus
                          rows={4}
                          value={aciklama}
                          onChange={(e) =>
                            taslakYaz(u.id, { aciklama: e.target.value })
                          }
                          aria-label={`${u.name} açıklaması`}
                          className={cn(girdi, "h-auto py-2 leading-relaxed")}
                        />
                        <button
                          type="button"
                          onClick={() => setAcikAciklama(null)}
                          className="mt-1 micro text-foreground/50 hover:text-foreground"
                        >
                          Kapat
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAcikAciklama(u.id)}
                        className="max-w-[16rem] truncate text-left text-foreground/70 underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground"
                      >
                        {aciklama.replace(/\s+/g, " ").slice(0, 60) || "Yaz →"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {gosterilen.length === 0 && (
          <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">
            Aramana uyan ürün yok.
          </p>
        )}
      </div>

      {/* Kaydetme çubuğu */}
      <div className="sticky bottom-0 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-product)] bg-background/95 px-4 py-3 ring-1 ring-border/70 backdrop-blur">
        <p className="text-[13px] text-foreground/70">
          {degisenIdler.length > 0
            ? `${degisenIdler.length} üründe kaydedilmemiş değişiklik var.`
            : "Kaydedilmemiş değişiklik yok."}
        </p>
        <div className="flex items-center gap-3">
          {degisenIdler.length > 0 && (
            <button
              type="button"
              onClick={taslaklariTemizle}
              className="micro text-foreground/50 transition-colors hover:text-brand"
            >
              Değişiklikleri geri al
            </button>
          )}
          <button
            type="button"
            onClick={() => setOnayAcik(true)}
            disabled={degisenIdler.length === 0 || kaydediliyor}
            className="inline-flex h-11 items-center rounded-full bg-foreground px-6 micro text-background transition-colors hover:bg-foreground/90 disabled:opacity-40"
          >
            {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>

      {/* Sonuç */}
      {sonuc.durum === "ok" && (
        <div
          role="status"
          className="mt-4 rounded-[var(--radius-product)] bg-muted/50 p-4 ring-1 ring-border/70"
        >
          <p className="flex items-center gap-2 text-[13px]">
            <Check className="size-4 text-brand" strokeWidth={2} />
            {sonuc.guncellenen} ürün başarıyla güncellendi.
          </p>
          {sonuc.hatalar.length > 0 && (
            <div className="mt-3">
              <p className="flex items-center gap-2 text-[13px] text-brand">
                <AlertTriangle className="size-4" strokeWidth={1.8} />
                {sonuc.hatalar.length} ürün güncellenemedi:
              </p>
              <ul className="mt-2 space-y-1 text-[13px] text-foreground/70">
                {sonuc.hatalar.map((h) => (
                  <li key={h.id}>
                    <span className="font-medium">{h.ad}</span> ({h.id}) —{" "}
                    {h.mesaj}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {sonuc.durum === "hata" && (
        <p role="alert" className="mt-4 text-[13px] text-brand">
          {sonuc.mesaj}
        </p>
      )}

      {/* Onay */}
      {onayAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Toplu güncelleme onayı"
            className="w-full max-w-sm rounded-[var(--radius-product)] bg-background p-5 ring-1 ring-border"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="micro">Toplu güncelleme</h2>
              <button
                type="button"
                onClick={() => setOnayAcik(false)}
                aria-label="Kapat"
                className="text-foreground/40 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-4 text-sm">
              {degisenIdler.length} ürün güncellenecek. Devam etmek istiyor
              musunuz?
            </p>
            <form
              action={kaydet}
              className="mt-5 flex flex-wrap justify-end gap-3"
            >
              <input
                type="hidden"
                name="degisiklikler"
                value={JSON.stringify(degisiklikler())}
              />
              <button
                type="button"
                onClick={() => setOnayAcik(false)}
                className="inline-flex h-10 items-center rounded-full px-4 micro text-foreground/60 hover:text-foreground"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={kaydediliyor}
                className="inline-flex h-10 items-center rounded-full bg-foreground px-5 micro text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
              >
                {kaydediliyor ? "Kaydediliyor…" : "Evet, güncelle"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/** Kategorinin beden sistemine göre çoklu seçim kutuları. */
function BedenSecici({
  kategori,
  secili,
  onDegis,
}: {
  kategori: ProductCategory;
  secili: Set<ProductSize>;
  onDegis: (yeni: Set<ProductSize>) => void;
}) {
  const bedenler = sizesForCategory(kategori);
  return (
    <div className="flex flex-wrap gap-1.5">
      {bedenler.map((b) => {
        const aktif = secili.has(b);
        return (
          <button
            key={b}
            type="button"
            aria-pressed={aktif}
            onClick={() => {
              const y = new Set(secili);
              if (aktif) y.delete(b);
              else y.add(b);
              onDegis(y);
            }}
            className={cn(
              "h-9 min-w-11 rounded-full px-3 text-[13px] transition-colors",
              aktif
                ? "bg-foreground text-background"
                : "bg-background text-foreground/70 ring-1 ring-border hover:text-foreground",
            )}
          >
            {b}
          </button>
        );
      })}
      {secili.size > 0 && (
        <button
          type="button"
          onClick={() => onDegis(new Set())}
          className="h-9 rounded-full px-3 text-[12px] text-foreground/50 hover:text-brand"
        >
          Temizle
        </button>
      )}
    </div>
  );
}
