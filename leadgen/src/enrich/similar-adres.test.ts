import { test } from 'node:test';
import assert from 'node:assert/strict';
import { izAra, urunAdresleri } from './similar.ts';
import type { Cevap } from '../net/fetch.ts';

const cevap = (body: string): Cevap => ({
  ok: true, status: 200, finalUrl: 'https://d.com/', body, contentType: 'text/html', headers: {}, hata: null,
});

test('adaylar varsa hepsi urun adresine ceviriliyor', () => {
  const a = urunAdresleri('https://d.com', ['a', 'b'], cevap(''));
  assert.deepEqual([...a], ['https://d.com/products/a', 'https://d.com/products/b']);
});

test('aday yoksa ana sayfadaki ilk urun baglantisina duyuluyor', () => {
  const a = urunAdresleri('https://d.com', [], cevap('<a href="/product/gul-suyu">bak</a>'));
  assert.deepEqual([...a], ['https://d.com/product/gul-suyu']);
});

test('hicbir urun baglantisi yoksa bos liste — uydurma adres yok', () => {
  assert.deepEqual([...urunAdresleri('https://d.com', [], cevap('<p>bos sayfa</p>'))], []);
});

test('gorunur baslik iz olarak yakalaniyor ve baglamiyla saklaniyor', () => {
  const b = izAra('<section><h2>You may also like</h2><div>urunler</div></section>');
  assert.notEqual(b, null);
  assert.ok(b?.parca.includes('You may also like'));
});

test('turkce baslik da yakalaniyor', () => {
  assert.notEqual(izAra('<h3>Benzer ürünler</h3>'), null);
});

test('iz yoksa null — var diye isaretlenmiyor', () => {
  assert.equal(izAra('<div>sade bir urun sayfasi</div>'), null);
});
