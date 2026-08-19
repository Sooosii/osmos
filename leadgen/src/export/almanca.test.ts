import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acilisCumlesi, dilSec, dmTaslagi, mektupGovdesi } from './outreach.ts';
import type { Evidence, Lead } from '../types.ts';

/**
 * Almanca taslakların kapısı.
 *
 * ⚠️ **Ölçülen bir eksiklikten doğdu (2026-08-19).** Boru hattı yalnız Türkçeyi
 * ayırıyordu; üçüncü partide dört Alman dükkânına Ingilizce taslak çıktı ve
 * elle çevrildi. Liste sayıldığında iş ölçeği göründü: **39 Alman DM hedefi**
 * artı Avusturya/Isviçre (8) — Türkçenin iki katından fazla, yani elle çeviri
 * her partide tekrarlanacak bir vergiydi.
 *
 * ⚠️ Buradaki iki dilbilgisi sınaması SÜS DEĞİL: ilk üretilen Almanca taslak
 * *"Hallo, Ich habe die 96 Düfte…"* diyordu. Derleme geçiyordu, sınamalar
 * yeşildi, hata yalnızca üretilen metne GÖZLE bakınca göründü.
 */

const kanit = [
  {
    domain: 'x.com', kind: 'platform', snippet: '',
    url: 'https://x.com/products.json?limit=250&page=1',
  },
] as unknown as readonly Evidence[];

const lead = (ad: string | null, sayi = 96): Lead => ({
  domain: 'x.com',
  shop_name: ad,
  notes: null,
  product_count: sayi,
} as unknown as Lead);

test('Almanca konusulan ulkelere Almanca, otekilere Ingilizce', () => {
  for (const u of ['DE', 'AT', 'CH']) assert.equal(dilSec(u, null), 'de', `ulke: ${u}`);
  for (const u of ['GB', 'CA', 'AE', 'US']) assert.equal(dilSec(u, null), 'en', `ulke: ${u}`);
  assert.equal(dilSec('TR', null), 'tr');
});

test('sayi iddiasi Almanca kuruluyor', () => {
  const a = acilisCumlesi(lead('MiniDuft'), kanit, 'de');
  assert.ok(a !== null, 'acilis cumlesi uretilmedi');
  assert.ok(a.cumle.includes('96 Düfte'), `gelen: ${a.cumle}`);
  assert.ok(!a.cumle.includes('fragrances'), `Ingilizce sizmis: ${a.cumle}`);
});

/*
  ⚠️ ASIL KAPI. Almancada gözlem cümlesi "Hallo Name," virgülünden sonra
  geliyor, yani cümle devam ediyor ve baş harf küçük kalıyor. Ingilizcede
  "I" her yerde büyük olduğu için `basHarfBuyut` orada doğru; Almancada
  "Hallo, Ich habe…" üretiyordu.
*/
test('DM taslaginda virgulden sonra kucuk harf', () => {
  const a = acilisCumlesi(lead('MiniDuft'), kanit, 'de');
  const metin = dmTaslagi(lead('MiniDuft'), a, 'de');

  assert.ok(metin.startsWith('Hallo MiniDuft, ich habe'), `gelen bas: ${metin.slice(0, 40)}`);
  assert.ok(!metin.includes(', Ich '), `virgulden sonra buyuk harf: ${metin.slice(0, 60)}`);
});

/*
  Ingilizce ve Türkçe tarafın bozulmadığı da ölçülüyor: düzeltme dile ÖZEL,
  hepsini birden küçültmek Ingilizcede "i counted" yapardı.
*/
test('Ingilizce ve Turkce bas harf buyuk kaliyor', () => {
  const a = acilisCumlesi(lead('MiniDuft'), kanit, 'en');
  assert.ok(dmTaslagi(lead('MiniDuft'), a, 'en').includes('! I counted'));

  const t = acilisCumlesi(lead('MiniDuft'), kanit, 'tr');
  assert.ok(dmTaslagi(lead('MiniDuft'), t, 'tr').includes('! Kataloğunuzdaki'));
});

/*
  ⚠️ Mektupta gözlem PARAGRAF BAŞINDA, orada büyük harf doğru — ama arkasından
  gelen uzun tireden sonra cümle devam ediyor ve orası küçük. Gözlem yoksa
  paragraf o kelimeyle başlıyor ve büyük harf gerekiyor. Iki hâl de ölçülüyor.
*/
test('mektupta tireden sonra kucuk, gozlem yokken buyuk', () => {
  const a = acilisCumlesi(lead('MiniDuft'), kanit, 'de');
  const varken = mektupGovdesi(lead('MiniDuft'), a, 'de', 154);
  assert.ok(varken.includes('— dasselbe kann ich'), 'tireden sonra buyuk harf kalmis');
  assert.ok(!varken.includes('— Dasselbe'), 'tireden sonra buyuk harf kalmis');

  const yokken = mektupGovdesi(lead('MiniDuft'), null, 'de', 154);
  assert.ok(yokken.includes('\nDasselbe kann ich'), 'paragraf kucuk harfle basliyor');
});

test('Almanca mektupta Ingilizce artik kalmamis', () => {
  const a = acilisCumlesi(lead('MiniDuft'), kanit, 'de');
  const metin = mektupGovdesi(lead('MiniDuft'), a, 'de', 154);
  for (const artik of ['I am Soroush', 'Would you like', 'unsubscribe', 'fragrances']) {
    assert.ok(!metin.includes(artik), `Ingilizce artik: ${artik}`);
  }
  /* Opt-out cumlesi pazarlik disi — dil degisse de kalmak zorunda. */
  assert.ok(metin.includes('Stopp'), 'opt-out cumlesi dusmus');
});
