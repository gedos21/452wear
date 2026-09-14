import { LegalPageLayout, legalMetadata } from "@/components/legal/legal-page";
import { List, P, Section, Slot } from "@/components/legal/prose";
import { COMPANY, LEGAL_PAGES } from "@/lib/legal";

const page = LEGAL_PAGES.find((p) => p.slug === "/iade-ve-cayma")!;
export const metadata = legalMetadata(page);

export default function ReturnsPage() {
  return (
    <LegalPageLayout page={page}>
      <Section no={1} title="Cayma Hakkı">
        <P>
          Mesafeli Sözleşmeler Yönetmeliği uyarınca, malı teslim aldığın
          tarihten itibaren <strong>on dört (14) gün</strong> içinde herhangi
          bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma
          hakkına sahipsin.
        </P>
        <P>
          Bu, kanundan doğan bir haktır. Aşağıda ayrıca belirtilen ve{" "}
          {COMPANY.brand}&apos;in kendi ticari uygulaması olan noktalar bu
          hakkı sınırlamaz.
        </P>
      </Section>

      <Section no={2} title="Cayma Süresi">
        <List
          items={[
            "Tek ürünlü siparişlerde süre, ürünün teslim alındığı gün başlar.",
            "Birden fazla ürünün ayrı ayrı teslim edildiği siparişlerde süre, son ürünün teslim alındığı gün başlar.",
            "Sürenin son günü resmî tatile denk gelirse süre, takip eden ilk iş günü sona erer.",
          ]}
        />
      </Section>

      <Section no={3} title="Cayma Hakkının Kullanılması">
        <P>
          Cayma bildirimini süre içinde yazılı olarak iletmen yeterlidir; ayrı
          bir gerekçe belirtmen gerekmez.
        </P>
        <List
          items={[
            <>E-posta: <Slot>{COMPANY.email}</Slot></>,
            <>Posta: <Slot>{COMPANY.address}</Slot></>,
            "Bildiriminde sipariş numarasını ve iade etmek istediğin ürünleri belirtmen süreci hızlandırır.",
          ]}
        />
      </Section>

      <Section no={4} title="İade Süreci">
        <List
          items={[
            <>Cayma bildirimini gönderdikten sonra ürünü <strong>on (10) gün</strong> içinde <Slot>{COMPANY.returnAddress}</Slot> adresine gönder.</>,
            <>İade kargo uygulaması: <Slot>[İADE KARGO POLİTİKASI]</Slot></>,
            <>Anlaşmalı kargo firması: <Slot>[KARGO FİRMASI]</Slot></>,
            <>İade işlemlerinin ortalama tamamlanma süresi: <Slot>[İADE SÜRESİ]</Slot></>,
          ]}
        />
        <P>
          Satıcı tarafından iade için belirli bir taşıyıcı bildirilmişse, o
          taşıyıcıyla yapılan gönderimde iade masrafı seni aşmaz.
        </P>
      </Section>

      <Section no={5} title="Ürünlerin İade Koşulları">
        <P>
          Giyim ürünlerinin, denemek için makul ölçüde kullanılması dışında
          kullanılmamış olması ve yeniden satılabilir durumda olması beklenir.
        </P>
        <List
          items={[
            "Ürün etiketleri sökülmemiş olmalıdır.",
            "Orijinal ambalaj ve varsa aksesuarlar birlikte gönderilmelidir.",
            "Yıkanmış, kullanılmış, tadil edilmiş veya kokusu geçmiş ürünler yeniden satılabilir sayılmaz.",
          ]}
        />
        <P>
          Ürünün, niteliğine ve işleyişine uygun kullanım dışındaki
          kullanımdan kaynaklanan değer kaybından sorumlu olabilirsin; bu durum
          cayma hakkını ortadan kaldırmaz.
        </P>
      </Section>

      <Section no={6} title="Ücret İadesi">
        <P>
          Cayma bildirimi satıcıya ulaştıktan sonra <strong>on dört (14) gün
          </strong> içinde, teslimat masrafları da dâhil olmak üzere tahsil
          edilen tüm ödemeler iade edilir.
        </P>
        <List
          items={[
            "İade, ödeme sırasında kullanılan yönteme uygun şekilde yapılır; bunun için senden ek bir masraf alınmaz.",
            "Kredi kartıyla yapılan ödemelerde tutarın hesabına yansıma süresi bankana bağlıdır.",
            "Satıcı, malı geri aldığı veya malın gönderildiğine dair kanıtı sen ilettiğin tarihe kadar iadeyi bekletebilir.",
          ]}
        />
      </Section>

      <Section no={7} title="Cayma Hakkının İstisnaları">
        <P>
          Mevzuat uyarınca aşağıdaki durumlarda cayma hakkı kullanılamaz. Bu
          liste kanunda sayılan hâllerle sınırlıdır; buna ek bir şart
          getirilmez.
        </P>
        <List
          items={[
            "Tesliminden sonra ambalaj, bant, mühür veya paket gibi koruyucu unsurları açılmış olan ve iadesi sağlık ile hijyen açısından uygun olmayan ürünler.",
            "Alıcının istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan, kişiye özel üretilmiş ürünler.",
            "Çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler.",
            "Tesliminden sonra başka ürünlerle karışan ve doğası gereği ayrıştırılması mümkün olmayan ürünler.",
          ]}
        />
      </Section>

      <Section no={8} title="Ayıplı Ürün">
        <P>
          Ürünün ayıplı çıkması hâlinde sahip olduğun seçimlik haklar (ücretsiz
          onarım, değişim, bedel indirimi veya sözleşmeden dönme) cayma
          hakkından bağımsızdır ve 6502 sayılı Tüketicinin Korunması Hakkında
          Kanun hükümlerine tabidir.
        </P>
      </Section>

      <Section no={9} title="İletişim ve Uyuşmazlık">
        <P>
          Sorularını <Slot>{COMPANY.email}</Slot> adresine iletebilirsin.
          Şikâyet ve itirazlarda, ilgili yıl için belirlenen parasal sınırlar
          dâhilinde Tüketici Hakem Heyetine veya Tüketici Mahkemesine
          başvurabilirsin.
        </P>
      </Section>
    </LegalPageLayout>
  );
}
