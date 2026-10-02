import { MAX_ADDRESSES, validateAddress } from "@/lib/address";
import { createAddress, listAddresses } from "@/lib/server/addresses";
import { fail, json, readJson, requireUser } from "@/lib/server/api";

/** Adreslerim: GET listeler, POST yeni adres ekler. */

export async function GET(request: Request) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response;
  return json({ addresses: await listAddresses(guard.userId) });
}

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response;

  const result = validateAddress(await readJson(request));
  if (!result.ok) return fail(400, result.message, result.field);

  const created = await createAddress(guard.userId, result.value);
  if (!created) {
    return fail(
      409,
      `En fazla ${MAX_ADDRESSES} adres kaydedebilirsin. Yenisini eklemek için birini sil.`,
    );
  }
  return json({ address: created }, 201);
}
