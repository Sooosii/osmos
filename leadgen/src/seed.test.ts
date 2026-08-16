import { test } from 'node:test';
import assert from 'node:assert/strict';
import { katalogTohumlari, varsayilanKatalogDizini } from './seed.ts';

const tohumlar = katalogTohumlari(varsayilanKatalogDizini());

test('katalogdan gercek satici alan adlari cikiyor', () => {
  assert.ok(tohumlar.length >= 30, `beklenenden az tohum: ${tohumlar.length}`);
});

test('her tohumun alan adi normallesmis: www yok, protokol yok, yol yok', () => {
  for (const t of tohumlar) {
    assert.ok(!t.domain.startsWith('www.'), t.domain);
    assert.ok(!t.domain.includes('/'), t.domain);
    assert.ok(!t.domain.includes(':'), t.domain);
    assert.ok(t.domain.includes('.'), t.domain);
  }
});

test('alan adlari tekil — ayni dukkana iki satir yok', () => {
  const kume = new Set(tohumlar.map((t) => t.domain));
  assert.equal(kume.size, tohumlar.length);
});

/*
  Katalogda `us.diptyqueparis.com` ve `diptyqueparis.com` ayri ayri geciyor.
  Ikisi de AYNI isletme; birlesmezlerse ayni dukkana iki mektup gider.
*/
test('alt alan adli magazalar apex ile birlesmis', () => {
  const d = tohumlar.filter((t) => t.domain.includes('diptyque'));
  assert.equal(d.length, 1, 'diptyque tek satir olmali');
  assert.equal(d[0]?.domain, 'diptyqueparis.com');
});

test('her tohum kaynak adresini tasiyor', () => {
  for (const t of tohumlar) {
    assert.ok(t.seedUrl.startsWith('https://'), t.seedUrl);
    assert.ok(t.shopName.trim() !== '');
  }
});
