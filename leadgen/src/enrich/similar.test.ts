import { test } from 'node:test';
import assert from 'node:assert/strict';
import { betikleriAt } from './similar.ts';

/*
  Olculmus yanlis-pozitif: aaronterencehughes.com "oneri blogu var" cikmisti.
  Eslesme <script data-sections="...,product-recommendations,..."> icindeydi —
  temanin hangi bolumleri TASIDIGINI soyleyen bir manifest, o sayfada blogun
  GOSTERILDIGINI degil.
*/
test('betik icindeki bolum manifesti taramaya girmiyor', () => {
  const html = '<script id="sections-script" data-sections="main-product,product-recommendations,header">x</script>';
  assert.ok(!betikleriAt(html).includes('product-recommendations'));
});

test('stil bloklari da atiliyor', () => {
  assert.ok(!betikleriAt('<style>.related-products{display:none}</style>').includes('related-products'));
});

test('gercek eleman taramada KALIYOR', () => {
  const html = '<product-recommendations class="related-products"></product-recommendations>';
  assert.ok(betikleriAt(html).includes('product-recommendations'));
});

test('gorunur baslik taramada kaliyor', () => {
  const html = '<section><h2>You may also like</h2></section>';
  assert.ok(betikleriAt(html).includes('You may also like'));
});
