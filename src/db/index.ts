import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Veritabanı bağlantısı — sitenin kalıcı hafızasının ucu.
 *
 * Neon'un **HTTP** sürücüsü kullanılıyor, TCP havuzu değil: sayfalar
 * sunucusuz işlevlerde koşuyor ve her çağrı kendi ömrüne sahip. Havuz açmak
 * o dünyada bağlantı sızdırmanın en kısa yolu.
 *
 * ⚠️ **Bağlantı tembel kuruluyor.** Modül yüklenirken kurulsaydı
 * `DATABASE_URL` olmayan her ortam — derleme makinesi, statik sayfa üretimi,
 * sınamalar — bu dosyayı içeri alan her şeyi patlatırdı. 394 statik sayfanın
 * hiçbiri veritabanına dokunmuyor ve dokunmamalı; bağlantı yalnızca gerçekten
 * sorgu yapan istek anında doğuyor.
 */

let cached: ReturnType<typeof drizzle<typeof schema>> | null = null;

/** Adres tanımlı mı — uçlar buna bakıp 503 dönebiliyor. */
export function dbReady(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb() {
  if (cached) return cached;

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    /*
      Anlaşılır hata: kurulumu yapan kişi "undefined is not a function"
      görmemeli. Uçlar zaten `dbReady()` ile korunuyor; burası son kapı.
    */
    throw new Error('DATABASE_URL tanımlı değil — Neon bağlantısı kurulamıyor');
  }

  cached = drizzle(neon(url), { schema });
  return cached;
}

export { schema };
