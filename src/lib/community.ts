/**
 * Ana sayfadaki "Bize Katıl" bölümünün kanalları — TEK KAYNAK.
 *
 * Buraya yalnızca GERÇEK bilgi girilir. Değer boşsa ilgili alan sayfada hiç
 * görünmez; uydurma hesap ya da ödeme yöntemi gösterilmez.
 */

/**
 * 452WEAR'ın resmi Instagram profili (tam adres, ör.
 * "https://www.instagram.com/<hesap>/"). Boşsa "Bizi takip et" gizlenir.
 */
export const INSTAGRAM_URL: string | null =
  "https://www.instagram.com/452wear/";

/** Profil adresinden görünen kullanıcı adı: ".../452wear/" → "@452wear". */
export function instagramHandle(url: string): string {
  const name = new URL(url).pathname.split("/").filter(Boolean)[0];
  return name ? `@${name}` : "Instagram";
}

export type PaymentMethod = {
  id: string;
  /** Görünen ad, ör. "Kredi Kartı", "Banka Kartı". */
  label: string;
};

/**
 * Sitede gerçekten kabul edilen ödeme yöntemleri. Ödeme altyapısı henüz
 * bağlı değil (bkz. app/odeme); sağlayıcı kesinleşince doldurulup ilgili
 * yerde (ör. footer, ödeme sayfası) gösterilecek. Şu an hiçbir yerde çizilmez.
 */
export const PAYMENT_METHODS: PaymentMethod[] = [];
