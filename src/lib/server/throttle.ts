import "server-only";
import { sql } from "drizzle-orm";
import { getDb, schema } from "./db";

/**
 * Basit deneme sınırı, Better Auth'un kullandığı `rate_limit` tablosunda.
 * Anahtarlar "452:" önekiyle ayrılır; `last_request` burada pencerenin
 * BAŞLANGICINI tutar. Tek bir upsert ile sayar (yarış durumunda da doğru).
 *
 * IP gibi kişisel veriler tabloya düz yazılmaz; gizli anahtarla özetlenir.
 */

const { rateLimit } = schema;

/** Pencere içindeki kaçıncı deneme olduğunu döner. */
async function hit(key: string, windowMs: number): Promise<number> {
  const now = Date.now();
  const resetBefore = now - windowMs;
  const result = await getDb().execute(sql`
    insert into ${rateLimit} (id, key, count, last_request)
    values (${crypto.randomUUID()}, ${key}, 1, ${now})
    on conflict (key) do update set
      count = case when ${rateLimit.lastRequest} < ${resetBefore} then 1 else ${rateLimit.count} + 1 end,
      last_request = case when ${rateLimit.lastRequest} < ${resetBefore} then ${now} else ${rateLimit.lastRequest} end
    returning count
  `);
  const row = result.rows[0] as { count: number } | undefined;

  // Ara sıra süresi çoktan geçmiş kendi kayıtlarımızı temizle.
  if (Math.random() < 0.02) {
    await getDb()
      .execute(sql`delete from ${rateLimit} where key like '452:%' and last_request < ${now - 86_400_000}`)
      .catch(() => {});
  }
  return Number(row?.count ?? 1);
}

/** true: sınır aşılmadı, devam edilebilir. */
export async function allow(key: string, max: number, windowMs: number): Promise<boolean> {
  return (await hit(`452:${key}`, windowMs)) <= max;
}

/** Kişisel veriyi (IP, e-posta) geri döndürülemez kısa bir özete çevirir. */
export async function digest(value: string): Promise<string> {
  const secret = process.env.BETTER_AUTH_SECRET ?? "";
  const data = new TextEncoder().encode(`${secret}:${value}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}
