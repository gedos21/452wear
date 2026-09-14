"use client";

/**
 * Kimlik doğrulama ARAYÜZÜ — henüz bir sağlayıcıya bağlı değil.
 *
 * Burada bilerek sahte bir oturum yok: `status` her zaman "signed-out" döner
 * ve eylemler `{ ok: false, reason: "not-connected" }` ile geri gelir. Arayüz
 * bu sonucu kullanıcıya dürüstçe gösterir; uydurma "giriş yapıldı" mesajı
 * üretmez.
 *
 * Supabase / Clerk / Auth.js bağlanırken YALNIZCA bu dosya değişecek:
 * `useAuth()` gerçek oturumu döndürdüğünde tüketen bileşenler aynı kalır.
 */

export type AuthStatus = "loading" | "signed-out" | "signed-in";

export type AuthUser = {
  firstName: string;
  lastName: string;
  email: string;
};

export type AuthResult =
  | { ok: true }
  | { ok: false; reason: "not-connected"; message: string };

const NOT_CONNECTED: AuthResult = {
  ok: false,
  reason: "not-connected",
  message: "Kimlik doğrulama altyapısı henüz bağlı değil.",
};

export type SignInInput = { email: string; password: string };

export type SignUpInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type AuthApi = {
  status: AuthStatus;
  user: AuthUser | null;
  signIn: (input: SignInInput) => Promise<AuthResult>;
  signUp: (input: SignUpInput) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
};

export function useAuth(): AuthApi {
  return {
    status: "signed-out",
    user: null,
    signIn: async () => NOT_CONNECTED,
    signUp: async () => NOT_CONNECTED,
    signOut: async () => NOT_CONNECTED,
    requestPasswordReset: async () => NOT_CONNECTED,
  };
}
