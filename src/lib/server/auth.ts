import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { getDb, schema } from "./db";
import { resetPasswordEmail, sendEmail } from "./email";
import { validateProfile } from "@/lib/profile";

/**
 * Kimlik doğrulama (Better Auth). Kullanıcılar, oturumlar ve giriş yöntemleri
 * kendi Neon veritabanımızda tutulur; dışarıda bir kullanıcı havuzu yok.
 *
 * Ortam değişkenleri (.env.example):
 * - DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
 * - GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET → yoksa Google ile giriş kapalı
 * - RESEND_API_KEY + EMAIL_FROM → şifre sıfırlama e-postası (bkz. email.ts)
 */

export function isGoogleEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function siteUrl() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  // Vercel önizleme dağıtımları: her birinin adresi farklı.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return undefined;
}

/**
 * Şifresi olmayan (yalnızca Google) hesabın silinebilmesi için oturumun en çok
 * bu kadar yeni olması gerekir: Google ile yeniden giriş = yeniden doğrulama.
 */
const DELETE_REAUTH_WINDOW_MS = 15 * 60 * 1000;

/**
 * Better Auth uç noktalarından önce çalışan kontroller.
 *
 * - `/update-user`: yalnızca ad/soyad değişir; `name` her zaman "ad soyad"
 *   olarak sunucuda kurulur, e-posta/görsel gibi alanlar reddedilir.
 * - `/delete-user`: şifresi olan hesapta şifre ZORUNLU (Better Auth tek başına
 *   24 saatlik "taze oturum" ile şifresiz silmeye izin veriyor). Yalnızca
 *   Google ile giren hesapta oturum son 15 dakikada açılmış olmalı.
 */
const beforeHooks = createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/update-user") {
    const body = (ctx.body ?? {}) as Record<string, unknown>;
    const extra = Object.keys(body).filter(
      (key) => !["firstName", "lastName", "name"].includes(key),
    );
    if (extra.length > 0) {
      throw new APIError("BAD_REQUEST", {
        code: "FIELD_NOT_ALLOWED",
        message: "Yalnızca ad ve soyad güncellenebilir.",
      });
    }
    const profile = validateProfile(body);
    if (!profile.ok) {
      throw new APIError("BAD_REQUEST", { code: "INVALID_PROFILE", message: profile.message });
    }
    const { firstName, lastName, name } = profile;
    return { context: { body: { firstName, lastName, name } } };
  }

  if (ctx.path === "/delete-user") {
    const session = await getSessionFromCtx(ctx);
    if (!session) return; // Uç nokta kendisi 401 döner.
    const accounts = await ctx.context.internalAdapter.findAccounts(session.user.id);
    const hasPassword = accounts.some((a) => a.providerId === "credential" && a.password);
    const body = (ctx.body ?? {}) as { password?: unknown; token?: unknown };

    if (body.token !== undefined) {
      throw new APIError("BAD_REQUEST", { code: "FIELD_NOT_ALLOWED", message: "Geçersiz istek." });
    }
    if (hasPassword) {
      if (typeof body.password !== "string" || body.password.length === 0) {
        throw new APIError("BAD_REQUEST", {
          code: "PASSWORD_REQUIRED",
          message: "Hesabını silmek için şifreni gir.",
        });
      }
    } else {
      const age = Date.now() - new Date(session.session.createdAt).getTime();
      if (age > DELETE_REAUTH_WINDOW_MS) {
        throw new APIError("BAD_REQUEST", {
          code: "SESSION_EXPIRED",
          message: "Güvenliğin için yeniden giriş yapman gerekiyor.",
        });
      }
    }
  }
});

function createAuth() {
  return betterAuth({
    appName: "452WEAR",
    baseURL: siteUrl(),
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        rateLimit: schema.rateLimit,
      },
    }),

    user: {
      additionalFields: {
        firstName: { type: "string", required: false, defaultValue: "", input: true },
        lastName: { type: "string", required: false, defaultValue: "", input: true },
      },
      // KVKK: kullanıcı hesabını kendisi silebilir. Adresler ve favoriler
      // veritabanında ON DELETE CASCADE ile birlikte silinir.
      deleteUser: { enabled: true },
    },

    hooks: { before: beforeHooks },

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      // E-posta doğrulaması, kendi alan adımız ve e-posta servisi
      // bağlandığında açılacak. Doğrulanmamış hesaplar Google hesabıyla
      // otomatik birleştirilmez (requireLocalEmailVerified varsayılanı).
      requireEmailVerification: false,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        const firstName = (user as { firstName?: string }).firstName ?? "";
        await sendEmail({ to: user.email, ...resetPasswordEmail(firstName, url) });
      },
    },

    socialProviders: isGoogleEnabled()
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            prompt: "select_account",
            mapProfileToUser: (profile) => ({
              firstName: profile.given_name ?? "",
              lastName: profile.family_name ?? "",
            }),
          },
        }
      : undefined,

    account: {
      accountLinking: { enabled: true, trustedProviders: ["google"] },
    },

    // Oturum çerez önbelleği (cookieCache) bilerek kapalı: açıkken şifre
    // sıfırlama ya da çıkış sonrası eski oturum 5 dk geçerli görünmeye
    // devam ediyordu.

    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "rateLimit",
      // Hesap silmede şifre denemesi: kaba kuvvete karşı dakikada 5.
      customRules: { "/delete-user": { window: 60, max: 5 } },
    },

    advanced: {
      cookiePrefix: "452wear",
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

let cached: Auth | undefined;

/** İlk istekte kurulur; derleme sırasında ortam değişkeni gerekmez. */
export function getAuth(): Auth {
  cached ??= createAuth();
  return cached;
}
