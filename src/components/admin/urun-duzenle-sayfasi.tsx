import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { UrunDuzenleyici } from "@/components/admin/urun-duzenleyici";
import { katalogOku, urunBul } from "@/lib/catalog-store";

/** Admin bölümünün adresi: saatler 452 Watch'ta, diğerleri Ürünler'de. */
export const bolumAdresi = (saat: boolean) =>
  saat ? "/admin/452-watch" : "/admin/urunler";

/**
 * Ürün düzenleme ekranı; /admin/urunler/[id] ve /admin/452-watch/[id] aynı
 * içeriği kullanır. Ürün yanlış bölümün adresinden açılırsa doğru bölüme
 * yönlendirilir (sekme, geri bağlantısı ve öneri havuzu tutarlı kalsın).
 */
export async function UrunDuzenleSayfasi({
  id,
  bolum,
}: {
  id: string;
  bolum: "urunler" | "452-watch";
}) {
  const urun = await urunBul(id);
  if (!urun) notFound();
  const saat = urun.category === "saat";
  if (saat !== (bolum === "452-watch")) redirect(`${bolumAdresi(saat)}/${id}`);

  // Öneri alanlarında yalnızca aynı bölümün ürünleri seçilebilir.
  const urunler = (await katalogOku()).filter(
    (u) => (u.category === "saat") === saat,
  );

  return (
    <div>
      <Link
        href={bolumAdresi(saat)}
        className="micro text-foreground/50 transition-colors hover:text-foreground"
      >
        {saat ? "← 452 Watch" : "← Ürünler"}
      </Link>
      <div className="mt-4 mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold leading-none tracking-[-0.03em]">
          {urun.name.toLocaleUpperCase("tr")}
          <span className="text-brand">.</span>
        </h1>
        <span className="text-[13px] text-foreground/40">{urun.id}</span>
      </div>
      <UrunDuzenleyici urun={urun} urunler={urunler} watch={saat} />
    </div>
  );
}
