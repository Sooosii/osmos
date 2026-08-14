import { FAMILIES } from '@/data/families';
import { takimyildizFazlari } from './acilis-takimyildizi';

type TakimyildizGrubu = 'bottle' | 'glass' | 'neck' | 'nozzle' | 'bulb';

interface Viewport {
  readonly width: number;
  readonly height: number;
}

export interface TakimyildizDugumu {
  readonly nodeIndex: number;
  readonly group: TakimyildizGrubu;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly color: string;
  readonly alpha: number;
  readonly role: 'object' | 'star';
}

export interface TakimyildizKenari {
  readonly from: number;
  readonly to: number;
}

export interface TakimyildizSisi {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly color: string;
  readonly alpha: number;
}

interface TakimyildizBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface TakimyildizSahnesi {
  readonly nodes: readonly TakimyildizDugumu[];
  readonly edges: readonly TakimyildizKenari[];
  readonly mist: readonly TakimyildizSisi[];
  readonly bounds: Readonly<Record<TakimyildizGrubu, TakimyildizBounds>>;
  readonly backdropAlpha: number;
  readonly edgeAlpha: number;
}

const PATHS = [
  {
    group: 'bottle',
    closed: true,
    points: [
      [-0.17, 0.31],
      [-0.21, 0.28],
      [-0.23, 0.21],
      [-0.23, -0.01],
      [-0.21, -0.08],
      [-0.14, -0.12],
      [-0.11, -0.13],
      [0.1, -0.13],
      [0.14, -0.12],
      [0.21, -0.08],
      [0.23, -0.01],
      [0.23, 0.21],
      [0.21, 0.28],
      [0.17, 0.31],
    ],
  },
  {
    group: 'glass',
    closed: false,
    points: [
      [-0.18, 0.19],
      [-0.1, 0.22],
      [0, 0.23],
      [0.1, 0.22],
      [0.18, 0.19],
    ],
  },
  {
    group: 'neck',
    closed: true,
    points: [
      [-0.11, -0.13],
      [-0.11, -0.27],
      [-0.14, -0.31],
      [-0.14, -0.39],
      [0.12, -0.39],
      [0.12, -0.31],
      [0.09, -0.27],
      [0.09, -0.13],
    ],
  },
  {
    group: 'neck',
    closed: true,
    points: [
      [-0.04, -0.39],
      [-0.04, -0.47],
      [0, -0.5],
      [0.07, -0.47],
      [0.07, -0.39],
    ],
  },
  {
    group: 'nozzle',
    closed: false,
    points: [
      [-0.04, -0.45],
      [-0.12, -0.48],
      [-0.24, -0.48],
      [-0.3, -0.46],
    ],
  },
  {
    group: 'bulb',
    closed: true,
    points: [
      [0.11, -0.36],
      [0.22, -0.4],
      [0.3, -0.5],
      [0.42, -0.54],
      [0.54, -0.51],
      [0.61, -0.42],
      [0.54, -0.33],
      [0.42, -0.3],
      [0.3, -0.33],
      [0.22, -0.39],
    ],
  },
] as const satisfies readonly {
  readonly group: TakimyildizGrubu;
  readonly closed: boolean;
  readonly points: readonly (readonly [number, number])[];
}[];

interface NormalizedNode {
  readonly nodeIndex: number;
  readonly group: TakimyildizGrubu;
  readonly x: number;
  readonly y: number;
}

const NORMALIZED_NODES: readonly NormalizedNode[] = PATHS.flatMap((path) =>
  path.points.map(([x, y]) => ({
    nodeIndex: 0,
    group: path.group,
    x,
    y,
  })),
).map((node, nodeIndex) => ({ ...node, nodeIndex }));

const EDGES: readonly TakimyildizKenari[] = (() => {
  const edges: TakimyildizKenari[] = [];
  let offset = 0;

  for (const path of PATHS) {
    for (let index = 1; index < path.points.length; index += 1) {
      edges.push({ from: offset + index - 1, to: offset + index });
    }
    if (path.closed) edges.push({ from: offset + path.points.length - 1, to: offset });
    offset += path.points.length;
  }

  return edges;
})();

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function scatter(index: number, ending: boolean) {
  const salt = ending ? 61 : 17;
  return {
    x: 0.05 + (((index * 43 + salt) % 97) / 97) * 0.9,
    y: 0.06 + (((index * 67 + salt * 2) % 89) / 89) * 0.86,
  };
}

function boundsFor(nodes: readonly TakimyildizDugumu[], group: TakimyildizGrubu): TakimyildizBounds {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    if (node.group !== group) continue;
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x);
    maxY = Math.max(maxY, node.y);
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function takimyildizSahnesi(progress: number, viewport: Viewport): TakimyildizSahnesi {
  const phases = takimyildizFazlari(progress);
  const width = Math.max(1, viewport.width);
  const height = Math.max(1, viewport.height);
  const scale = Math.min(width, height) * 0.72;
  const centerX = width * 0.48;
  const centerY = height * 0.59;
  const bulbCompression = 1 - phases.squeeze * 0.23;

  const nodes = NORMALIZED_NODES.map((node): TakimyildizDugumu => {
    const start = scatter(node.nodeIndex, false);
    const ending = scatter(node.nodeIndex, true);
    const normalizedX =
      node.group === 'bulb' ? 0.39 + (node.x - 0.39) * bulbCompression : node.x;
    const shapeX = centerX + normalizedX * scale;
    const shapeY = centerY + node.y * scale;
    const assembledX = lerp(start.x * width, shapeX, phases.assemble);
    const assembledY = lerp(start.y * height, shapeY, phases.assemble);

    return {
      nodeIndex: node.nodeIndex,
      group: node.group,
      x: lerp(assembledX, ending.x * width, phases.dissolve),
      y: lerp(assembledY, ending.y * height, phases.dissolve),
      radius: 1.15 + (node.nodeIndex % 5 === 0 ? 0.85 : 0),
      color: FAMILIES[node.nodeIndex % FAMILIES.length].color,
      alpha: (0.52 + phases.assemble * 0.48) * (1 - phases.reveal * 0.42),
      role: phases.dissolve >= 0.5 ? 'star' : 'object',
    };
  });

  const nozzleX = centerX - 0.3 * scale;
  const nozzleY = centerY - 0.46 * scale;
  const mist = Array.from({ length: 18 }, (_, index): TakimyildizSisi => {
    const stagger = index * 0.008;
    const travel = clamp01((phases.mist - stagger) / (1 - stagger));
    const wave = Math.sin((travel + index * 0.13) * Math.PI * 2);

    return {
      x: nozzleX - scale * (0.04 + index * 0.014) * travel,
      y: nozzleY - scale * (0.018 + index * 0.004) * travel + wave * scale * 0.012,
      radius: 0.85 + (index % 4) * 0.28,
      color: FAMILIES[(index + 3) % FAMILIES.length].color,
      alpha: Math.sin(travel * Math.PI) * phases.mist,
    };
  });

  return {
    nodes,
    edges: EDGES,
    mist,
    bounds: {
      bottle: boundsFor(nodes, 'bottle'),
      glass: boundsFor(nodes, 'glass'),
      neck: boundsFor(nodes, 'neck'),
      nozzle: boundsFor(nodes, 'nozzle'),
      bulb: boundsFor(nodes, 'bulb'),
    },
    backdropAlpha: 1 - phases.reveal,
    edgeAlpha: (0.08 + phases.assemble * 0.62) * (1 - phases.dissolve),
  };
}
