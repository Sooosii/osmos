import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cezaGecikmesi, frenBeklemesi } from './fetch.ts';

/*
  ⚠️ Bu sinama olculmus bir KILITLENMENIN karsiligi. Ceza gecikmesi her
  429'da uce katlaniyordu ve tavani yoktu: 2,5sn → 7,5 → 22,5 → 67 → 202 →
  607. Bir isci on dakika uyuyabiliyordu; dort iscinin hepsi takilinca kosu
  bes dakika boyunca tek satir ilerlemedi. Ustel geri cekilme ust sinirsiz
  yazilirsa geri cekilme degil kilitlenme olur.
*/
test('ceza gecikmesi buyur ama TAVANI asmaz', () => {
  let g = 2500;
  for (let i = 0; i < 20; i += 1) g = cezaGecikmesi(g);
  assert.ok(g <= 20_000, `tavan asildi: ${g}`);
});

test('ceza gecikmesi gercekten buyuyor — fren islevsiz degil', () => {
  assert.ok(cezaGecikmesi(2500) > 2500);
});

test('Retry-After basligi kullaniliyor ama tavanla', () => {
  assert.equal(frenBeklemesi(5), 5000, 'baslik saniyeden milisaniyeye');
  assert.ok(frenBeklemesi(3600) <= 25_000, 'bir saatlik Retry-After boru hattini durdurmamali');
});

test('Retry-After yoksa taban bekleme kullaniliyor', () => {
  assert.ok(frenBeklemesi(null) > 0);
  assert.ok(frenBeklemesi(0) > 0);
});
