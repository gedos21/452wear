import { fail, json, requireUser } from "@/lib/server/api";
import {
  addFavorite,
  isProductId,
  MAX_FAVORITES,
  removeFavorite,
} from "@/lib/server/favorites";

/** Tek favori: PUT ekler, DELETE çıkarır. İkisi de tekrarlanabilir (idempotent). */

type Context = { params: Promise<{ productId: string }> };

export async function PUT(request: Request, { params }: Context) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response;
  const { productId } = await params;
  if (!isProductId(productId)) return fail(400, "Ürün bulunamadı.");

  if ((await addFavorite(guard.userId, productId)) === "full") {
    return fail(409, `En fazla ${MAX_FAVORITES} ürünü favorine ekleyebilirsin.`);
  }
  return json({ ok: true });
}

export async function DELETE(request: Request, { params }: Context) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response;
  const { productId } = await params;
  if (!isProductId(productId)) return fail(400, "Ürün bulunamadı.");

  await removeFavorite(guard.userId, productId);
  return json({ ok: true });
}
