import Link from "next/link";
import { UrunDuzenleyici } from "@/components/admin/urun-duzenleyici";
import { katalogOku } from "@/lib/catalog-store";

export const metadata = { title: "Yeni saat" };

export const dynamic = "force-dynamic";

export default async function YeniSaatSayfasi() {
  // Öneri alanlarında yalnızca saatler seçilebilir.
  const saatler = (await katalogOku()).filter((u) => u.category === "saat");

  return (
    <div>
      <Link
        href="/admin/452-watch"
        className="micro text-foreground/50 transition-colors hover:text-foreground"
      >
        ← 452 Watch
      </Link>
      <h1 className="mt-4 mb-8 font-display text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold leading-none tracking-[-0.03em]">
        YENİ SAAT<span className="text-brand">.</span>
      </h1>
      <UrunDuzenleyici watch urunler={saatler} />
    </div>
  );
}
