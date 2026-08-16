import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvMetni, hucre } from './csv.ts';

test('duz deger tirnaklanmiyor', () => {
  assert.equal(hucre('ornek.com'), 'ornek.com');
});

test('virgul, tirnak ve satir sonu kacisliyor', () => {
  assert.equal(hucre('a,b'), '"a,b"');
  assert.equal(hucre('de"mek'), '"de""mek"');
  assert.equal(hucre('iki\nsatir'), '"iki\nsatir"');
});

test('null bos hucre', () => {
  assert.equal(hucre(null), '');
});

/*
  Mektup govdeleri CSV'ye giriyor ve Excel bas taraftaki `=` ya da `+`
  isaretini FORMUL sanip calistiriyor. Tek tirnak onu metne cevirir.
*/
test('formul enjeksiyonu etkisizlestiriliyor', () => {
  assert.equal(hucre('=1+1'), "'=1+1");
  assert.equal(hucre('+A1'), "'+A1");
  assert.equal(hucre('-cmd'), "'-cmd");
});

test('BOM basta duruyor ve satirlar CRLF', () => {
  const m = csvMetni(['a', 'b'], [['1', '2']]);
  assert.ok(m.startsWith('﻿'), 'Excel icin BOM sart');
  assert.ok(m.includes('\r\n'));
});
