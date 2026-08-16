import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gonderilerdenKullanicilar, HASHTAGLER, profilAdresi, profillerdenAdaylar } from './instagram.ts';

test('dort pazarin etiketleri de var', () => {
  assert.ok(HASHTAGLER.includes('perfumedecants'));
  assert.ok(HASHTAGLER.some((h) => h.startsWith('parfum')), 'turkce etiket yok');
  assert.ok(HASHTAGLER.length >= 10);
});

test('gonderilerden tekil kullanici adi cikiyor', () => {
  const k = gonderilerdenKullanicilar([
    { ownerUsername: 'DecantShop' },
    { ownerUsername: 'decantshop' },
    { username: 'ikinci' },
    { ownerUsername: '  ' },
  ]);
  assert.deepEqual([...k], ['decantshop', 'ikinci']);
});

test('profildeki dis baglanti adres olarak aliniyor', () => {
  assert.equal(profilAdresi({ externalUrl: 'https://scentsplit.com' }), 'https://scentsplit.com');
});

/*
  Baglanti toplayicilari alan adi degil ara duraktir: linktr.ee'yi dukkan
  sanmak butun listeyi tek bir alan adina cokertir.
*/
test('linktree gibi ara duraklar adres sayilmiyor', () => {
  assert.equal(profilAdresi({ externalUrl: 'https://linktr.ee/dukkan' }), null);
  assert.equal(profilAdresi({ externalUrl: 'https://beacons.ai/x' }), null);
});

test('dis baglanti bossa biyografideki cıplak adres yakalaniyor', () => {
  const a = profilAdresi({ biography: 'nis parfum dekantlari · siparis: mydecants.com.tr' });
  assert.equal(a, 'https://mydecants.com.tr');
});

test('biyoda adres yoksa null — uydurma yok', () => {
  assert.equal(profilAdresi({ biography: 'parfum sevdalisi, DM ile siparis' }), null);
});

test('profiller adaya ceviriliyor ve instagram adi tasiniyor', () => {
  const h = profillerdenAdaylar([
    { username: 'decantshop', fullName: 'Decant Shop', externalUrl: 'https://decantshop.com' },
  ]);
  assert.equal(h.adaylar.length, 1);
  assert.equal(h.adaylar[0]?.domain, 'decantshop.com');
  assert.equal(h.adaylar[0]?.kaynak, 'instagram');
  assert.equal(h.instagramlar.get('decantshop.com'), 'decantshop');
});

test('sitesi olmayan hesap elenip sebebi sayiliyor', () => {
  const h = profillerdenAdaylar([{ username: 'yalnizdm', biography: 'DM ile siparis' }]);
  assert.equal(h.adaylar.length, 0);
  assert.equal(h.elenen, 1);
  assert.ok(h.sebepler.has('biyoda site adresi yok'));
});

test('ayni siteyi gosteren iki hesap tek aday ediyor', () => {
  const h = profillerdenAdaylar([
    { username: 'a', externalUrl: 'https://ayni.com' },
    { username: 'b', externalUrl: 'https://www.ayni.com/sayfa' },
  ]);
  assert.equal(h.adaylar.length, 1);
  assert.equal(h.tekrar, 1);
});
