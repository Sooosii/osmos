// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AcilisTakimyildizi } from './AcilisTakimyildizi';

const motion = vi.hoisted(() => ({ reduced: false }));

vi.mock('@/lib/motion', () => ({
  prefersReducedMotion: () => motion.reduced,
}));

const gradient = { addColorStop: () => undefined };
const context = {
  arc: () => undefined,
  beginPath: () => undefined,
  clearRect: () => undefined,
  createRadialGradient: () => gradient,
  fill: () => undefined,
  fillRect: () => undefined,
  fillStyle: '',
  globalAlpha: 1,
  lineTo: () => undefined,
  lineWidth: 1,
  moveTo: () => undefined,
  setTransform: () => undefined,
  stroke: () => undefined,
  strokeStyle: '',
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
      constructor() {
        throw new Error('the constellation opening must not allocate images');
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

test('draws immediately with a 1.5 DPR cap and no image allocation', async () => {
  await mount();

  const canvas = container.querySelector('canvas');
  expect(canvas?.width).toBe(2160);
  expect(canvas?.height).toBe(1350);
});

test('one RAF chain finishes a 2.2-screen wheel movement', async () => {
  const { onEngage, onComplete } = await mount();
  const gate = container.querySelector<HTMLElement>('[data-opening-gate]');

  act(() => gate?.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 2200 })));
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
});
