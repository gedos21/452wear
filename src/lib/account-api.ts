"use client";

/**
 * Hesap API'si (/api/hesap/*) için küçük istemci. Sunucu hata mesajlarını
 * zaten Türkçe döner; bağlantı hatası burada Türkçeye çevrilir.
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; field?: string };

const NETWORK = "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.";
const GENERIC = "Bir şeyler ters gitti. Lütfen tekrar dene.";

export async function accountApi<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(`/api/hesap${path}`, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, message: NETWORK };
  }

  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string; field?: string })
    | null;
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: payload?.error ?? GENERIC,
      field: payload?.field,
    };
  }
  return { ok: true, data: payload as T };
}
