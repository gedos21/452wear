/**
 * Teslimat adresi: tip, sınırlar ve doğrulama. Hem form (anında geri bildirim)
 * hem sunucu (asıl kontrol) aynı kuralları kullanır; sunucu istemciye asla
 * güvenmez, kuralları kendisi yeniden uygular.
 */

export const MAX_ADDRESSES = 10;

export type Address = {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode: string | null;
  isDefault: boolean;
};

/** Formdan gelen ham değerler. */
export type AddressInput = {
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode: string;
  isDefault: boolean;
};

export type AddressField = Exclude<keyof AddressInput, "isDefault">;

export type AddressValidation =
  | { ok: true; value: Omit<Address, "id" | "postalCode"> & { postalCode: string | null } }
  | { ok: false; field: AddressField; message: string };

/** Alan → [en az, en çok, ad]. Uzunluklar Türkçe karakterle sayılır. */
const LIMITS: Record<Exclude<AddressField, "phone" | "postalCode">, [number, number, string]> = {
  title: [1, 30, "Adres başlığı"],
  fullName: [3, 80, "Ad soyad"],
  city: [2, 40, "İl"],
  district: [2, 40, "İlçe"],
  addressLine: [10, 250, "Adres"],
};

/** Kontrol karakterlerini atar, boşlukları teke indirir. */
export function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Türkiye telefon numarası. Yazım serbest (boşluk, tire, parantez, +90 ya da
 * 0 ile başlama); sonuçta 10 haneli, 2-5 ile başlayan bir numara kalmalı.
 * Kargo etiketinde okunaklı dursun diye "0532 123 45 67" biçimine çevrilir.
 */
export function normalizePhone(value: string): string | null {
  const digits = value.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;
  let national = digits.replace(/^\+/, "");
  if (national.length === 12 && national.startsWith("90")) national = national.slice(2);
  else if (national.length === 11 && national.startsWith("0")) national = national.slice(1);
  if (!/^[2-5]\d{9}$/.test(national)) return null;
  return `0${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6, 8)} ${national.slice(8)}`;
}

export function validateAddress(raw: unknown): AddressValidation {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const text: Partial<Record<AddressField, string>> = {};
  for (const field of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) {
    const value = cleanText(input[field]);
    const [min, max, label] = LIMITS[field];
    const length = [...value].length;
    if (length === 0) return { ok: false, field, message: `${label} boş olamaz.` };
    if (length < min) return { ok: false, field, message: `${label} en az ${min} karakter olmalı.` };
    if (length > max) return { ok: false, field, message: `${label} en fazla ${max} karakter olabilir.` };
    text[field] = value;
  }

  const phoneRaw = cleanText(input.phone);
  if (!phoneRaw) return { ok: false, field: "phone", message: "Telefon numarası boş olamaz." };
  const phone = phoneRaw.length <= 25 ? normalizePhone(phoneRaw) : null;
  if (!phone) {
    return {
      ok: false,
      field: "phone",
      message: "Telefon numarasını 0532 123 45 67 gibi, 10 haneli yaz.",
    };
  }

  const postalRaw = cleanText(input.postalCode);
  if (postalRaw && !/^\d{5}$/.test(postalRaw)) {
    return { ok: false, field: "postalCode", message: "Posta kodu 5 haneli olmalı (boş da bırakabilirsin)." };
  }

  return {
    ok: true,
    value: {
      title: text.title!,
      fullName: text.fullName!,
      phone,
      city: text.city!,
      district: text.district!,
      addressLine: text.addressLine!,
      postalCode: postalRaw || null,
      isDefault: input.isDefault === true,
    },
  };
}
