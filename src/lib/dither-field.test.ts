import { describe, expect, test } from 'vitest';
import { BAYER_4X4, ditherThreshold } from './dither-field';

describe('BAYER_4X4', () => {
  test('0–15 arası her değer tam bir kez geçiyor', () => {
    expect([...BAYER_4X4].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, i) => i),
    );
  });
});

describe('ditherThreshold', () => {
  test('4 pikselde bir kendini tekrar ediyor', () => {
    expect(ditherThreshold(5, 9)).toBe(ditherThreshold(1, 1));
    expect(ditherThreshold(400, 304)).toBe(ditherThreshold(0, 0));
  });

  test('eşikler 0–1 arasında ve 16 ayrı basamak veriyor', () => {
    const seen = new Set<number>();
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        const threshold = ditherThreshold(x, y);
        expect(threshold).toBeGreaterThanOrEqual(0);
        expect(threshold).toBeLessThan(1);
        seen.add(threshold);
      }
    }
    expect(seen.size).toBe(16);
  });
});
