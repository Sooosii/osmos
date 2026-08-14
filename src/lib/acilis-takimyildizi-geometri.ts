import { FAMILIES } from '@/data/families';
import { takimyildizFazlari } from './acilis-takimyildizi';

interface Viewport {
  readonly width: number;
  readonly height: number;
}

interface StarSeed {
  readonly index: number;
  readonly startX: number;
  readonly startY: number;
  readonly angle: number;
  readonly orbitRadius: number;
  readonly releaseRadius: number;
  readonly radius: number;
}

export interface TakimyildizDugumu {
  readonly nodeIndex: number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly color: string;
  readonly alpha: number;
}

export interface TakimyildizSahnesi {
  readonly nodes: readonly TakimyildizDugumu[];
  readonly aperture: number;
}

function seededRandom() {
  let state = 0x4f534d4f;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function makeStars(): readonly StarSeed[] {
  const random = seededRandom();
  return Array.from({ length: 84 }, (_, index) => ({
    index,
    startX: 0.04 + random() * 0.92,
    startY: 0.05 + random() * 0.88,
    angle: random() * Math.PI * 2,
    orbitRadius: 0.07 + random() * 0.12,
    releaseRadius: 0.64 + random() * 0.28,
    radius: 0.7 + random() * 1.45,
  }));
}

const STARS = makeStars();

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

export function takimyildizSahnesi(progress: number, viewport: Viewport): TakimyildizSahnesi {
  const phases = takimyildizFazlari(progress);
  const width = Math.max(1, viewport.width);
  const height = Math.max(1, viewport.height);
  const scale = Math.min(width, height);
  const releaseScale = Math.hypot(width, height) * 0.5;
  const centerX = width * 0.5;
  const centerY = height * 0.5;

  const nodes = STARS.map((star): TakimyildizDugumu => {
    const startX = star.startX * width;
    const startY = star.startY * height;
    const orbitAngle = star.angle + phases.gather * 0.22;
    const orbitX = centerX + Math.cos(orbitAngle) * star.orbitRadius * scale;
    const orbitY = centerY + Math.sin(orbitAngle) * star.orbitRadius * scale;
    const releasedAngle = star.angle + (star.index % 2 === 0 ? 0.14 : -0.14);
    const releasedX = centerX + Math.cos(releasedAngle) * star.releaseRadius * releaseScale;
    const releasedY = centerY + Math.sin(releasedAngle) * star.releaseRadius * releaseScale;
    const gatheredX = lerp(startX, orbitX, phases.gather);
    const gatheredY = lerp(startY, orbitY, phases.gather);

    return {
      nodeIndex: star.index,
      x: lerp(gatheredX, releasedX, phases.release),
      y: lerp(gatheredY, releasedY, phases.release),
      radius: star.radius * (1 + phases.gather * 0.22),
      color: FAMILIES[star.index % FAMILIES.length].color,
      alpha: (0.48 + (star.index % 7 === 0 ? 0.38 : 0.12)) * (1 - phases.reveal),
    };
  });

  return { nodes, aperture: phases.reveal };
}
