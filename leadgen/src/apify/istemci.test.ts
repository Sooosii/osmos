import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApifyIstemcisi, sondadanTahmin, type Getirici } from './istemci.ts';
import { ACTORLAR } from './actors.ts';

/** Sahte getirici — hicbir istek aga cikmiyor, tek kurus harcanmiyor. */
const sahte = (govde: unknown, ok = true): Getirici => async (_u, _s) =>
  new Response(JSON.stringify(govde), { status: ok ? 200 : 402 });

test('token yoksa istemci kurulmuyor, Faz A etkilenmiyor', () => {
  const eski = process.env['APIFY_TOKEN'];
  delete process.env['APIFY_TOKEN'];
  assert.equal(ApifyIstemcisi.ortamdan(sahte([])), null);
  if (eski !== undefined) process.env['APIFY_TOKEN'] = eski;
});

test('bos token acikca reddediliyor', () => {
  assert.throws(() => new ApifyIstemcisi('   ', sahte([])), /APIFY_TOKEN bos/);
});

/*
  Olay basi ucretlendirmede ust sinirsiz bir calistirma butun butceyi
  tek istekte yakabilir. maxItems her cagrida adreste olmali.
*/
test('her calistirma maxItems tasiyor', async () => {
  let gorulenUrl = '';
  const izleyen: Getirici = async (u, s) => { gorulenUrl = u; return sahte([{ a: 1 }])(u, s); };
  const i = new ApifyIstemcisi('sahte-token', izleyen);
  await i.calistir('apify/google-search-scraper', { queries: 'x' }, 20);
  assert.ok(gorulenUrl.includes('maxItems=20'), gorulenUrl);
  assert.ok(gorulenUrl.includes('apify~google-search-scraper'), 'actor kimligi ~ ile kacislanmali');
});

test('HTTP hatasi sessizce yutulmuyor', async () => {
  const i = new ApifyIstemcisi('sahte-token', sahte({ error: 'kredi bitti' }, false));
  await assert.rejects(() => i.calistir('a/b', {}, 5), /HTTP 402/);
});

test('sonda raporu tam calistirma icin ONAY istiyor', () => {
  const r = sondadanTahmin(ACTORLAR.googleArama, 20, 500, 0, false);
  assert.equal(r.karar.izin, 'onay-gerek');
  assert.equal(r.tamTahmin.toplamUsd, 0.9, 'resmi actor: 500 sayfa × $0.0018');
});

test('kredi bitmisse sonda raporu HAYIR diyor', () => {
  const r = sondadanTahmin(ACTORLAR.etsy, 20, 500, 4.9, true);
  assert.equal(r.karar.izin, 'hayir');
});
