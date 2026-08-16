import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  acilisCumlesi, dilSec, dmTaslagi, guvenCumlesi, kanalSec, mektupGovdesi, temizAd, type Dil,
} from './outreach.ts';
import type { Evidence, Lead } from '../types.ts';

const PARFUM = 150;

const LEAD: Lead = {
  id: 1, domain: 'ornek.com', shop_name: 'Ornek Parfum', platform: 'shopify',
  email: 'info@ornek.com', instagram: 'ornek', country: 'TR', product_count: 129,
  has_similar_feature: false, segment: 'butik-eticaret', olcek: 'kucuk', score: 100,
  durum: 'zenginlestirildi', source: 'katalog', notes: null, seed_url: null,
};

const kanit = (kind: string, url: string, snippet = 'x'): Evidence => ({
  lead_id: 1, kind, url, snippet, http_status: 200, fetched_at: '2026-08-16T00:00:00Z',
});

const URUN = 'https://ornek.com/products/abc';
const TUM_DILLER: readonly Dil[] = ['tr', 'en'];

test('ulkeye gore dil seciliyor', () => {
  assert.equal(dilSec('TR'), 'tr');
  assert.equal(dilSec('US'), 'en');
  assert.equal(dilSec(null), 'en');
});

/*
  Hafizadaki sira: Instagram DM, sonra mail, sonra telefon. Sahip yeni ve
  markasi taninmiyor; taninmayan alan adindan gelen soguk mail acilmiyor.
*/
test('Turkiye de Instagram varsa kanal DM', () => {
  assert.equal(kanalSec({ email: 'info@x.com', instagram: 'x', country: 'TR' }), 'dm');
});

test('yurt disinda e-posta varsa kanal mail', () => {
  assert.equal(kanalSec({ email: 'info@x.com', instagram: 'x', country: 'US' }), 'mail');
});

test('e-posta yoksa Instagram varsa yine DM', () => {
  assert.equal(kanalSec({ email: null, instagram: 'x', country: 'US' }), 'dm');
});

test('hicbir kanali olmayan yok olarak isaretleniyor', () => {
  assert.equal(kanalSec({ email: null, instagram: null, country: 'US' }), 'yok');
});

/*
  Boru hattinin en sert kurali. Kanit satiri yoksa somut ayrinti da yok;
  cumle yazilmiyor. Uydurulmus tek bir ayrinti ilk cevapta yakalanir.
*/
test('hic kanit yoksa acilis cumlesi URETILMIYOR', () => {
  assert.equal(acilisCumlesi(LEAD, [], 'tr'), null);
  assert.equal(acilisCumlesi(LEAD, [], 'en'), null);
});

test('benzer-urun kaniti varsa cumle o sayfayi gosteriyor', () => {
  const a = acilisCumlesi(LEAD, [kanit('benzer-urun', URUN)], 'tr');
  assert.equal(a?.kaynakUrl, URUN);
  assert.ok(a?.cumle.includes(URUN), 'cumle kanit adresini tasimali');
  assert.ok((a?.kisa.length ?? 0) > 0, 'DM icin kisa hali de olmali');
});

test('benzer-urun kaniti yoksa o iddia kurulmuyor, alt secenege duyuluyor', () => {
  const a = acilisCumlesi(LEAD, [kanit('platform', 'https://ornek.com/products.json')], 'tr');
  assert.ok(a?.cumle.includes('129'), 'katalog sayisina duyulmeli');
  assert.ok(!a?.cumle.includes('göremedim'), 'olculmemis yokluk iddia edilmemeli');
});

test('urun sayisi yoksa ana sayfa basligina duyuluyor', () => {
  const l: Lead = { ...LEAD, product_count: null, has_similar_feature: null };
  const a = acilisCumlesi(l, [kanit('ana-sayfa', 'https://ornek.com/', 'Ornek Parfum')], 'en');
  assert.ok(a?.cumle.includes('Ornek Parfum'));
});

test('mektup sahibin verdigi iskeleti tasiyor', () => {
  for (const dil of TUM_DILLER) {
    const m = mektupGovdesi(LEAD, acilisCumlesi(LEAD, [kanit('benzer-urun', URUN)], dil), dil, PARFUM);
    assert.ok(m.includes('osmos.me'), `${dil}: urun adresi yok`);
    assert.ok(/2 hafta|two-week/.test(m), `${dil}: ucretsiz pilot teklifi yok`);
    assert.equal((m.match(/\?/g) ?? []).length, 1, `${dil}: tek soruyla bitmeli`);
    assert.ok(/listeden çıkar|unsubscribe/.test(m), `${dil}: opt-out cumlesi yok`);
  }
});

/*
  ⚠️ Sahibin aile sirketi bu isle ilgisiz bir sektorde; adi anilinca
  "bunun parfumle ne isi var" sorusunu dogurur. Guven sirketten degil
  dogrulanabilir bir SAYIDAN geliyor.
*/
test('guven sayidan geliyor, sirket adi mektuba GIRMIYOR', () => {
  for (const dil of TUM_DILLER) {
    const m = mektupGovdesi(LEAD, null, dil, PARFUM);
    assert.ok(m.includes(String(PARFUM)), `${dil}: katalog sayisi yok`);
    assert.ok(!/şirket|company|Ltd|A\.Ş\.|LLC|Inc\./i.test(m), `${dil}: mektupta sirket gecmemeli`);
  }
});

test('guven cumlesi kataloga gore degisiyor — sabit yazilmamis', () => {
  assert.ok(guvenCumlesi(150, 'tr').includes('150'));
  assert.ok(guvenCumlesi(220, 'tr').includes('220'));
});

test('kanit yoksa mektup yine kuruluyor ama somut iddia icermiyor', () => {
  const m = mektupGovdesi(LEAD, null, 'tr', PARFUM);
  assert.ok(m.includes('osmos.me'));
  assert.ok(!m.includes('göremedim'));
  assert.ok(!m.includes('129'));
});

/*
  DM'e mektup yapistirmak en hizli engellenme yolu.
*/
test('DM taslagi kisa, tek soruyla ve tek adresle', () => {
  for (const dil of TUM_DILLER) {
    const d = dmTaslagi(LEAD, acilisCumlesi(LEAD, [kanit('benzer-urun', URUN)], dil), dil);
    assert.ok(d.length < 420, `${dil}: DM cok uzun (${d.length})`);
    assert.equal((d.match(/\?/g) ?? []).length, 1, `${dil}: tek soru olmali`);
    assert.equal((d.match(/osmos\.me/g) ?? []).length, 1, `${dil}: tek adres olmali`);
    assert.ok(!d.includes(URUN), `${dil}: DM'e uzun adres yapistirilmamali`);
  }
});

test('DM mektuptan farkli — kopyasi degil', () => {
  const a = acilisCumlesi(LEAD, [kanit('benzer-urun', URUN)], 'tr');
  assert.notEqual(dmTaslagi(LEAD, a, 'tr'), mektupGovdesi(LEAD, a, 'tr', PARFUM));
});

/*
  Sahibin kesin kurali: ekranda buyuk noktali I hic gorunmeyecek. CSV de
  ekran sayiliyor — musteriye giden metin bu kuralin en gorunur yeri.
*/
test('uretilen TURKCE metinlerin hicbirinde buyuk noktali I yok', () => {
  const a = acilisCumlesi(LEAD, [kanit('benzer-urun', URUN)], 'tr');
  const b = acilisCumlesi(LEAD, [kanit('platform', 'https://ornek.com/products.json')], 'tr');
  const parcalar = [
    mektupGovdesi(LEAD, a, 'tr', PARFUM),
    mektupGovdesi(LEAD, b, 'tr', PARFUM),
    mektupGovdesi({ ...LEAD, shop_name: null }, null, 'tr', PARFUM),
    dmTaslagi(LEAD, a, 'tr'),
    dmTaslagi(LEAD, null, 'tr'),
    guvenCumlesi(PARFUM, 'tr'),
    a?.cumle ?? '', a?.kisa ?? '', b?.cumle ?? '', b?.kisa ?? '',
  ];
  for (const p of parcalar) {
    assert.ok(!p.includes('İ'), `buyuk noktali I bulundu: ${p.slice(0, 80)}`);
  }
});

/*
  ⚠️ Ciktiya bakinca gorulen kalite hatasi: hitap ham SAYFA BASLIGINDAN
  aliniyordu ve soyle bir DM uretiliyordu:
  "Hi Alkemia Perfumes: Unique Indie Perfumes and Fragrances ...!"
  Baslik bir ad degil bir tanitim cumlesi; uc noktasi bile duruyordu.
*/
test('sayfa basligindan kullanilabilir ad cikariliyor', () => {
  assert.equal(temizAd('Alkemia Perfumes: Unique Indie Perfumes and Fragrances ...'), 'Alkemia Perfumes');
  assert.equal(temizAd('Scent Split | Perfume Samples'), 'Scent Split');
});

test('gercek marka adlari bozulmuyor', () => {
  assert.equal(temizAd('Decant Direct'), 'Decant Direct');
  assert.equal(temizAd('Marc-Antoine Barrois'), 'Marc-Antoine Barrois', 'bosluksuz tire korunmali');
});

/*
  "Naturliches Parfum" bir marka degil bir tarif; onunla selamlamak
  ("Merhaba Dogal Parfum!") mektubu robot gibi gosteriyor.
*/
test('hepsi jenerik kelimeden olusan ad DUSURULUYOR', () => {
  assert.equal(temizAd('Natürliches Parfum - concious natural Perfum - AMBA Shop'), null);
  assert.equal(temizAd('Perfume Shop'), null);
  assert.equal(temizAd('Buy the best perfumes online in Turkey today'), null);
});

test('adsiz hitap kurulabiliyor — bos ad patlamiyor', () => {
  assert.equal(temizAd(null), null);
  assert.equal(temizAd('   '), null);
  const m = mektupGovdesi({ ...LEAD, shop_name: 'Perfume Shop' }, null, 'tr', PARFUM);
  assert.ok(m.startsWith('Merhaba,'), 'ad dusunce dogrudan virgul gelmeli');
});

/*
  ⚠️ Sayfa basligi bazen URUN adi tasiyor. `bibliotheque-de-parfum.ua` icin
  "Discovery Set" cikti ve mektup "Hello Discovery Set," diye baslayacakti.
*/
test('urun adi hitap olarak kullanilmiyor', () => {
  assert.equal(temizAd('Discovery Set'), null);
  assert.equal(temizAd('Perfume Samples'), null);
  assert.equal(temizAd('Gift Set 5ml'), null);
});

test('urun sozcugu iceren GERCEK marka adi korunuyor', () => {
  assert.equal(temizAd('Decant Direct'), 'Decant Direct', 'ikinci kelime jenerik degil');
  assert.equal(temizAd('Scent Split'), 'Scent Split');
});
