import { describe, expect, test } from 'vitest';
import {
  TAKIMYILDIZ_SCROLL_SCREENS,
  takimyildizFazlari,
  takimyildizIlerlemesi,
} from './acilis-takimyildizi';

test('2.2 viewport heights drives the complete rail', () => {
  expect(TAKIMYILDIZ_SCROLL_SCREENS).toBe(2.2);
  expect(takimyildizIlerlemesi(0.25, 220, 1000)).toBeCloseTo(0.35);
  expect(takimyildizIlerlemesi(0.02, -220, 1000)).toBe(0);
  expect(takimyildizIlerlemesi(0.98, 220, 1000)).toBe(1);
});

describe('narrative phases', () => {
  test('assembles before squeezing', () => {
    expect(takimyildizFazlari(0).assemble).toBe(0);
    expect(takimyildizFazlari(0.3).assemble).toBe(1);
    expect(takimyildizFazlari(0.46).squeeze).toBeCloseTo(1);
    expect(takimyildizFazlari(0.7).squeeze).toBe(0);
  });

  test('dissolves before revealing the live space', () => {
    expect(takimyildizFazlari(0.6).dissolve).toBe(0);
    expect(takimyildizFazlari(0.77).reveal).toBe(0);
    expect(takimyildizFazlari(1)).toEqual({
      assemble: 1,
      squeeze: 0,
      mist: 0,
      dissolve: 1,
      reveal: 1,
    });
  });
});
