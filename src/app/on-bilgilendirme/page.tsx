import { LegalPageLayout, legalMetadata } from "@/components/legal/legal-page";
import { List, P, Section, Slot } from "@/components/legal/prose";
import { OrderSummaryTable } from "@/components/legal/order-summary-table";
import { COMPANY, LEGAL_PAGES } from "@/lib/legal";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";

const page = LEGAL_PAGES.find((p) => p.slug === "/on-bilgilendirme")!;
export const metadata = legalMetadata(page);

export default function PreInfoPage() {
  return (
    <LegalPageLayout page={page}>
      <Section no={1} title="Satıcı Bilgileri">
        <List
          items={[
            <>Unvan: <Slot>{COMPANY.legalName}</Slot></>,
            <>Adres: <Slot>{COMPANY.address}</Slot></>,
            <>Vergi dairesi / numarası: <Slot>{COMPANY.taxOffice}</Slot> / <Slot>{COMPANY.taxNumber}</Slot></>,
            <>MERSİS: <Slot>{COMPANY.mersis}</Slot></>,
            <>Telefon: <Slot>{COMPANY.phone}</Slot></>,
            <>E-posta: <Slot>{COMPANY.email}</Slot></>,
          ]}
        />
      </Section>

      <Section no={2} title="Alıcı Bilgileri">
        <P>
          Alıcının adı, teslimat adresi, fatura adresi ve iletişim bilgileri
          sipariş adımında girdiğin bilgilerden oluşur ve siparişi
          onaylamadan önce bu formda sana gösterilir.
        </P>
        <List
          items={[
            "Ad soyad / unvan",
            "Teslimat adresi",
            "Fatura adresi",
            "Telefon ve e-posta",
          ]}
        />
      </Section>

      <Section no={3} title="Sözleşme Konusu Ürün ve Ödeme Bilgileri">
        <P>
          Ürün adı, adedi, birim fiyatı, kargo ücreti ve toplam tutar sepetinden
          alınır. Aşağıdaki özet, bu sayfayı görüntülediğin andaki sepetini
          gösterir.
        </P>
        <div className="pt-2">
          <OrderSummaryTable />
        </div>
        <P>
          Tüm fiyatlar KDV dâhildir. Ödeme yöntemleri ve ödeme kuruluşu bilgisi,
          ödeme altyapısı bağlandığında bu bölümde ve sipariş özetinde
          gösterilecektir.
        </P>
      </Section>

      <Section no={4} title="Teslimat">
        <P>
          Sipariş, ödeme onayının ardından{" "}
          <Slot>[TAHMİNİ HAZIRLAMA SÜRESİ]</Slot> içinde hazırlanarak kargoya
          verilir. Teslimat, alıcının belirttiği adrese{" "}
          <Slot>[KARGO FİRMASI]</Slot> aracılığıyla yapılır. Kargo süreci ve
          ücretlere ilişkin ayrıntılar Teslimat ve Kargo sayfasındadır.
        </P>
        <P>
          {FREE_SHIPPING_THRESHOLD.toLocaleString("tr-TR")} TL ve üzeri
          siparişlerde kargo ücreti alınmaz. Bu tutarın altındaki siparişlerde
          kargo ücreti sipariş özetinde ayrıca gösterilir.
        </P>
      </Section>

      <Section no={5} title="Cayma Hakkı">
        <P>
          Alıcı, malı teslim aldığı tarihten itibaren on dört (14) gün içinde
          herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin
          sözleşmeden cayma hakkına sahiptir. Cayma bildiriminin bu süre içinde
          satıcıya yöneltilmesi yeterlidir.
        </P>
        <P>
          Cayma hakkının kullanılması, istisnaları ve iade süreci İade ve Cayma
          Hakkı sayfasında ayrıntılı olarak açıklanmıştır.
        </P>
      </Section>

      <Section no={6} title="Cayma Hakkının Kullanımı ve İade">
        <List
          items={[
            <>Cayma bildirimi <Slot>{COMPANY.email}</Slot> adresine veya <Slot>{COMPANY.address}</Slot> adresine iletilir.</>,
            <>Ürün, iade bildiriminden itibaren on (10) gün içinde <Slot>{COMPANY.returnAddress}</Slot> adresine gönderilir.</>,
            "Ürünün kutusu, ambalajı ve varsa standart aksesuarlarıyla eksiksiz ve kullanılmamış olarak iade edilmesi gerekir.",
            <>İade kargo ücretine ilişkin uygulama: <Slot>[İADE KARGO POLİTİKASI]</Slot></>,
          ]}
        />
        <P>
          Cayma bildiriminin satıcıya ulaşmasından itibaren on dört (14) gün
          içinde toplam bedel, ödeme sırasında kullanılan yönteme uygun şekilde
          iade edilir.
        </P>
      </Section>

      <Section no={7} title="Uyuşmazlık ve İletişim">
        <P>
          Şikâyet ve itirazlar konusunda, ilgili yıl için Ticaret Bakanlığı
          tarafından belirlenen parasal sınırlar dâhilinde alıcının yerleşim
          yerindeki veya tüketici işleminin yapıldığı yerdeki Tüketici Hakem
          Heyetine ya da Tüketici Mahkemesine başvurulabilir.
        </P>
        <P>
          İletişim: <Slot>{COMPANY.email}</Slot> · <Slot>{COMPANY.phone}</Slot>
        </P>
      </Section>
    </LegalPageLayout>
  );
}
