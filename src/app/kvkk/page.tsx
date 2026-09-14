import { LegalPageLayout, legalMetadata } from "@/components/legal/legal-page";
import { List, P, Section, Slot } from "@/components/legal/prose";
import { COMPANY, LEGAL_PAGES } from "@/lib/legal";

const page = LEGAL_PAGES.find((p) => p.slug === "/kvkk")!;
export const metadata = legalMetadata(page);

export default function KvkkPage() {
  return (
    <LegalPageLayout page={page}>
      <Section no={1} title="Veri Sorumlusu">
        <P>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;)
          uyarınca kişisel verilerin, veri sorumlusu sıfatıyla{" "}
          <Slot>{COMPANY.legalName}</Slot> tarafından aşağıda açıklanan
          kapsamda işlenmektedir. {COMPANY.brand} bu tüzel kişiliğe ait markadır.
        </P>
        <List
          items={[
            <>Adres: <Slot>{COMPANY.address}</Slot></>,
            <>Vergi dairesi / numarası: <Slot>{COMPANY.taxOffice}</Slot> / <Slot>{COMPANY.taxNumber}</Slot></>,
            <>MERSİS: <Slot>{COMPANY.mersis}</Slot></>,
            <>E-posta: <Slot>{COMPANY.email}</Slot></>,
            <>KEP: <Slot>{COMPANY.kep}</Slot></>,
          ]}
        />
      </Section>

      <Section no={2} title="İşlenen Kişisel Veri Kategorileri">
        <P>
          Sitenin sunduğu hizmete bağlı olarak aşağıdaki veri kategorileri
          işlenebilir. Bir kategorinin burada sayılması, her kullanıcı için
          mutlaka işlendiği anlamına gelmez.
        </P>
        <List
          items={[
            "Kimlik verisi: ad, soyad.",
            "İletişim verisi: e-posta adresi, telefon numarası, teslimat ve fatura adresi.",
            "Müşteri işlem verisi: sipariş kayıtları, sipariş numarası, iade ve talep kayıtları.",
            "İşlem güvenliği verisi: hesap oluşturulması hâlinde giriş kayıtları ve güvenlik amaçlı log kayıtları.",
            "Pazarlama verisi: açık rızaya dayalı olarak ileti tercihleri ve alışveriş alışkanlıklarına ilişkin kayıtlar.",
          ]}
        />
        <P>
          Ödeme sırasında kart bilgileri, ödeme hizmet sağlayıcısı devreye
          alındığında doğrudan ilgili kuruluş tarafından işlenir; kart
          numarasının tamamı tarafımızca saklanmaz. Ödeme altyapısı henüz
          bağlanmadığından bu kapsamda hâlihazırda veri işlenmemektedir.
        </P>
      </Section>

      <Section no={3} title="Kişisel Verilerin İşlenme Amaçları">
        <List
          items={[
            "Siparişin alınması, hazırlanması, teslim edilmesi ve takibi.",
            "Sözleşmeden doğan yükümlülüklerin yerine getirilmesi; iade, değişim ve cayma taleplerinin sonuçlandırılması.",
            "Müşteri destek taleplerinin karşılanması ve iletişimin yürütülmesi.",
            "Faturalandırma ile mali ve ticari kayıtların mevzuata uygun tutulması.",
            "Site ve hizmetlerin güvenliğinin sağlanması, hata ve kötüye kullanımın tespiti.",
            "Açık rıza verilmesi hâlinde ticari elektronik ileti gönderimi ve kampanya duyuruları.",
          ]}
        />
      </Section>

      <Section no={4} title="Hukuki Sebepler">
        <P>
          Kişisel veriler, KVKK m.5 kapsamında aşağıdaki hukuki sebeplere
          dayanılarak işlenir:
        </P>
        <List
          items={[
            "Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması (m.5/2-c) — sipariş ve teslimat süreçleri.",
            "Veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi (m.5/2-ç) — fatura, saklama ve mevzuat yükümlülükleri.",
            "Bir hakkın tesisi, kullanılması veya korunması için zorunlu olması (m.5/2-e) — uyuşmazlık ve talep süreçleri.",
            "İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla meşru menfaat (m.5/2-f) — güvenlik ve hizmet iyileştirme.",
            "Açık rıza (m.5/1) — pazarlama iletileri ve zorunlu olmayan çerezler.",
          ]}
        />
      </Section>

      <Section no={5} title="Veri Toplama Yöntemleri">
        <P>
          Veriler; site üzerindeki formlar (hesap, sipariş, iletişim), e-posta
          yazışmaları ve site kullanımı sırasında oluşan teknik kayıtlar
          aracılığıyla, elektronik ortamda otomatik ve kısmen otomatik yollarla
          toplanır.
        </P>
        <P>
          Sepet ve favori bilgileri hâlihazırda yalnızca tarayıcının yerel
          depolamasında tutulmakta olup sunucuya iletilmemektedir. Ayrıntı için{" "}
          <Slot>Çerez Politikası</Slot> bölümüne bakabilirsin.
        </P>
      </Section>

      <Section no={6} title="Aktarım Yapılabilecek Taraflar">
        <P>
          Kişisel veriler, yalnızca işleme amacıyla sınırlı olmak üzere
          aşağıdaki taraf kategorilerine aktarılabilir. Hizmet sağlayıcılar
          netleştikçe bu bölüm güncellenecektir.
        </P>
        <List
          items={[
            "Kargo ve lojistik hizmeti sağlayıcıları — teslimat için.",
            "Ödeme hizmeti sağlayıcıları ve bankalar — ödeme işleminin gerçekleştirilmesi için.",
            "Bilişim altyapısı ve barındırma sağlayıcıları — hizmetin sunulması için.",
            "Muhasebe ve hukuk danışmanları — yasal yükümlülükler ve hakların korunması için.",
            "Yetkili kamu kurum ve kuruluşları — mevzuattan doğan talepler kapsamında.",
          ]}
        />
        <P>
          Yurt dışına aktarım söz konusu olduğunda KVKK m.9 kapsamındaki
          şartlar sağlanır ve bu metin güncellenir.
        </P>
      </Section>

      <Section no={7} title="Saklama Süresi">
        <P>
          Kişisel veriler, işlendikleri amacın gerektirdiği süre boyunca ve
          ilgili mevzuatta öngörülen zamanaşımı ile saklama süreleri dikkate
          alınarak muhafaza edilir. Amacın ortadan kalkması ve yasal saklama
          sürelerinin dolması hâlinde veriler silinir, yok edilir veya anonim
          hâle getirilir.
        </P>
        <P>
          Kategori bazlı saklama süreleri{" "}
          <Slot>[SAKLAMA VE İMHA POLİTİKASI]</Slot> ile belirlenecektir.
        </P>
      </Section>

      <Section no={8} title="İlgili Kişinin Hakları">
        <P>KVKK m.11 uyarınca aşağıdaki haklara sahipsin:</P>
        <List
          items={[
            "Kişisel verinin işlenip işlenmediğini öğrenme ve işlenmişse buna ilişkin bilgi talep etme.",
            "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme.",
            "Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme.",
            "Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme.",
            "Şartların oluşması hâlinde verilerin silinmesini veya yok edilmesini isteme.",
            "Düzeltme, silme ve yok etme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme.",
            "Verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhine bir sonuç ortaya çıkmasına itiraz etme.",
            "Kanuna aykırı işleme sebebiyle zarara uğraman hâlinde zararın giderilmesini talep etme.",
          ]}
        />
      </Section>

      <Section no={9} title="Başvuru Yöntemi">
        <P>
          Taleplerini, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında
          Tebliğ&apos;e uygun şekilde <Slot>{COMPANY.address}</Slot> adresine
          yazılı olarak veya <Slot>{COMPANY.kep}</Slot> KEP adresine
          iletebilirsin. Başvurular en geç otuz gün içinde sonuçlandırılır.
        </P>
        <P>
          Başvurunda ad-soyad, imza, T.C. kimlik numarası, tebligata esas adres
          ve talep konusunun açıkça yer alması gerekir.
        </P>
      </Section>

      <Section no={10} title="Veri Güvenliği">
        <P>
          Kişisel verilerin hukuka aykırı işlenmesini ve erişilmesini önlemek
          ile muhafazasını sağlamak amacıyla uygun güvenlik düzeyini temin
          etmeye yönelik teknik ve idari tedbirler alınır. Bu tedbirler
          teknolojik gelişmeler ve hizmet altyapısındaki değişikliklere göre
          gözden geçirilir.
        </P>
      </Section>
    </LegalPageLayout>
  );
}
