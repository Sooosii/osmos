import { test } from 'node:test';
import assert from 'node:assert/strict';
import { olculecekAdaylar } from './adaylar.ts';
import type { Lead } from '../types.ts';

function lead(domain: string, ek: Partial<Lead> = {}): Lead {
  return {
    domain, platform: 'shopify', durum: 'zenginlestirildi',
    marka_ortusmesi: null, urun_ortusmesi: null,
  } as unknown as Lead;
}

const olculmus = (d: string): Lead => ({ ...lead(d), marka_ortusmesi: 7 }) as Lead;

test('varsayilan HERKESI olcer — olcum bayatlar, tam tarama dogru olan is', () => {
  const kume = [lead('a.com'), olculmus('b.com'), lead('c.com')];
  assert.deepEqual(olculecekAdaylar(kume, 10, false).map((l) => l.domain), ['a.com', 'b.com', 'c.com']);
});

/*
  27 yeni hedef icin 278 dukkanin tamami geziliyordu (~40 dk). Bayrak yalniz
  HIZ icin; kurali degistirmiyor, o yuzden varsayilan disinda kaliyor.
*/
test('--yalniz-yeni yalnizca hic olculmemisleri secer', () => {
  const kume = [lead('a.com'), olculmus('b.com'), lead('c.com')];
  assert.deepEqual(olculecekAdaylar(kume, 10, true).map((l) => l.domain), ['a.com', 'c.com']);
});

test('shopify olmayan ve zenginlestirilmemis kayitlar her iki halde de disarida', () => {
  const kume = [
    lead('a.com'),
    { ...lead('woo.com'), platform: 'woocommerce' } as Lead,
    { ...lead('bekleyen.com'), durum: 'yeni' } as Lead,
  ];
  assert.deepEqual(olculecekAdaylar(kume, 10, false).map((l) => l.domain), ['a.com']);
  assert.deepEqual(olculecekAdaylar(kume, 10, true).map((l) => l.domain), ['a.com']);
});

test('sinir secimden SONRA uygulaniyor — bayrak sinirin kotasini yemiyor', () => {
  const kume = [olculmus('b.com'), lead('a.com'), lead('c.com')];
  assert.deepEqual(olculecekAdaylar(kume, 1, true).map((l) => l.domain), ['a.com']);
});
