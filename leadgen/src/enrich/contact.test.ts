import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baslikCek, enIyiEposta, instagramSec, isAdresiMi } from './contact.ts';

test('kendi alan adindaki adres is adresi', () => {
  assert.ok(isAdresiMi('siparis@dukkan.com', 'dukkan.com'));
  assert.ok(isAdresiMi('info@shop.dukkan.com', 'dukkan.com'));
});

test('rol kutusu serbest postada da is adresi', () => {
  assert.ok(isAdresiMi('info@gmail.com', 'dukkan.com'));
});

/*
  Olculmus yanlis-pozitif: argosfragrances.com icin info@stagheaddesigns.com
  secilmisti — tema gelistiricisinin adresi. Baska bir SIRKETIN alan adindaki
  info@ o sirketin masasi, dukkanin degil.
*/
test('baska bir sirketin rol kutusu is adresi SAYILMIYOR', () => {
  assert.equal(isAdresiMi('info@stagheaddesigns.com', 'argosfragrances.com'), false);
});

test('yabanci sirket adresi secilmiyor, bos donuyor', () => {
  const { secilen } = enIyiEposta(['info@stagheaddesigns.com'], 'argosfragrances.com');
  assert.equal(secilen, null);
});

test('serbest postadaki rol kutusu hala seciliyor', () => {
  const { secilen } = enIyiEposta(['dukkanim@gmail.com'], 'dukkan.com');
  assert.equal(secilen, null, 'kisi adi gibi duran kutu secilmemeli');
  assert.equal(enIyiEposta(['info@gmail.com'], 'dukkan.com').secilen, 'info@gmail.com');
});

/*
  Sahibin kisiti: kisisel veri toplanmiyor. Kisi adi tasiyan serbest posta
  kutusu is adresi sayilmiyor ve secilmiyor.
*/
test('kisi adi tasiyan serbest posta is adresi DEGIL', () => {
  assert.equal(isAdresiMi('ahmet.yilmaz@gmail.com', 'dukkan.com'), false);
});

test('kendi alan adindaki rol kutusu once seciliyor', () => {
  const { secilen } = enIyiEposta(['ahmet@gmail.com', 'sarah@dukkan.com', 'info@dukkan.com'], 'dukkan.com');
  assert.equal(secilen, 'info@dukkan.com');
});

test('kisisel gorunumluler sayiliyor ama secilmiyor', () => {
  const { secilen, elenen } = enIyiEposta(['ahmet.yilmaz@gmail.com', 'veli@hotmail.com'], 'dukkan.com');
  assert.equal(secilen, null);
  assert.equal(elenen, 2);
});

test('instagram gezinti yollari kullanici adi sayilmiyor', () => {
  assert.equal(instagramSec('<a href="https://instagram.com/p/Cxyz">gonderi</a>'), null);
  assert.equal(instagramSec('<a href="https://instagram.com/explore/tags/x">etiket</a>'), null);
  assert.equal(instagramSec('<a href="https://www.instagram.com/scentsplit/">bizi izle</a>'), 'scentsplit');
});

test('sayfa basligi cekiliyor ve bosluklari toparlaniyor', () => {
  assert.equal(baslikCek('<html><head><title>  Ornek\n  Parfum </title>'), 'Ornek Parfum');
  assert.equal(baslikCek('<html><body>yok</body>'), '');
});
