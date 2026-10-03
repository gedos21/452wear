import "server-only";
import { headers } from "next/headers";
import { getAuth } from "./auth";

/**
 * Admin yetkisi. Admin, ADMIN_EMAILS (virgülle ayrılmış) listesindeki ve
 * e-postası doğrulanmış hesaptır. Doğrulama şartı önemli: e-posta/şifre ile
 * açılan hesaplar şimdilik doğrulanmıyor; böylece biri admin e-postasıyla
 * kayıt olsa bile admin olamaz (Google ile girişte e-posta doğrulanmış gelir).
 */
function adminListesi(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function adminOturumu() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;
  const { email, emailVerified } = session.user;
  if (!emailVerified || !adminListesi().includes(email.toLowerCase())) return null;
  return session;
}

export async function adminMi(): Promise<boolean> {
  return (await adminOturumu()) !== null;
}
