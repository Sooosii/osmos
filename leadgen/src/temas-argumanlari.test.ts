import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

/**
 * `temas` komutunun argüman kapısı.
 *
 * ⚠️ **Gerçek bir olaydan doğdu (2026-08-18, ilk gerçek mesaj gönderilirken).**
 * Komut argümanları elle okuyordu ve bir kaydırma yapıyordu:
 *
 *     node src/cli.ts temas nischengold.com gonderildi
 *     → deftere domain="temas", sonuc="nischengold.com" yazıldı
 *
 * Hata vermedi, hatta makul görünen bir satır bastı: `[temas] temas →
 * nischengold.com (dm)`. Yani ilk gerçek temas **kaydedilmemişti** ve defterin
 * TEK işi olan tekrar koruması sessizce devre dışıydı. 233 kişilik liste bu
 * hatayla koşsaydı hiçbir temas doğru kaydedilmez, bu da ancak birine ikinci
 * kez yazınca — yani en pahalı yerde — anlaşılırdı.
 *
 * Kural: argümanlar `komutOku`nun `positionals`ından gelir. Tek ayrıştırma
 * yolu, tek kaydırma riski.
 */

/*
  ⚠️ `import.meta.dirname`, `__dirname` DEĞİL: paket `type: module` ve dosya
  `node --test` altında koşuyor — orada `__dirname` tanımsız.
*/
const CLI = resolve(import.meta.dirname, 'cli.ts');
const KOK = resolve(import.meta.dirname, '..');
const gecici = mkdtempSync(join(tmpdir(), 'leadgen-sinama-'));

/** Yorumları düşürür — aranan şey bir ANLATIM değil, gerçek bir okuma. */
function kodSadece(kaynak: string): string {
  const blok = new RegExp('/\\*[\\s\\S]*?\\*/', 'g');
  const satir = new RegExp('^\\s*//.*$', 'gm');
  return kaynak.replace(blok, '').replace(satir, '');
}

after(() => { rmSync(gecici, { recursive: true, force: true }); });

test('elle argv okumuyor — tek ayristirma yolu komutOku', () => {
  const kaynak = readFileSync(CLI, 'utf8');
  const dal = kaynak.slice(kaynak.indexOf("if (komut === 'temas')"));
  const govde = kodSadece(dal.slice(0, dal.indexOf("if (komut === 'enrich'")));

  /*
    ⚠️ Yorum ayıklama şart: bu dosyanın ve komutun kendi açıklaması hatayı
    anlatırken `argv`den söz ediyor. Sınama ilk yazıldığında tam da ona
    takıldı ve yeşil sanılan bir kapı kırmızı döndü.
  */
  assert.ok(!govde.includes('process.argv'), 'temas dali process.argv okuyor');
  assert.ok(govde.includes('argumanlar'), 'temas dali komutOku argumanlarini okumuyor');
});

/*
  Asıl kanıt: komut gerçekten çalıştırılıp ne bastığı okunuyor. Kaynak
  denetimi tek başına kaydırmayı yakalamazdı — eski kod da "argümanları
  okuyor" gibi görünüyordu.
*/
test('domain ve sonuc dogru sirada okunuyor', () => {
  const cikti = execFileSync(
    process.execPath,
    [CLI, 'temas', 'ornek-dukkan.test', 'gonderildi', 'sinama'],
    {
      cwd: KOK,
      encoding: 'utf8',
      /* Sınamanın defteri AYRI: canlı defter kirlenmesin (bkz. cli.ts LEADGEN_DB). */
      env: { ...process.env, LEADGEN_DB: join(gecici, 'sinama.db') },
    },
  );

  assert.ok(cikti.includes('ornek-dukkan.test → gonderildi'), `beklenmeyen cikti: ${cikti}`);
  assert.ok(!cikti.includes('temas → ornek-dukkan.test'), `argumanlar kaydi: ${cikti}`);
});
