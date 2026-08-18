import { describe, expect, it } from 'vitest';
import { kanalSec } from './outreach';

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

describe('kanalSec', () => {
  it('Instagram varsa DM — e-posta da olsa', () => {
    expect(kanalSec(lead('dukkan', 'info@dukkan.de', 'DE'))).toBe('dm');
    expect(kanalSec(lead('dukkan', 'info@dukkan.co.uk', 'GB'))).toBe('dm');
    expect(kanalSec(lead('dukkan', 'info@dukkan.com', null))).toBe('dm');
  });

  /*
    Asıl kapı: ülkeye bakan bir şart geri konursa bu düşer. Almanya'yı özellikle
    yazıyoruz çünkü yasağı olan ülke o ve eski kuralın kurbanı da oydu.
  */
  it('ulke kanali DEGISTIRMIYOR — Almanya e-postaya dusmuyor', () => {
    const ulkeler = ['DE', 'TR', 'GB', 'CA', 'AE', 'CH', null];
    for (const u of ulkeler) {
      expect(kanalSec(lead('dukkan', 'info@dukkan.com', u)), `ulke: ${u}`).toBe('dm');
    }
  });

  it('Instagram yoksa mail', () => {
    expect(kanalSec(lead(null, 'info@dukkan.de', 'DE'))).toBe('mail');
    expect(kanalSec(lead('', 'info@dukkan.de', 'DE'))).toBe('mail');
  });

  it('ikisi de yoksa kanal yok', () => {
    expect(kanalSec(lead(null, null, 'DE'))).toBe('yok');
    expect(kanalSec(lead('', '', null))).toBe('yok');
  });
});
