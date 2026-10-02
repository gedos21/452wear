import { cleanText } from "./address";

/**
 * Ad / soyad kuralları. Hem form hem sunucu (Better Auth `/update-user`
 * öncesi kanca, bkz. lib/server/auth.ts) aynı fonksiyonu kullanır.
 */

const NAME_MAX = 50;

export type ProfileValidation =
  | { ok: true; firstName: string; lastName: string; name: string }
  | { ok: false; message: string };

export function validateProfile(raw: unknown): ProfileValidation {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const firstName = cleanText(input.firstName);
  const lastName = cleanText(input.lastName);

  if (!firstName) return { ok: false, message: "Adın boş olamaz." };
  if (!lastName) return { ok: false, message: "Soyadın boş olamaz." };
  if ([...firstName].length > NAME_MAX || [...lastName].length > NAME_MAX) {
    return { ok: false, message: `Ad ve soyad en fazla ${NAME_MAX} karakter olabilir.` };
  }
  return { ok: true, firstName, lastName, name: `${firstName} ${lastName}` };
}
