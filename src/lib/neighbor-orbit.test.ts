import { describe, expect, test } from 'vitest';
import {
  LABEL_HALF_WIDTH,
  LABEL_RISE,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  horizonPath,
  orbitSeats,
  projectSeat,
  type OrbitNeighbor,
} from './neighbor-orbit';

/**
 * Komşu takımyıldızının geometrisinin sınamaları.
 *
 * Modül saf olduğu için tarayıcı, React ya da SVG gerekmiyor — `evolution-loop.test.ts`
 * ile aynı sözleşme. Sınanan şey davranış: en benzeyen gerçekten en yakında mı,
 * derinlik dikeye gidiyor mu, dönerken çerçeveden taşan oluyor mu.
 */

const KOMSULAR: readonly OrbitNeighbor[] = [
  { id: 'a', score: 0.84, depth: 0.5 },
  { id: 'b', score: 0.79, depth: 0.9 },
  { id: 'c', score: 0.78, depth: 0.1 },
  { id: 'd', score: 0.77, depth: 0.5 },
  { id: 'e', score: 0.6, depth: 0.5 },
];

const MERKEZ_DERINLIK = 0.5;

describe('orbitSeats', () => {
  test('en benzeyen en yakında — sahibin istediği tek garanti', () => {
    const seats = orbitSeats(KOMSULAR, MERKEZ_DERINLIK);
    for (let i = 1; i < seats.length; i += 1) {
      expect(seats[i].radius).toBeGreaterThanOrEqual(seats[i - 1].radius);
    }
  });

  test('derinlik farkı yüksekliğe gidiyor — asıl üçüncü boyut bu', () => {
    const seats = orbitSeats(KOMSULAR, MERKEZ_DERINLIK);
    const ayni = seats.find((s) => s.id === 'a');
    const derin = seats.find((s) => s.id === 'b');
    const sig = seats.find((s) => s.id === 'c');

    // Merkezle aynı derinlikteki komşu tam düzlemde.
    expect(ayni?.height).toBeCloseTo(0, 6);
    // Biri üstte biri altta, işaretleri zıt.
    expect(Math.sign(derin?.height ?? 0)).toBe(-Math.sign(sig?.height ?? 0));
    expect(Math.abs(derin?.height ?? 0)).toBeGreaterThan(0);
  });

  test('dört bir yana dağılıyor — sıra değil çember', () => {
    const seats = orbitSeats(KOMSULAR, MERKEZ_DERINLIK);
    const acilar = seats.map((s) => s.angle);
    expect(new Set(acilar.map((a) => a.toFixed(4))).size).toBe(seats.length);
  });

  test('komşusuz parfüm çökmüyor', () => {
    expect(orbitSeats([], 0.5)).toHaveLength(0);
  });
});

describe('projectSeat', () => {
  const seats = orbitSeats(KOMSULAR, MERKEZ_DERINLIK);

  test('tur boyunca hiçbir nokta çerçeveden taşmıyor', () => {
    // Dönerken perspektif yakındakini büyütüyor; sınırı aşarsa etiketler kesilir.
    for (let step = 0; step < 120; step += 1) {
      const phase = (step / 120) * Math.PI * 2;
      for (const seat of seats) {
        const node = projectSeat(seat, phase);
        expect(node.x).toBeGreaterThanOrEqual(0);
        expect(node.x).toBeLessThanOrEqual(VIEW_WIDTH);
        expect(node.y).toBeGreaterThanOrEqual(0);
        expect(node.y).toBeLessThanOrEqual(VIEW_HEIGHT);
      }
    }
  });

  test('etiketler de çerçeveye sığıyor — asıl taşan şey onlar', () => {
    // Noktanın sığması yetmiyor: adın yazıldığı yer dışarı taşarsa kesilir.
    // Bu sınama olmasaydı yarıçapı büyütürken sessizce kırpma yapardım.
    // Ad noktanın üstünde ortalı, yani iki yana da yarım genişlik kadar taşıyor.
    for (let step = 0; step < 120; step += 1) {
      const phase = (step / 120) * Math.PI * 2;
      for (const seat of seats) {
        const node = projectSeat(seat, phase);
        expect(node.x - LABEL_HALF_WIDTH).toBeGreaterThanOrEqual(0);
        expect(node.x + LABEL_HALF_WIDTH).toBeLessThanOrEqual(VIEW_WIDTH);
        expect(node.y - LABEL_RISE * node.scale).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('öne gelen büyük, arkaya giden küçük — perspektif gerçek', () => {
    const seat = seats[0];
    // Yarım tur arayla aynı koltuk bir önde bir arkada.
    const scales: number[] = [];
    for (let step = 0; step < 60; step += 1) {
      scales.push(projectSeat(seat, (step / 60) * Math.PI * 2).scale);
    }
    expect(Math.max(...scales)).toBeGreaterThan(Math.min(...scales) * 1.2);
  });

  test('tam tur başa dönüyor — döngüde ek yeri yok', () => {
    const seat = seats[1];
    const bas = projectSeat(seat, 0);
    const son = projectSeat(seat, Math.PI * 2);
    expect(son.x).toBeCloseTo(bas.x, 6);
    expect(son.y).toBeCloseTo(bas.y, 6);
  });

  test('arkadaki nokta daha sönük', () => {
    const seat = seats[0];
    let on = projectSeat(seat, 0);
    let arka = on;
    for (let step = 0; step < 60; step += 1) {
      const node = projectSeat(seat, (step / 60) * Math.PI * 2);
      if (node.z < on.z) on = node;
      if (node.z > arka.z) arka = node;
    }
    expect(on.fade).toBeGreaterThan(arka.fade);
  });

  test('etiketin bir yanı yok — sıçrayacak bir şey kalmadı', () => {
    // Eskiden ad ekrandaki x'e göre sağa ya da sola yaslanıyordu ve komşu merkezin
    // öbür yanına geçtiği anda bir taraftan diğerine sıçrıyordu. Artık ortalı;
    // bu sınama `anchor`ın geri gelmesini engelliyor.
    // `as unknown as` şart: `OrbitNode`ta dizin imzası yok, dolayısıyla TypeScript
    // doğrudan dönüşümü "iki tip yeterince örtüşmüyor" diye reddediyor. Sınamanın
    // istediği şey zaten tipin dışına çıkmak — `anchor` orada OLMADIĞINI görmek.
    const node = projectSeat(seats[0], 0) as unknown as Record<string, unknown>;
    expect('anchor' in node).toBe(false);
  });
});

describe('horizonPath', () => {
  test('kapalı bir eğri veriyor ve çerçeveye sığıyor', () => {
    const d = horizonPath();
    expect(d.startsWith('M')).toBe(true);
    expect(d.trimEnd().endsWith('Z')).toBe(true);

    const sayilar = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    expect(sayilar.length).toBeGreaterThan(20);
    for (let i = 0; i < sayilar.length; i += 2) {
      expect(sayilar[i]).toBeGreaterThanOrEqual(0);
      expect(sayilar[i]).toBeLessThanOrEqual(VIEW_WIDTH);
      expect(sayilar[i + 1]).toBeGreaterThanOrEqual(0);
      expect(sayilar[i + 1]).toBeLessThanOrEqual(VIEW_HEIGHT);
    }
  });
});
