import { readdirSync, readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

/**
 * Göçleri uygular — `npx tsx scripts/db-migrate.ts`.
 *
 * `drizzle-kit migrate` yerine kendi betiğimiz var ve sebebi Neon'un HTTP
 * sürücüsü: tek istekte çok ifadeli SQL kabul etmiyor, o yüzden dosya
 * `--> statement-breakpoint` işaretinden bölünüp ifade ifade gönderiliyor.
 * Aynı bölme sınamalarda da yapılıyor (`auth.test.ts`), yani üretimle
 * sınama aynı DDL'i aynı biçimde koşuyor.
 *
 * ⚠️ Bu betik **elle** çalıştırılıyor, derlemede değil. Göç, uygulamanın
 * başlangıcına bağlansaydı her soğuk başlatma veritabanına şema sorgusu
 * atardı ve bir gün yarım kalmış bir göç siteyi kapatırdı.
 *
 * Yeniden çalıştırmak güvenli değil (CREATE TABLE ikinci kez patlar);
 * `--ignore-existing` ile var olanlar atlanıyor.
 */
const ignoreExisting = process.argv.includes('--ignore-existing');

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error('DATABASE_URL tanımlı değil');

  const sql = neon(url);
  const files = readdirSync('drizzle')
    .filter((name) => name.endsWith('.sql'))
    .sort();

  if (files.length === 0) throw new Error('drizzle/ altında göç dosyası yok');

  for (const file of files) {
    const statements = readFileSync(`drizzle/${file}`, 'utf8')
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter(Boolean);

    let applied = 0;
    let skipped = 0;

    for (const statement of statements) {
      try {
        await sql.query(statement);
        applied += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (ignoreExisting && /already exists/i.test(message)) {
          skipped += 1;
          continue;
        }
        throw new Error(`${file}: ${message}`);
      }
    }

    console.log(`${file}: ${applied} ifade uygulandı${skipped ? `, ${skipped} atlandı` : ''}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
