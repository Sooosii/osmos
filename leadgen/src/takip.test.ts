import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { DatabaseSync } from 'node:sqlite';
import { tumLeadler, upsertLead } from './db.ts';
import { geciciVeritabani } from './sinama-db.ts';
import { gecenGun, takipAdaylari, takipMetni } from './takip.ts';

/**
 * Takip listesinin kapısı.
 *
 * ⚠️ **Sınamanın ağırlığı "kimi listeliyor"da değil, "kimi listelemiyor"da.**
 * Yanlış bir takip, hiç takip etmemekten pahalı: sıcak bir konuşmanın üstüne
 * soğuk hatırlatma göndermek ya da aynı kişiye ikinci kez yazmak, hesabın
 * kendisini riske atıyor — ve o hesap 396 hedefin tek kapısı.
 *
 * Tarihler elle yazılıyor (`ekleTemas` her zaman "şimdi" damgalıyor); yaş
 * süzgeci ancak böyle sınanabilir.
 */

/** Deftere belirli tarihli bir satır — yaş süzgecini sınayabilmek için. */
function temasYaz(
  db: DatabaseSync,
  domain: string,
  sonuc: string,
  gunOnce: number,
  kanal = 'dm',
): void {
  const tarih = new Date(SIMDI.getTime() - gunOnce * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO temas (domain, kanal, sonuc, not_, tarih) VALUES (?,?,?,?,?)')
    .run(domain, kanal, sonuc, null, tarih);
}

const SIMDI = new Date('2026-08-26T12:00:00Z');

function hazirla(): DatabaseSync {
  const db = geciciVeritabani();
  upsertLead(db, { domain: 'de-shop.com', source: 'k', country: 'DE', instagram: 'deshop' });
  upsertLead(db, { domain: 'tr-shop.com', source: 'k', country: 'TR', instagram: 'trshop' });
  upsertLead(db, { domain: 'us-shop.com', source: 'k', country: 'US', email: 'a@us-shop.com' });
  return db;
}

test('7 gundur cevapsiz olan listede', () => {
  const db = hazirla();
  temasYaz(db, 'de-shop.com', 'gonderildi', 8);
  const adaylar = takipAdaylari(db, tumLeadler(db), SIMDI);
  assert.equal(adaylar.length, 1);
  assert.equal(adaylar[0]?.domain, 'de-shop.com');
  assert.equal(adaylar[0]?.gecenGun, 8);
  assert.equal(adaylar[0]?.dil, 'de');
  db.close();
});

test('7 gun DOLMAMIS olan listede DEGIL', () => {
  const db = hazirla();
  temasYaz(db, 'de-shop.com', 'gonderildi', 3);
  assert.equal(takipAdaylari(db, tumLeadler(db), SIMDI).length, 0);
  db.close();
});

test('cevap gelen listede DEGIL — sicak konusmaya soguk hatirlatma gitmez', () => {
  const db = hazirla();
  temasYaz(db, 'de-shop.com', 'gonderildi', 10);
  temasYaz(db, 'de-shop.com', 'cevap', 9);
  assert.equal(takipAdaylari(db, tumLeadler(db), SIMDI).length, 0);
  db.close();
});

test('red ve elendi de listeyi kapatiyor', () => {
  const db = hazirla();
  temasYaz(db, 'de-shop.com', 'gonderildi', 10);
  temasYaz(db, 'de-shop.com', 'red', 9);
  temasYaz(db, 'tr-shop.com', 'gonderildi', 10);
  temasYaz(db, 'tr-shop.com', 'elendi', 9);
  assert.equal(takipAdaylari(db, tumLeadler(db), SIMDI).length, 0);
  db.close();
});

test('IKI HATIRLATMA YOK — hatirlatma deftere yazilinca dukkan listeden dusuyor', () => {
  const db = hazirla();
  temasYaz(db, 'de-shop.com', 'gonderildi', 20);
  assert.equal(takipAdaylari(db, tumLeadler(db), SIMDI).length, 1, 'ilk hatirlatma hakki var');

  /* Hatırlatma gönderildi ve deftere işlendi. */
  temasYaz(db, 'de-shop.com', 'gonderildi', 10);
  assert.equal(takipAdaylari(db, tumLeadler(db), SIMDI).length, 0, 'ikinci hatirlatma yok');
  db.close();
});

test('otomatik yanit takip hakkini YAKMIYOR — insan mesaji hic gormedi', () => {
  const db = hazirla();
  temasYaz(db, 'de-shop.com', 'gonderildi', 10);
  temasYaz(db, 'de-shop.com', 'otomatik', 10);
  const adaylar = takipAdaylari(db, tumLeadler(db), SIMDI);
  assert.equal(adaylar.length, 1);
  assert.equal(adaylar[0]?.domain, 'de-shop.com');
  db.close();
});

test('en eski en ustte — bekleyen once', () => {
  const db = hazirla();
  temasYaz(db, 'de-shop.com', 'gonderildi', 8);
  temasYaz(db, 'tr-shop.com', 'gonderildi', 30);
  temasYaz(db, 'us-shop.com', 'gonderildi', 15, 'mail');
  const sirali = takipAdaylari(db, tumLeadler(db), SIMDI).map((a) => a.domain);
  assert.deepEqual(sirali, ['tr-shop.com', 'us-shop.com', 'de-shop.com']);
  db.close();
});

test('kanal ve dil defterden/leadden okunuyor, tahmin edilmiyor', () => {
  const db = hazirla();
  temasYaz(db, 'us-shop.com', 'gonderildi', 9, 'mail');
  const aday = takipAdaylari(db, tumLeadler(db), SIMDI)[0];
  assert.equal(aday?.kanal, 'mail');
  assert.equal(aday?.email, 'a@us-shop.com');
  assert.equal(aday?.dil, 'en');
  db.close();
});

test('hic temas yoksa liste bos', () => {
  const db = hazirla();
  assert.equal(takipAdaylari(db, tumLeadler(db), SIMDI).length, 0);
  db.close();
});

test('gecen gun tam gun sayiyor', () => {
  assert.equal(gecenGun('2026-08-18T22:07:00Z', new Date('2026-08-26T12:00:00Z')), 7);
  assert.equal(gecenGun('2026-08-19T09:43:00Z', new Date('2026-08-26T12:00:00Z')), 7);
  assert.equal(gecenGun('2026-08-26T00:00:00Z', new Date('2026-08-26T12:00:00Z')), 0);
});

test('hatirlatma TEK CUMLE ve satis yapmiyor', () => {
  for (const dil of ['tr', 'en', 'de'] as const) {
    const metin = takipMetni(dil);
    /* Fiyat, bağlantı, özellik listesi yok — ikinci mesajın işi konuşmayı açmak. */
    assert.ok(!metin.includes('€'), `${dil}: fiyat gecmemeli`);
    assert.ok(!metin.includes('http'), `${dil}: baglanti gecmemeli`);
    assert.ok(metin.length < 130, `${dil}: tek cumle olmali`);
  }
});
