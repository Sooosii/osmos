import { test } from 'node:test';
import assert from 'node:assert/strict';
import { olcekCikar, type OlcekGirdisi } from './olcek.ts';

const g = (o: Partial<OlcekGirdisi>): OlcekGirdisi =>
  ({ product_count: null, platform: 'shopify', notes: null, ...o });

test('urun sayisina gore olcek', () => {
  assert.equal(olcekCikar(g({ product_count: 12 })), 'tek-kisilik');
  assert.equal(olcekCikar(g({ product_count: 129 })), 'kucuk');
  assert.equal(olcekCikar(g({ product_count: 900 })), 'orta');
  assert.equal(olcekCikar(g({ product_count: 4000 })), 'buyuk');
});

/*
  Olculdu: 38 alan adinin 9'u 403 verdi ve dokuzu da buyuk evdi.
  Kucuk bir Shopify dukkani bu korumayi kurmuyor.
*/
test('kurumsal guvenlik duvari tek basina buyuk isareti', () => {
  assert.equal(olcekCikar(g({ notes: 'ROBOTA KAPALI (gercek tarayici gerekir): dior.com: HTTP 403' })), 'buyuk');
});

test('olculemeyen olcek uydurulmuyor', () => {
  assert.equal(olcekCikar(g({ product_count: null })), 'bilinmiyor');
});

/*
  ⚠️ Sahibin karari: kimse ELENMIYOR. Bu modul yalniz etiket uretiyor;
  bir gun buraya filtre eklenirse bu sinama onu yakalar.
*/
test('modul yalniz etiket donduruyor — eleme yetkisi YOK', () => {
  for (const sayi of [1, 50, 500, 5000, 100000]) {
    const o = olcekCikar(g({ product_count: sayi }));
    assert.ok(typeof o === 'string' && o.length > 0, 'her zaman bir etiket donmeli, hicbir zaman "ele" demiyor');
  }
});
