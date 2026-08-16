import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  actorGirdisi, hataliKayitlar, serptenAdaylar, sorgulariUret, ulkeyeGoreGrupla, type SerpKaydi,
} from './google.ts';

const sorgular = sorgulariUret();

test('anlamli sayida sorgu uretiliyor', () => {
  assert.ok(sorgular.length >= 200, `az sorgu: ${sorgular.length}`);
  assert.ok(sorgular.length <= 600, `cok sorgu, butce sapar: ${sorgular.length}`);
});

test('sorgular tekil — ayni sorgu iki kez para harcamiyor', () => {
  const kume = new Set(sorgular.map((s) => `${s.metin}|${s.ulke}`));
  assert.equal(kume.size, sorgular.length);
});

test('hicbir sorguda cift bosluk ya da bastan-sondan bosluk yok', () => {
  for (const s of sorgular) {
    assert.equal(s.metin, s.metin.trim());
    assert.ok(!s.metin.includes('  '), s.metin);
  }
});

/*
  ⚠️ Capraz carpim korlemesine yapilirsa Turkce sorgu Suudi Arabistan'da
  aratilir: hem para hem sonuc kalitesi kaybi.
*/
test('her dil yalniz kendi pazarlarina gidiyor', () => {
  for (const s of sorgular.filter((x) => x.dil === 'tr')) {
    assert.equal(s.ulke, 'tr', `turkce sorgu yanlis pazarda: ${s.metin} → ${s.ulke}`);
  }
  for (const s of sorgular.filter((x) => x.dil === 'de')) {
    assert.ok(['de', 'at', 'ch'].includes(s.ulke), s.ulke);
  }
});

test('dort hedef pazarin hepsi kapsaniyor', () => {
  const pazarlar = new Set(sorgular.map((s) => s.ulke));
  for (const p of ['tr', 'de', 'fr', 'us', 'gb', 'ae', 'sa']) {
    assert.ok(pazarlar.has(p), `pazar eksik: ${p}`);
  }
});

test('altyapiya nisan alan sorgular var', () => {
  assert.ok(sorgular.some((s) => s.metin.includes('myshopify.com')));
});

/*
  ⚠️ Bu sinama TAHMINI degil OLCULEN semayi tutuyor. Ilk surumde
  `queries: string[]` gonderilmisti ve actor HTTP 400 verdi. Gercek sema
  (`/builds/default` ucundan okundu): keyword tek bir STRING, "her satira
  bir sorgu"; limit ise STRING.
*/
test('actor girdisi resmi semaya uyuyor: queries satirli dize', () => {
  const uc = sorgular.slice(0, 3);
  const g = actorGirdisi(uc, 100);

  assert.equal(typeof g['queries'], 'string', 'queries dize olmali, dizi degil');
  assert.equal(String(g['queries']).split(String.fromCharCode(10)).length, 3, 'her satira bir sorgu');
  assert.equal(g['resultsPerPage'], 10);
  assert.equal(g['maxPagesPerQuery'], 10, '100 sonuc = 10 sayfa');
  assert.equal(g['keyword'], undefined, 'onceki actor un alan adi kalmamali');
});

/*
  Actor tek bir gl/hl aliyor: bir kosu = bir pazar. Gruplanmazsa Turkce
  sorgu Amerika sonuclariyla doner ve para bosa gider.
*/
test('sorgular ulkeye gore gruplaniyor', () => {
  const gruplar = ulkeyeGoreGrupla(sorgular);
  assert.ok(gruplar.size >= 10, `az grup: ${gruplar.size}`);
  assert.equal(
    [...gruplar.values()].reduce((n, g) => n + g.length, 0),
    sorgular.length,
    'hicbir sorgu gruplamada kaybolmamali',
  );
  for (const [ulke, grup] of gruplar) {
    for (const s of grup) assert.equal(s.ulke, ulke);
  }
});

test('grup girdisi o grubun ulkesini tasiyor', () => {
  const tr = ulkeyeGoreGrupla(sorgular).get('tr');
  assert.notEqual(tr, undefined);
  const g = actorGirdisi(tr as never, 100);
  assert.equal(g['countryCode'], 'tr', 'resmi actor KUCUK harf istiyor');
  assert.equal(g['languageCode'], 'tr');
});

const serp = (url: string, title = 'Baslik'): SerpKaydi => ({ url, title });

test('SERP kayitlari alan adina ceviriliyor', () => {
  const h = serptenAdaylar([serp('https://www.scentsplit.com/products/x', 'Scentsplit')]);
  assert.equal(h.adaylar.length, 1);
  assert.equal(h.adaylar[0]?.domain, 'scentsplit.com');
  assert.equal(h.adaylar[0]?.shopName, 'Scentsplit');
});

test('ayni dukkanin iki sonucu tek aday ediyor', () => {
  const h = serptenAdaylar([
    serp('https://scentsplit.com/products/a'),
    serp('https://www.scentsplit.com/products/b'),
  ]);
  assert.equal(h.adaylar.length, 1);
  assert.equal(h.tekrar, 1);
});

/*
  Butcenin corba olmasini onleyen sinama: ham Google sonucunun buyuk kismi
  dukkan degil. Bunlar veritabanina girerse saatlerce bosuna gezilir.
*/
test('dukkan olmayanlar hasat edilmiyor ve sebebi sayiliyor', () => {
  const h = serptenAdaylar([
    serp('https://www.fragrantica.com/perfume/x'),
    serp('https://www.reddit.com/r/fragrance/comments/x'),
    serp('https://www.amazon.com/dp/B01'),
    serp('https://scentsplit.com/products/a'),
  ]);
  assert.equal(h.adaylar.length, 1, 'yalniz gercek dukkan kalmali');
  assert.equal(h.elenen, 3);
  assert.ok(h.sebepler.size > 0, 'eleme sebepleri sayilmali');
});

test('adressiz kayit patlatmiyor', () => {
  const h = serptenAdaylar([{ title: 'adres yok' }, serp('https://x-dukkan.com/')]);
  assert.equal(h.adaylar.length, 1);
});

/*
  ⚠️ Actor duz bir sonuc listesi DEGIL, SERP SAYFALARI donduruyor: asil
  sonuclar `results` dizisinin icinde. Ilk surum duz liste bekliyordu ve
  hata vermeden sifir aday cikariyordu — en sinsi hata turu.
  Bu bicim gercek bir kosunun ciktisina bakilarak yazildi.
*/
test('ic ice gelen SERP sayfalari duzlestiriliyor', () => {
  const h = serptenAdaylar([
    {
      page_number: 1,
      search_term: 'perfume decants',
      results: [
        { position: 1, url: 'https://www.scentsplit.com/', title: 'Scent Split' },
        { position: 2, url: 'https://www.fragrantica.com/x', title: 'Fragrantica' },
      ],
    },
    { page_number: 2, results: [{ position: 1, url: 'https://zoologistperfumes.com/', title: 'Zoologist' }] },
  ]);
  assert.equal(h.adaylar.length, 2, 'iki gercek dukkan');
  assert.equal(h.elenen, 1, 'fragrantica elenmeli');
  assert.deepEqual(h.adaylar.map((a) => a.domain).sort(), ['scentsplit.com', 'zoologistperfumes.com']);
});

test('duz bicim de destekleniyor — actor degisirse sessizce bosalmasin', () => {
  const h = serptenAdaylar([{ url: 'https://duzbicim.com/', title: 'Duz' }]);
  assert.equal(h.adaylar.length, 1);
});

test('bos results dizisi patlatmiyor', () => {
  assert.equal(serptenAdaylar([{ page_number: 1, results: [] }]).adaylar.length, 0);
});

/*
  ⚠️ Bir tam kosu bu yuzden sessizce bosa gitti: actor kendi aylik ucretsiz
  sinirina carpinca veri yerine {"error":"Free monthly limit reached…"}
  dondurmeye basladi. Apify hata VERMEDI, kosu basarili gorundu, 333 kayit
  geldi ve sifir aday cikti. Veri icindeki hata sayilmazsa bos sonuc
  basariya benziyor.
*/
test('actor kendi hatasini dondurdugunde YAKALANIYOR', () => {
  const hatalar = hataliKayitlar([
    { error: 'Free monthly limit reached. Please upgrade to continue.' },
    { error: 'Free monthly limit reached. Please upgrade to continue.' },
  ]);
  assert.equal(hatalar.length, 2);
  assert.ok(hatalar[0]?.includes('limit reached'));
});

test('saglikli kayitlarda hata sayaci bos', () => {
  assert.equal(hataliKayitlar([{ organicResults: [{ url: 'https://x.com/' }] }]).length, 0);
});

test('resmi actor un organicResults bicimi duzlestiriliyor', () => {
  const h = serptenAdaylar([
    {
      searchQuery: { term: 'perfume decants' },
      organicResults: [
        { url: 'https://www.scentsplit.com/', title: 'Scent Split' },
        { url: 'https://www.reddit.com/r/x', title: 'Reddit' },
      ],
    },
  ]);
  assert.equal(h.adaylar.length, 1);
  assert.equal(h.adaylar[0]?.domain, 'scentsplit.com');
  assert.equal(h.elenen, 1);
});
