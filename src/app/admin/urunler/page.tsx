import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CATEGORIES } from "@/data/products";
import { Silinenler } from "@/components/admin/silinenler";
import { copKutusu, katalogOku } from "@/lib/catalog-store";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Ürünler" };

// Katalog diskten okunur; her istekte güncel olmalı.
export const dynamic = "force-dynamic";

export default async function UrunlerSayfasi() {
  const [urunler, silinenler] = await Promise.all([katalogOku(), copKutusu()]);
  const kategoriAdi = (slug: string) =>
    CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

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
        <Link
          href="/admin/urunler/yeni"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 micro text-background transition-colors hover:bg-foreground/90"
        >
          <Plus className="size-4" strokeWidth={2} />
          Yeni Ürün
        </Link>
      </div>

      {/* Masaüstü: tablo */}
      <div className="mt-8 hidden overflow-hidden rounded-[var(--radius-product)] ring-1 ring-border/70 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr className="micro text-foreground/45">
              <th className="px-4 py-3 font-normal">Ürün</th>
              <th className="px-4 py-3 font-normal">Kategori</th>
              <th className="px-4 py-3 font-normal">Fiyat</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {urunler.map((u) => (
              <tr key={u.id} className="border-t border-border/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Kucuk src={u.images[0]?.src} alt={u.name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{u.name}</p>
                      <p className="text-[12px] text-foreground/40">{u.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  {kategoriAdi(u.category)}
                </td>
                <td className="px-4 py-3">
                  {formatPrice(u.price, u.currency)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/urunler/${u.id}`}
                    className="micro text-foreground/55 transition-colors hover:text-brand"
                  >
                    Düzenle →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobil: kart listesi */}
      <ul className="mt-8 grid gap-2 md:hidden">
        {urunler.map((u) => (
          <li key={u.id}>
            <Link
              href={`/admin/urunler/${u.id}`}
              className="flex items-center gap-3 rounded-[var(--radius-product)] bg-background px-3 py-3 ring-1 ring-border/70"
            >
              <Kucuk src={u.images[0]?.src} alt={u.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.name}</p>
                <p className="mt-0.5 text-[12px] text-foreground/45">
                  {kategoriAdi(u.category)} · {formatPrice(u.price, u.currency)}
                </p>
              </div>
              <span className="micro shrink-0 text-foreground/40">→</span>
            </Link>
          </li>
        ))}
      </ul>

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

function Kucuk({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
      {src && (
        <Image src={src} alt={alt} fill sizes="48px" className="object-cover" />
      )}
    </div>
  );
}
