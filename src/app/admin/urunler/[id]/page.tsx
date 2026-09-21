import Link from "next/link";
import { notFound } from "next/navigation";
import { UrunDuzenleyici } from "@/components/admin/urun-duzenleyici";
import { katalogOku, urunBul } from "@/lib/catalog-store";

export const dynamic = "force-dynamic";

export default async function UrunDuzenleSayfasi({
  params,
}: PageProps<"/admin/urunler/[id]">) {
  const { id } = await params;
  const urun = await urunBul(id);
  if (!urun) notFound();
  // Öneri alanlarında seçilecek ürünler.
  const urunler = await katalogOku();

  return (
    <div>
      <Link
        href="/admin/urunler"
        className="micro text-foreground/50 transition-colors hover:text-foreground"
      >
        ← Ürünler
      </Link>
      <div className="mt-4 mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold leading-none tracking-[-0.03em]">
          {urun.name.toLocaleUpperCase("tr")}
          <span className="text-brand">.</span>
        </h1>
        <span className="text-[13px] text-foreground/40">{urun.id}</span>
      </div>
      <UrunDuzenleyici urun={urun} urunler={urunler} />
    </div>
  );
}
