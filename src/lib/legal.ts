/**
 * Yasal sayfaların tek kaydı. Footer bağlantıları ve sayfa başlıkları
 * buradan üretilir; yeni bir metin eklenirse tek yerden tanımlanır.
 */

export const LEGAL_UPDATED_AT = "8 Eylül 2026";
export const LEGAL_VERSION = "1.0 (taslak)";

export type LegalPage = {
  slug: string;
  /** Sayfa başlığı (büyük harf, sondaki nokta sayfada ekleniyor) */
  title: string;
  /** Footer'da görünen kısa etiket */
  footerLabel: string;
  /** <title> için okunabilir başlık (kısaltmalar korunur) */
  metaTitle: string;
  description: string;
};

export const LEGAL_PAGES: LegalPage[] = [
  {
    slug: "/kvkk",
    title: "KVKK AYDINLATMA METNİ",
    metaTitle: "KVKK Aydınlatma Metni",
    footerLabel: "KVKK",
    description:
      "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinin nasıl işlendiğine dair bilgilendirme.",
  },
  {
    slug: "/gizlilik-politikasi",
    title: "GİZLİLİK POLİTİKASI",
    metaTitle: "Gizlilik Politikası",
    footerLabel: "Gizlilik Politikası",
    description:
      "Hangi bilgileri topladığımız, neden topladığımız ve nasıl koruduğumuz.",
  },
  {
    slug: "/cerez-politikasi",
    title: "ÇEREZ POLİTİKASI",
    metaTitle: "Çerez Politikası",
    footerLabel: "Çerez Politikası",
    description:
      "Sitede çerez ve benzeri teknolojilerin nasıl kullanıldığı.",
  },
  {
    slug: "/cerez-tercihleri",
    title: "ÇEREZ TERCİHLERİ",
    metaTitle: "Çerez Tercihleri",
    footerLabel: "Çerez Tercihleri",
    description: "Zorunlu olmayan çerez kategorilerini buradan yönetebilirsin.",
  },
  {
    slug: "/on-bilgilendirme",
    title: "ÖN BİLGİLENDİRME FORMU",
    metaTitle: "Ön Bilgilendirme Formu",
    footerLabel: "Ön Bilgilendirme",
    description:
      "Mesafeli satış öncesinde tüketiciye sunulan bilgilendirme.",
  },
  {
    slug: "/iade-ve-cayma",
    title: "İADE VE CAYMA HAKKI",
    metaTitle: "İade ve Cayma Hakkı",
    footerLabel: "İade ve Cayma",
    description: "Cayma hakkın, iade koşulları ve ücret iadesi süreci.",
  },
  {
    slug: "/teslimat-ve-kargo",
    title: "TESLİMAT VE KARGO",
    metaTitle: "Teslimat ve Kargo",
    footerLabel: "Teslimat ve Kargo",
    description: "Siparişinin hazırlanması, kargoya verilmesi ve teslimi.",
  },
  {
    slug: "/kullanim-kosullari",
    title: "KULLANIM KOŞULLARI",
    metaTitle: "Kullanım Koşulları",
    footerLabel: "Kullanım Koşulları",
    description: "Siteyi kullanırken geçerli olan koşullar.",
  },
];

/**
 * Şirket bilgileri henüz belli olmadığı için placeholder. Bilgiler
 * netleştiğinde YALNIZCA burası doldurulacak; metinler otomatik güncellenir.
 */
export const COMPANY = {
  legalName: "[ŞİRKET UNVANI]",
  brand: "452WEAR",
  taxOffice: "[VERGİ DAİRESİ]",
  taxNumber: "[VERGİ NUMARASI]",
  mersis: "[MERSİS NUMARASI]",
  address: "[ŞİRKET ADRESİ]",
  email: "[DESTEK E-POSTASI]",
  phone: "[TELEFON]",
  kep: "[KEP ADRESİ]",
  returnAddress: "[İADE ADRESİ]",
} as const;
