import { describe, expect, test } from 'vitest';
import { PERFUMES } from '../data/perfumes';
import type { Perfume } from '../data/types';
import { characterVector } from './similarity';
import { characterOf } from './perfume-character';

/** Sınama için parfüm — gerçek nota kimlikleri şart, ortalama onlardan çıkıyor. */
function madeOf(notes: Perfume['notes']): Perfume {
  return { id: 'sinama', name: 'Sinama', brand: 'Sinama', year: 2026, notes, curated: false };
}

describe('characterOf', () => {
  test('alan sırası vektörle birebir aynı — 52 parfümün hepsinde', () => {
    /*
      ⚠️ Asıl sınama bu. `characterVector` konum döndürüyor, burası ad veriyor;
      ikisi kayarsa parfümün dokusu sıcaklık sütununda çizilir ve kimse fark
      etmez. `AXIS_ORDER` (`note-measures.ts`) da aynı sırayı varsayıyor.
    */
    for (const perfume of PERFUMES) {
      const [temperature, texture, cleanliness, proximity] = characterVector(perfume);
      expect(characterOf(perfume), perfume.id).toEqual({
        temperature,
        texture,
        cleanliness,
        proximity,
      });
    }
  });

  test('ağırlık gerçekten sayılıyor — baskın nota sonucu kendine çekiyor', () => {
    const light = madeOf([
      { noteId: 'bergamot', tier: 'top', weight: 0.1 },
      { noteId: 'vanilla', tier: 'base', weight: 0.9 },
    ]);
    const heavy = madeOf([
      { noteId: 'bergamot', tier: 'top', weight: 0.9 },
      { noteId: 'vanilla', tier: 'base', weight: 0.1 },
    ]);

    // Vanilya sıcak, bergamot soğuk: ağırlık yer değiştirince yön de değişiyor.
    expect(characterOf(light).temperature).toBeGreaterThan(characterOf(heavy).temperature);
  });

  test('karışım malzemesinin dışına taşmıyor', () => {
    /*
      Ortalamanın sözü: iki notalı bir parfüm ikisinin arasında durur. Toplam
      alınsaydı buradaki değer iki notanın da dışına çıkardı.
    */
    const blend = madeOf([
      { noteId: 'bergamot', tier: 'top', weight: 0.5 },
      { noteId: 'vanilla', tier: 'base', weight: 0.5 },
    ]);
    const only = (noteId: string) =>
      characterOf(madeOf([{ noteId, tier: 'base', weight: 1 }])).temperature;

    const low = Math.min(only('bergamot'), only('vanilla'));
    const high = Math.max(only('bergamot'), only('vanilla'));

    expect(characterOf(blend).temperature).toBeGreaterThanOrEqual(low);
    expect(characterOf(blend).temperature).toBeLessThanOrEqual(high);
  });

  test('notasız parfüm sıfırlanıyor — sıfıra bölme yok', () => {
    expect(characterOf(madeOf([]))).toEqual({
      temperature: 0,
      texture: 0,
      cleanliness: 0,
      proximity: 0,
    });
  });

  test('bütün değerler −1…+1 aralığında', () => {
    for (const perfume of PERFUMES) {
      for (const value of Object.values(characterOf(perfume))) {
        expect(value, perfume.id).toBeGreaterThanOrEqual(-1);
        expect(value, perfume.id).toBeLessThanOrEqual(1);
      }
    }
  });
});
