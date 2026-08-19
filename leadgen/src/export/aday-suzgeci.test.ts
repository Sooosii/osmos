import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hesabaZatenYazildi, platformHesabi, yazilanHesaplariTopla } from './aday-suzgeci.ts';

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
