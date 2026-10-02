/**
 * E-posta bülteni: form ile sunucu arasındaki ortak tanımlar.
 *
 * Abonelik kendi veritabanımıza kaydedilir (bkz. lib/server/newsletter-action.ts).
 * HENÜZ E-POSTA GÖNDERİLMİYOR: İYS (İleti Yönetim Sistemi) kaydı tamamlanınca
 * gönderim ve abonelikten çıkış bağlantısı eklenecek.
 *
 * Açık rıza metni değişirse NEWSLETTER_CONSENT_VERSION da değişmeli; her
 * abonenin hangi metne onay verdiği bu sürümle saklanıyor.
 */
export const NEWSLETTER_ENABLED = true;

export const NEWSLETTER_CONSENT_VERSION = "bulten-acik-riza-v1";

/** Formun bulunabileceği yerler; sunucu başka değer kabul etmez. */
export const NEWSLETTER_SOURCES = ["ana-sayfa"] as const;
export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];

export type SubscribeInput = {
  email: string;
  /** Açık rıza kutusu işaretli mi. */
  consent: boolean;
  /** Bal küpü (honeypot): insanlar görmez, botlar doldurur. */
  website: string;
  source: NewsletterSource;
};

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "consent" | "rate-limited" | "not-configured" | "error" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && EMAIL.test(email);
}
