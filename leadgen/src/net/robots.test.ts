import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ayristirRobots } from './robots.ts';

test('bos dosyada her yol serbest', () => {
  assert.ok(ayristirRobots('').izinliMi('/products.json'));
});

test('yildiz grubundaki Disallow tutuyor', () => {
  const r = ayristirRobots('User-agent: *\nDisallow: /cart\nDisallow: /checkout');
  assert.equal(r.izinliMi('/cart'), false);
  assert.equal(r.izinliMi('/checkout/x'), false);
  assert.ok(r.izinliMi('/products.json'));
});

/*
  Baska bir robotun kurallarina uymak bizi gereksiz yere disarida birakir;
  Shopify'in varsayilan robots.txt'i tam olarak boyle uzun bir dosya.
*/
test('baska bir user-agent in kurallari bizi baglamiyor', () => {
  const r = ayristirRobots('User-agent: AhrefsBot\nDisallow: /\n\nUser-agent: *\nDisallow: /cart');
  assert.ok(r.izinliMi('/products.json'));
  assert.equal(r.izinliMi('/cart'), false);
});

test('en uzun kural kazaniyor: Allow, genel Disallow i eziyor', () => {
  const r = ayristirRobots('User-agent: *\nDisallow: /\nAllow: /products.json');
  assert.ok(r.izinliMi('/products.json'));
  assert.equal(r.izinliMi('/rastgele'), false);
});

test('joker ve satir sonu capasi', () => {
  const r = ayristirRobots('User-agent: *\nDisallow: /*.json$');
  assert.equal(r.izinliMi('/products.json'), false);
  assert.ok(r.izinliMi('/products.json?limit=250'), 'capa sonrasi sorgu eslesmemeli');
  assert.ok(r.izinliMi('/pages/contact'));
});

test('yorumlar ve bos Disallow yok sayiliyor', () => {
  const r = ayristirRobots('User-agent: *   # herkes\nDisallow:      \nDisallow: /gizli # not');
  assert.ok(r.izinliMi('/'));
  assert.equal(r.izinliMi('/gizli'), false);
});
