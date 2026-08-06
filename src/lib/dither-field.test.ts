import { describe, expect, test } from 'vitest';
import { BAYER_4X4, ditherThreshold, fieldValue, tuneField } from './dither-field';

const MID: ReturnType<typeof tuneField> = tuneField(25, 200);

describe('BAYER_4X4', () => {
  test('0–15 arası her değer tam bir kez geçiyor', () => {
    expect([...BAYER_4X4].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, i) => i),
    );
  });
});

describe('tuneField', () => {
  test('uçucu nota hızlı, ağır nota yavaş', () => {
    // Uçlar veriden: peak 1 (aldehit tarafı) ↔ 160 (reçine tarafı).
    expect(tuneField(1, 200).speed).toBeGreaterThan(tuneField(160, 200).speed);
  });

  test('uzun ömür daha geniş yayılıyor', () => {
    expect(tuneField(25, 900).reach).toBeGreaterThan(tuneField(25, 12).reach);
  });

  test('iki katsayı da 0–1 aralığında kalıyor — uçlarda ve dışında', () => {
    for (const peak of [0, 1, 25, 160, 5000]) {
      for (const life of [0, 12, 200, 900, 10_000]) {
        const tuning = tuneField(peak, life);
        expect(tuning.speed).toBeGreaterThanOrEqual(0);
        expect(tuning.speed).toBeLessThanOrEqual(1);
        expect(tuning.reach).toBeGreaterThanOrEqual(0);
        expect(tuning.reach).toBeLessThanOrEqual(1);
      }
    }
  });

  test('logaritmik: ortanca nota ölçeğin ortalarına düşüyor', () => {
    // Doğrusal olsaydı peak 25 → (25-1)/159 ≈ 0.15 olur, speed 0.85'e yapışırdı
    // ve notaların yarısı ekranda ayırt edilemezdi. Gerekçe dither-field.ts'te.
    const { speed } = tuneField(25, 200);
    expect(speed).toBeGreaterThan(0.25);
    expect(speed).toBeLessThan(0.75);
  });
});

describe('fieldValue', () => {
  test('her yerde ve her anda 0–1 arasında', () => {
    for (let i = 0; i < 40; i += 1) {
      const t = i * 0.7;
      for (const nx of [-1.4, -0.5, 0, 0.5, 1.4]) {
        for (const ny of [-1.4, -0.5, 0, 0.5, 1.4]) {
          const value = fieldValue(nx, ny, t, MID);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  test('kenarda merkezden sönük — sönüm gerçekten çalışıyor', () => {
    // Tek bir an yanıltabilir (halka o anda kenardan geçiyor olabilir), o yüzden
    // bir tur boyunca ortalama alınıyor.
    const mean = (nx: number, ny: number) => {
      let total = 0;
      for (let i = 0; i < 120; i += 1) total += fieldValue(nx, ny, i * 0.25, MID);
      return total / 120;
    };

    expect(mean(0.1, 0.1)).toBeGreaterThan(mean(1.3, 1.3));
  });

  test('zamanla değişiyor — donuk bir görüntü değil', () => {
    const first = fieldValue(0.4, -0.2, 0, MID);
    let moved = false;
    for (let i = 1; i < 60; i += 1) {
      if (Math.abs(fieldValue(0.4, -0.2, i * 0.3, MID) - first) > 0.02) moved = true;
    }
    expect(moved).toBe(true);
  });

  test('hızlı nota aynı sürede daha çok değişiyor', () => {
    const swing = (tuning: ReturnType<typeof tuneField>) => {
      let min = Infinity;
      let max = -Infinity;
      // Kısa bir pencere: yavaş olan bu sürede daha az yol alsın.
      for (let i = 0; i < 30; i += 1) {
        const value = fieldValue(0.3, 0.3, i * 0.05, tuning);
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
      return max - min;
    };

    expect(swing(tuneField(1, 200))).toBeGreaterThan(swing(tuneField(160, 200)));
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
