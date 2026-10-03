import Link from "next/link";
import { ListChecks, Plus } from "lucide-react";
import { Silinenler } from "@/components/admin/silinenler";
import { UrunListesi, kategoriAdi } from "@/components/admin/urun-listesi";
import { copKutusu, adminKatalog } from "@/lib/catalog-store";

export const metadata = { title: "Ürünler" };

// Katalog diskten okunur; her istekte güncel olmalı.
export const dynamic = "force-dynamic";

/** Giyim ve ayakkabı. Saatler ayrı bölümde: /admin/452-watch. */
export default async function UrunlerSayfasi() {
  const [tumu, tumSilinenler] = await Promise.all([adminKatalog(), copKutusu()]);
  const urunler = tumu.filter((u) => u.category !== "saat");
  const silinenler = tumSilinenler.filter((u) => u.category !== "saat");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold leading-none tracking-[-0.03em]">
            ÜRÜNLER<span className="text-brand">.</span>
          </h1>
          <p className="mt-3 text-[13px] text-muted-foreground">
            {urunler.length} ürün
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Çok sayıda ürünü tek ekrandan düzenlemek için. */}
          <Link
            href="/admin/urunler/toplu"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-background px-5 micro ring-1 ring-border transition-colors hover:ring-foreground/40"
          >
            <ListChecks className="size-4" strokeWidth={2} />
            Toplu Düzenle
          </Link>
          <Link
            href="/admin/urunler/yeni"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 micro text-background transition-colors hover:bg-foreground/90"
          >
            <Plus className="size-4" strokeWidth={2} />
            Yeni Ürün
          </Link>
        </div>
      </div>

      <UrunListesi urunler={urunler} />

      {silinenler.length > 0 && (
        <Silinenler
          urunler={silinenler.map((u) => ({
            id: u.id,
            name: u.name,
            kategori: kategoriAdi(u.category),
            gorsel: u.images[0]?.src,
          }))}
        />
      )}
    </div>
  );
}
