import { test } from 'node:test';
import assert from 'node:assert/strict';
import { segmentCikar, ulkeCikar } from './infer.ts';

const decantAdlari = [
  'Baccarat Rouge 540 Sample Decant', 'Oud Ispahan 5ml Decant', 'Aventus Decant 10ml',
  'Layton Sample', 'Tobacco Vanille Decant', 'Discovery Set', 'Bottle', 'Candle',
];

test('decant izleri segmenti belirliyor', () => {
  assert.equal(segmentCikar(decantAdlari, 400, 'shopify'), 'decant');
});

test('az urunlu katalog nis parfum evi', () => {
  assert.equal(segmentCikar(['Musk', 'Amber', 'Rose'], 12, 'shopify'), 'nis-parfum-evi');
});

test('cok urunlu magaza butik e-ticaret', () => {
  assert.equal(segmentCikar(['Musk', 'Amber'], 300, 'shopify'), 'butik-eticaret');
});

/*
  Olculemeyen alan uydurulmuyor: urun sayisi yoksa segment de yok.
*/
test('urun sayisi yoksa segment bilinmiyor', () => {
  assert.equal(segmentCikar([], null, 'diger'), 'bilinmiyor');
});

test('ulke yalniz ulke kodlu uzantidan cikiyor', () => {
  assert.equal(ulkeCikar('parfum.com.tr'), 'TR');
  assert.equal(ulkeCikar('duft.de'), 'DE');
  assert.equal(ulkeCikar('scent.ae'), 'AE');
});

test('com uzantisi ABD varsayilmiyor', () => {
  assert.equal(ulkeCikar('luckyscent.com'), null);
  assert.equal(ulkeCikar('scentsplit.com'), null);
});
