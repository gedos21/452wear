import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb, schema } from "./db";
import { resetPasswordEmail, sendEmail } from "./email";

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
    },

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
