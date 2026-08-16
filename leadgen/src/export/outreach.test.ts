import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  acilisCumlesi, dilIzi, dilSec, dmTaslagi, guvenCumlesi, kanalSec, mektupGovdesi, temizAd, type Dil,
} from './outreach.ts';
import type { Evidence, Lead } from '../types.ts';

const PARFUM = 150;

const LEAD: Lead = {
  id: 1, domain: 'ornek.com', shop_name: 'Ornek Parfum', platform: 'shopify',
  email: 'info@ornek.com', instagram: 'ornek', country: 'TR', product_count: 129,
  has_similar_feature: false, segment: 'butik-eticaret', olcek: 'kucuk',
  marka_ortusmesi: null, urun_ortusmesi: null, score: 100,
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

/*
  ⚠️ EMEKLIYE AYRILAN SINYAL. Onceki surumde en ustteki gozlem "urun
  sayfanizda oneri blogu yok"tu ve o cumle bir WIDGET satiyordu. Satilan sey
  degisti (kendi markasiyla calisan harita sitesi), o yuzden bu kanit
  toplanmaya devam ediyor ama ACILIS CUMLESINE girmiyor — yanlis urunu
  ima ederdi.
*/
test('benzer-urun kaniti artik acilis cumlesini SURUKLEMIYOR', () => {
  const yalnizBenzer = acilisCumlesi(
    { ...LEAD, product_count: null }, [kanit('benzer-urun', URUN)], 'tr',
  );
  assert.equal(yalnizBenzer, null, 'tek basina benzer-urun kaniti cumle kurmamali');
});

test('katalog sayisi acilis cumlesini surukluyor', () => {
  const a = acilisCumlesi(LEAD, [kanit('platform', 'https://ornek.com/products.json')], 'tr');
  assert.ok(a?.cumle.includes('129'), 'parfum sayisi cumlede olmali');
  assert.ok(a?.cumle.includes('tek bir listede'), 'haritanin cozdugu sorun soylenmeli');
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
    const m = mektupGovdesi(LEAD, acilisCumlesi(LEAD, [kanit('platform', 'https://x/products.json')], dil), dil, PARFUM);
    assert.ok(m.includes('osmos.me'), `${dil}: urun adresi yok`);
    assert.ok(/ücretsiz bir örnek|free sample/i.test(m), `${dil}: ucretsiz ornek teklifi yok`);
    assert.equal((m.match(/\?/g) ?? []).length, 1, `${dil}: tek soruyla bitmeli`);
    assert.ok(/listeden çıkar|unsubscribe/.test(m), `${dil}: opt-out cumlesi yok`);
  }
});

/*
  ⚠️ BU SINAMA BIR KAZAYI ONLUYOR. Yazilmis 497 mesaj "urun sayfaniza
  GOMULEBILEN benzer-parfum onerisi" diyordu — yani bir widget. Oyle bir urun
  hic yazilmadi ve yazilmayacak; hazir olan sey musterinin kendi markasiyla
  calisan bir harita SITESI. Biri "evet" deseydi verecek sey yoktu.
  Metne widget vaadi bir daha girmesin.
*/
test('metinlerin hicbiri GOMULEBILIR bir sey vaat etmiyor', () => {
  const yasak = /gömülebil|gömül|embedded|embed |widget|blok ekle/i;
  for (const dil of TUM_DILLER) {
    const a = acilisCumlesi(LEAD, [kanit('platform', 'https://x/products.json')], dil);
    for (const metin of [mektupGovdesi(LEAD, a, dil, PARFUM), dmTaslagi(LEAD, a, dil), a?.cumle ?? '']) {
      assert.ok(!yasak.test(metin), `${dil}: widget vaadi geri geldi → ${metin.slice(0, 90)}`);
    }
  }
});

test('metinler satilan seyi soyluyor: kendi markasiyla harita', () => {
  const tr = mektupGovdesi(LEAD, null, 'tr', PARFUM);
  assert.ok(/kendi adresiniz|sizin markanız/.test(tr), 'white-label vaadi eksik');
  const en = mektupGovdesi(LEAD, null, 'en', PARFUM);
  assert.ok(/your own address|your brand/.test(en), 'white-label vaadi eksik');
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

/*
  ⚠️ WooCommerce dukkanlarda `platform` kaniti ANA SAYFA (tespit ana sayfa
  kaynagindaki "woocommerce" gecisinden yapiliyor), sayi ise ayri bir
  `urun-sayisi` satirindan (`x-wp-total` basligi) geliyor. Eskiden kaynakUrl
  her zaman `platform`dan aliniyordu; sonucu, "kataloğunuzda 191 parfum
  saydim" diyen bir mesajin kanit adresinin ANA SAYFA olmasiydi.

  Bu sessizce ADAY KAYBETTIRIYOR: dm-listesi.md "cumlede yazan sey o sayfada
  gercekten yoksa gonderme" diyor, listeyi isleyen kisi ana sayfayi acip 191
  sayisini bulamiyor ve gecerli bir adayi atiyor. Dis denetimde 110 sayi
  iddiasinin 23unde olculdu.
*/
test('sayi iddiasinin kanit adresi urun-sayisi satirindan geliyor', () => {
  const woo = [
    kanit('platform', 'https://ornek.com/', 'ana sayfa kaynaginda woocommerce gecti'),
    kanit('urun-sayisi', 'https://ornek.com/wp-json/wc/store/v1/products?per_page=1', 'x-wp-total: 129'),
  ];
  const a = acilisCumlesi(LEAD, woo, 'tr');
  assert.ok(a);
  assert.equal(a.kaynakUrl, 'https://ornek.com/wp-json/wc/store/v1/products?per_page=1');
});

/* Shopifyde ayri satir yok; sayi `platform` kanitindaki products.json ucundan
   geliyor ve o adres zaten dogrulanabilir. Geri dusus korunuyor. */
test('urun-sayisi satiri yoksa platform kaniti kullanilmaya devam ediyor', () => {
  const a = acilisCumlesi(LEAD, [kanit('platform', 'https://ornek.com/products.json')], 'tr');
  assert.ok(a);
  assert.equal(a.kaynakUrl, 'https://ornek.com/products.json');
});

/*
  ⚠️ Uretilen listeye bakinca cikti: "Hi https!" diye DM gidecekti. Dort
  dukkanin shop_name alani ham ADRES (baslik cekilemeyince adres dusmus) ve
  temizAd `https://...`i iki nokta ustunden bolup "https"i ad saniyordu —
  bir kelime, bes harf, jenerik listede yok, yani butun kapilardan geciyordu.
*/
test('ham adres hitap olarak kullanilmiyor', () => {
  assert.equal(temizAd('https://decantanddiscover.com/products/delphes?var...'), null);
  assert.equal(temizAd('https://www.stephaniedebruijn.com/'), null);
  assert.equal(temizAd('www.ornek.com'), null);
});

/*
  ⚠️ WordPress kategori/arsiv sayfasinin basligi dukkan adi degil:
  "PARFUM SISELERI Arsivleri" = "parfum siseleri arsivi". Uc kelime ve
  hepsi jenerik olmadigi icin eski kapilardan geciyordu; arsiv/kategori
  isareti tek basina yeter sebep.
*/
test('CMS arsiv ve kategori basliklari hitap olmuyor', () => {
  assert.equal(temizAd('PARFÜM ŞİŞELERİ Arşivleri'), null);
  assert.equal(temizAd('Official Samples Archives'), null);
  assert.equal(temizAd('Parfum Kategori'), null);
});

/*
  Cinsiyet ve urun kategorisi sozcukleri, listedeki karsiliklarinin baska
  dildeki halleri: "Kadin Parfum" = "womens perfume", "Nischendufte kaufen"
  = "buy niche fragrances". Ikisi de tarif, ad degil.
*/
test('baska dildeki kategori tarifleri de jenerik sayiliyor', () => {
  assert.equal(temizAd('Kadın Parfüm'), null);
  assert.equal(temizAd('Nischendüfte kaufen'), null);
  assert.equal(temizAd('All Fragrances'), null);
});

/*
  ⚠️ Kapi genisledi, GERCEK adlari yemedigi ayrica olculuyor. Bunlarin hepsi
  jenerik bir sozcuk TASIYOR ama ad olarak gecerli.
*/
test('gercek dukkan adlari eleme genisledikten sonra da geciyor', () => {
  for (const ad of ['Alkemia Perfumes', 'Bloom Perfumery', 'MiN New York', 'Dekant House', 'Indigo Perfumery']) {
    assert.equal(temizAd(ad), ad);
  }
});

/*
  ⚠️ Uretilen 142 hitabi tek tek okuyunca kalan kotu olanlarin hepsi AYNI
  kalipti: bir sifat + jenerik ad ("Luxury Parfum", "Artisanal Perfumes",
  "Nis Parfum Fiyatlari"). Sifat listede olmadigi icin "hepsi jenerik"
  kurali tutmuyordu, yani kategori sayfasinin basligiyla selamlaniyordu.
*/
test('sifat + jenerik ad kalibi hitap olmuyor', () => {
  for (const tarif of ['Luxury Parfum', 'Artisanal Perfumes', 'Indie Brands',
    'Independent perfumery', 'Roll-On Perfume Samples', 'Niş Parfüm Fiyatları',
    'Parfüm Şişesi', 'MINIs', 'Esans']) {
    assert.equal(temizAd(tarif), null, tarif);
  }
});

/* Bir dukkanin adi soru sormaz — "Dekant Parfum Nedir?" bir blog basligi. */
test('soru isareti tasiyan baslik hitap olmuyor', () => {
  assert.equal(temizAd('Dekant Parfüm Nedir?'), null);
});

/* Destek/iletisim sayfalarinin basligi da dukkanin adi degil. */
test('site sayfasi basliklari hitap olmuyor', () => {
  assert.equal(temizAd('Customer Service'), null);
  assert.equal(temizAd('Search for Scents'), null);
});

/* ⚠️ Ayrac yalniz bosluk degil: "Decants/Samples" tek sozcuk sayiliyordu. */
test('egik cizgi de sozcuk ayraci', () => {
  assert.equal(temizAd('Decants/Samples'), null);
});

/*
  ⚠️ Eleme UC KEZ genisledi; gercek adlarin hayatta kaldigi her seferinde
  ayrica olculuyor. Bunlarin hepsi jenerik bir sozcuk TASIYOR.
*/
test('gercek adlar ucuncu genislemeden sonra da geciyor', () => {
  for (const ad of ['Alkemia Perfumes', 'Bloom Perfumery', 'MiN New York',
    'Dekant House', 'Decant Direct', 'Scent Split', 'Merz Apothecary',
    'The Harmonist', 'Kingdom Scotland']) {
    assert.equal(temizAd(ad), ad, ad);
  }
});

/*
  ⚠️ Olculdu: DM listesindeki 239 hesabin 45i Turk dukkani ama INGILIZCE
  mesaj aliyordu. Sebep, dilSecin yalnizca ulke koduna bakmasi ve ulkenin
  735 adayin 599unda BOS olmasi — cunku ulke uzantidan cikiyor ve bu
  dukkanlar .com kullaniyor. Sahibin en kolay kapatacagi pazar bu.

  Cozum ulkeyi UYDURMAK degil: ana sayfa metnindeki dil izine bakmak.
  Iz yalniz Turkceye OZGU harflerden ve sozcuklerden okunuyor; u ve o
  Almancayla ortak oldugu icin tek basina yetmiyor.
*/
test('Turkceye ozgu harfler dil izi sayiliyor', () => {
  assert.equal(dilIzi('Orijinal ve Uygun Fiyatlı Dekant Parfümler'), 'tr');
  assert.equal(dilIzi('Koku Mutfağı'), 'tr');
  assert.equal(dilIzi('Niche Parfüm Çeşitleri'), 'tr');
});

/* ⚠️ Almanca da u/o kullaniyor; Turkce sanilmamali. */
test('Almanca sayfa Turkce sayilmiyor', () => {
  assert.equal(dilIzi('Exklusive Parfümproben günstig kaufen'), null);
  assert.equal(dilIzi('Nischendüfte online entdecken'), null);
  assert.equal(dilIzi('Independent perfumery, London'), null);
  assert.equal(dilIzi(null), null);
});

test('ulkesi bilinmeyen ama sayfasi Turkce olana Turkce yaziliyor', () => {
  assert.equal(dilSec(null, 'Uygun Fiyatlı Dekant Parfümler'), 'tr');
  assert.equal(dilSec(null, 'Independent perfumery'), 'en');
  assert.equal(dilSec(null), 'en');
});

/*
  ⚠️ Ulke BILINIYORSA metin onu ezmiyor. Alman bir dukkanin sayfasinda
  Turkce bir urun adi gecmesi o dukkani Turk yapmaz; yanlis dilde mesaj,
  dilsiz mesajdan kotu.
*/
test('bilinen ulke sayfa metnini eziyor', () => {
  assert.equal(dilSec('DE', 'Uygun Fiyatlı Dekant Parfümler'), 'en');
  assert.equal(dilSec('TR', 'Independent perfumery'), 'tr');
});
