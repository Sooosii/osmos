import { describe, expect, test } from 'vitest';
import { FAMILIES } from '@/data/families';
import { LOGO_DOTS, LOGO_VIEW, logoDotColor } from './logo';

/**
 * Simgenin sınamaları.
 *
 * Simge tek bir karar üzerine kurulu: **16 pikselde ayakta kalmak.** Geometri
 * ekranda ölçülerek seçildi; buradaki sınamalar o kararı koruyor.
 */

describe('LOGO_DOTS', () => {
  test('16 pikselde noktalar birbirine degmiyor', () => {
    // Simgenin bütün gerekçesi bu. Üç nokta 16 pikselde birleşirse tek bulanık
    // leke kalır ve seçilen yön anlamını kaybeder.
    const olcek = 16 / LOGO_VIEW;

    for (let i = 0; i < LOGO_DOTS.length; i += 1) {
      for (let j = i + 1; j < LOGO_DOTS.length; j += 1) {
        const a = LOGO_DOTS[i];
        const b = LOGO_DOTS[j];
        const uzaklik = Math.hypot(a.cx - b.cx, a.cy - b.cy) * olcek;
        const yariCaplar = (a.r + b.r) * olcek;
        expect(uzaklik, `${a.family} ↔ ${b.family}`).toBeGreaterThan(yariCaplar);
      }
    }
  });

  test('noktalar kutunun disina tasmiyor', () => {
    for (const dot of LOGO_DOTS) {
      expect(dot.cx - dot.r).toBeGreaterThanOrEqual(0);
      expect(dot.cy - dot.r).toBeGreaterThanOrEqual(0);
      expect(dot.cx + dot.r).toBeLessThanOrEqual(LOGO_VIEW);
      expect(dot.cy + dot.r).toBeLessThanOrEqual(LOGO_VIEW);
    }
  });

  test('renkler gercek aile renkleri — ikinci bir palet yok', () => {
    const paletteler = new Set(FAMILIES.map((f) => f.color));
    for (const dot of LOGO_DOTS) {
      expect(paletteler.has(logoDotColor(dot))).toBe(true);
    }
  });

  test('uc ayri aile — kume farkli seyleri gosteriyor', () => {
    const aileler = new Set(LOGO_DOTS.map((d) => d.family));
    expect(aileler.size).toBe(LOGO_DOTS.length);
  });
});
