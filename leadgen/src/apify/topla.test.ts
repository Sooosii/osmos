import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toplamHarcama, tumLeadler } from '../db.ts';
import { geciciVeritabani } from '../sinama-db.ts';
import { ApifyIstemcisi, type Getirici } from './istemci.ts';
import { topla } from './topla.ts';
import { AYLIK_TAVAN_USD } from './butce.ts';

const sessiz = (): void => {};

interface SahteAyar {
  readonly aylikUsd?: number | null;
  readonly serp?: readonly unknown[];
  readonly gonderi?: readonly unknown[];
  readonly profil?: readonly unknown[];
  readonly etsy?: readonly unknown[];
}

/**
 * Sahte Apify — hicbir istek aga cikmiyor, tek kurus harcanmiyor.
 * Cagrilan actor adreslerini kaydediyor ki "kosmadi" iddiasi olculebilsin.
 */
function sahteIstemci(ayar: SahteAyar = {}): { istemci: ApifyIstemcisi; kosular: string[] } {
  const kosular: string[] = [];
  const getir: Getirici = async (url) => {
    if (url.includes('/users/me/usage/monthly')) {
      const d = ayar.aylikUsd;
      if (d === null) return new Response('nope', { status: 500 });
      return new Response(JSON.stringify({ data: { totalUsageCreditsUsd: d ?? 0 } }), { status: 200 });
    }
    kosular.push(url);
    if (url.includes('google-search')) return new Response(JSON.stringify(ayar.serp ?? []), { status: 200 });
    if (url.includes('hashtag')) return new Response(JSON.stringify(ayar.gonderi ?? []), { status: 200 });
    if (url.includes('profile')) return new Response(JSON.stringify(ayar.profil ?? []), { status: 200 });
    return new Response(JSON.stringify(ayar.etsy ?? []), { status: 200 });
  };
  return { istemci: new ApifyIstemcisi('sahte-token', getir), kosular };
}

/*
  ⚠️ Sahibin kuralinin en sert sinamasi: onay olmadan TEK BIR actor bile
  cagrilmamali. "Kosmadi" iddiasi burada laf degil olcum — sahte getirici
  cagrilan her actor adresini kaydediyor ve liste bos cikmali.
*/
test('onay YOKKEN tam kosuda hicbir actor cagrilmiyor', async () => {
  const db = geciciVeritabani();
  const { istemci, kosular } = sahteIstemci({ aylikUsd: 0 });

  const r = await topla(db, istemci, 'tam', false, sessiz);

  assert.equal(kosular.length, 0, `onaysiz ${kosular.length} actor cagrildi`);
  assert.equal(r.toplamYeniAday, 0);
  assert.equal(r.toplamGercekUsd, 0);
  assert.equal(toplamHarcama(db), 0, 'onaysiz harcama defterine satir yazilmamali');
  assert.ok(r.bekleyenOnaylar.length > 0, 'onay bekleyenler listelenmeli');
  for (const k of r.kanallar) assert.equal(k.karar.izin, 'onay-gerek');
  db.close();
});

test('sonda modu onay beklemeden dort kanali da kosuyor', async () => {
  const db = geciciVeritabani();
  const { istemci, kosular } = sahteIstemci({
    aylikUsd: 0,
    serp: [{ organicResults: [{ url: 'https://sondadukkan.com/products/a', title: 'Sonda Dukkan' }] }],
    gonderi: [{ ownerUsername: 'decantci' }],
    profil: [{ username: 'decantci', fullName: 'Decantci', externalUrl: 'https://decantci.com' }],
  });

  const r = await topla(db, istemci, 'sonda', false, sessiz);

  /* Google ulke grubu basina bir kosu yapiyor; kanal sayisi cagri sayisi degil. */
  const kanallar = new Set(kosular.map((u) => (u.match(/acts\/([^/]+)/) ?? [])[1]));
  assert.equal(kanallar.size, 4, `dort kanal da kosmali, gorulen: ${[...kanallar].join(', ')}`);
  assert.equal(r.mod, 'sonda');
  const alanlar = tumLeadler(db).map((l) => l.domain);
  assert.ok(alanlar.includes('sondadukkan.com'), 'Google adayi yazilmali');
  assert.ok(alanlar.includes('decantci.com'), 'Instagram biyosundaki adres yazilmali');
  db.close();
});

/*
  Hashtag adimi hic kullanici adi cikarmadiysa profil actor'ini cagirmak
  bos bir liste icin para odemek olur. Bu davranis bir sinamanin dusmesiyle
  fark edildi; beklenti yanlisti, kod dogruydu.
*/
test('kullanici adi yoksa profil actor i CAGRILMIYOR — bos listeye para odenmiyor', async () => {
  const db = geciciVeritabani();
  const { istemci, kosular } = sahteIstemci({ aylikUsd: 0, gonderi: [] });

  await topla(db, istemci, 'sonda', false, sessiz);

  assert.equal(kosular.filter((u) => u.includes('profile')).length, 0);
  const kanallar = new Set(kosular.map((u) => (u.match(/acts\/([^/]+)/) ?? [])[1]));
  assert.equal(kanallar.size, 3, 'kalan uc kanal kosmali');
  db.close();
});

/*
  Kredi bitmisse onay verilmis olsa bile is baslamamali — ucretsiz planda
  kredi tukenince Apify zaten durduruyor, ama biz oraya hic gitmiyoruz.
*/
test('aylik kredi bitmisse ONAYLI kosu bile baslamiyor', async () => {
  const db = geciciVeritabani();
  const { istemci, kosular } = sahteIstemci({ aylikUsd: AYLIK_TAVAN_USD - 0.01 });

  const r = await topla(db, istemci, 'tam', true, sessiz);

  assert.equal(kosular.length, 0);
  for (const k of r.kanallar) assert.equal(k.karar.izin, 'hayir');
  db.close();
});

/*
  Harcama defteri TAHMINLE degil OLCUMLE tutulmali: iki kosu arasindaki
  aylik kullanim farki o kosunun gercek maliyetidir.
*/
test('harcama Apify dan olculuyor, hesaplanmiyor', async () => {
  const db = geciciVeritabani();
  let cagri = 0;
  const getir: Getirici = async (url) => {
    if (url.includes('/users/me/usage/monthly')) {
      cagri += 1;
      // her olcumde 0.01 artiyor: gercek harcama boyle gorunur
      return new Response(JSON.stringify({ data: { totalUsageCreditsUsd: cagri * 0.01 } }), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  const istemci = new ApifyIstemcisi('sahte-token', getir);

  await topla(db, istemci, 'sonda', false, sessiz);

  const yazilan = toplamHarcama(db);
  assert.ok(yazilan > 0, 'harcama defterine yazilmali');
  /* Hesaplanan sonda toplami ~$0.073; olculen deger ondan farkli olmali. */
  assert.notEqual(Number(yazilan.toFixed(4)), 0.0726);
  db.close();
});

test('kullanim okunamazsa harcama sessizce sifir yazilmiyor', async () => {
  const db = geciciVeritabani();
  const { istemci } = sahteIstemci({ aylikUsd: null });

  await topla(db, istemci, 'sonda', false, sessiz);

  assert.ok(toplamHarcama(db) > 0, 'olculemeyince hesaplanan tahmin yazilmali, sifir degil');
  db.close();
});

/*
  Google, Etsy sondasindan cikan dukkan adlarini ek sorgu olarak almali:
  Etsy saticisinin kendi sitesi bedava Google adiminda araniyor.
*/
test('Etsy dukkan adlari Google sorgularina ekleniyor', async () => {
  const db = geciciVeritabani();
  const gorulenGirdiler: string[] = [];
  const getir: Getirici = async (url, secenekler) => {
    if (url.includes('/users/me/usage/monthly')) {
      return new Response(JSON.stringify({ data: { totalUsageCreditsUsd: 0 } }), { status: 200 });
    }
    if (url.includes('google-search')) gorulenGirdiler.push(String(secenekler.body));
    if (url.includes('etsy')) {
      return new Response(JSON.stringify([{ shopName: 'DecantHouse' }]), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };

  await topla(db, new ApifyIstemcisi('sahte-token', getir), 'sonda', false, sessiz);

  assert.ok(gorulenGirdiler.some((g) => g.includes('DecantHouse')), 'Etsy adi Google sorgusuna girmeli');
  db.close();
});

/*
  ⚠️ Iki ayri sinir gerekiyor ve bu sinama ikincisini tutuyor.
  `maxItems` kac kayit isteneceini soyluyor ama olay basi ucretlendirmede
  bir kaydin kaca mal oldugunu BIZ tahmin ediyoruz. Sondada tahmin sasti:
  ilan edilen fiyatla olculen tutmadi. `maxTotalChargeUsd` o zinciri kiriyor
  cunku sinirir APIFY uyguluyor.
*/
test('her actor cagrisinda APIFY tarafinda sert harcama tavani var', async () => {
  const db = geciciVeritabani();
  const adresler: string[] = [];
  const getir: Getirici = async (url) => {
    if (url.includes('/users/me/usage/monthly')) {
      return new Response(JSON.stringify({ data: { totalUsageCreditsUsd: 0 } }), { status: 200 });
    }
    adresler.push(url);
    return new Response(JSON.stringify([]), { status: 200 });
  };

  await topla(db, new ApifyIstemcisi('sahte-token', getir), 'sonda', false, sessiz);

  assert.ok(adresler.length > 0, 'kanallar kosmali');
  for (const u of adresler) {
    assert.ok(u.includes('maxTotalChargeUsd='), `tavansiz cagri: ${u}`);
    const deger = Number(new URL(u).searchParams.get('maxTotalChargeUsd'));
    assert.ok(Number.isFinite(deger) && deger > 0, `gecersiz tavan: ${u}`);
    /* Apify $0.50'nin altini reddediyor; tavan bir harcama degil ust sinir. */
    assert.ok(deger >= 0.5, `Apify alt sinirinin altinda tavan: ${deger}`);
    assert.ok(deger <= 2, `tavan supheli derecede yuksek: ${deger}`);
  }
  db.close();
});
