import Link from "next/link";
import { LegalPageLayout, legalMetadata } from "@/components/legal/legal-page";
import { P, Section } from "@/components/legal/prose";
import { ConsentControls } from "@/components/cookie/consent-controls";
import { LEGAL_PAGES } from "@/lib/legal";

const page = LEGAL_PAGES.find((p) => p.slug === "/cerez-tercihleri")!;
export const metadata = legalMetadata(page);

export default function CookiePreferencesPage() {
  return (
    <LegalPageLayout page={page}>
      <Section no={1} title="Tercihlerin">
        <P>
          Zorunlu kategori sitenin çalışması için gereklidir ve kapatılamaz.
          Diğer kategoriler sen izin vermeden etkinleştirilmez. Seçimini
          istediğin zaman bu sayfadan değiştirebilirsin.
        </P>
        <div className="pt-4">
          <ConsentControls />
        </div>
      </Section>

      <Section no={2} title="Kategoriler Ne Anlama Geliyor">
        <P>
          Her kategorinin kapsamı, hangi verilerin tutulduğu ve süreleri{" "}
          <Link href="/cerez-politikasi" className="underline underline-offset-4 hover:text-foreground">
            Çerez Politikası
          </Link>{" "}
          sayfasında tablo hâlinde açıklanmıştır. Zorunlu olanlar dışındaki
          kategoriler şu anda sitede kullanılmamaktadır; tercihin ileride bu
          araçlar eklenirse geçerli olacaktır.
        </P>
      </Section>

      <Section no={3} title="Tarayıcı Ayarları">
        <P>
          Tarayıcının ayarlarından çerezleri ve site verilerini silebilir ya da
          engelleyebilirsin. Zorunlu verileri engellersen sepet ve favoriler
          gibi işlevler çalışmayabilir.
        </P>
      </Section>
    </LegalPageLayout>
  );
}
