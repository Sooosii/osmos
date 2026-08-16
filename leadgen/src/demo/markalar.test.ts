import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { markaAnahtari, ortusmeHesapla, osmosMarkalari } from './markalar.ts';

const KATALOG = join(import.meta.dirname, '..', '..', '..', 'src', 'data', 'perfume-sets');
const BIZIMKILER = osmosMarkalari(KATALOG);

test('katalogdan gercek marka listesi cikiyor', () => {
  assert.ok(BIZIMKILER.size >= 80, `az marka: ${BIZIMKILER.size}`);
});

/*
  Duz esitlik yetmiyor: ayni ev "Orto Parisi", "ORTO PARISI" ve "Orto-Parisi"
  diye yaziliyor. Esleseme yanlis olursa demo bos cikar.
*/
test('yazim farklari ayni anahtara iniyor', () => {
  assert.equal(markaAnahtari('Orto Parisi'), markaAnahtari('ORTO-PARISI'));
  assert.equal(markaAnahtari('Orto Parisi'), markaAnahtari('orto  parisi'));
});

test('Parfums oneki markayi bolmuyor', () => {
  assert.equal(markaAnahtari('Parfums Dusita'), markaAnahtari('Dusita'));
});

test('ortusme gercek markalari buluyor', () => {
  const o = ortusmeHesapla(['Orto Parisi', 'Nasomatto', 'Bilinmeyen Ev'], BIZIMKILER);
  assert.equal(o.sayi, 2);
  assert.equal(o.hedefMarkaSayisi, 3);
});

test('ayni marka iki kez sayilmiyor', () => {
  const o = ortusmeHesapla(['Nasomatto', 'NASOMATTO', 'Nasomatto '], BIZIMKILER);
  assert.equal(o.sayi, 1);
  assert.equal(o.hedefMarkaSayisi, 1);
});

/*
  ⚠️ Bos liste "olculdu, yok" demek; hic olculememis hedef icin cagiran
  taraf `null` yazmali. Puanlama bu ayrimi goziyor.
*/
test('ortak marka yoksa sifir donuyor, patlamiyor', () => {
  const o = ortusmeHesapla(['Hic Duyulmamis Ev'], BIZIMKILER);
  assert.equal(o.sayi, 0);
  assert.deepEqual([...o.ortak], []);
});

test('bos girdi patlamiyor', () => {
  assert.equal(ortusmeHesapla([], BIZIMKILER).sayi, 0);
  assert.equal(ortusmeHesapla(['', '   '], BIZIMKILER).hedefMarkaSayisi, 0);
});
