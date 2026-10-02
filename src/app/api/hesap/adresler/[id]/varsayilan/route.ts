import { ADDRESS_NOT_FOUND, isAddressId, setDefaultAddress } from "@/lib/server/addresses";
import { fail, json, requireUser } from "@/lib/server/api";

/** POST: bu adresi varsayılan teslimat adresi yapar. Yalnızca sahibi. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response;
  const { id } = await params;
  if (!isAddressId(id)) return fail(404, ADDRESS_NOT_FOUND);

  return (await setDefaultAddress(guard.userId, id))
    ? json({ ok: true })
    : fail(404, ADDRESS_NOT_FOUND);
}
