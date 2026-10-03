/**
 * Derlemeden önce veritabanını hazırlar (package.json "build"):
 *   1. Bekleyen tablo göçlerini (drizzle/) uygular.
 *   2. Ürün tablosu BOŞSA kataloğu data/katalog-aktarim.json'dan aktarır.
 *
 * İkisi de tekrar çalıştırılınca zararsızdır: uygulanmış göç atlanır, dolu
 * katalog ellenmez. DATABASE_URL yoksa (ör. önizleme derlemesi) hiçbir şey
 * yapmaz. Lokalde elle: `npm run db:hazirla`.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[db-hazirla] DATABASE_URL yok, atlandı.");
  process.exit(0);
}

const sql = neon(url);
await migrate(drizzle({ client: sql }), { migrationsFolder: "drizzle" });
console.log("[db-hazirla] Tablo göçleri tamam.");

const [{ n }] = await sql`select count(*)::int as n from product`;
if (n > 0) {
  console.log(`[db-hazirla] Katalog dolu (${n} ürün), aktarım atlandı.`);
  process.exit(0);
}

const { urunler, yonlendirmeler } = JSON.parse(
  readFileSync(new URL("../data/katalog-aktarim.json", import.meta.url), "utf8"),
);

const simdi = Date.now();
const sorgular = [];
for (const p of urunler) {
  sorgular.push(sql`
    insert into product (id, slug, name, description, category, brand, model, fit,
      price, compare_at_price, currency, images, colors, is_new,
      complementary_ids, related_ids, durum, sira, tohum, cope_atildi)
    values (${p.id}, ${p.slug}, ${p.name}, ${p.description}, ${p.category},
      ${p.brand ?? null}, ${p.model ?? null}, ${p.fit ?? null},
      ${p.price}, ${p.compareAtPrice ?? null}, ${p.currency ?? "TRY"},
      ${JSON.stringify(p.images)}::jsonb, ${JSON.stringify(p.colors)}::jsonb, ${Boolean(p.isNew)},
      ${p.complementaryIds ? JSON.stringify(p.complementaryIds) : null}::jsonb,
      ${p.relatedIds ? JSON.stringify(p.relatedIds) : null}::jsonb,
      ${p.durum}, ${p.sira}, ${p.tohum},
      ${p.durum === "cop" ? new Date(simdi + (p.copSira ?? 0) * 1000) : null})`);
  p.variants.forEach((v, i) => {
    sorgular.push(sql`
      insert into product_variant (id, product_id, size, color, stock, sira)
      values (${v.id}, ${p.id}, ${v.size}, ${v.color}, ${Math.max(0, v.stock)}, ${i})`);
  });
}
for (const [slug, productId] of Object.entries(yonlendirmeler)) {
  sorgular.push(sql`
    insert into product_redirect (slug, product_id) values (${slug}, ${productId})`);
}

// Tek işlem: yarıda kalırsa hiçbir satır yazılmaz, sonraki derleme yeniden dener.
await sql.transaction(sorgular);
console.log(
  `[db-hazirla] Katalog aktarıldı: ${urunler.length} ürün, ${Object.keys(yonlendirmeler).length} yönlendirme.`,
);
