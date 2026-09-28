import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/data/products";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/product";

export const kategoriAdi = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

/** Toplam stok (bütün renk/beden kombinasyonları). */
const toplamStok = (u: Product) =>
  u.variants.reduce((n, v) => n + Math.max(0, v.stock), 0);

/**
 * Admin ürün listesi: masaüstünde tablo, mobilde kart listesi. "Ürünler" ve
 * "452 Watch" bölümleri aynı listeyi kendi ürünleriyle kullanır.
 */
export function UrunListesi({
  urunler,
  taban = "/admin/urunler",
}: {
  urunler: Product[];
  /** Düzenleme bağlantılarının bölümü (Ürünler ya da 452 Watch). */
  taban?: string;
}) {
  return (
    <>
      {/* Masaüstü: tablo */}
      <div className="mt-8 hidden overflow-hidden rounded-[var(--radius-product)] ring-1 ring-border/70 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr className="micro text-foreground/45">
              <th className="px-4 py-3 font-normal">Ürün</th>
              <th className="px-4 py-3 font-normal">Kategori</th>
              <th className="px-4 py-3 font-normal">Fiyat</th>
              <th className="px-4 py-3 font-normal">Stok</th>
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
                <td
                  className={
                    toplamStok(u) === 0
                      ? "px-4 py-3 text-brand"
                      : "px-4 py-3 text-foreground/70"
                  }
                >
                  {toplamStok(u) === 0 ? "Tükendi" : toplamStok(u)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`${taban}/${u.id}`}
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
              href={`${taban}/${u.id}`}
              className="flex items-center gap-3 rounded-[var(--radius-product)] bg-background px-3 py-3 ring-1 ring-border/70"
            >
              <Kucuk src={u.images[0]?.src} alt={u.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.name}</p>
                <p className="mt-0.5 text-[12px] text-foreground/45">
                  {kategoriAdi(u.category)} · {formatPrice(u.price, u.currency)}{" "}
                  · {toplamStok(u) === 0 ? "Tükendi" : `${toplamStok(u)} stok`}
                </p>
              </div>
              <span className="micro shrink-0 text-foreground/40">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
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
