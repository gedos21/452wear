import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "./db";

/**
 * Giriş yapmış kullanıcının favorileri. Ürün kimliği yalnızca biçimce
 * doğrulanır (katalog dosyadan okunuyor, sunucusuz ortamda erişilemeyebilir);
 * katalogda olmayan kimlik zaten vitrinde gösterilmez.
 */

export const MAX_FAVORITES = 500;

const PRODUCT_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

export function isProductId(value: unknown): value is string {
  return typeof value === "string" && PRODUCT_ID.test(value);
}

const { favorite } = schema;

export async function listFavorites(userId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ productId: favorite.productId })
    .from(favorite)
    .where(eq(favorite.userId, userId))
    .orderBy(asc(favorite.createdAt), asc(favorite.productId));
  return rows.map((r) => r.productId);
}

/**
 * Ekler (zaten varsa dokunmaz). Sınır aynı INSERT içinde kontrol edilir.
 * Dönen değer: favoride mi (yeni eklendi ya da zaten vardı) yoksa sınır mı doldu.
 */
export async function addFavorite(userId: string, productId: string): Promise<"ok" | "full"> {
  const result = await getDb().execute(sql`
    insert into ${favorite} (user_id, product_id)
    select ${userId}, ${productId}
    where (select count(*) from ${favorite} where user_id = ${userId}) < ${MAX_FAVORITES}
    on conflict do nothing
    returning product_id
  `);
  if (result.rows.length > 0) return "ok";
  // Hiçbir şey eklenmediyse ya zaten favorideydi ya da sınır doldu.
  const [existing] = await getDb()
    .select({ productId: favorite.productId })
    .from(favorite)
    .where(and(eq(favorite.userId, userId), eq(favorite.productId, productId)));
  return existing ? "ok" : "full";
}

export async function removeFavorite(userId: string, productId: string) {
  await getDb()
    .delete(favorite)
    .where(and(eq(favorite.userId, userId), eq(favorite.productId, productId)));
}

export async function clearFavorites(userId: string) {
  await getDb().delete(favorite).where(eq(favorite.userId, userId));
}

/**
 * Girişte tarayıcıdaki (yerel) favorileri hesaba bir kez katar. Var olanlar
 * atlanır; sınırı aşan fazlası alınmaz (sıralı eklenir, eskiler önce).
 * Güncel listeyi döner.
 */
export async function mergeFavorites(userId: string, productIds: string[]): Promise<string[]> {
  const unique = [...new Set(productIds)].slice(0, MAX_FAVORITES);
  if (unique.length > 0) {
    const current = await listFavorites(userId);
    const have = new Set(current);
    const room = Math.max(0, MAX_FAVORITES - current.length);
    const toAdd = unique.filter((id) => !have.has(id)).slice(0, room);
    if (toAdd.length > 0) {
      // Eklenme sırası korunsun diye milisaniye farkıyla zaman damgası.
      const base = Date.now() - toAdd.length;
      await getDb()
        .insert(favorite)
        .values(toAdd.map((productId, i) => ({ userId, productId, createdAt: new Date(base + i) })))
        .onConflictDoNothing();
    }
  }
  return listFavorites(userId);
}
