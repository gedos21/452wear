import Link from "next/link";
import { UrunDuzenleyici } from "@/components/admin/urun-duzenleyici";

export const metadata = { title: "Yeni ürün" };

export default function YeniUrunSayfasi() {
  return (
    <div>
      <Link
        href="/admin/urunler"
        className="micro text-foreground/50 transition-colors hover:text-foreground"
      >
        ← Ürünler
      </Link>
      <h1 className="mt-4 mb-8 font-display text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold leading-none tracking-[-0.03em]">
        YENİ ÜRÜN<span className="text-brand">.</span>
      </h1>
      <UrunDuzenleyici />
    </div>
  );
}
