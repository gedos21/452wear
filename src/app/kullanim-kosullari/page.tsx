import Link from "next/link";
import { LegalPageLayout, legalMetadata } from "@/components/legal/legal-page";
import { List, P, Section, Slot } from "@/components/legal/prose";
import { COMPANY, LEGAL_PAGES } from "@/lib/legal";

const page = LEGAL_PAGES.find((p) => p.slug === "/kullanim-kosullari")!;
export const metadata = legalMetadata(page);

export default function TermsPage() {
  return (
    <LegalPageLayout page={page}>
      <Section no={1} title="Taraflar ve Kapsam">
        <P>
          Bu koşullar, <Slot>{COMPANY.legalName}</Slot> tarafından işletilen{" "}
          {COMPANY.brand} web sitesinin kullanımına ilişkindir. Siteyi
          kullanarak bu koşulları kabul etmiş sayılırsın. Katılmıyorsan siteyi
          kullanmamanı rica ederiz.
        </P>
      </Section>

      <Section no={2} title="Kullanıcı Hesapları">
        <P>
          Site üzerinde hesap oluşturma özelliği hazırlanmaktadır; kimlik
          doğrulama altyapısı henüz bağlanmamıştır. Hesap özelliği
          etkinleştirildiğinde aşağıdaki koşullar geçerli olacaktır.
        </P>
        <List
          items={[
            "Hesap bilgilerinin doğru ve güncel olmasından kullanıcı sorumludur.",
            "Şifrenin gizliliğinin korunması ve hesap üzerinden yapılan işlemler kullanıcının sorumluluğundadır.",
            "Hesabının izinsiz kullanıldığını fark edersen bize bildirmelisin.",
          ]}
        />
      </Section>

      <Section no={3} title="Kullanıcı Sorumlulukları">
        <List
          items={[
            "Siteyi yürürlükteki mevzuata ve dürüstlük kurallarına uygun kullanmak.",
            "Verdiğin bilgilerin doğruluğundan sorumlu olmak.",
            "Başkalarının haklarını ihlal etmemek.",
          ]}
        />
      </Section>

      <Section no={4} title="Ürün ve Fiyat Bilgileri">
        <P>
          Ürün açıklamaları, görselleri ve fiyatları özenle hazırlanır. Ekran
          ayarlarına bağlı olarak renkler farklı görünebilir. Fiyatlar KDV
          dâhil olarak gösterilir ve önceden bildirilmeksizin değiştirilebilir;
          değişiklik, onaylanmış siparişleri etkilemez.
        </P>
        <P>
          Açık yazım veya sistem hatası nedeniyle gerçek değerinden bariz
          şekilde farklı görünen fiyatlarda satıcı siparişi iptal edebilir; bu
          durumda tahsil edilen tutar iade edilir ve sana bilgi verilir.
        </P>
      </Section>

      <Section no={5} title="Sipariş Süreci">
        <P>
          Sipariş, ödeme adımının tamamlanması ve satıcının onayıyla kurulur.
          Ürünün stokta bulunmaması hâlinde sipariş iptal edilir ve tahsil
          edilen tutar iade edilir.
        </P>
        <P>
          Satışa ilişkin ayrıntılar{" "}
          <Link href="/on-bilgilendirme" className="underline underline-offset-4 hover:text-foreground">
            Ön Bilgilendirme Formu
          </Link>{" "}
          ve{" "}
          <Link href="/iade-ve-cayma" className="underline underline-offset-4 hover:text-foreground">
            İade ve Cayma Hakkı
          </Link>{" "}
          sayfalarında yer alır.
        </P>
      </Section>

      <Section no={6} title="Fikri Mülkiyet">
        <P>
          Sitedeki marka, logo, tasarım, görsel, metin ve yazılım unsurları
          satıcıya veya lisans verenlerine aittir. Bu içerikler, kişisel ve
          ticari olmayan kullanım dışında izinsiz kopyalanamaz, çoğaltılamaz,
          dağıtılamaz veya türev çalışmalara konu edilemez.
        </P>
      </Section>

      <Section no={7} title="Site İçeriği">
        <P>
          İçerikler bilgilendirme amaçlıdır ve güncelliği korunmaya çalışılır.
          Kampanya ve stok bilgileri değişebilir. Site üzerinden verilen
          bağlantılarla erişilen üçüncü taraf sitelerin içeriğinden satıcı
          sorumlu değildir.
        </P>
      </Section>

      <Section no={8} title="Yasaklı Kullanımlar">
        <List
          items={[
            "Siteye zarar verecek yazılım yüklemek veya yaymak.",
            "Otomatik araçlarla sistemi aşırı yükleyecek şekilde veri çekmek.",
            "Güvenlik önlemlerini aşmaya çalışmak veya yetkisiz erişim denemek.",
            "Başka bir kişi veya kurum adına yanıltıcı şekilde işlem yapmak.",
            "İçerikleri izinsiz ticari amaçla kullanmak.",
          ]}
        />
      </Section>

      <Section no={9} title="Hizmetin Değiştirilmesi">
        <P>
          Site içeriği, özellikleri ve sunulan hizmetler zaman içinde
          değiştirilebilir, askıya alınabilir veya sonlandırılabilir. Onaylanmış
          siparişlere ilişkin yükümlülükler bu değişikliklerden etkilenmez.
        </P>
      </Section>

      <Section no={10} title="Sorumluluk">
        <P>
          Satıcı, hizmetin kesintisiz ve hatasız sunulması için makul özeni
          gösterir. Bakım, teknik arıza veya mücbir sebep kaynaklı geçici
          kesintilerden doğan dolaylı zararlardan sorumlu tutulamaz.
        </P>
        <P>
          Bu bölüm; satıcının kastından, ağır ihmalinden ya da tüketici
          mevzuatından doğan sorumluluğunu sınırlamaz veya ortadan kaldırmaz.
          Tüketici olarak sahip olduğun kanuni haklar saklıdır.
        </P>
      </Section>

      <Section no={11} title="Koşulların Güncellenmesi">
        <P>
          Bu koşullar güncellenebilir. Güncel sürüm her zaman bu sayfada
          yayımlanır; sayfa başındaki tarih ve sürüm bilgisi son değişikliği
          gösterir. Güncellemeler, yürürlüğe girdikten sonraki kullanımlar için
          geçerlidir.
        </P>
      </Section>

      <Section no={12} title="Uygulanacak Hukuk ve İletişim">
        <P>
          Bu koşullara Türk hukuku uygulanır. Tüketici uyuşmazlıklarında,
          ilgili yıl için belirlenen parasal sınırlar dâhilinde Tüketici Hakem
          Heyetleri ve Tüketici Mahkemeleri yetkilidir.
        </P>
        <P>
          İletişim: <Slot>{COMPANY.email}</Slot> ·{" "}
          <Slot>{COMPANY.address}</Slot>
        </P>
      </Section>
    </LegalPageLayout>
  );
}
