import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AGIRLIK, KATALOG_ALT, KATALOG_UST, ORTUSME_ESIGI, puanla, type PuanGirdisi,
} from './score.ts';

const BOS: PuanGirdisi = {
  email: null, platform: 'bilinmiyor', product_count: null,
  instagram: null, urun_ortusmesi: null,
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

/*
  Shopify'in anlami degisti: artik "gomulebilir" oldugu icin degil,
  products.json sayesinde katalogu OKUNABILIR oldugu icin degerli — demo
  o yuzden ucuz.
*/
test('Shopify 20, WooCommerce 0 puan', () => {
  assert.equal(puanla({ ...BOS, platform: 'shopify' }).toplam, AGIRLIK.shopify);
  assert.equal(puanla({ ...BOS, platform: 'woocommerce' }).toplam, 0);
});

test('harita-boyu katalog araligi uclarda da puan aliyor', () => {
  assert.equal(puanla({ ...BOS, product_count: KATALOG_ALT }).toplam, AGIRLIK.haritalikKatalog);
  assert.equal(puanla({ ...BOS, product_count: KATALOG_UST }).toplam, AGIRLIK.haritalikKatalog);
});

/*
  Alt uc: bu sayinin altinda harita bos gorunuyor. Ust uc: teslim her
  parfumun elle girilmesini gerektirdigi icin ustu tek seferde yapilamiyor.
*/
test('aralik disindaki kataloglar puan almiyor', () => {
  assert.equal(puanla({ ...BOS, product_count: KATALOG_ALT - 1 }).toplam, 0);
  assert.equal(puanla({ ...BOS, product_count: KATALOG_UST + 1 }).toplam, 0);
});

/*
  ⚠️ Esik MARKA degil URUN ustunde ve bu olculdu: marka ortusmesi 25 olan
  dukkanda urun ortusmesi 4 cikti, 24 olanda 3, ortalama 3. Bizde marka
  basina 1-2 KURATORLU parfum var, dukkanlar o markanin POPULER parfumlerini
  satiyor; kesismeleri icin ozel bir sebep yok.
*/
test('URUN ortusmesi esigi tutuyor', () => {
  assert.equal(puanla({ ...BOS, urun_ortusmesi: ORTUSME_ESIGI }).toplam, AGIRLIK.urunOrtusmesi);
  assert.equal(puanla({ ...BOS, urun_ortusmesi: ORTUSME_ESIGI - 1 }).toplam, 0);
});

/*
  ⚠️ `null` "olculmedi" demek, "sifir" degil. Ortusme ancak demo-adaylari
  kosunca biliniyor; olculmemis bir hedefe puan vermek, ayni hatanin
  (benzer-urun `null` iken puan verme) ikinci kez yapilmasi olurdu.
*/
test('OLCULMEMIS ortusme puan almiyor', () => {
  assert.equal(puanla({ ...BOS, urun_ortusmesi: null }).toplam, 0);
});

test('Instagram 10 puan', () => {
  assert.equal(puanla({ ...BOS, instagram: 'osmos' }).toplam, AGIRLIK.instagram);
});

test('bes kural birlikte tam 100 ediyor', () => {
  const tam = puanla({
    email: 'info@dukkan.com', platform: 'shopify', product_count: 47,
    urun_ortusmesi: 11, instagram: 'dukkan',
  });
  assert.equal(tam.toplam, 100);
  assert.deepEqual(tam.kalemler, {
    eposta: 30, shopify: 20, haritalikKatalog: 25, urunOrtusmesi: 15, instagram: 10,
  });
});
