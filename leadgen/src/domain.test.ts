import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adayHostlar, hostOf, normalizeDomain } from './domain.ts';

test('protokolsuz ve protokollu adresler ayni hosta cikiyor', () => {
  assert.equal(hostOf('https://www.luckyscent.com/x'), 'www.luckyscent.com');
  assert.equal(hostOf('luckyscent.com'), 'luckyscent.com');
});

test('www kirpiliyor', () => {
  assert.equal(normalizeDomain('https://www.dior.com/en_us/beauty'), 'dior.com');
});

/*
  Katalogda gercekten boyle duruyor: `us.diptyqueparis.com` ve
  `diptyqueparis.com` ayri satirlar ama AYNI isletme. Birlesmezlerse
  ayni dukkana iki mektup gider.
*/
test('alt alan adlari kayitli alan adina iniyor', () => {
  assert.equal(normalizeDomain('https://us.diptyqueparis.com/en-us/products/x'), 'diptyqueparis.com');
  assert.equal(normalizeDomain('https://shop.bogue-profumo.com/p/1'), 'bogue-profumo.com');
  assert.equal(normalizeDomain('https://us.memoparis.com'), 'memoparis.com');
});

test('iki duzeyli ccTLD ler korunuyor', () => {
  assert.equal(normalizeDomain('https://shop.parfum.com.tr/x'), 'parfum.com.tr');
  assert.equal(normalizeDomain('https://www.scent.co.uk'), 'scent.co.uk');
});

test('gecersiz girdi null donduruyor, patlatmiyor', () => {
  assert.equal(normalizeDomain(''), null);
  assert.equal(normalizeDomain('   '), null);
  assert.equal(normalizeDomain('localhost'), null);
});

/*
  Olculdu: luckyscent.com ciplak halde 301 veriyor. `www` ayri bir aday
  olarak denenmezse site "ulasilamadi" diye elenirdi.
*/
test('aday hostlar tohum adresini ve www yi kapsiyor', () => {
  const a = adayHostlar('bogue-profumo.com', 'https://shop.bogue-profumo.com/p/1');
  assert.deepEqual([...a], ['shop.bogue-profumo.com', 'bogue-profumo.com', 'www.bogue-profumo.com']);
});

test('tohum yoksa iki aday kaliyor', () => {
  assert.deepEqual([...adayHostlar('nishane.com', null)], ['nishane.com', 'www.nishane.com']);
});

/*
  ⚠️ Olculmus veri hatasi: dokuz aday alan adi yerine KAMU SON EKI olarak
  kaydedilmisti — jumia.com.ng → "com.ng", malak.com.pk → "com.pk",
  shopee.co.th → "co.th". Iki yonlu zarar: adres cozulmuyor ve birbirinden
  bagimsiz dukkanlar tek satirda birlesiyor (ubuy uc ayri ulkede uc kez).
  Sabit liste yetmedi; kural kondu: iki harfli ulke uzantisinin altindaki
  genel etiket alan adinin kendisi olamaz.
*/
test('listede olmayan iki duzeyli ccTLD ler de dogru cozuluyor', () => {
  assert.equal(normalizeDomain('https://www.jumia.com.ng/slp/x'), 'jumia.com.ng');
  assert.equal(normalizeDomain('https://malak.com.pk/collections/f'), 'malak.com.pk');
  assert.equal(normalizeDomain('https://pparfums.com.ua/shop/x'), 'pparfums.com.ua');
  assert.equal(normalizeDomain('https://shopee.co.th/x'), 'shopee.co.th');
  assert.equal(normalizeDomain('https://www.ubuy.co.tz/en/product/x'), 'ubuy.co.tz');
});

test('ciplak kamu son eki alan adi SAYILMIYOR', () => {
  assert.equal(normalizeDomain('https://com.ng'), null);
  assert.equal(normalizeDomain('co.uk'), null);
  assert.equal(normalizeDomain('com.tr'), null);
});

test('duz com adresleri bozulmadi', () => {
  assert.equal(normalizeDomain('https://www.scentsplit.com/'), 'scentsplit.com');
  assert.equal(normalizeDomain('https://shop.bogue-profumo.com/p/1'), 'bogue-profumo.com');
});

/*
  ⚠️ Platform barindirma alan adlari da kamu son eki gibi davraniyor.
  Listeye alinmazsa BUTUN kucuk Shopify dukkanlari tek satira cokuyordu
  (`myshopify.com`) — ustelik tam hedef kitlede: kendi alan adini henuz
  almamis dukkanlar.
*/
test('platform altindaki dukkanlar kendi kimligini koruyor', () => {
  assert.equal(normalizeDomain('https://kucukdukkan.myshopify.com/products/x'), 'kucukdukkan.myshopify.com');
  assert.equal(normalizeDomain('https://baskadukkan.myshopify.com'), 'baskadukkan.myshopify.com');
  assert.notEqual(
    normalizeDomain('https://a.myshopify.com'),
    normalizeDomain('https://b.myshopify.com'),
    'iki ayri dukkan tek satira cokmemeli',
  );
});

test('platformun kendisi alan adi sayilmiyor', () => {
  assert.equal(normalizeDomain('https://myshopify.com'), null);
  assert.equal(normalizeDomain('https://bigcartel.com'), null);
});
