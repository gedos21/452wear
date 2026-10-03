import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { Silinenler } from "@/components/admin/silinenler";
import { UrunListesi, kategoriAdi } from "@/components/admin/urun-listesi";
import { copKutusu, adminKatalog } from "@/lib/catalog-store";

export const metadata = { title: "452 Watch" };

// Katalog diskten okunur; her istekte güncel olmalı.
export const dynamic = "force-dynamic";

/**
 * 452 Watch bölümü: yalnızca saatler. Giyim/ayakkabı listesinden bağımsız;
 * burada eklenen ürünün kategorisi her zaman "saat"tir.
 */
export default async function WatchAdminSayfasi() {
  const [tumu, tumSilinenler] = await Promise.all([adminKatalog(), copKutusu()]);
  const saatler = tumu.filter((u) => u.category === "saat");
  const silinenler = tumSilinenler.filter((u) => u.category === "saat");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold leading-none tracking-[-0.03em]">
            <span className="nav-accent">452 WATCH</span>
            <span className="text-brand">.</span>
          </h1>
          <p className="mt-3 text-[13px] text-muted-foreground">
            {saatler.length} saat
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/452-watch"
            target="_blank"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-background px-5 micro ring-1 ring-border transition-colors hover:ring-foreground/40"
          >
            <ExternalLink className="size-4" strokeWidth={2} />
            Sayfayı Gör
          </Link>
          <Link
            href="/admin/452-watch/yeni"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 micro text-background transition-colors hover:bg-foreground/90"
          >
            <Plus className="size-4" strokeWidth={2} />
            Yeni Saat
          </Link>
        </div>
      </div>

      {saatler.length > 0 ? (
        <UrunListesi urunler={saatler} taban="/admin/452-watch" />
      ) : (
        <div className="mt-8 rounded-[var(--radius-product)] px-6 py-14 text-center ring-1 ring-border/70">
          <p className="text-sm text-muted-foreground">
            Henüz saat yok. Eklediğin saatler 452 Watch sayfasındaki
            koleksiyonda görünür.
          </p>
        </div>
      )}

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
