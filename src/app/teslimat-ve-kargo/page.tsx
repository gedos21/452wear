import { LegalPageLayout, legalMetadata } from "@/components/legal/legal-page";
import { List, P, Section, Slot } from "@/components/legal/prose";
import { COMPANY, LEGAL_PAGES } from "@/lib/legal";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/shipping";

const page = LEGAL_PAGES.find((p) => p.slug === "/teslimat-ve-kargo")!;
export const metadata = legalMetadata(page);

export default function ShippingPage() {
  return (
    <LegalPageLayout page={page}>
      <Section no={1} title="Sipariş Hazırlama">
        <P>
          Siparişin, ödeme onayının ardından hazırlanmaya başlar. Hazırlama
          süresi <Slot>[TAHMİNİ HAZIRLAMA SÜRESİ]</Slot> olarak
          planlanmaktadır; kesin süre operasyon kurulduğunda bu sayfada
          yayımlanacaktır.
        </P>
        <P>
          Hafta sonu ve resmî tatillerde hazırlama ve kargo teslimi yapılmaz;
          bu günler süreye dâhil edilmez.
        </P>
      </Section>

      <Section no={2} title="Kargoya Teslim">
        <P>
          Hazırlanan siparişler anlaşmalı taşıyıcıya teslim edilir. Anlaşmalı
          kargo firması: <Slot>[KARGO FİRMASI]</Slot>. Kargoya verildiğinde
          takip numarası e-posta ile iletilir.
        </P>
      </Section>

      <Section no={3} title="Tahmini Teslimat Süresi">
        <P>
          Teslimat süresi, kargo firmasının dağıtım ağına ve teslimat adresine
          göre değişir: <Slot>[TAHMİNİ TESLİMAT SÜRESİ]</Slot>.
        </P>
        <P>
          Yoğun dönemler, olumsuz hava koşulları ve mücbir sebepler teslimatı
          geciktirebilir. Mevzuat uyarınca sipariş, her hâlükârda taahhüt edilen
          süre içinde ve en geç otuz (30) gün içinde teslim edilir; bu sürenin
          aşılması hâlinde sözleşmeyi feshedebilirsin.
        </P>
      </Section>

      <Section no={4} title="Kargo Ücreti">
        <List
          items={[
            <>
              <strong>
                {FREE_SHIPPING_THRESHOLD.toLocaleString("tr-TR")} TL ve üzeri
              </strong>{" "}
              siparişlerde kargo ücretsizdir.
            </>,
            <>
              Bu tutarın altındaki siparişlerde kargo ücreti:{" "}
              {SHIPPING_FEE.toLocaleString("tr-TR")} TL
            </>,
            "Kargo ücreti, ödeme adımında sipariş özetinde ayrıca gösterilir ve toplam tutara eklenir.",
          ]}
        />
        <P>
          Ücretsiz kargo eşiği, ara toplam (indirimler düşüldükten sonraki
          tutar) üzerinden hesaplanır.
        </P>
      </Section>

      <Section no={5} title="Teslimat Adresi">
        <List
          items={[
            "Teslimat, sipariş sırasında belirttiğin adrese yapılır.",
            "Adres bilgisinin eksik veya hatalı olması hâlinde doğabilecek gecikmelerden satıcı sorumlu tutulamaz.",
            "Kargo firmasına teslim edildikten sonra adres değişikliği talepleri firmanın uygulamasına bağlıdır.",
            <>Teslimat bölgesi: <Slot>[TESLİMAT YAPILAN BÖLGELER]</Slot></>,
          ]}
        />
      </Section>

      <Section no={6} title="Teslimat Sırasında Yaşanabilecek Sorunlar">
        <List
          items={[
            "Adreste bulunamama durumunda kargo firması genellikle ikinci bir teslimat denemesi yapar; sonrasında gönderi şubede beklemeye alınır.",
            "Şubede bekleme süresi dolduğunda gönderi satıcıya iade edilebilir. Bu durumda bizimle iletişime geçmen yeterlidir.",
            "Kargonun kaybolması hâlinde süreci kargo firmasıyla birlikte biz takip ederiz.",
          ]}
        />
      </Section>

      <Section no={7} title="Hasarlı veya Açılmış Paket">
        <P>
          Paketi teslim alırken kontrol etmeni öneririz. Pakette ezilme,
          yırtılma veya açılmış olduğuna dair bir iz varsa:
        </P>
        <List
          items={[
            "Paketi teslim almadan önce kargo görevlisine tutanak tutturmanı isteriz.",
            "Tutanak, ürünün hasarlı teslim edildiğinin ispatı açısından önemlidir.",
            <>Tutanağı ve fotoğrafları <Slot>{COMPANY.email}</Slot> adresine ilettiğinde süreci başlatırız.</>,
            "Tutanak tutulamadıysa da bize ulaşabilirsin; durumu birlikte değerlendiririz.",
          ]}
        />
      </Section>

      <Section no={8} title="İletişim">
        <P>
          Sipariş ve teslimatla ilgili sorular için:{" "}
          <Slot>{COMPANY.email}</Slot> · <Slot>{COMPANY.phone}</Slot>
        </P>
      </Section>
    </LegalPageLayout>
  );
}
