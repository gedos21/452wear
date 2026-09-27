import { COMPANY } from "@/lib/legal";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/shipping";

/**
 * Sık sorulan sorular — TEK KAYIT. /sss sayfası ve arama motorları için
 * FAQPage verisi buradan üretilir.
 *
 * Cevaplar yalnızca sitede zaten yazan bilgilerden oluşur (kargo kuralı,
 * iade ve teslimat metinleri, duyuru çubuğu); tutarlar ve telefon kendi
 * kaynaklarından okunur, o kaynaklar değişince burası da güncellenir.
 * Yeni soru eklerken aynı kural geçerli: sitede karşılığı olmayan bir
 * vaat yazılmaz.
 */

export type FaqItem = {
  q: string;
  a: string;
  /** Cevabın sonunda gösterilen ayrıntı bağlantısı. */
  link?: { href: string; label: string };
};

export type FaqGroup = { title: string; items: FaqItem[] };

const tl = (n: number) => `${n.toLocaleString("tr-TR")} TL`;

export const FAQ: FaqGroup[] = [
  {
    title: "Sipariş ve Kargo",
    items: [
      {
        q: "Siparişim ne zaman kargoya verilir?",
        a: "Siparişin, ödeme onayının ardından aynı gün hazırlanır ve kargoya verilir. Hafta sonu ve resmî tatillerde verilen siparişler takip eden ilk iş günü kargoya verilir.",
        link: { href: "/teslimat-ve-kargo", label: "Teslimat ve Kargo" },
      },
      {
        q: "Kargo ücreti ne kadar?",
        a: `${tl(FREE_SHIPPING_THRESHOLD)} ve üzeri siparişlerde kargo ücretsiz. Bu tutarın altındaki siparişlerde kargo ücreti ${tl(SHIPPING_FEE)}; sepette ücretsiz kargoya ne kadar kaldığını görebilirsin.`,
      },
      {
        q: "Siparişimi nasıl takip ederim?",
        a: "Siparişin kargoya verildiğinde takip numarası e-posta ile iletilir.",
      },
    ],
  },
  {
    title: "Ödeme",
    items: [
      {
        q: "Hangi kartlarla ödeme yapabilirim?",
        a: "Visa, Mastercard ve Troy logolu kartlarla ödeme yapabilirsin.",
      },
      {
        q: "Taksit yapabiliyor muyum?",
        a: "Evet, kredi kartına 6 taksit imkânı var.",
      },
    ],
  },
  {
    title: "İade",
    items: [
      {
        q: "Ürünü iade edebilir miyim?",
        a: "Evet. Ürünü teslim aldığın tarihten itibaren 14 gün içinde, gerekçe göstermeden iade edebilirsin. Ürünün kullanılmamış, etiketleri sökülmemiş ve yeniden satılabilir durumda olması gerekir.",
        link: { href: "/iade-ve-cayma", label: "İade ve Cayma Hakkı" },
      },
      {
        q: "İade ücretim ne zaman yatar?",
        a: "İade bildirimin bize ulaştıktan sonra 14 gün içinde, teslimat masrafları da dâhil olmak üzere ödemeni iade ederiz.",
      },
    ],
  },
  {
    title: "Beden",
    items: [
      {
        q: "Hangi bedeni seçmeliyim?",
        a: "Her ürün sayfasında Beden Rehberi var. Giyim ürünlerinde boy ve kilonu bir kez girersen Beden Bulucu her üründe sana uygun bedeni önerir; bilgilerin yalnızca kendi tarayıcında saklanır.",
      },
      {
        q: "Aradığım beden tükenmiş, ne yapabilirim?",
        a: "Ürün sayfasında \"Gelince haber ver\"e dokun; hazır mesajla WhatsApp'tan bize yazarsın, beden stoğa girince sana haber veririz.",
      },
    ],
  },
  {
    title: "Stil ve İletişim",
    items: [
      {
        q: "Neyle giyeceğime karar veremiyorum.",
        a: "Kombinini Bul'da birkaç soruya cevap ver, mağazadaki ürünlerden sana kombin kuralım. Ürün sayfalarındaki \"Bunu tamamla\" bölümü de o ürünle giyilecek parçaları gösterir.",
        link: { href: "/kombinini-bul", label: "Kombinini Bul" },
      },
      {
        q: "Size nasıl ulaşırım?",
        a: `WhatsApp'tan ya da ${COMPANY.phone} numaralı telefondan bize ulaşabilirsin; ürün sayfalarındaki "WhatsApp'tan Sor" butonu ürünü mesaja hazır ekler.`,
        link: { href: "/iletisim", label: "İletişim" },
      },
    ],
  },
];
