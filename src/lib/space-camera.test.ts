import { describe, expect, test } from 'vitest';
import { pixelsPerUnit, type Viewport } from './space-camera';

/**
 * Çerçeveleme — bulutun ekranı ne kadar doldurduğu.
 *
 * Bulutun gerçek sınırları (`space-marks`ten geliyor): x ±1.0, y ±0.84.
 * Sınamalar o ölçüyle yazıldı; izdüşüm değişirse burası da yeniden ölçülür.
 */
const CLOUD = { halfX: 1, halfY: 0.84 };

function view(width: number, height: number): Viewport {
  return { width, height, ...CLOUD };
}

/** Bulutun ekranda kapladığı kutu, yüzde olarak. */
function coverage(viewport: Viewport) {
  const unit = pixelsPerUnit(viewport, 1);
  return {
    w: (CLOUD.halfX * 2 * unit) / viewport.width,
    h: (CLOUD.halfY * 2 * unit) / viewport.height,
  };
}

describe('pixelsPerUnit', () => {
  test('genis ekranda bulut tamamen sigiyor', () => {
    /* Masaüstünde kırpma YOK: iki eksen de ekranın içinde kalmalı. */
    const { w, h } = coverage(view(1280, 800));
    expect(w).toBeLessThanOrEqual(1);
    expect(h).toBeLessThanOrEqual(1);
    /* Ve dolduruyor: uzun kenar %85'in üstünde. */
    expect(Math.max(w, h)).toBeGreaterThan(0.85);
  });

  test('kare-ye yakin ekranda da kirpma yok', () => {
    const { w, h } = coverage(view(900, 800));
    expect(w).toBeLessThanOrEqual(1);
    expect(h).toBeLessThanOrEqual(1);
  });

  test('telefonda bulut ekranin kucuk bir adasi olarak kalmiyor', () => {
    /*
      ⚠️ Ölçüldü (2026-08-11, 390×844): bulut ekranın yalnızca **%36**'sını
      kaplıyordu — masaüstünde %91. Sebep geometri: bulut kareye yakın, telefon
      ise iki kat uzun; genişliğe oturtulunca dikeyde koca boşluk kalıyor.

      Portre ekranlarda ölçek dikeye doğru bir miktar açılıyor. Bedeli bilinçli:
      en kenardaki birkaç parfüm durağan görünümde ekranın dışında kalıyor ve
      sürükleyerek geliyor — harita zaten sürüklenebilir ve giriş metni bunu
      söylüyor ("Drag, zoom, touch a point").
    */
    const { h } = coverage(view(390, 844));
    expect(h).toBeGreaterThan(0.45);
  });

  test('portre acilimi sinirli — harita yarisi ekran disinda kalmiyor', () => {
    const { w } = coverage(view(390, 844));
    expect(w).toBeLessThan(1.5);
  });

  test('olcek carpani dogrudan geciyor', () => {
    const v = view(1280, 800);
    expect(pixelsPerUnit(v, 2)).toBeCloseTo(pixelsPerUnit(v, 1) * 2, 6);
  });
});
