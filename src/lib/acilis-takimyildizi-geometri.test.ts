import { expect, test } from 'vitest';
import { takimyildizSahnesi } from './acilis-takimyildizi-geometri';

test('the approved atomizer topology has 46 nodes and 44 edges', () => {
  const scene = takimyildizSahnesi(0.3, { width: 1000, height: 800 });
  expect(scene.nodes).toHaveLength(46);
  expect(scene.edges).toHaveLength(44);
  expect(scene.nodes[0]).toMatchObject({ group: 'bottle', x: 382.08, y: 650.56 });
});

test('the squeeze compresses the bulb without moving the bottle', () => {
  const still = takimyildizSahnesi(0.3, { width: 1000, height: 800 });
  const squeezed = takimyildizSahnesi(0.46, { width: 1000, height: 800 });
  expect(squeezed.nodes[0]).toEqual(still.nodes[0]);
  expect(squeezed.bounds.bulb.width).toBeLessThan(still.bounds.bulb.width);
  expect(squeezed.mist.some((particle) => particle.alpha > 0)).toBe(true);
});

test('the final frame is transparent and no longer reads as an object', () => {
  const scene = takimyildizSahnesi(1, { width: 1000, height: 800 });
  expect(scene.backdropAlpha).toBe(0);
  expect(scene.edgeAlpha).toBe(0);
  expect(scene.nodes.every((node) => node.role === 'star')).toBe(true);
});
