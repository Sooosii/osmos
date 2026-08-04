import { describe, expect, test } from 'vitest';
import {
  CYCLE_MS,
  SIGNATURE_MAX_MINUTES,
  SLIDER_MAX_MINUTES,
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
  /** İki tüketici, iki aralık — sınamaların çoğu ikisinde de geçmek zorunda. */
  const SPANS = [SIGNATURE_MAX_MINUTES, SLIDER_MAX_MINUTES];

  test('uçlar tam oturuyor — her iki aralıkta da', () => {
    for (const span of SPANS) {
      expect(minutesAt(0, span)).toBe(0);
      expect(minutesAt(1, span)).toBeCloseTo(span, 6);
    }
  });

  test('aralık gerçekten parametre — imza turu kaydıraçtan daha az dakika kapsıyor', () => {
    // İki sabitin ayrı durmasının tek sebebi bu. Biri diğerine sabitlenirse ya da
    // fonksiyon bir varsayılana düşerse iki eğri üst üste biner ve burada yakalanır.
    for (let p = 0.1; p < 1; p += 0.1) {
      expect(minutesAt(p, SIGNATURE_MAX_MINUTES)).toBeLessThan(
        minutesAt(p, SLIDER_MAX_MINUTES),
      );
    }
  });

  test('tek yönlü artıyor — zaman hiç geri gitmiyor', () => {
    for (const span of SPANS) {
      let previous = minutesAt(0, span);
      for (let p = 0.05; p <= 1; p += 0.05) {
        const current = minutesAt(p, span);
        expect(current).toBeGreaterThan(previous);
        previous = current;
      }
    }
  });

  test('turun yarısından fazlası ilk saate ayrılıyor', () => {
    // "12 saniye ama notaları takip etmek kolay olsun" isteğini karşılayan şey bu:
    // eşleme logaritmik, kokunun ilginç kısmı turun büyük bölümünü kaplıyor.
    for (const span of SPANS) {
      expect(minutesAt(0.5, span)).toBeLessThan(60);
      expect(minutesAt(0.6, span)).toBeLessThan(60);
      expect(minutesAt(0.7, span)).toBeGreaterThan(60);
    }
  });

  test('imza turunun ortası — çubukların okunduğu an — 21 dakikayı gösteriyor', () => {
    // Turun ortası `morphAt`in tepesi, yani biçimin çizelgeye oturduğu an. Ekranda
    // o sırada hangi saatin yazdığı doğrudan kullanıcı deneyimi: 12 saatlik turda
    // 26 dakikaydı, 8 saatlik turda 21. Sayı değil, görünen metin sınanıyor.
    expect(formatDuration(minutesAt(0.5, SIGNATURE_MAX_MINUTES))).toBe('21 dakika');
    expect(formatDuration(minutesAt(0.5, SLIDER_MAX_MINUTES))).toBe('26 dakika');
  });
});

describe('morphAt', () => {
  test('turda tek tam gidiş geliş — eğride başlıyor, ortada çizelgeye oturuyor, eğriye dönüyor', () => {
    expect(morphAt(0)).toBeCloseTo(0);
    expect(morphAt(0.5)).toBeCloseTo(1);
    expect(morphAt(1)).toBeCloseTo(0);
  });

  test('ilk yarıda tekdüze artıyor, ikinci yarıda tekdüze azalıyor', () => {
    let previous = morphAt(0);
    for (let p = 0.05; p <= 0.5; p += 0.05) {
      const current = morphAt(p);
      expect(current).toBeGreaterThan(previous);
      previous = current;
    }

    for (let p = 0.55; p <= 1; p += 0.05) {
      const current = morphAt(p);
      expect(current).toBeLessThan(previous);
      previous = current;
    }
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

  test('60 dakika sınırı — saat biçimine tam burada geçiyor', () => {
    // Sınır sınanmıyordu: `< 60` yanlışlıkla `<= 60` yapılsa 60 dakika
    // "60 dakika" diye yazılır ve hiçbir sınama bunu yakalamazdı.
    expect(formatDuration(59)).toBe('59 dakika');
    expect(formatDuration(60)).toBe('1 saat');
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
