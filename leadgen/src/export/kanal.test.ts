import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kanalSec } from './outreach.ts';

/**
 * Kanal sırasının kapısı.
 *
 * ⚠️ **Bayat bir kuraldan doğdu (2026-08-18'de ölçülerek bulundu).** `kanalSec`
 * bir zamanlar `country === 'TR'` şartı taşıyordu ve gerekçesi *"e-posta
 * TÜRKİYE'de tek başına zayıf kanal"* idi — hedef pazar Türkiye sanılırken
 * yazılmış bir cümle. Liste sayıldığında tersi çıktı: bilinen en büyük grup
 * **Almanya (57)**, Türkiye 24. Ve Almanya'da **UWG §7 izinsiz ticari
 * e-postayı B2B'de bile yasaklıyor.**
 *
 * Yani eski kural, e-postası olan her Alman dükkânını **tam da yasak olan
 * kanala** yolluyordu. Karar 16 Ağustos'ta verilmişti ama koda girmemişti;
 * ölçüm 213 dükkânın yanlış kanalda olduğunu gösterdi.
 *
 * Kural: **Instagram varsa DM.** Mail yalnızca Instagram yokken.
 */

const lead = (instagram: string | null, email: string | null, country: string | null) =>
  ({ instagram, email, country });

test('Instagram varsa DM — e-posta da olsa', () => {
  assert.equal(kanalSec(lead('dukkan', 'info@dukkan.de', 'DE')), 'dm');
  assert.equal(kanalSec(lead('dukkan', 'info@dukkan.co.uk', 'GB')), 'dm');
  assert.equal(kanalSec(lead('dukkan', 'info@dukkan.com', null)), 'dm');
});

/*
  Asıl kapı: ülkeye bakan bir şart geri konursa bu düşer. Almanya'yı özellikle
  yazıyoruz çünkü yasağı olan ülke o ve eski kuralın kurbanı da oydu.
*/
test('ulke kanali DEGISTIRMIYOR — Almanya e-postaya dusmuyor', () => {
  const ulkeler = ['DE', 'TR', 'GB', 'CA', 'AE', 'CH', null];
  for (const u of ulkeler) {
    assert.equal(kanalSec(lead('dukkan', 'info@dukkan.com', u)), 'dm', `ulke: ${u}`);
  }
});

test('Instagram yoksa mail', () => {
  assert.equal(kanalSec(lead(null, 'info@dukkan.de', 'DE')), 'mail');
  assert.equal(kanalSec(lead('', 'info@dukkan.de', 'DE')), 'mail');
});

test('ikisi de yoksa kanal yok', () => {
  assert.equal(kanalSec(lead(null, null, 'DE')), 'yok');
  assert.equal(kanalSec(lead('', '', null)), 'yok');
});
