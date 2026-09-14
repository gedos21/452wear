import Link from "next/link";
import { LegalPageLayout, legalMetadata } from "@/components/legal/legal-page";
import { List, P, Section, Slot } from "@/components/legal/prose";
import { COMPANY, LEGAL_PAGES } from "@/lib/legal";

const page = LEGAL_PAGES.find((p) => p.slug === "/gizlilik-politikasi")!;
export const metadata = legalMetadata(page);

export default function PrivacyPage() {
  return (
    <LegalPageLayout page={page}>
      <Section no={1} title="Bu Politikanın Kapsamı">
        <P>
          Bu politika, {COMPANY.brand} web sitesini kullanırken bilgilerinin
          nasıl ele alındığını günlük dille açıklar. KVKK kapsamındaki resmî
          bildirim ise ayrı bir metindir:{" "}
          <Link href="/kvkk" className="underline underline-offset-4 hover:text-foreground">
            KVKK Aydınlatma Metni
          </Link>
          . İkisi çelişirse aydınlatma metni esas alınır.
        </P>
      </Section>

      <Section no={2} title="Toplanabilecek Bilgiler">
        <List
          items={[
            "Sen verdiğinde: ad, soyad, e-posta, telefon, teslimat ve fatura adresi, sipariş içeriği, destek yazışmaları.",
            "Otomatik oluşan teknik kayıtlar: IP adresi, tarayıcı ve cihaz bilgisi, ziyaret edilen sayfalar, hata kayıtları.",
            "Tarayıcında saklanan tercihler: sepetin, favorilerin ve çerez tercihin.",
          ]}
        />
        <P>
          Sepet ve favori bilgileri şu anda yalnızca senin tarayıcının yerel
          depolamasında (<Slot>452wear:cart</Slot>,{" "}
          <Slot>452wear:favorites</Slot>) tutulur ve sunucumuza
          gönderilmez. Tarayıcı verisini temizlediğinde bu bilgiler kaybolur.
        </P>
      </Section>

      <Section no={3} title="Neden Topluyoruz">
        <List
          items={[
            "Siparişini alıp hazırlamak ve teslim etmek.",
            "İade, değişim ve destek taleplerini sonuçlandırmak.",
            "Yasal yükümlülükleri (fatura, kayıt saklama) yerine getirmek.",
            "Siteyi güvenli tutmak, hataları bulup gidermek.",
            "Yalnızca ayrıca izin verirsen kampanya ve yenilik duyurusu göndermek.",
          ]}
        />
      </Section>

      <Section no={4} title="Nasıl Kullanıyoruz">
        <P>
          Bilgilerini yalnızca yukarıdaki amaçlarla ve amaçla sınırlı ölçüde
          kullanırız. Kişisel verilerini satmayız ve pazarlama amacıyla üçüncü
          kişilere kiralamayız.
        </P>
      </Section>

      <Section no={5} title="Kimlerle Paylaşabiliriz">
        <P>
          Hizmetin sunulabilmesi için gereken taraflarla, yalnızca gerekli
          veriyle sınırlı olarak paylaşım yapılabilir: kargo ve lojistik
          sağlayıcıları, ödeme kuruluşları, barındırma ve bilişim hizmeti
          sağlayıcıları, muhasebe ve hukuk danışmanları ile yetkili kamu kurum
          ve kuruluşları.
        </P>
        <P>
          Bu sağlayıcılar henüz belirlenmemiştir; sözleşmeler yapıldığında bu
          bölüm somut isimlerle güncellenecektir.
        </P>
      </Section>

      <Section no={6} title="Üçüncü Taraf Hizmetler">
        <P>
          Sitede şu anda analiz (analytics), reklam ağı, sosyal medya izleme
          pikseli veya benzeri bir üçüncü taraf ölçümleme aracı
          kullanılmamaktadır. Yazı tipleri site sunucusundan sunulur; bu nedenle
          sayfa görüntülerken üçüncü bir tarafa istek gitmez.
        </P>
        <P>
          İleride böyle bir araç eklenirse bu bölüm ve{" "}
          <Link href="/cerez-politikasi" className="underline underline-offset-4 hover:text-foreground">
            Çerez Politikası
          </Link>{" "}
          önceden güncellenir; zorunlu olmayan araçlar ancak izin verdiğinde
          çalıştırılır.
        </P>
      </Section>

      <Section no={7} title="Veri Güvenliği">
        <P>
          Bilgilerini yetkisiz erişime karşı korumak için uygun teknik ve idari
          tedbirleri alırız. Bununla birlikte internet üzerinden yapılan hiçbir
          aktarımın %100 güvenli olduğu taahhüt edilemez.
        </P>
      </Section>

      <Section no={8} title="Saklama">
        <P>
          Bilgilerini yalnızca gerekli olduğu sürece ve mevzuatın öngördüğü
          saklama süreleri boyunca tutarız. Süre dolduğunda veriler silinir,
          yok edilir veya anonimleştirilir.
        </P>
      </Section>

      <Section no={9} title="Haklarını Nasıl Kullanırsın">
        <P>
          Verilerine erişme, düzeltme, silme ve işlemeye itiraz etme haklarına
          sahipsin. Bu hakların kapsamı ve başvuru usulü{" "}
          <Link href="/kvkk" className="underline underline-offset-4 hover:text-foreground">
            KVKK Aydınlatma Metni
          </Link>{" "}
          içinde ayrıntılı olarak açıklanmıştır.
        </P>
      </Section>

      <Section no={10} title="Politikadaki Değişiklikler">
        <P>
          Bu politika zaman zaman güncellenebilir. Güncel sürüm her zaman bu
          sayfada yayımlanır; sayfa başındaki tarih ve sürüm bilgisi son
          değişikliği gösterir. Önemli değişikliklerde ayrıca bilgilendirme
          yapılır.
        </P>
      </Section>

      <Section no={11} title="İletişim">
        <P>
          Sorularını <Slot>{COMPANY.email}</Slot> adresine iletebilirsin.
          Yazışma adresi: <Slot>{COMPANY.address}</Slot>.
        </P>
      </Section>
    </LegalPageLayout>
  );
}
