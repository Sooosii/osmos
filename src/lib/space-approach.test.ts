import { describe, expect, test } from 'vitest';
import {
  APPROACH_DISTANCE,
  APPROACH_START,
  START_SCALE,
  advance,
  isComplete,
  scaleAt,
} from './space-approach';

/**
 * Yaklaşmanın sınamaları.
 *
 * Modül saf olduğu için tuval, React ya da tarayıcı gerekmiyor — `space-camera.ts`'in
 * "her fonksiyon tek başına okunup sınanabilir" iddiasının karşılığı bu dosya.
 *
 * Sınanan şey davranış, uygulama değil: ilerleme sınırların dışına taşmıyor mu,
 * geri kaydırmak geri sarıyor mu, ölçeğin uçları uzayın beklediği yerlere oturuyor mu.
 */

/** Tipik bir fare çentiği; içeri yön negatif. */
const NOTCH_IN = -100;
const NOTCH_OUT = 100;

describe('advance', () => {
  test('içeri kaydırmak ilerlemeyi artırıyor', () => {
    const next = advance(APPROACH_START, NOTCH_IN);

    expect(next.progress).toBeCloseTo(100 / APPROACH_DISTANCE);
  });

  test('ilerleme 1i aşmıyor — kaç çentik çevrilirse çevrilsin', () => {
    let state = APPROACH_START;
    for (let i = 0; i < 50; i += 1) state = advance(state, NOTCH_IN);

    expect(state.progress).toBe(1);
  });

  test('dışarı kaydırmak geri sarıyor, sıfırlamıyor', () => {
    const forward = advance(advance(APPROACH_START, NOTCH_IN), NOTCH_IN);
    const back = advance(forward, NOTCH_OUT);

    expect(back.progress).toBeCloseTo(100 / APPROACH_DISTANCE);
    expect(back.progress).toBeGreaterThan(0);
  });

  test('başlangıçta geri kaydırmak 0ın altına inmiyor', () => {
    const next = advance(APPROACH_START, NOTCH_OUT * 10);

    expect(next.progress).toBe(0);
  });

  test('durumu değiştirmiyor, yenisini üretiyor', () => {
    const state = APPROACH_START;
    advance(state, NOTCH_IN);

    expect(state.progress).toBe(0);
  });
});

describe('scaleAt', () => {
  test('uçlar tam oturuyor', () => {
    expect(scaleAt(0)).toBe(START_SCALE);
    expect(scaleAt(1)).toBeCloseTo(1, 10);
  });

  test('tek yönlü artıyor — yaklaşma hiç geri tepmiyor', () => {
    let previous = scaleAt(0);
    for (let p = 0.1; p <= 1; p += 0.1) {
      const current = scaleAt(p);
      expect(current).toBeGreaterThan(previous);
      previous = current;
    }
  });

  test('üstel: eşit ilerleme adımları eşit ORAN veriyor', () => {
    // Uzayın kendi tekerleği de çarpımsal. Doğrusal olsaydı sahnenin sonu ile
    // uzayın başı arasında hız değişir, "kesintisiz zoom" iddiası düşerdi.
    const first = scaleAt(0.25) / scaleAt(0);
    const second = scaleAt(0.5) / scaleAt(0.25);

    expect(second).toBeCloseTo(first, 10);
  });
});

describe('isComplete', () => {
  test('yalnızca 1e varınca doğru', () => {
    expect(isComplete({ progress: 0 })).toBe(false);
    expect(isComplete({ progress: 0.999 })).toBe(false);
    expect(isComplete({ progress: 1 })).toBe(true);
  });
});
