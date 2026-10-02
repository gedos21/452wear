import { fail, json, readJson, requireUser } from "@/lib/server/api";
import {
  clearFavorites,
  isProductId,
  listFavorites,
  MAX_FAVORITES,
  mergeFavorites,
} from "@/lib/server/favorites";

/**
 * Favorilerim (giriş yapmış kullanıcı).
 * GET: liste · POST { ids }: tarayıcıdaki favorileri hesaba kat · DELETE: hepsini sil.
 */

export async function GET(request: Request) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response;
  return json({ ids: await listFavorites(guard.userId) });
}

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response;

  const body = (await readJson(request, 64_000)) as { ids?: unknown } | null;
  if (!body || !Array.isArray(body.ids) || body.ids.length > MAX_FAVORITES) {
    return fail(400, "Favori listesi okunamadı.");
  }
  // Biçimi bozuk kimlikler sessizce atlanır; geçerli olanlar yine katılır.
  const ids = body.ids.filter(isProductId);
  return json({ ids: await mergeFavorites(guard.userId, ids) });
}

export async function DELETE(request: Request) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response;
  await clearFavorites(guard.userId);
  return json({ ids: [] });
}
