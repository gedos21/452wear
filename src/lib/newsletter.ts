/**
 * E-posta bülteni. Projede henüz bir bülten sağlayıcısı / backend yok; form
 * bu yüzden adresi hiçbir yere göndermez ve kullanıcıya bunu açıkça söyler.
 *
 * Sağlayıcı bağlandığında yalnızca `subscribeToNewsletter` doldurulur (ör. bir
 * server action ya da sağlayıcının API'si) ve NEWSLETTER_ENABLED true yapılır.
 * O noktada formun altına KVKK aydınlatma/açık rıza metni de eklenmelidir.
 */
export const NEWSLETTER_ENABLED = false;

export type SubscribeResult =
  { ok: true } | { ok: false; reason: "invalid" | "not-configured" | "error" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

export async function subscribeToNewsletter(
  email: string,
): Promise<SubscribeResult> {
  if (!isValidEmail(email)) return { ok: false, reason: "invalid" };
  if (!NEWSLETTER_ENABLED) return { ok: false, reason: "not-configured" };
  return { ok: false, reason: "error" };
}
