import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Neon Postgres bağlantısı. HTTP sürücüsü kullanılır: kalıcı TCP bağlantısı
 * açmaz, bu yüzden hem Vercel fonksiyonlarında hem Cloudflare Workers'ta
 * aynı kodla çalışır.
 *
 * Bağlantı ilk kullanımda kurulur; `DATABASE_URL` olmadan derleme (build)
 * yine geçer, yalnızca veritabanına giden istek hata verir.
 */

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil (.env.local).");
  return drizzle({ client: neon(url), schema });
}

let cached: ReturnType<typeof createDb> | undefined;

export function getDb() {
  cached ??= createDb();
  return cached;
}

export { schema };
