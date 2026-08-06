import { describe, expect, it } from 'vitest';
import { PERFUMES } from '@/data/perfumes';
import { buildMarks } from './space-marks';
import { introPoints } from './intro-points';

function mark(x: number, y: number, depth = 0.5) {
  return {
    id: 'x',
    name: 'X',
    brand: 'Y',
    line: null,
    color: '#abcdef',
    x,
    y,
    depth,
    neighborIds: [],
    feel: [0, 0, 0, 0],
  } as unknown as Parameters<typeof introPoints>[0][number];
}

describe('introPoints', () => {
  it('merkezi kutunun ortasına koyuyor', () => {
    const [point] = introPoints([mark(0, 0)]);

    expect(point.x).toBe(50);
    expect(point.y).toBe(50);
  });

  it('iki ekseni aynı çarpanla ölçekliyor', () => {
    const [point] = introPoints([mark(1, 1)]);

    expect(point.x - 50).toBe(point.y - 50);
  });

  it('ailenin rengini olduğu gibi taşıyor', () => {
    const [point] = introPoints([mark(0, 0)]);

    expect(point.color).toBe('#abcdef');
  });

  it('derinliği çapa çeviriyor: uzak küçük, yakın büyük', () => {
    const [far] = introPoints([mark(0, 0, 0)]);
    const [near] = introPoints([mark(0, 0, 1)]);

    expect(far.size).toBe(4);
    expect(near.size).toBe(14);
  });

  it('gerçek veride hiçbir nokta kutunun dışına taşmıyor', () => {
    const points = introPoints(buildMarks(PERFUMES));

    expect(points).toHaveLength(PERFUMES.length);
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(100);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(100);
    }
  });
});
