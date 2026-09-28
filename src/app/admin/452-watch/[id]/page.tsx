import { UrunDuzenleSayfasi } from "@/components/admin/urun-duzenle-sayfasi";

export const dynamic = "force-dynamic";

export default async function SaatDuzenle({
  params,
}: PageProps<"/admin/452-watch/[id]">) {
  const { id } = await params;
  return <UrunDuzenleSayfasi id={id} bolum="452-watch" />;
}
