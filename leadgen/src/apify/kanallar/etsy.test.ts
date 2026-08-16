import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adtanSorgu, dukkanAdlari } from './etsy.ts';

test('tekil dukkan adlari cikiyor', () => {
  const a = dukkanAdlari([
    { shopName: 'DecantHouse' }, { shop_name: 'DecantHouse' },
    { seller: 'ScentLab' }, { title: 'adsiz ilan' },
  ]);
  assert.deepEqual([...a], ['DecantHouse', 'ScentLab']);
});

/*
  Etsy saticisinin widget gomecegi kendi sitesi yok; sonda yalniz ADI
  aliyor, alan adi bedava Google adiminda araniyor.
*/
test('dukkan adi kendi sitesini arayan sorguya ceviriliyor', () => {
  const s = adtanSorgu('DecantHouse');
  assert.ok(s.includes('DecantHouse'));
  assert.ok(s.includes('-site:etsy.com'), 'Etsy kendi sayfalari sonuctan dusmeli');
});
