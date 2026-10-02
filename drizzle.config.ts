import { defineConfig } from "drizzle-kit";

/** Veritabanı göçleri: `npm run db:generate` → drizzle/, `npm run db:migrate`. */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
