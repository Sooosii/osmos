import { describe, expect, test } from 'vitest';
import {
  CENTER_X,
  CENTER_Y,
  LABEL_MIN_GAP,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  radialLayout,
  type Neighbor,
} from './neighbor-map';

/**
 * Komşu çemberinin geometrisinin sınamaları.
 *
 * Modül saf olduğu için tarayıcı, React ya da SVG gerekmiyor — `evolution-loop.test.ts`
 * ile aynı sözleşme. Sınanan şey davranış: en benzeyen gerçekten en yakında mı,
 * komşular dört bir yana dağılıyor mu, etiketler çakışıyor mu.
 */

const uzaklik = (dot: { x: number; y: number }) =>
  Math.hypot(dot.x - CENTER_X, dot.y - CENTER_Y);

describe('radialLayout', () => {
  const komsular: readonly Neighbor[] = [
    { id: 'a', score: 0.84 },
    { id: 'b', score: 0.79 },
    { id: 'c', score: 0.78 },
    { id: 'd', score: 0.77 },
    { id: 'e', score: 0.6 },
  ];

  test('en benzeyen en yakında — sahibin istediği tek garanti', () => {
    // Gerçek uzay konumlarıyla bu tutmuyordu (ölçüm: ortalama örtüşme 3.16/5).
    // Konumlar benzerlikten üretildiği için artık her sayfada tutmak ZORUNDA.
    const placed = radialLayout(komsular);
    for (let i = 1; i < placed.length; i += 1) {
      expect(uzaklik(placed[i])).toBeGreaterThanOrEqual(uzaklik(placed[i - 1]));
    }
  });

  test('daha az benzeyen komşu belirgin biçimde uzakta', () => {
    const placed = radialLayout(komsular);
    const enYakin = uzaklik(placed[0]);
    const enUzak = uzaklik(placed[placed.length - 1]);
    expect(enUzak).toBeGreaterThan(enYakin * 1.2);
  });

  test('dört bir yana dağılıyor — sıra değil çember', () => {
    // "sırada değiller" — tek bir yöne dizilseler liste olurdu, harita değil.
    const placed = radialLayout(komsular);
    const solda = placed.filter((d) => d.x < CENTER_X).length;
    const sagda = placed.filter((d) => d.x > CENTER_X).length;
    const ustte = placed.filter((d) => d.y < CENTER_Y).length;
    const altta = placed.filter((d) => d.y > CENTER_Y).length;

    expect(solda).toBeGreaterThan(0);
    expect(sagda).toBeGreaterThan(0);
    expect(ustte).toBeGreaterThan(0);
    expect(altta).toBeGreaterThan(0);
  });

  test('hiçbir nokta çizim alanının dışına taşmıyor', () => {
    for (const dot of radialLayout(komsular)) {
      expect(dot.x).toBeGreaterThanOrEqual(0);
      expect(dot.x).toBeLessThanOrEqual(VIEW_WIDTH);
      expect(dot.y).toBeGreaterThanOrEqual(0);
      expect(dot.y).toBeLessThanOrEqual(VIEW_HEIGHT);
    }
  });

  test('zayıf benzerlikler de alan içinde kalıyor', () => {
    // Bigarade Concentrée'nin en zayıf komşusu 0.48. Yarıçap sınırlanmasaydı
    // düşük skorlar noktayı çerçevenin dışına atardı.
    const zayif = radialLayout([
      { id: 'a', score: 0.1 },
      { id: 'b', score: 0.02 },
    ]);
    for (const dot of zayif) {
      expect(uzaklik(dot)).toBeLessThanOrEqual(Math.min(CENTER_X, CENTER_Y));
    }
  });

  test('efekt merkezden başlıyor — toplu, sonra dağılıyor', () => {
    // Başlangıç ötelemesi noktayı tam merkeze getirmeli: hepsi orada toplanıp
    // oradan ayrışıyor.
    for (const dot of radialLayout(komsular)) {
      expect(dot.x + dot.fromDx).toBeCloseTo(CENTER_X, 5);
      expect(dot.y + dot.fromDy).toBeCloseTo(CENTER_Y, 5);
    }
  });

  test('dağılma sırayla — en benzeyen önce', () => {
    const placed = radialLayout(komsular);
    for (let i = 1; i < placed.length; i += 1) {
      expect(placed[i].delayMs).toBeGreaterThan(placed[i - 1].delayMs);
    }
  });

  test('üst üste gelen etiketler dikeyde ayrılıyor', () => {
    // Aynı skordan birkaç komşu benzer yükseklige düşebiliyor; ad okunmaz olmasın.
    const placed = radialLayout([
      { id: 'a', score: 0.8 },
      { id: 'b', score: 0.8 },
      { id: 'c', score: 0.8 },
      { id: 'd', score: 0.8 },
    ]);
    const sameSide = placed
      .filter((d) => d.anchor === 'start')
      .sort((a, b) => a.labelY - b.labelY);

    for (let i = 1; i < sameSide.length; i += 1) {
      expect(sameSide[i].labelY - sameSide[i - 1].labelY).toBeGreaterThanOrEqual(
        LABEL_MIN_GAP,
      );
    }
  });

  test('komşusuz parfüm çökmüyor', () => {
    expect(radialLayout([])).toHaveLength(0);
  });
});
