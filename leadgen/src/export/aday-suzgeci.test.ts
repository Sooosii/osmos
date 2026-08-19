import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hesabaGoreTekille, hesabaZatenYazildi, platformHesabi, yazilanHesaplariTopla,
} from './aday-suzgeci.ts';

/**
 * Iki eleme kuralının kapısı — ikisi de gerçek bir partide yakalandı.
 */

const kayitlar = [
  { domain: 'visionaryfragrances.com', instagram: 'visionaryfragrancesgb' },
  { domain: 'visionaryfragranceseu.com', instagram: 'visionaryfragrancesgb' },
  { domain: 'montagnedecants.com', instagram: 'shopify' },
  { domain: 'petitparfums.ca', instagram: 'petit_parfums' },
  { domain: 'kanalsiz.com', instagram: null },
];

/*
  ⚠️ ASIL KAPI. Ilk partide visionaryfragrances.com'a yazildi; dorduncu
  partide visionaryfragranceseu.com 1. SIRADA cikti ve hesabi ayni.
  Defter alan adina baktigi icin tekrar korumasi bunu kacirmisti.
*/
test('ayni hesabi tasiyan IKINCI alan adi eleniyor', () => {
  const yazilan = yazilanHesaplariTopla(kayitlar, new Set(['visionaryfragrances.com']));
  assert.equal(hesabaZatenYazildi('visionaryfragrancesgb', yazilan), true);
  assert.equal(hesabaZatenYazildi('petit_parfums', yazilan), false);
});

test('hesap karsilastirmasi buyuk-kucuk harf ve @ tanimiyor', () => {
  const yazilan = yazilanHesaplariTopla(
    [{ domain: 'a.com', instagram: '@VisionaryFragrancesGB' }],
    new Set(['a.com']),
  );
  assert.equal(hesabaZatenYazildi('visionaryfragrancesgb', yazilan), true);
  assert.equal(hesabaZatenYazildi('@VISIONARYFRAGRANCESGB', yazilan), true);
});

test('hesabi olmayan kayit yanlislikla eslesmiyor', () => {
  const yazilan = yazilanHesaplariTopla(kayitlar, new Set(['kanalsiz.com']));
  assert.equal(yazilan.size, 0, 'null hesap kumeye girmis');
  assert.equal(hesabaZatenYazildi(null, yazilan), false);
  assert.equal(hesabaZatenYazildi('', yazilan), false);
});

/*
  ⚠️⚠️ `hesabaZatenYazildi` bunu YAKALAMIYOR — o yalniz daha once yazilmis
  hesaplara bakiyor. Besinci parti kuruldugunda 9. ve 10. siralarda
  parfumexquis.com ile parfumexquis.us yan yana duruyordu: iki alan adi, tek
  hesap, yani tek oturumda ayni kutuya iki mesaj.
*/
test('ayni hesabi tasiyan IKINCI aday partiden dusuyor', () => {
  const parti = [
    { domain: 'parfumexquis.com', instagram: 'parfum.exquis', ortusme: 2 },
    { domain: 'parfumexquis.us', instagram: '@Parfum.Exquis', ortusme: 2 },
    { domain: 'baska.com', instagram: 'baska', ortusme: 1 },
  ];
  const kalan = hesabaGoreTekille(parti);
  assert.deepEqual(kalan.map((k) => k.domain), ['parfumexquis.com', 'baska.com']);
});

/*
  Giris ortusmeye gore sirali geliyor, yani "birincisi" en iyisi demek —
  ayni isletmenin iki kaydindan is yuku dusuk olani kaliyor.
*/
test('tekillestirmede ILK (en iyi) kayit kaliyor', () => {
  const kalan = hesabaGoreTekille([
    { domain: 'zayif.com', instagram: 'ayni', ortusme: 9 },
    { domain: 'guclu.com', instagram: 'ayni', ortusme: 1 },
  ]);
  assert.equal(kalan.length, 1);
  assert.equal(kalan[0].domain, 'zayif.com');
});

/*
  ⚠️ Hesabi olmayan kayitlar BIRBIRININ kopyasi degil: `null` bir kimlik degil,
  bilgi eksikligi. Hepsini tek "null" hesabinda toplamak biri disinda hepsini
  elerdi.
*/
test('hesabi olmayan kayitlar birbirini elemiyor', () => {
  const kalan = hesabaGoreTekille([
    { domain: 'a.com', instagram: null },
    { domain: 'b.com', instagram: null },
    { domain: 'c.com', instagram: '' },
  ]);
  assert.equal(kalan.length, 3);
});

/*
  Kaziyici sayfadaki her Instagram baglantisini topluyor ve bazi temalar
  altbilgide "Powered by Shopify" rozetini bagliyor.
*/
test('platform hesaplari eleniyor', () => {
  assert.equal(platformHesabi('shopify'), true);
  assert.equal(platformHesabi('@Shopify'), true);
  assert.equal(platformHesabi('instagram'), true);
  assert.equal(platformHesabi('linktree'), true);
});

/*
  ⚠️ Liste DAR: yalniz hesabin TAMAMI eslesirse eleniyor. Icinde gecmesine
  bakilsaydi gercek bir dukkan da elenirdi.
*/
test('icinde platform adi GECEN gercek dukkan elenmiyor', () => {
  assert.equal(platformHesabi('shopifyqueen'), false);
  assert.equal(platformHesabi('the_shopify_store'), false);
  assert.equal(platformHesabi('xerjoff'), false);
  assert.equal(platformHesabi(null), false);
});
