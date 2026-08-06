import { describe, expect, test } from 'vitest';
import type { Note, Perfume, PerfumeNote } from '@/data/types';
import { NOTES } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import { countUsedNotes } from './note-marks';

/**
 * Paletin ne kadarının seçkide gerçekten geçtiği.
 *
 * Sayı nota dizininin çerçevesinde duruyor ve orada durmasının tek gerekçesi
 * doğru olması: `ScreenFrame` uydurma sayaç taşımıyor. Buradaki sınamalar da
 * sayının yanlış çıkabileceği üç yolu tutuyor — çift sayma, palet dışı kimlik,
 * ve sıfır/tam uçları.
 */

/** Sınamanın umursamadığı alanlar; hepsi tipin zorunlu kıldığı için var. */
function note(id: string): Note {
  return {
    id,
    name: { en: id, tr: id },
    families: { woody: 1 },
    volatility: { peakMinutes: 10, halfLifeMinutes: 60 },
    character: { temperature: 0, texture: 0, cleanliness: 0, proximity: 0 },
    description: { en: id, tr: id },
  };
}

function perfume(id: string, noteIds: readonly string[]): Perfume {
  const notes: readonly PerfumeNote[] = noteIds.map((noteId) => ({
    noteId,
    tier: 'heart',
    weight: 0.5,
  }));

  return { id, name: id, brand: id, year: 2020, notes, curated: false };
}

describe('countUsedNotes', () => {
  test('hiçbir parfüm yoksa hiçbir nota kullanılmıyor', () => {
    expect(countUsedNotes([note('bergamot'), note('sandal')], [])).toBe(0);
  });

  test('tek parfümde geçen nota sayılıyor, geçmeyen sayılmıyor', () => {
    const palette = [note('bergamot'), note('sandal')];
    const shelf = [perfume('tek', ['bergamot'])];

    expect(countUsedNotes(palette, shelf)).toBe(1);
  });

  test('aynı nota iki parfümde geçse de bir kez sayılıyor', () => {
    const palette = [note('bergamot'), note('sandal')];
    const shelf = [perfume('bir', ['bergamot']), perfume('iki', ['bergamot'])];

    expect(countUsedNotes(palette, shelf)).toBe(1);
  });

  /*
    Asıl sebep bu: `Set` boyutunu saymak kolay olurdu ama parfüm verisi palette
    olmayan bir kimliğe işaret ederse ekranda 136'yı aşan bir sayı belirirdi.
    Sayılan şey kesişim.
  */
  test('palette olmayan nota kimliği sayıya girmiyor', () => {
    const palette = [note('bergamot')];
    const shelf = [perfume('hayalet', ['bergamot', 'olmayan-nota'])];

    expect(countUsedNotes(palette, shelf)).toBe(1);
  });

  test('gerçek veride sayı paletin içinde kalıyor ve sıfır değil', () => {
    const used = countUsedNotes(NOTES, PERFUMES);

    expect(used).toBeGreaterThan(0);
    expect(used).toBeLessThanOrEqual(NOTES.length);
  });
});
