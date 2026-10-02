"use client";

import { authClient } from "@/lib/auth-client";

/**
 * Kimlik doğrulama arayüzü. Bileşenler Better Auth'u doğrudan değil bu
 * kancayı kullanır; hata mesajları burada Türkçeye çevrilir.
 */

export type AuthStatus = "loading" | "signed-out" | "signed-in";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type AuthResult =
  | { ok: true }
  | { ok: false; message: string; /** Better Auth hata kodu (varsa). */ code?: string };

/** Hesaba bağlı giriş yöntemleri. */
export type SignInMethods = { google: boolean; password: boolean };

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
  /** `callbackURL`: Google dönüşünde gidilecek sayfa (varsayılan /hesap). */
  signInWithGoogle: (callbackURL?: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  resetPassword: (token: string, newPassword: string) => Promise<AuthResult>;
  updateProfile: (input: { firstName: string; lastName: string }) => Promise<AuthResult>;
  listSignInMethods: () => Promise<
    ({ ok: true } & SignInMethods) | { ok: false; message: string }
  >;
  /** Şifreli hesapta `password` zorunlu; yalnızca Google'lı hesapta taze oturum gerekir. */
  deleteAccount: (password?: string) => Promise<AuthResult>;
};

/** Giriş sonrası ve Google dönüşünde gidilen sayfa. */
const ACCOUNT_PATH = "/hesap";
const RESET_PATH = "/hesap/sifre-yenile";

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-posta ya da şifre hatalı.",
  INVALID_EMAIL: "Geçerli bir e-posta adresi gir.",
  INVALID_PASSWORD: "Şifre hatalı.",
  USER_ALREADY_EXISTS: "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.",
  PASSWORD_TOO_SHORT: "Şifre en az 8 karakter olmalı.",
  PASSWORD_TOO_LONG: "Şifre çok uzun.",
  INVALID_TOKEN:
    "Şifre sıfırlama bağlantısı geçersiz ya da süresi dolmuş. Yeni bir bağlantı iste.",
  RESET_PASSWORD_DISABLED: "Şifre sıfırlama şu anda kullanılamıyor.",
  PASSWORD_REQUIRED: "Hesabını silmek için şifreni gir.",
  SESSION_EXPIRED: "Güvenliğin için yeniden giriş yapman gerekiyor.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Bu hesapta şifre tanımlı değil.",
  UNAUTHORIZED: "Oturumun kapanmış görünüyor. Lütfen tekrar giriş yap.",
};

/** Sunucumuzun (lib/server/auth.ts) zaten Türkçe mesajla döndüğü kodlar. */
const OWN_CODES = new Set(["INVALID_PROFILE", "FIELD_NOT_ALLOWED", "RESET_EMAIL_UNAVAILABLE"]);

const GENERIC = "Bir şeyler ters gitti. Lütfen tekrar dene.";
const NETWORK = "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.";

type ClientError = { code?: string; status?: number; message?: string } | null;

function toResult(error: ClientError): AuthResult {
  if (!error) return { ok: true };
  if (error.status === 429) {
    return { ok: false, message: "Çok fazla deneme yaptın. Biraz bekleyip tekrar dene." };
  }
  const code = error.code;
  const message =
    (code && MESSAGES[code]) ||
    (code && OWN_CODES.has(code) && error.message) ||
    GENERIC;
  return { ok: false, message, code };
}

async function run(call: () => Promise<{ error: ClientError }>): Promise<AuthResult> {
  try {
    const { error } = await call();
    return toResult(error);
  } catch {
    return { ok: false, message: NETWORK };
  }
}

/** Google dönüşünde adres çubuğuna gelen `?error=` kodunun Türkçesi. */
export function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  if (code === "account_not_linked") {
    return "Bu e-posta ile daha önce şifreyle hesap açılmış. Lütfen e-posta ve şifrenle giriş yap.";
  }
  if (code === "access_denied") return "Google ile giriş iptal edildi.";
  return "Google ile giriş tamamlanamadı. Lütfen tekrar dene.";
}

export function useAuth(): AuthApi {
  const { data, isPending } = authClient.useSession();

  const user: AuthUser | null = data
    ? {
        id: data.user.id,
        firstName: data.user.firstName || data.user.name,
        lastName: data.user.lastName ?? "",
        email: data.user.email,
      }
    : null;

  return {
    status: isPending ? "loading" : user ? "signed-in" : "signed-out",
    user,

    signIn: ({ email, password }) =>
      run(() => authClient.signIn.email({ email, password })),

    signUp: ({ firstName, lastName, email, password }) =>
      run(() =>
        authClient.signUp.email({
          email,
          password,
          name: `${firstName} ${lastName}`.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      ),

    // Başarılıysa tarayıcı Google'a yönlenir; bu sonuç yalnızca hata için.
    signInWithGoogle: (callbackURL = ACCOUNT_PATH) =>
      run(() =>
        authClient.signIn.social({
          provider: "google",
          callbackURL,
          errorCallbackURL: ACCOUNT_PATH,
        }),
      ),

    signOut: () => run(() => authClient.signOut()),

    requestPasswordReset: (email) =>
      run(() => authClient.requestPasswordReset({ email, redirectTo: RESET_PATH })),

    resetPassword: (token, newPassword) =>
      run(() => authClient.resetPassword({ token, newPassword })),

    // `name` sunucuda da "ad soyad" olarak yeniden kurulur (bkz. server/auth.ts).
    updateProfile: ({ firstName, lastName }) =>
      run(() =>
        authClient.updateUser({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
        }),
      ),

    listSignInMethods: async () => {
      try {
        const { data: accounts, error } = await authClient.listAccounts();
        if (error || !accounts) {
          const result = toResult(error ?? {});
          return { ok: false, message: result.ok ? GENERIC : result.message };
        }
        return {
          ok: true,
          google: accounts.some((a) => a.providerId === "google"),
          password: accounts.some((a) => a.providerId === "credential"),
        };
      } catch {
        return { ok: false, message: NETWORK };
      }
    },

    deleteAccount: (password) =>
      run(() => authClient.deleteUser(password ? { password } : {})),
  };
}
