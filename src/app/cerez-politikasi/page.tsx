import Link from "next/link";
import { LegalPageLayout, legalMetadata } from "@/components/legal/legal-page";
import { List, P, Section, Slot, Table } from "@/components/legal/prose";
import { COMPANY, LEGAL_PAGES } from "@/lib/legal";

const page = LEGAL_PAGES.find((p) => p.slug === "/cerez-politikasi")!;
export const metadata = legalMetadata(page);

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout page={page}>
      <Section no={1} title="Çerez Nedir">
        <P>
          Çerez, bir siteyi ziyaret ettiğinde tarayıcına kaydedilen küçük bir
          metin dosyasıdır. Benzer teknolojiler arasında tarayıcının yerel
          depolaması (localStorage) da yer alır; bu politika ikisini birlikte
          ele alır.
        </P>
      </Section>

      <Section no={2} title="Şu Anda Hangi Teknolojileri Kullanıyoruz">
        <P>
          {COMPANY.brand} sitesi şu anda <strong>hiçbir çerez (cookie)
          kullanmamaktadır</strong>. Bunun yerine, sitenin çalışması için
          gereken üç bilgi tarayıcının yerel depolamasında tutulur. Bu veriler
          sunucumuza gönderilmez ve sen silene kadar cihazında kalır.
        </P>
        <Table
          head={["Ad", "Amaç", "Tür", "Süre", "Taraf"]}
          rows={[
            [
              <Slot key="c">452wear:cart</Slot>,
              "Sepetindeki ürünlerin sayfa yenilendiğinde kaybolmaması",
              "Zorunlu · localStorage",
              "Sen silene kadar",
              "Birinci taraf",
            ],
            [
              <Slot key="f">452wear:favorites</Slot>,
              "Favorilediğin ürünlerin hatırlanması",
              "Zorunlu · localStorage",
              "Sen silene kadar",
              "Birinci taraf",
            ],
            [
              <Slot key="k">452wear:cookie-consent</Slot>,
              "Çerez tercihinin hatırlanması ve bildirimin tekrar gösterilmemesi",
              "Zorunlu · localStorage",
              "Sen silene kadar",
              "Birinci taraf",
            ],
          ]}
        />
        <P>
          Yazı tipleri derleme sırasında site sunucusuna kopyalanır ve oradan
          sunulur; sayfa görüntülerken üçüncü bir tarafa istek gitmez.
        </P>
      </Section>

      <Section no={3} title="Çerez Kategorileri">
        <P>
          Aşağıdaki kategoriler, ileride kullanılabilecek teknolojileri
          sınıflandırmak için tanımlanmıştır. Zorunlu kategori dışındakiler{" "}
          <strong>şu anda kullanılmamaktadır</strong>; tercih ekranında
          kapalı görünmelerinin sebebi budur.
        </P>
        <List
          items={[
            <><strong>Zorunlu:</strong> Sitenin temel işlevleri için gereklidir; sepet, favoriler ve çerez tercihi bu kapsamdadır. Kapatılamaz.</>,
            <><strong>Analitik / Performans:</strong> Sitenin nasıl kullanıldığını toplu olarak ölçmek için kullanılır. Şu anda kullanılmıyor.</>,
            <><strong>İşlevsel:</strong> Dil ve bölge gibi ek tercihlerin hatırlanmasını sağlar. Şu anda kullanılmıyor.</>,
            <><strong>Reklam / Pazarlama:</strong> İlgi alanına göre reklam gösterimi ve ölçümü için kullanılır. Şu anda kullanılmıyor.</>,
          ]}
        />
      </Section>

      <Section no={4} title="Tercihlerini Yönetme">
        <P>
          Zorunlu olmayan kategoriler, sen açıkça izin vermeden
          etkinleştirilmez. Tercihini istediğin zaman{" "}
          <Link href="/cerez-tercihleri" className="underline underline-offset-4 hover:text-foreground">
            Çerez Tercihleri
          </Link>{" "}
          sayfasından değiştirebilirsin.
        </P>
        <P>
          Ayrıca tarayıcının ayarlarından çerezleri ve site verilerini
          silebilir veya engelleyebilirsin. Zorunlu verileri engellemen hâlinde
          sepet ve favoriler gibi işlevler çalışmayabilir.
        </P>
      </Section>

      <Section no={5} title="Değişiklikler ve İletişim">
        <P>
          Yeni bir araç eklendiğinde bu politika ve yukarıdaki tablo önceden
          güncellenir. Sorular için: <Slot>{COMPANY.email}</Slot>.
        </P>
      </Section>
    </LegalPageLayout>
  );
}
