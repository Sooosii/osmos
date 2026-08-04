import { describe, expect, test } from 'vitest';
import {
  CYCLE_MS,
  MAX_MINUTES,
  cycleProgress,
  formatDuration,
  minutesAt,
  morphAt,
  phaseLabel,
} from './evolution-loop';

/**
 * Evrim imzasının saatinin sınamaları.
 *
 * Modül saf olduğu için tarayıcı, React ya da SVG gerekmiyor — `space-approach.test.ts`
 * ile aynı sözleşme. Sınanan şey davranış: döngü başa dönüyor mu, zaman eşlemesi
 * uçlara oturuyor mu, biçim turda kaç kez gidip geliyor.
 */

describe('cycleProgress', () => {
  test('tur başında sıfır, tur sonunda başa dönüyor', () => {
    expect(cycleProgress(0)).toBe(0);
    expect(cycleProgress(CYCLE_MS)).toBe(0);
    expect(cycleProgress(CYCLE_MS * 7)).toBe(0);
  });

  test('turun ortası yarıda', () => {
    expect(cycleProgress(CYCLE_MS / 2)).toBeCloseTo(0.5);
    expect(cycleProgress(CYCLE_MS * 3.5)).toBeCloseTo(0.5);
  });

  test('hiçbir girdide 0–1 aralığından çıkmıyor — negatif dahil', () => {
    for (let ms = -5_000; ms < 60_000; ms += 137) {
      const progress = cycleProgress(ms);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThan(1);
    }
  });
});

describe('minutesAt', () => {
  test('uçlar tam oturuyor', () => {
    expect(minutesAt(0)).toBe(0);
    expect(minutesAt(1)).toBeCloseTo(MAX_MINUTES, 6);
  });

  test('tek yönlü artıyor — zaman hiç geri gitmiyor', () => {
    let previous = minutesAt(0);
    for (let p = 0.05; p <= 1; p += 0.05) {
      const current = minutesAt(p);
      expect(current).toBeGreaterThan(previous);
      previous = current;
    }
  });

  test('turun yarısından fazlası ilk saate ayrılıyor', () => {
    // "12 saniye ama notaları takip etmek kolay olsun" isteğini karşılayan şey bu:
    // eşleme logaritmik, kokunun ilginç kısmı turun büyük bölümünü kaplıyor.
    expect(minutesAt(0.5)).toBeLessThan(60);
    expect(minutesAt(0.6)).toBeLessThan(60);
    expect(minutesAt(0.7)).toBeGreaterThan(60);
  });
});

describe('morphAt', () => {
  test('turda iki tam gidiş geliş', () => {
    expect(morphAt(0)).toBeCloseTo(0);
    expect(morphAt(0.25)).toBeCloseTo(1);
    expect(morphAt(0.5)).toBeCloseTo(0);
    expect(morphAt(0.75)).toBeCloseTo(1);
    expect(morphAt(1)).toBeCloseTo(0);
  });

  test('tur başı ile tur sonu aynı — döngüde ek yeri görünmüyor', () => {
    expect(morphAt(1)).toBeCloseTo(morphAt(0), 10);
  });

  test('0–1 dışına çıkmıyor', () => {
    for (let p = 0; p <= 1; p += 0.01) {
      expect(morphAt(p)).toBeGreaterThanOrEqual(0);
      expect(morphAt(p)).toBeLessThanOrEqual(1);
    }
  });
});

describe('formatDuration', () => {
  test('bir dakikanın altı sözle söyleniyor', () => {
    expect(formatDuration(0)).toBe('ilk saniyeler');
    expect(formatDuration(0.4)).toBe('ilk saniyeler');
  });

  test('saatin altı dakikayla', () => {
    expect(formatDuration(3)).toBe('3 dakika');
  });

  test('tam saat dakikasız yazılıyor', () => {
    expect(formatDuration(120)).toBe('2 saat');
  });

  test('saat ve dakika birlikte', () => {
    expect(formatDuration(185)).toBe('3 saat 5 dakika');
  });
});

describe('phaseLabel', () => {
  test('evre sınırları', () => {
    expect(phaseLabel(0)).toBe('Açılış');
    expect(phaseLabel(14)).toBe('Açılış');
    expect(phaseLabel(15)).toBe('Kalp');
    expect(phaseLabel(119)).toBe('Kalp');
    expect(phaseLabel(120)).toBe('Dip');
  });
});
