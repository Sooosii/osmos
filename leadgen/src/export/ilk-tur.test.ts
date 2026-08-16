import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enGucluler, TUR_BOYU } from './ilk-tur.ts';
import type { Lead } from '../types.ts';

const l = (o: Partial<Lead>): Lead => ({
  id: 1, domain: 'x.com', shop_name: null, platform: 'shopify', email: null,
  instagram: null, country: null, product_count: 100, has_similar_feature: null,
  segment: 'butik-eticaret', olcek: 'kucuk', marka_ortusmesi: null, score: 50, durum: 'zenginlestirildi',
  source: 'google', notes: null, seed_url: null, ...o,
});

const bos = new Set<string>();

/*
  ⚠️ Siralama puana gore DEGIL. Oneri blogu OLMAYAN dukkanlara soylenecek
  somut bir eksik var ve cumle dogrulanabilir; blogu zaten olana ayni mektup
  gitmemeli. Bu yuzden hedefler daha dusuk puanli olsalar bile one geciyor.
*/
test('oneri blogu olmayanlar puanca dusuk olsa bile ONE geciyor', () => {
  const s = enGucluler([
    l({ domain: 'blogu-var.com', email: 'a@b.com', score: 90, has_similar_feature: true }),
    l({ domain: 'blogu-yok.com', email: 'a@b.com', score: 60, has_similar_feature: false }),
  ], 'mail', bos, 5);
  assert.equal(s[0]?.domain, 'blogu-yok.com');
});

test('esit hedeflilikte puan siralamayi belirliyor', () => {
  const s = enGucluler([
    l({ domain: 'dusuk.com', email: 'a@b.com', score: 40, has_similar_feature: false }),
    l({ domain: 'yuksek.com', email: 'a@b.com', score: 80, has_similar_feature: false }),
  ], 'mail', bos, 5);
  assert.equal(s[0]?.domain, 'yuksek.com');
});

test('kanal ayrimi tutuyor', () => {
  const veri = [
    l({ domain: 'dm.com', instagram: 'dm', country: 'TR' }),
    l({ domain: 'mail.com', email: 'a@b.com', country: 'US' }),
  ];
  assert.deepEqual(enGucluler(veri, 'dm', bos, 5).map((x) => x.domain), ['dm.com']);
  assert.deepEqual(enGucluler(veri, 'mail', bos, 5).map((x) => x.domain), ['mail.com']);
});

/* Ayni kisiye ikinci kez yazmak, hic yazmamaktan kotu. */
test('daha once temas kurulanlar ilk tura girmiyor', () => {
  const s = enGucluler([l({ domain: 'yazildi.com', email: 'a@b.com' })], 'mail', new Set(['yazildi.com']), 5);
  assert.equal(s.length, 0);
});

test('tur boyu asilmiyor', () => {
  const cok = Array.from({ length: 40 }, (_, i) => l({ domain: `d${i}.com`, email: 'a@b.com' }));
  assert.equal(enGucluler(cok, 'mail', bos, TUR_BOYU).length, TUR_BOYU);
});
