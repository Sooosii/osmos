// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AcilisTakimyildizi } from './AcilisTakimyildizi';

const motion = vi.hoisted(() => ({ reduced: false }));
const imageSources = vi.hoisted(() => [] as string[]);

vi.mock('@/lib/motion', () => ({
  prefersReducedMotion: () => motion.reduced,
}));

vi.mock('@/i18n/LocaleProvider', () => ({
  useDict: () => ({
    openingGate: {
      scrollHint: 'Scroll to awaken the scent',
      touchHint: 'Swipe up to awaken the scent',
      skip: 'Skip the opening and enter the scent space',
    },
  }),
}));

const gradient = { addColorStop: () => undefined };
const context = {
  arc: () => undefined,
  beginPath: () => undefined,
  clearRect: () => undefined,
  createRadialGradient: () => gradient,
  drawImage: () => undefined,
  fill: () => undefined,
  fillRect: () => undefined,
  fillStyle: '',
  filter: 'none',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  lineTo: () => undefined,
  lineWidth: 1,
  moveTo: () => undefined,
  restore: () => undefined,
  save: () => undefined,
  scale: () => undefined,
  setTransform: () => undefined,
  shadowBlur: 0,
  shadowColor: '',
  stroke: () => undefined,
  strokeStyle: '',
  translate: () => undefined,
};

let container: HTMLDivElement;
let root: Root;
let frameId: number;
let frames: Map<number, FrameRequestCallback>;
let maxPendingFrames: number;

function flushQueuedFrames(limit: number) {
  for (let index = 0; index < limit && frames.size > 0; index += 1) {
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback(index * 16.67);
  }
}

async function mount(onEngage = vi.fn(), onComplete = vi.fn()) {
  await act(async () => {
    root.render(<AcilisTakimyildizi onEngage={onEngage} onComplete={onComplete} />);
    await Promise.resolve();
  });
  return { onEngage, onComplete };
}

beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true;
  motion.reduced = false;
  imageSources.length = 0;
  frameId = 0;
  frames = new Map();
  maxPendingFrames = 0;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);

  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    bottom: 900,
    height: 900,
    left: 0,
    right: 1440,
    top: 0,
    width: 1440,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
  vi.stubGlobal(
    'Image',
    class {
      naturalHeight = 864;
      naturalWidth = 1536;
      onerror: null | (() => void) = null;
      onload: null | (() => void) = null;

      async decode() {
        return undefined;
      }

      set src(value: string) {
        imageSources.push(value);
      }
    },
  );
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frameId += 1;
    frames.set(frameId, callback);
    maxPendingFrames = Math.max(maxPendingFrames, frames.size);
    return frameId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frames.delete(id);
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('draws with a 1.5 DPR cap without allocating an image', async () => {
  await mount();

  const canvas = container.querySelector('canvas');
  const gate = container.querySelector<HTMLElement>('[data-opening-gate]');
  expect(canvas?.width).toBe(2160);
  expect(canvas?.height).toBe(1350);
  expect(imageSources).toEqual([]);
  expect(gate?.style.getPropertyValue('--opening-root-bg')).toBe('0');
});

test.each([
  { deltaMode: 0, deltaY: 810, label: 'pixels' },
  { deltaMode: 1, deltaY: 50.625, label: 'lines' },
  { deltaMode: 2, deltaY: 0.9, label: 'pages' },
])('one RAF chain normalizes $label into a 0.9-screen wheel movement', async ({
  deltaMode,
  deltaY,
}) => {
  const { onEngage, onComplete } = await mount();
  const gate = container.querySelector<HTMLElement>('[data-opening-gate]');

  act(() =>
    gate?.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaMode, deltaY })),
  );
  act(() => flushQueuedFrames(100));

  expect(maxPendingFrames).toBe(1);
  expect(onEngage).toHaveBeenCalledTimes(1);
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('accessible skip uses the same single completion path', async () => {
  const { onEngage, onComplete } = await mount();
  const skip = container.querySelector<HTMLButtonElement>('button');

  act(() => skip?.click());
  act(() => flushQueuedFrames(100));

  expect(maxPendingFrames).toBe(1);
  expect(onEngage).toHaveBeenCalledTimes(1);
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('reduced motion completes without scheduling animation', async () => {
  motion.reduced = true;
  const { onEngage, onComplete } = await mount();

  expect(maxPendingFrames).toBe(0);
  expect(onEngage).not.toHaveBeenCalled();
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(imageSources).toEqual([]);
});
