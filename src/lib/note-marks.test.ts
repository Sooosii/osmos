import { describe, expect, test } from 'vitest';
import type { Note, Perfume, PerfumeNote } from '@/data/types';
import { NOTES } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import { buildNotePage, countUsedNotes } from './note-marks';

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

describe('buildNotePage — katman', () => {
  /*
    ⚠️ Nota sayfasındaki damganın (ÜST / KALP / DIP) tek kaynağı bu alan.
    Yanlış olsaydı belirti sessiz olurdu: sayfa açılır, liste dolu görünür,
    yalnızca hangi parfümde ne olduğu yanlış yazardı — ve kimse fark etmezdi.

    ⚠️ Tek bir notaya bakılıyor, 158'in hepsine değil: `buildNotePage` her
    çağrıda `projectToSpace` ile 52×52'lik bir matris kuruyor ve paletin
    tamamını gezen ilk yazım sınamayı 100 saniyeye çıkarıp zaman aşımına
    uğrattı. Katman eşlemesi notaya göre değişen bir şey değil; bir nota onu
    kanıtlıyor, üç katmanın da göründüğünü aşağıdaki sentetik sınama tutuyor.
  */
  test('gerçek veride taşıyıcının katmanı parfümün kendi kaydıyla aynı', () => {
    const limon = NOTES.find((candidate) => candidate.id === 'lemon');
    expect(limon, 'limon paletten kalkmış').toBeDefined();
    if (!limon) return;

    const { carriers } = buildNotePage(limon, PERFUMES);
    expect(carriers.length).toBeGreaterThan(0);

    for (const carrier of carriers) {
      const perfume = PERFUMES.find((candidate) => candidate.id === carrier.id);
      const entry = perfume?.notes.find((candidate) => candidate.noteId === limon.id);
      expect(carrier.tier, carrier.id).toBe(entry?.tier);
    }
  });

  test('üç katman da olduğu gibi taşınıyor', () => {
    const katmanlar = ['top', 'heart', 'base'] as const;
    const parfumler = katmanlar.map((tier, index) => ({
      ...perfume(`p${index}`, ['bergamot']),
      notes: [{ noteId: 'bergamot', tier, weight: 0.5 }],
    }));

    const { carriers } = buildNotePage(note('bergamot'), parfumler);
    expect(carriers.map((carrier) => carrier.tier).sort()).toEqual(['base', 'heart', 'top']);
  });
});
