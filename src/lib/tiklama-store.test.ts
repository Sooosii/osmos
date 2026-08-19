import { describe, expect, test } from 'vitest';
import { OSMOS_ALL } from '@/data/osmos-catalog';
import { ALAN_AYRAC, alanAdi, ayDilimi, sayacAnahtari, satirlariCoz } from '@/lib/tiklama-store';

/**
 * Sayacın saf parçaları ve anahtar biçiminin kapısı.
 *
 * Depoya yazma yolu `app/api/tiklama/route.test.ts`te uçtan uca dönüyor;
 * burada tutulan şey **anahtar biçiminin katalogla çakışmaması**. Bir parfüm
 * kimliği ya da satıcı adı ayracı taşısaydı, çözme adımı alanı yanlış yerden
 * bölerdi ve rapor sessizce başka bir satıra yazardı — ölçüm hatalarının en
 * kötü sınıfı: sistem çalışır, yanlış çalışır.
 */

describe('tiklama sayaci — anahtar bicimi', () => {
  test('hicbir parfum kimligi ayraci tasimiyor', () => {
    for (const perfume of OSMOS_ALL) {
      expect(perfume.id.includes(ALAN_AYRAC), `${perfume.id}: kimlikte "${ALAN_AYRAC}"`).toBe(
        false,
      );
    }
  });

  test('hicbir satici adi ayraci tasimiyor', () => {
    for (const perfume of OSMOS_ALL) {
      for (const retailer of perfume.retailers ?? []) {
        expect(
          retailer.name.includes(ALAN_AYRAC),
          `${perfume.id} → ${retailer.name}: adda "${ALAN_AYRAC}"`,
        ).toBe(false);
      }
    }
  });

  test('anahtar kiraciyi ve ayi tasiyor — sayaclar karismiyor', () => {
    expect(sayacAnahtari('nischengold', '2026-08')).toBe('tiklama:nischengold:2026-08');
    expect(sayacAnahtari('osmos', '2026-08')).not.toBe(sayacAnahtari('nischengold', '2026-08'));
  });

  test('ay dilimi UTC ve iki haneli', () => {
    expect(ayDilimi(new Date('2026-08-19T21:53:00Z'))).toBe('2026-08');
    expect(ayDilimi(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01');
    /* Yerel saat aya taşarken bile UTC okunuyor: rapor sunucunun konumundan bağımsız. */
    expect(ayDilimi(new Date('2026-08-31T23:30:00Z'))).toBe('2026-08');
  });
});

describe('tiklama sayaci — satir cozme', () => {
  test('duz dizi satirlara cevriliyor, coktan aza sirali', () => {
    const flat = [alanAdi('a-bir', 'Luckyscent'), '3', alanAdi('b-iki', 'Notino'), '7'];
    expect(satirlariCoz(flat)).toEqual([
      { perfumeId: 'b-iki', retailer: 'Notino', sayi: 7 },
      { perfumeId: 'a-bir', retailer: 'Luckyscent', sayi: 3 },
    ]);
  });

  test('bos hash bos rapor', () => {
    expect(satirlariCoz([])).toEqual([]);
  });

  test('bozuk alan atlaniyor, rapor dusmuyor', () => {
    const flat = ['ayracsiz-alan', '4', alanAdi('a-bir', 'Luckyscent'), '2', alanAdi('c', 'X'), 'sayi-degil'];
    expect(satirlariCoz(flat)).toEqual([{ perfumeId: 'a-bir', retailer: 'Luckyscent', sayi: 2 }]);
  });

  test('satici adinda bosluk ve nokta korunuyor', () => {
    const flat = [alanAdi('a-bir', 'Scent Split'), '1'];
    expect(satirlariCoz(flat)).toEqual([
      { perfumeId: 'a-bir', retailer: 'Scent Split', sayi: 1 },
    ]);
  });
});
