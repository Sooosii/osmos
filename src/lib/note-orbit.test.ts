import { describe, expect, test } from 'vitest';
import {
  CENTER_X,
  CENTER_Y,
  HORIZON_RADII,
  LABEL_HALF_WIDTH,
  LABEL_RISE,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  horizonRing,
  noteSeats,
  projectSeat,
  type NoteCarrier,
} from './note-orbit';

/**
 * Nota takımyıldızının geometrisi.
 *
 * Buradaki sınamaların çoğu ekranda görülemeyecek şeyleri tutuyor: taşma,
 * ölçek aralığı, kalabalık notada dağılım. Ekranda görülebilenler (dönüş hızı,
 * renk) sınanmıyor.
 */

function carrier(id: string, weight: number, depth = 0.5): NoteCarrier {
  return { id, weight, depth };
}

describe('noteSeats', () => {
  test('boş girdi boş çıktı verir', () => {
    expect(noteSeats([])).toEqual([]);
  });

  test('tek parfümlü nota da oturuyor — dorayaki gibi', () => {
    const seats = noteSeats([carrier('floraiku-gong', 0.9)]);

    expect(seats).toHaveLength(1);
    expect(seats[0].id).toBe('floraiku-gong');
    expect(seats[0].angle).toBe(0);
  });

  test('ağır olan merkeze yakın, hafif olan uzakta', () => {
    const seats = noteSeats([carrier('agir', 1.0), carrier('hafif', 0.2)]);
    const heavy = seats.find((s) => s.id === 'agir');
    const light = seats.find((s) => s.id === 'hafif');

    expect(heavy!.radius).toBeLessThan(light!.radius);
  });

  test('ağırlığa göre sıralı — girdi sırası sonucu değiştirmiyor', () => {
    const forward = noteSeats([carrier('a', 0.3), carrier('b', 0.9), carrier('c', 0.6)]);
    const backward = noteSeats([carrier('c', 0.6), carrier('a', 0.3), carrier('b', 0.9)]);

    expect(forward.map((s) => s.id)).toEqual(['b', 'c', 'a']);
    expect(forward).toEqual(backward);
  });

  test('açılar çemberi eşit bölüyor', () => {
    const seats = noteSeats([carrier('a', 0.9), carrier('b', 0.6), carrier('c', 0.3)]);
    const step = (Math.PI * 2) / 3;

    expect(seats[0].angle).toBeCloseTo(0);
    expect(seats[1].angle).toBeCloseTo(step);
    expect(seats[2].angle).toBeCloseTo(step * 2);
  });

  test('yükseklik kümenin ortasına göre — ortadaki düzlemde duruyor', () => {
    const seats = noteSeats([carrier('orta', 0.5, 0.5)]);
    expect(seats[0].height).toBe(0);
  });

  test('derin olan aşağıda, yüzeysel olan yukarıda kalmıyor — işaret ayrışıyor', () => {
    const seats = noteSeats([carrier('derin', 0.5, 0.9), carrier('sig', 0.5, 0.1)]);
    const deep = seats.find((s) => s.id === 'derin')!;
    const shallow = seats.find((s) => s.id === 'sig')!;

    expect(Math.sign(deep.height)).not.toBe(Math.sign(shallow.height));
  });

  test('ağırlık sınırın altına düşse de yarıçap patlamıyor', () => {
    const seats = noteSeats([carrier('cok-hafif', 0.01)]);
    expect(seats[0].radius).toBeLessThanOrEqual(HORIZON_RADII[HORIZON_RADII.length - 1]);
  });
});

describe('projectSeat', () => {
  const seat = noteSeats([carrier('tek', 0.6)])[0];

  // `z = sin(angle) · radius` ve ölçek `focal / (focal + z)`, yani **pozitif z
  // kameradan uzaklaşıyor**: −π/2 ön, +π/2 arka. İlk yazışta ters varsayılmıştı
  // ve sınama yakaladı.
  const FRONT = -Math.PI / 2;
  const BACK = Math.PI / 2;

  test('öne dönen büyür, arkaya geçen küçülür', () => {
    const front = projectSeat(seat, FRONT);
    const back = projectSeat(seat, BACK);

    expect(front.scale).toBeGreaterThan(back.scale);
    expect(front.fade).toBeGreaterThan(back.fade);
  });

  test('sönümleme 0–1 aralığından taşmıyor', () => {
    for (let i = 0; i < 64; i += 1) {
      const node = projectSeat(seat, (i / 64) * Math.PI * 2);
      expect(node.fade).toBeGreaterThanOrEqual(0);
      expect(node.fade).toBeLessThanOrEqual(1);
    }
  });

  test('ön ile arka arasındaki büyüklük farkı okunur kalıyor', () => {
    const front = projectSeat(seat, FRONT);
    const back = projectSeat(seat, BACK);

    // %20'nin altına düşerse üçüncü boyut ekranda kaybolur.
    expect(front.scale / back.scale).toBeGreaterThan(1.2);
  });

  /**
   * Mutlak en kötü hâl — tahmini bir küme değil, geometrinin iki ucu birden:
   * `WEAKEST_WEIGHT`in altındaki ağırlık en dış yarıçapa yapışıyor, derinliğin
   * 0 ve 1'i de yüksekliğin iki ucunu veriyor. Başka hiçbir veri bundan dışarı
   * çıkamaz, dolayısıyla bu sınama geçtiğinde 136 notanın hepsi kutuda.
   *
   * Önceki hâli 0.15 ağırlık kullanıyordu ve o değer sınırın **içinde** kalıyor;
   * sınama bu yüzden gerçek sınırı hiç denemiyordu.
   */
  test('en dıştaki parfüm etiketiyle birlikte tuvale sığıyor', () => {
    const crowded = noteSeats([carrier('a', 0.05, 1), carrier('b', 0.05, 0)]);

    for (const s of crowded) {
      // 96 örnek uçları ıskalayabiliyordu; sınırı arayan sınama sık örneklemeli.
      for (let i = 0; i < 720; i += 1) {
        const node = projectSeat(s, (i / 720) * Math.PI * 2);
        expect(node.x - LABEL_HALF_WIDTH).toBeGreaterThanOrEqual(0);
        expect(node.x + LABEL_HALF_WIDTH).toBeLessThanOrEqual(VIEW_WIDTH);
        expect(node.y - LABEL_RISE).toBeGreaterThanOrEqual(0);
        expect(node.y).toBeLessThanOrEqual(VIEW_HEIGHT);
      }
    }
  });

  test('kalabalık nota da taşmıyor — sandal 26 parfüm', () => {
    const many = noteSeats(
      Array.from({ length: 26 }, (_, i) => carrier(`p${i}`, 0.2 + (i % 5) * 0.2, i / 25)),
    );

    for (const s of many) {
      for (let i = 0; i < 48; i += 1) {
        const node = projectSeat(s, (i / 48) * Math.PI * 2);
        expect(node.x - LABEL_HALF_WIDTH).toBeGreaterThanOrEqual(0);
        expect(node.x + LABEL_HALF_WIDTH).toBeLessThanOrEqual(VIEW_WIDTH);
        expect(node.y).toBeGreaterThanOrEqual(0);
        expect(node.y).toBeLessThanOrEqual(VIEW_HEIGHT);
      }
    }
  });
});

describe('horizonRing', () => {
  test('halka kapalı ve merkezin çevresinde', () => {
    const ring = horizonRing(HORIZON_RADII[0]);

    expect(ring.length).toBe(96);
    expect(Math.min(...ring.map((p) => p.x))).toBeLessThan(CENTER_X);
    expect(Math.max(...ring.map((p) => p.x))).toBeGreaterThan(CENTER_X);
    expect(Math.min(...ring.map((p) => p.y))).toBeLessThan(CENTER_Y);
    expect(Math.max(...ring.map((p) => p.y))).toBeGreaterThan(CENTER_Y);
  });

  test('halka yatık — dikey yarıçap yatayın belirgin altında', () => {
    const ring = horizonRing(HORIZON_RADII[2]);
    const width = Math.max(...ring.map((p) => p.x)) - Math.min(...ring.map((p) => p.x));
    const height = Math.max(...ring.map((p) => p.y)) - Math.min(...ring.map((p) => p.y));

    expect(height).toBeLessThan(width * 0.75);
  });

  test('halkalar tuvale sığıyor', () => {
    for (const radius of HORIZON_RADII) {
      for (const point of horizonRing(radius)) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(VIEW_WIDTH);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(VIEW_HEIGHT);
      }
    }
  });
});
