import { expect, test } from 'vitest';
import { takimyildizSahnesi } from './acilis-takimyildizi-geometri';

const viewport = { width: 1000, height: 800 } as const;

function averageDistanceFromCenter(progress: number): number {
  const scene = takimyildizSahnesi(progress, viewport);
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  return (
    scene.nodes.reduce(
      (sum, node) => sum + Math.hypot(node.x - centerX, node.y - centerY),
      0,
    ) / scene.nodes.length
  );
}

test('the opening is a deterministic field of OSMOS stars, not an object outline', () => {
  const first = takimyildizSahnesi(0, viewport);
  const second = takimyildizSahnesi(0, viewport);

  expect(first.nodes).toHaveLength(84);
  expect(first.nodes).toEqual(second.nodes);
  expect(first.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y))).toBe(
    true,
  );
});

test('stars breathe inward once, then release back into the scent space', () => {
  const startDistance = averageDistanceFromCenter(0);
  const gatheredDistance = averageDistanceFromCenter(0.48);
  const releasedDistance = averageDistanceFromCenter(0.86);

  expect(gatheredDistance).toBeLessThan(startDistance * 0.55);
  expect(releasedDistance).toBeGreaterThan(gatheredDistance * 2);
});

test('the aperture fully reveals the live page and leaves no opening stars behind', () => {
  const beforeReveal = takimyildizSahnesi(0.52, viewport);
  const final = takimyildizSahnesi(1, viewport);

  expect(beforeReveal.aperture).toBe(0);
  expect(final.aperture).toBe(1);
  expect(final.nodes.every((node) => node.alpha === 0)).toBe(true);
});
