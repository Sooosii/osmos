import type { Config } from 'drizzle-kit';

/**
 * Göç üretimi — `npx drizzle-kit generate`.
 *
 * Üretilen SQL iki yerde çalışıyor ve bu bilinçli: yayında **Neon**,
 * sınamalarda **PGlite** (Postgres'in WASM sürümü). Aynı DDL ikisinde de
 * koştuğu için sınamalar gerçek bir Postgres'e karşı dönüyor — şema
 * taklidi değil.
 *
 * ⚠️ `dbCredentials` yalnızca `drizzle-kit push`/`studio` için gerekiyor;
 * biz göçü dosyaya üretip elle uyguluyoruz, o yüzden adres burada
 * isteğe bağlı.
 */
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
} satisfies Config;
