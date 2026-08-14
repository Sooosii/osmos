import { describe, expect, test } from 'vitest';
import {
  TAKIMYILDIZ_SCROLL_SCREENS,
  takimyildizFazlari,
  takimyildizIlerlemesi,
} from './acilis-takimyildizi';

test('0.9 viewport heights opens directly into the live space', () => {
  expect(TAKIMYILDIZ_SCROLL_SCREENS).toBe(0.9);
  expect(takimyildizIlerlemesi(0.25, 90, 1000)).toBeCloseTo(0.35);
  expect(takimyildizIlerlemesi(0.02, -90, 1000)).toBe(0);
  expect(takimyildizIlerlemesi(0.98, 90, 1000)).toBe(1);
});

describe('narrative phases', () => {
  test('keeps the invitation long enough to explain the gesture', () => {
    expect(takimyildizFazlari(0).hint).toBe(1);
    expect(takimyildizFazlari(0.17).hint).toBeGreaterThan(0);
    expect(takimyildizFazlari(0.18).hint).toBe(0);
  });

  test('gathers once, releases once, then reveals the live space', () => {
    expect(takimyildizFazlari(0.12).gather).toBe(0);
    expect(takimyildizFazlari(0.48).gather).toBe(1);
    expect(takimyildizFazlari(0.42).release).toBe(0);
    expect(takimyildizFazlari(0.86).release).toBe(1);
    expect(takimyildizFazlari(0.52).reveal).toBe(0);
    expect(takimyildizFazlari(1)).toEqual({
      hint: 0,
      gather: 1,
      release: 1,
      reveal: 1,
    });
  });
});
