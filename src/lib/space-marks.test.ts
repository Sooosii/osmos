import { describe, expect, test } from 'vitest';
import { PERFUMES } from '@/data/perfumes';
import { buildMarks } from './space-marks';

describe('uzay işaretleri', () => {
  test('alt uzayın filtre değerlerini ortak parfüm cetvelinden üretir', () => {
    const subset = PERFUMES.slice(8, 20);
    const globalMarks = buildMarks(PERFUMES, 'en');
    const localMarks = buildMarks(subset, 'en', { feelUniverse: PERFUMES });
    const globalById = new Map(globalMarks.map((mark) => [mark.id, mark]));

    for (const mark of localMarks) {
      expect(mark.feel).toEqual(globalById.get(mark.id)?.feel);
    }
  });

  test('komşuları yalnız çizilen uzayın içinden seçer', () => {
    const subset = PERFUMES.slice(8, 20);
    const ids = new Set(subset.map((perfume) => perfume.id));
    const marks = buildMarks(subset, 'en', { feelUniverse: PERFUMES });

    for (const mark of marks) {
      expect(mark.neighborIds.every((id) => ids.has(id))).toBe(true);
    }
  });
});
