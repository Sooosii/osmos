import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AGIRLIK, puanla, type PuanGirdisi } from './score.ts';

const BOS: PuanGirdisi = {
  email: null, platform: 'bilinmiyor', product_count: null,
  has_similar_feature: null, instagram: null,
};

test('hicbir sinyal yoksa puan sifir', () => {
  assert.equal(puanla(BOS).toplam, 0);
});

test('e-posta 30 puan getiriyor', () => {
  assert.equal(puanla({ ...BOS, email: 'info@dukkan.com' }).toplam, AGIRLIK.eposta);
});

test('bos dize e-posta sayilmiyor', () => {
  assert.equal(puanla({ ...BOS, email: '' }).toplam, 0);
});

test('Shopify 20, WooCommerce 0 puan', () => {
  assert.equal(puanla({ ...BOS, platform: 'shopify' }).toplam, AGIRLIK.shopify);
  assert.equal(puanla({ ...BOS, platform: 'woocommerce' }).toplam, 0);
});

test('urun sayisi araligi uclarda da 20 puan, disinda 0', () => {
  assert.equal(puanla({ ...BOS, product_count: 30 }).toplam, AGIRLIK.urunAraligi);
  assert.equal(puanla({ ...BOS, product_count: 500 }).toplam, AGIRLIK.urunAraligi);
  assert.equal(puanla({ ...BOS, product_count: 29 }).toplam, 0);
  assert.equal(puanla({ ...BOS, product_count: 501 }).toplam, 0);
});

test('benzer urun ozelligi YOK ise 20, VAR ise 0', () => {
  assert.equal(puanla({ ...BOS, has_similar_feature: false }).toplam, AGIRLIK.benzerYok);
  assert.equal(puanla({ ...BOS, has_similar_feature: true }).toplam, 0);
});

/*
  Boru hattinin en kolay bozulacak yeri. `null` "bakilmadi" demek; ona
  puan verilirse ulasilamayan siteler listenin tepesine cikar ve sahip
  en degersiz adaylara mektup yazar.
*/
test('benzer urun BAKILMADI ise puan verilmiyor', () => {
  assert.equal(puanla({ ...BOS, has_similar_feature: null }).toplam, 0);
});

test('Instagram 10 puan', () => {
  assert.equal(puanla({ ...BOS, instagram: 'osmos' }).toplam, AGIRLIK.instagram);
});

test('bes kural birlikte tam 100 ediyor', () => {
  const tam = puanla({
    email: 'info@dukkan.com', platform: 'shopify', product_count: 129,
    has_similar_feature: false, instagram: 'dukkan',
  });
  assert.equal(tam.toplam, 100);
  assert.deepEqual(tam.kalemler, {
    eposta: 30, shopify: 20, urunAraligi: 20, benzerYok: 20, instagram: 10,
  });
});
