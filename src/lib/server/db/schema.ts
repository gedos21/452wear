import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Veritabanı şeması. İlk dört tablo Better Auth'un beklediği yapıdır
 * (alan adları onun modeline göre); kolonlar snake_case.
 *
 * Değişiklikten sonra: `npm run db:generate` (SQL göçü üretir) ve
 * `npm run db:migrate` (veritabanına uygular).
 */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

/** Giriş yöntemleri: e-posta/şifre ("credential") ve Google ("google"). */
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

/** Şifre sıfırlama gibi tek kullanımlık kodlar. */
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/**
 * Deneme sınırı (kaba kuvvet koruması). Bellekte değil veritabanında tutulur;
 * sunucusuz ortamda her istek ayrı örneğe düşebildiği için bellek yetmez.
 */
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/**
 * Kayıtlı teslimat adresleri ("Adreslerim"). Kullanıcı silinince adresleri de
 * silinir. Kullanıcı başına en fazla bir varsayılan adres olur; bunu
 * uygulama korur (bkz. lib/server/addresses.ts) — kısmi tekil indeks, tek
 * UPDATE ile varsayılanı taşırken satır satır kontrol edildiği için kullanılmadı.
 */
export const address = pgTable(
  "address",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Kullanıcının verdiği kısa ad: "Ev", "İş"… */
    title: text("title").notNull(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    /** İl */
    city: text("city").notNull(),
    /** İlçe */
    district: text("district").notNull(),
    addressLine: text("address_line").notNull(),
    postalCode: text("postal_code"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("address_user_id_idx").on(t.userId)],
);

/** Giriş yapmış kullanıcının favorileri. Ürün kimliği katalogdaki `id`. */
export const favorite = pgTable(
  "favorite",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

/**
 * E-posta bülteni aboneleri. Hesaptan bağımsızdır (giriş yapmadan da abone
 * olunur). Açık rıza anı ve o an gösterilen metnin sürümü saklanır; abonelikten
 * çıkışta satır silinmez, `unsubscribed_at` dolar (rızanın geri alındığının kaydı).
 */
export const newsletterSubscriber = pgTable(
  "newsletter_subscriber",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    consentAt: timestamp("consent_at").notNull(),
    consentTextVersion: text("consent_text_version").notNull(),
    /** Formun bulunduğu yer, ör. "ana-sayfa". */
    source: text("source").notNull(),
    unsubscribedAt: timestamp("unsubscribed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [check("newsletter_subscriber_email_lower", sql`${t.email} = lower(${t.email})`)],
);
