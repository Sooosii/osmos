import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { acVeritabani, tumLeadler, upsertLead } from './db.ts';
import { geciciVeritabani } from './sinama-db.ts';

/** Goc sinamasi dosyanin kendisini iki kez acmali; yol lazim, hazir db degil. */
function geciciDosya(): string {
  const klasor = join(import.meta.dirname, '..', 'data', 'sinama');
  mkdirSync(klasor, { recursive: true });
  return join(klasor, `goc-${process.pid}-${Math.random().toString(36).slice(2)}.db`);
}
import { puanla } from './score.ts';

test('alan adi benzersiz: ayni alan adi ikinci kez satir acmiyor', () => {
  const db = geciciVeritabani();
  upsertLead(db, { domain: 'a.com', source: 'katalog', shop_name: 'A' });
  upsertLead(db, { domain: 'a.com', source: 'google', email: 'info@a.com' });
  const hepsi = tumLeadler(db);
  assert.equal(hepsi.length, 1);
  assert.equal(hepsi[0]?.email, 'info@a.com');
  db.close();
});

/*
  Zenginlestirici bir turda e-postayi bulup digerinde bulamayabilir (site
  o an 503 verir). Duz SET olsaydi ikinci tur ilkinin bulduklarini SILERDI.
*/
test('ikinci tur birinci turun bulduklarini silmiyor', () => {
  const db = geciciVeritabani();
  upsertLead(db, { domain: 'a.com', source: 'k', email: 'info@a.com', instagram: 'a', product_count: 100 });
  upsertLead(db, { domain: 'a.com', source: 'k', email: null, instagram: null, product_count: null });
  const l = tumLeadler(db)[0];
  assert.equal(l?.email, 'info@a.com');
  assert.equal(l?.instagram, 'a');
  assert.equal(l?.product_count, 100);
  db.close();
});

/*
  ⚠️ Boru hattinin en sinsi hatasi buradaydi: SQLite `false` yerine 0
  donduruyor ve `0 === false` yanlis. Bu sinama olmadan "benzer urun yok"
  +20 puani sessizce hic verilmiyordu.
*/
test('has_similar_feature veritabanindan BOOLEAN olarak geri geliyor', () => {
  const db = geciciVeritabani();
  upsertLead(db, { domain: 'yok.com', source: 'k', has_similar_feature: false });
  upsertLead(db, { domain: 'var.com', source: 'k', has_similar_feature: true });
  upsertLead(db, { domain: 'bakilmadi.com', source: 'k', has_similar_feature: null });

  const m = new Map(tumLeadler(db).map((l) => [l.domain, l.has_similar_feature]));
  assert.equal(m.get('yok.com'), false, 'sifir, false olarak geri gelmeli');
  assert.equal(m.get('var.com'), true);
  assert.equal(m.get('bakilmadi.com'), null);
  db.close();
});

test('veritabanindan okunan satir dogru puanlaniyor', () => {
  const db = geciciVeritabani();
  upsertLead(db, {
    domain: 'hedef.com', source: 'k', email: 'info@hedef.com', platform: 'shopify',
    product_count: 47, has_similar_feature: false, instagram: 'hedef', marka_ortusmesi: 5,
  });
  const l = tumLeadler(db)[0];
  assert.equal(puanla(l!).toplam, 100, 'veritabani turu yuzunden puan dusmemeli');
  assert.equal(l?.marka_ortusmesi, 5, 'ortusme sayisi geri gelmeli');
  db.close();
});

/*
  ⚠️ `CREATE TABLE IF NOT EXISTS` var olan tabloya sutun EKLEMEZ. Goc olmadan
  yeni bir sutun eklendiginde eski veritabani "table leads has no column
  named …" diye patliyor ve tek cikis yolu dosyayi silip SAATLERCE suren
  taramayi bastan yapmak oluyor. Bu sinama o yolu kapatiyor.
*/
test('eski semali veritabanina yeni sutun EKLENIYOR, veri kaybolmuyor', () => {
  const yol = geciciDosya();

  // Eski surumu elle kur: olcek ve seed_url sutunlari YOK.
  const eski = new DatabaseSync(yol);
  eski.exec(`CREATE TABLE leads (
    id INTEGER PRIMARY KEY, domain TEXT NOT NULL UNIQUE, shop_name TEXT,
    platform TEXT NOT NULL DEFAULT 'bilinmiyor', email TEXT, instagram TEXT,
    country TEXT, product_count INTEGER, has_similar_feature INTEGER,
    segment TEXT NOT NULL DEFAULT 'bilinmiyor', score INTEGER NOT NULL DEFAULT 0,
    durum TEXT NOT NULL DEFAULT 'yeni', source TEXT NOT NULL, notes TEXT,
    updated_at TEXT NOT NULL)`);
  eski.prepare("INSERT INTO leads (domain, source, score, updated_at) VALUES ('eskikayit.com','katalog',42,'2026-01-01')").run();
  eski.close();

  // Yeni surum ayni dosyayi acinca goc calismali.
  const db = acVeritabani(yol);
  const sutunlar = new Set(
    (db.prepare('PRAGMA table_info(leads)').all() as unknown as { name: string }[]).map((r) => r.name),
  );
  assert.ok(sutunlar.has('olcek'), 'olcek sutunu eklenmeli');
  assert.ok(sutunlar.has('seed_url'), 'seed_url sutunu eklenmeli');

  const kayit = tumLeadler(db).find((l) => l.domain === 'eskikayit.com');
  assert.notEqual(kayit, undefined, 'eski kayit KAYBOLMAMALI');
  assert.equal(kayit?.score, 42, 'eski degerler korunmali');
  assert.equal(kayit?.olcek, 'bilinmiyor', 'yeni sutun varsayilanla dolmali');

  // Goc sonrasi yazma da calismali.
  upsertLead(db, { domain: 'eskikayit.com', source: 'katalog', olcek: 'kucuk' });
  assert.equal(tumLeadler(db).find((l) => l.domain === 'eskikayit.com')?.olcek, 'kucuk');
  db.close();
});

test('goc iki kez calisinca patlamiyor', () => {
  const yol = geciciDosya();
  acVeritabani(yol).close();
  const db = acVeritabani(yol);
  assert.ok(tumLeadler(db).length === 0);
  db.close();
});
