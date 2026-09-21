import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TopluDuzenle } from "@/components/admin/toplu-duzenle";
import { katalogOku } from "@/lib/catalog-store";

export const metadata = { title: "Toplu düzenle" };

// Katalog diskten okunur; her istekte güncel olmalı.
export const dynamic = "force-dynamic";

/**
 * Toplu düzenleme sayfası: yayındaki bütün ürünler tek tabloda. Çöp
 * kutusundaki ürünler burada görünmez — önce geri getirilmeleri gerekir.
 */
export default async function TopluDuzenleSayfasi() {
  const urunler = await katalogOku();

  return (
    <div>
      <Link
        href="/admin/urunler"
        className="inline-flex items-center gap-1.5 micro text-foreground/50 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} />
        Ürünler
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold leading-none tracking-[-0.03em]">
            TOPLU DÜZENLE<span className="text-brand">.</span>
          </h1>
          <p className="mt-3 text-[13px] text-muted-foreground">
            {urunler.length} ürün · seç, üstteki alanlardan uygula, tek seferde
            kaydet
          </p>
        </div>
      </div>

      <div className="mt-8">
        <TopluDuzenle urunler={urunler} />
      </div>
    </div>
  );
}
