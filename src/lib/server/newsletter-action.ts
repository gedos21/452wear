"use server";

import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import { allow, digest } from "./throttle";
import {
  isValidEmail,
  NEWSLETTER_CONSENT_VERSION,
  NEWSLETTER_ENABLED,
  NEWSLETTER_SOURCES,
  type SubscribeInput,
  type SubscribeResult,
} from "@/lib/newsletter";

/**
 * Bülten aboneliği (server action). E-POSTA GÖNDERMEZ — yalnızca açık rızayı
 * ve aboneliği kaydeder (bkz. lib/newsletter.ts).
 *
 * Kötüye kullanıma karşı: bal küpü alanı, IP başına 10 dakikada 5 ve e-posta
 * başına saatte 3 deneme. Aynı e-posta tekrar gelirse yeni satır açılmaz;
 * abonelikten çıkmışsa yeniden abone olur (yeni rıza anı ile). Cevap, adresin
 * daha önce kayıtlı olup olmadığını ele vermez.
 */

const { newsletterSubscriber: subscriber } = schema;

/**
 * İstemci IP'si. Yalnızca platformun KENDİSİNİN yazdığı başlığa güvenilir:
 * Vercel `x-real-ip`/`x-forwarded-for`'u ezer ama `cf-connecting-ip`'yi
 * ezmez (istemci uydurabilir); Cloudflare'de ise tersi.
 */
async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (process.env.VERCEL) return h.get("x-real-ip") ?? forwarded ?? "unknown";
  return h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? forwarded ?? "unknown";
}

export async function subscribeToNewsletter(input: SubscribeInput): Promise<SubscribeResult> {
  if (!NEWSLETTER_ENABLED) return { ok: false, reason: "not-configured" };

  const raw = (input && typeof input === "object" ? input : {}) as Partial<SubscribeInput>;
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  const source = NEWSLETTER_SOURCES.find((s) => s === raw.source);

  // Bot: başarılı gibi görünür ama hiçbir şey kaydedilmez.
  if (typeof raw.website === "string" && raw.website.trim() !== "") return { ok: true };

  if (!email || !isValidEmail(email) || !source) return { ok: false, reason: "invalid" };
  if (raw.consent !== true) return { ok: false, reason: "consent" };

  try {
    const [ipOk, emailOk] = await Promise.all([
      allow(`bulten:ip:${await digest(await clientIp())}`, 5, 10 * 60_000),
      allow(`bulten:eposta:${await digest(email)}`, 3, 60 * 60_000),
    ]);
    if (!ipOk || !emailOk) return { ok: false, reason: "rate-limited" };

    const now = new Date();
    await getDb()
      .insert(subscriber)
      .values({
        id: crypto.randomUUID(),
        email,
        consentAt: now,
        consentTextVersion: NEWSLETTER_CONSENT_VERSION,
        source,
      })
      .onConflictDoUpdate({
        target: subscriber.email,
        // Aktif aboneyse ilk rıza kaydı korunur; çıkmışsa yeni rıza yazılır.
        set: {
          consentAt: sql`case when ${subscriber.unsubscribedAt} is null then ${subscriber.consentAt} else excluded.consent_at end`,
          consentTextVersion: sql`case when ${subscriber.unsubscribedAt} is null then ${subscriber.consentTextVersion} else excluded.consent_text_version end`,
          source: sql`case when ${subscriber.unsubscribedAt} is null then ${subscriber.source} else excluded.source end`,
          unsubscribedAt: null,
        },
      });
    return { ok: true };
  } catch (error) {
    console.error("[bülten] abonelik kaydedilemedi:", error);
    return { ok: false, reason: "error" };
  }
}
