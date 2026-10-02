import "server-only";
import { getAuth } from "./auth";

/**
 * Hesap API'leri (/api/hesap/*) için ortak yardımcılar. Her uç nokta kimliği
 * oturumdan alır; istemcinin gönderdiği kullanıcı kimliğine asla bakılmaz.
 */

export function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function fail(status: number, message: string, field?: string) {
  return json(field ? { error: message, field } : { error: message }, status);
}

export const UNAUTHORIZED = "Oturumun kapanmış görünüyor. Lütfen tekrar giriş yap.";

/**
 * Değiştiren isteklerde (POST/PUT/PATCH/DELETE) `Origin`, sitenin kendi
 * adresiyle aynı olmalı. Oturum çerezi SameSite=Lax olsa da aynı site altındaki
 * başka bir alt alan adından gelen isteğe karşı ikinci bir kilit (server
 * action'larda Next.js'in yaptığı kontrolün aynısı).
 */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type Guard =
  | { ok: true; userId: string }
  | { ok: false; response: Response };

/** Oturumu doğrular; değiştiren isteklerde kaynağı da kontrol eder. */
export async function requireUser(request: Request): Promise<Guard> {
  if (request.method !== "GET" && request.method !== "HEAD" && !isSameOrigin(request)) {
    return { ok: false, response: fail(403, "İstek reddedildi.") };
  }
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return { ok: false, response: fail(401, UNAUTHORIZED) };
  return { ok: true, userId: session.user.id };
}

/** Gövdeyi JSON olarak okur; bozuk ya da çok büyükse null. */
export async function readJson(request: Request, maxBytes = 16_384): Promise<unknown> {
  try {
    const text = await request.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}
