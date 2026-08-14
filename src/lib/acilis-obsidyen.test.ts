import { describe, expect, test } from 'vitest';
import {
  OBSIDYEN_SCROLL_SCREENS,
  obsidyenFazlari,
  obsidyenIlerlemesi,
} from './acilis-obsidyen';

test('2.2 viewport heights drives the complete rail', () => {
  expect(OBSIDYEN_SCROLL_SCREENS).toBe(2.2);
  expect(obsidyenIlerlemesi(0.25, 220, 1000)).toBeCloseTo(0.35);
  expect(obsidyenIlerlemesi(0.02, -220, 1000)).toBe(0);
  expect(obsidyenIlerlemesi(0.98, 220, 1000)).toBe(1);
});

describe('obsidian atomizer phases', () => {
  test('reveals the bottle before squeezing the bulb', () => {
    expect(obsidyenFazlari(0).reveal).toBe(0);
    expect(obsidyenFazlari(0.28).reveal).toBe(1);
    expect(obsidyenFazlari(0.46).squeeze).toBeCloseTo(1);
    expect(obsidyenFazlari(0.68).squeeze).toBe(0);
  });

  test('dissolves the object before revealing the live space', () => {
    expect(obsidyenFazlari(0.62).dissolve).toBe(0);
    expect(obsidyenFazlari(0.76).spaceReveal).toBe(0);
    expect(obsidyenFazlari(1)).toEqual({
      reveal: 1,
      squeeze: 0,
      mist: 0,
      dissolve: 1,
      spaceReveal: 1,
      glint: 0,
    });
  });
});
