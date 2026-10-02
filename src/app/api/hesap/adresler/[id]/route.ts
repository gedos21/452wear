import { validateAddress } from "@/lib/address";
import {
  ADDRESS_NOT_FOUND,
  deleteAddress,
  isAddressId,
  updateAddress,
} from "@/lib/server/addresses";
import { fail, json, readJson, requireUser } from "@/lib/server/api";

/** Tek adres: PATCH günceller, DELETE siler. Yalnızca sahibi. */

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response;
  const { id } = await params;
  if (!isAddressId(id)) return fail(404, ADDRESS_NOT_FOUND);

  const result = validateAddress(await readJson(request));
  if (!result.ok) return fail(400, result.message, result.field);

  const updated = await updateAddress(guard.userId, id, result.value);
  return updated ? json({ address: updated }) : fail(404, ADDRESS_NOT_FOUND);
}

export async function DELETE(request: Request, { params }: Context) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response;
  const { id } = await params;
  if (!isAddressId(id)) return fail(404, ADDRESS_NOT_FOUND);

  return (await deleteAddress(guard.userId, id))
    ? json({ ok: true })
    : fail(404, ADDRESS_NOT_FOUND);
}
