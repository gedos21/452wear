import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import { MAX_ADDRESSES, type Address, type AddressValidation } from "@/lib/address";

/**
 * Adres veri katmanı. Her sorgu `user_id` ile sınırlıdır: kullanıcı yalnızca
 * kendi satırlarını görür ve değiştirir. Neon HTTP sürücüsü etkileşimli
 * transaction desteklemediği için kritik adımlar tek SQL ifadesiyle yapılır.
 */

type NewAddress = Extract<AddressValidation, { ok: true }>["value"];

export const ADDRESS_NOT_FOUND = "Adres bulunamadı. Sayfayı yenileyip tekrar dene.";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Adres kimlikleri UUID; başka biçimdeki değer veritabanına hiç gitmez. */
export function isAddressId(value: string) {
  return UUID.test(value);
}

const { address } = schema;

const columns = {
  id: address.id,
  title: address.title,
  fullName: address.fullName,
  phone: address.phone,
  city: address.city,
  district: address.district,
  addressLine: address.addressLine,
  postalCode: address.postalCode,
  isDefault: address.isDefault,
};

export async function listAddresses(userId: string): Promise<Address[]> {
  return getDb()
    .select(columns)
    .from(address)
    .where(eq(address.userId, userId))
    .orderBy(desc(address.isDefault), desc(address.createdAt));
}

/** Varsayılanı tek ifadede taşır: hedef true, diğer hepsi false olur. */
async function makeDefault(userId: string, id: string) {
  await getDb()
    .update(address)
    .set({ isDefault: sql`(${address.id} = ${id})` })
    .where(eq(address.userId, userId));
}

/** Varsayılan kalmadıysa en yeni adresi varsayılan yapar. */
async function ensureDefault(userId: string) {
  await getDb().execute(sql`
    update ${address} set is_default = true
    where id = (
      select id from ${address} where user_id = ${userId}
      order by created_at desc limit 1
    )
    and not exists (
      select 1 from ${address} where user_id = ${userId} and is_default
    )
  `);
}

/**
 * Yeni adres. Sınır (MAX_ADDRESSES) aynı INSERT içinde kontrol edilir; ilk
 * adres kendiliğinden varsayılan olur. Sınır doluysa null döner.
 */
export async function createAddress(userId: string, value: NewAddress): Promise<Address | null> {
  const id = crypto.randomUUID();
  const result = await getDb().execute(sql`
    insert into ${address}
      (id, user_id, title, full_name, phone, city, district, address_line, postal_code, is_default)
    select ${id}, ${userId}, ${value.title}, ${value.fullName}, ${value.phone}, ${value.city},
      ${value.district}, ${value.addressLine}, ${value.postalCode},
      (${value.isDefault} or not exists (select 1 from ${address} where user_id = ${userId}))
    where (select count(*) from ${address} where user_id = ${userId}) < ${MAX_ADDRESSES}
    returning id, is_default
  `);
  const row = result.rows[0] as { id: string; is_default: boolean } | undefined;
  if (!row) return null;
  if (value.isDefault) await makeDefault(userId, id);
  return { id, ...value, isDefault: row.is_default };
}

/** Günceller; adres bu kullanıcıya ait değilse null. */
export async function updateAddress(
  userId: string,
  id: string,
  value: NewAddress,
): Promise<Address | null> {
  // Varsayılanlık buradan kaldırılmaz; başka bir adres varsayılan yapılınca taşınır.
  const { isDefault, ...fields } = value;
  const [row] = await getDb()
    .update(address)
    .set({ ...fields, updatedAt: new Date() })
    .where(and(eq(address.id, id), eq(address.userId, userId)))
    .returning(columns);
  if (!row) return null;
  if (isDefault && !row.isDefault) {
    await makeDefault(userId, id);
    return { ...row, isDefault: true };
  }
  return row;
}

/** Siler; silinen varsayılansa bir diğerini varsayılan yapar. */
export async function deleteAddress(userId: string, id: string): Promise<boolean> {
  const [row] = await getDb()
    .delete(address)
    .where(and(eq(address.id, id), eq(address.userId, userId)))
    .returning({ isDefault: address.isDefault });
  if (!row) return false;
  if (row.isDefault) await ensureDefault(userId);
  return true;
}

export async function setDefaultAddress(userId: string, id: string): Promise<boolean> {
  const [owned] = await getDb()
    .select({ id: address.id })
    .from(address)
    .where(and(eq(address.id, id), eq(address.userId, userId)));
  if (!owned) return false;
  await makeDefault(userId, id);
  return true;
}
