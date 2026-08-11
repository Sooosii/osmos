import { describe, expect, test } from 'vitest';
import { PERFUMES } from '@/data/perfumes';
import { NOTES, getNote } from '@/data/notes';
import { FAMILY_ORDER, getFamily } from '@/data/families';
import { noteColor } from './note-marks';
import { projectToSpace } from './similarity';
import { SHARE_DOT_LIMIT, mapDots, noteDots, perfumeDots } from './share-marks';

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

describe('mapDots — paylasim kartindaki harita', () => {
  const BOX = 560;
  const dots = mapDots(PERFUMES, BOX);

  test('her parfum icin bir nokta', () => {
    expect(dots).toHaveLength(PERFUMES.length);
  });

  test('hicbir nokta kutunun disina tasmiyor', () => {
    for (const dot of dots) {
      expect(dot.x).toBeGreaterThanOrEqual(0);
      expect(dot.y).toBeGreaterThanOrEqual(0);
      expect(dot.x + dot.size).toBeLessThanOrEqual(BOX);
      expect(dot.y + dot.size).toBeLessThanOrEqual(BOX);
    }
  });

  test('IKI EKSEN AYNI CARPANLA — harita gerilmiyor', () => {
    /*
      ⚠️ Kararın kalbi. Eksenler ayrı ayrı normalize edilseydi harita gerilir
      ve uzaklıklar yalan söylerdi; sitenin bütün iddiası uzaklık.

      Ölçü: nokta bulutunun kartta kapladığı en/boy oranı, ham koordinatların
      en/boy oranıyla aynı kalmalı.
    */
    const raw = projectToSpace(PERFUMES);
    const rawW = Math.max(...raw.map((p) => p.x)) - Math.min(...raw.map((p) => p.x));
    const rawH = Math.max(...raw.map((p) => p.y)) - Math.min(...raw.map((p) => p.y));

    const cardW = Math.max(...dots.map((d) => d.x)) - Math.min(...dots.map((d) => d.x));
    const cardH = Math.max(...dots.map((d) => d.y)) - Math.min(...dots.map((d) => d.y));

    expect(cardW / cardH).toBeCloseTo(rawW / rawH, 5);
  });

  test('renk aile zincirinden geliyor, uydurulmuyor', () => {
    const palette = new Set(FAMILY_ORDER.map((family) => getFamily(family).color));
    for (const dot of dots) expect(palette.has(dot.color)).toBe(true);
  });

  test('kararli — ayni girdi ayni kart', () => {
    expect(mapDots(PERFUMES, BOX)).toEqual(dots);
  });
});
