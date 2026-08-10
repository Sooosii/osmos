import { describe, expect, test } from 'vitest';
import { PERFUMES } from '@/data/perfumes';
import { NOTES, getNote } from '@/data/notes';
import { getFamily } from '@/data/families';
import { noteColor } from './note-marks';
import { SHARE_DOT_LIMIT, noteDots, perfumeDots } from './share-marks';

/**
 * Paylaşım kartının imza satırını besleyen modül.
 *
 * `opengraph-image.tsx` sınanamaz; bu modül sınanabiliyor ve kartın taşıdığı
 * bütün kararlar burada.
 */

/** Altıdan fazla notası olan bir parfüm — sınır sınanabilsin diye. */
const KALABALIK = PERFUMES.find((p) => p.notes.length > SHARE_DOT_LIMIT)!;

describe('perfumeDots', () => {
  test('en fazla alti nokta', () => {
    expect(KALABALIK.notes.length).toBeGreaterThan(SHARE_DOT_LIMIT);
    expect(perfumeDots(KALABALIK)).toHaveLength(SHARE_DOT_LIMIT);
  });

  test('agirliktan hafife siralaniyor', () => {
    const dots = perfumeDots(KALABALIK);
    for (let i = 1; i < dots.length; i += 1) {
      expect(dots[i - 1].weight).toBeGreaterThanOrEqual(dots[i].weight);
    }
  });

  test('altidan az notasi olan parfum kisa liste veriyor, eksik degil', () => {
    const az = PERFUMES.find((p) => p.notes.length < SHARE_DOT_LIMIT);
    if (!az) return;
    expect(perfumeDots(az)).toHaveLength(az.notes.length);
  });

  test('her noktanin rengi gercek bir aile rengi', () => {
    const kullanilan = new Set(PERFUMES.flatMap((p) => perfumeDots(p)).map((d) => d.color));
    const aileRenkleri = new Set(
      NOTES.flatMap((n) => Object.keys(n.families)).map(
        (id) => getFamily(id as Parameters<typeof getFamily>[0]).color,
      ),
    );
    for (const renk of kullanilan) expect(aileRenkleri.has(renk)).toBe(true);
  });
});

describe('noteDots', () => {
  test('notayi tasiyan parfumlerin renkleri, en fazla alti', () => {
    const tasinan = NOTES.find((n) =>
      PERFUMES.some((p) => p.notes.some((e) => e.noteId === n.id)),
    )!;
    const dots = noteDots(tasinan, PERFUMES);
    expect(dots.length).toBeGreaterThan(0);
    expect(dots.length).toBeLessThanOrEqual(SHARE_DOT_LIMIT);
  });

  test('hic tasiyicisi olmayan nota bos liste veriyor', () => {
    // Palet ile kullanım listesi ayrı şeyler — gerekçe `note-marks.ts`te.
    const bos = NOTES.find((n) => !PERFUMES.some((p) => p.notes.some((e) => e.noteId === n.id)));
    if (!bos) return;
    expect(noteDots(bos, PERFUMES)).toEqual([]);
  });
});

describe('renk zinciri tek', () => {
  test('ilk noktanin rengi, en agir notanin kendi rengiyle ayni', () => {
    // İkinci bir renk kaynağı açılmadığının sınaması: bağımsız hesaplanan
    // değerle karşılaştırılıyor, "dize mi" diye bakılmıyor.
    for (const perfume of PERFUMES) {
      const enAgir = [...perfume.notes].sort((a, b) => b.weight - a.weight)[0];
      expect(perfumeDots(perfume)[0].color).toBe(noteColor(getNote(enAgir.noteId)));
    }
  });

  test('noktanin agirligi notanin kompozisyondaki agirligi', () => {
    const perfume = PERFUMES[0];
    const enAgir = [...perfume.notes].sort((a, b) => b.weight - a.weight)[0];
    expect(perfumeDots(perfume)[0].weight).toBe(enAgir.weight);
  });
});
