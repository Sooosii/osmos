import { describe, expect, test } from 'vitest';
import {
  BG_CELL,
  CELL_H,
  CELL_W,
  COLS,
  LUMA_CUTOFF,
  RAMP,
  alphaAt,
  bobOffset,
  boostLuma,
  charAt,
  fieldAlpha,
  fieldDot,
  fieldX,
  fieldY,
  hashCell,
  rowsFor,
} from './astronot-tram';

describe('rampa', () => {
  test('ilk basamak boşluk — "hiç" çizilebilir olmalı', () => {
    expect(RAMP[0]).toBe(' ');
  });

  test('boşluk yalnızca ilk basamakta', () => {
    expect(RAMP.slice(1)).not.toContain(' ');
  });
});

describe('ızgara oranı', () => {
  test('kare kaynak karesel görünür: satır sayısı hücre oranını telafi ediyor', () => {
    const rows = rowsFor(COLS);
    const width = COLS * CELL_W;
    const height = rows * CELL_H;
    // Yuvarlama en fazla yarım hücre oynatabilir.
    expect(Math.abs(width - height)).toBeLessThanOrEqual(CELL_H / 2);
  });
});

describe('kazanç', () => {
  test('sıfır sıfırda kalıyor, üst uç 1e kırpılıyor', () => {
    expect(boostLuma(0)).toBe(0);
    expect(boostLuma(1)).toBe(1);
    expect(boostLuma(0.9)).toBe(1);
  });

  test('bant içinde tekdüze artıyor', () => {
    expect(boostLuma(0.1)).toBeLessThan(boostLuma(0.25));
    expect(boostLuma(0.25)).toBeLessThan(boostLuma(0.45));
  });
});

describe('hücre karması', () => {
  test('[0, 1) bandında ve kararlı', () => {
    for (const [c, r] of [[0, 0], [12, 40], [87, 50]] as const) {
      const h = hashCell(c, r);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
      expect(hashCell(c, r)).toBe(h);
    }
  });

  test('komşu hücreler farklı faz alıyor', () => {
    expect(hashCell(10, 10)).not.toBe(hashCell(11, 10));
    expect(hashCell(10, 10)).not.toBe(hashCell(10, 11));
  });
});

describe('karakter seçimi', () => {
  test('eşik altı hücre hiç çizilmiyor', () => {
    expect(charAt(0, 5, 5, 0)).toBe('');
    expect(charAt(LUMA_CUTOFF - 0.001, 5, 5, 0)).toBe('');
  });

  test('eşik üstü hücre kıpırtıyla asla boşluğa düşmüyor', () => {
    for (let t = 0; t < 3600; t += 60) {
      expect(charAt(LUMA_CUTOFF, 3, 7, t)).not.toBe('');
      expect(charAt(LUMA_CUTOFF, 3, 7, t)).not.toBe(' ');
    }
  });

  test('aynı girdi hep aynı karakter — kare kararlı', () => {
    expect(charAt(0.4, 20, 12, 500)).toBe(charAt(0.4, 20, 12, 500));
  });

  test('kıpırtı en fazla bir basamak oynatıyor', () => {
    const luma = 0.3;
    const base = Math.round(boostLuma(luma) * (RAMP.length - 1));
    for (let t = 0; t < 3600; t += 60) {
      const ch = charAt(luma, 8, 8, t);
      const index = RAMP.indexOf(ch);
      expect(Math.abs(index - base)).toBeLessThanOrEqual(1);
    }
  });

  test('parlak hücre rampanın üst ucunda kalıyor', () => {
    for (let t = 0; t < 3600; t += 120) {
      const ch = charAt(1, 30, 30, t);
      expect(RAMP.indexOf(ch)).toBeGreaterThanOrEqual(RAMP.length - 2);
    }
  });
});

describe('saydamlık', () => {
  test('taban 0.25 — en silik karakter bile okunur', () => {
    expect(alphaAt(0)).toBeCloseTo(0.25, 5);
  });

  test('üst uç 0.9 — saf beyaz yok', () => {
    expect(alphaAt(1)).toBeLessThanOrEqual(0.9);
  });
});

describe('salınım', () => {
  test('±6 piksel bandında kalıyor', () => {
    for (let t = 0; t < 30000; t += 250) {
      expect(Math.abs(bobOffset(t))).toBeLessThanOrEqual(6);
    }
  });

  test('sıfırdan başlıyor — figür yerinden fırlamıyor', () => {
    expect(bobOffset(0)).toBe(0);
  });
});

describe('arka plan tarlası', () => {
  test('nokta kimliği kararlı ve bantların içinde', () => {
    for (let c = 0; c < 40; c += 1) {
      for (let r = 0; r < 5; r += 1) {
        const dot = fieldDot(c, r);
        expect(fieldDot(c, r)).toEqual(dot);
        expect(dot.radius).toBeGreaterThanOrEqual(1.1);
        expect(dot.radius).toBeLessThanOrEqual(3.2);
        expect(dot.speed).toBeGreaterThanOrEqual(6);
        expect(dot.speed).toBeLessThanOrEqual(18);
        expect(dot.swayAmp).toBeLessThanOrEqual(4);
        expect(Math.abs(dot.x0 - c * BG_CELL)).toBeLessThanOrEqual(BG_CELL * 0.175);
        expect(Math.abs(dot.y0 - r * BG_CELL)).toBeLessThanOrEqual(BG_CELL * 0.175);
      }
    }
  });

  test('ortak ritim yok: hızlar da frekanslar da noktaya özgü', () => {
    /*
     * "Tak tak tak"ın sınaması. Eski kurguda bütün tarla tek hızda inip aynı
     * anda sarıyordu; iki noktanın hızı ya da yanıp sönme frekansı eşitse
     * o vuruş geri gelir.
     */
    const a = fieldDot(3, 7);
    const b = fieldDot(12, 2);
    const c = fieldDot(25, 14);
    expect(a.speed).not.toBe(b.speed);
    expect(b.speed).not.toBe(c.speed);
    expect(a.twinkleW).not.toBe(b.twinkleW);
    expect(b.twinkleW).not.toBe(c.twinkleW);
    expect(a.swayW).not.toBe(b.swayW);
  });

  test('süzülme dikişsiz sarıyor: bant içinde, sürekli, herkes kendi anında', () => {
    const wrapH = 800;
    const a = fieldDot(3, 7);
    const b = fieldDot(12, 2);
    let previousA = fieldY(a, 0, wrapH);
    for (let t = 16; t < 120000; t += 16) {
      const y = fieldY(a, t, wrapH);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(wrapH);
      // Kare arası ya küçük bir adım (≤ hız·dt) ya da sarma sıçraması.
      const step = Math.abs(y - previousA);
      expect(step <= (18 * 16) / 1000 + 1e-6 || step > wrapH - 1).toBe(true);
      previousA = y;
    }
    // Farklı hızlar zamanla farklı konum üretir — levha tek parça değil.
    expect(fieldY(a, 60000, wrapH)).not.toBeCloseTo(fieldY(b, 60000, wrapH), 5);
  });

  test('salınım genliğin içinde kalıyor', () => {
    const dot = fieldDot(9, 9);
    for (let t = 0; t < 30000; t += 250) {
      expect(Math.abs(fieldX(dot, t) - dot.x0)).toBeLessThanOrEqual(dot.swayAmp + 1e-9);
    }
  });

  test('sıradan nokta [0.03, 0.42] bandında', () => {
    for (let c = 0; c < 30; c += 1) {
      const dot = fieldDot(c, 4);
      if (dot.star) continue; // yıldızlar ayrı sınanıyor
      for (let t = 0; t < 12000; t += 300) {
        const a = fieldAlpha(dot, t);
        expect(a).toBeGreaterThanOrEqual(0.03);
        expect(a).toBeLessThanOrEqual(0.42);
      }
    }
  });

  test('yıldızlar var ve sıradan noktalardan parlak', () => {
    let star: FieldDotLike | null = null;
    for (let c = 0; c < 200 && !star; c += 1) {
      for (let r = 0; r < 200 && !star; r += 1) {
        const dot = fieldDot(c, r);
        if (dot.star) star = dot;
      }
    }
    expect(star).not.toBeNull();
    if (!star) return;
    for (let t = 0; t < 12000; t += 300) {
      const a = fieldAlpha(star, t);
      expect(a).toBeGreaterThanOrEqual(0.45);
      expect(a).toBeLessThanOrEqual(0.85);
    }
  });
});

type FieldDotLike = ReturnType<typeof fieldDot>;
