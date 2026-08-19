import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  katalogParfumSayisi, katalogTohumlari, kiraciyaOzelDosyalar, varsayilanKatalogDizini,
} from './seed.ts';

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

/**
 * ⚠️ Mektuptaki sayı iddiasının kapısı (2026-08-19'da eklendi).
 *
 * `katalogParfumSayisi` bütün dosyaları sayıyordu ve 154 buluyordu; oysa
 * `space-3-c.ts`teki dört kayıt yalnız kiracı demoları için girilmiş ve ana
 * sitenin uzaylarına hiç girmiyor. Mektup *"154 fragrances are mapped"*
 * diyordu, osmos.me'de sayılabilen ise 150 — ve o cümlenin bütün değeri
 * sayılabilir olmasında.
 */
test('kiraciya ozel kayitlar mektuptaki sayidan dusuyor', () => {
  const dizin = varsayilanKatalogDizini();
  const haric = kiraciyaOzelDosyalar(dizin);

  assert.ok(haric.size > 0, 'kiraciya ozel dosya bulunamadi — turetme kirilmis olabilir');
  assert.ok(haric.has('space-3-c.ts'), `beklenen dosya yok: ${[...haric].join(', ')}`);

  /* Haric tutulanlar gercekten sayidan dusuyor mu. */
  const hepsi = readdirSync(dizin)
    .filter((d) => d.endsWith('.ts') && !d.endsWith('.test.ts'))
    .reduce((n, d) => n + (readFileSync(join(dizin, d), 'utf8').match(/^ {4}id: '/gm) ?? []).length, 0);

  assert.ok(
    katalogParfumSayisi(dizin) < hepsi,
    'kiraciya ozel kayitlar hala sayiliyor',
  );
});
