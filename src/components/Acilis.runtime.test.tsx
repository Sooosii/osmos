// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ACILIS_SEEN_KEY, oturumDeposu, oturumOku, oturumYaz } from '@/lib/acilis-oturum';
import { Acilis } from './Acilis';

vi.mock('./AcilisTakimyildizi', () => ({
  AcilisTakimyildizi: () => <div data-opening-gate="true" />,
}));

let reduceMotion = false;
vi.mock('@/lib/motion', () => ({ prefersReducedMotion: () => reduceMotion }));

let container: HTMLDivElement;
let root: Root;
let shell: HTMLDivElement;

beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true;
  reduceMotion = false;
  const storage = oturumDeposu();
  storage?.setItem(ACILIS_SEEN_KEY, '');
  shell = document.createElement('div');
  shell.id = 'osmos-space-shell';
  shell.setAttribute('inert', '');
  shell.setAttribute('aria-hidden', 'true');
  document.body.append(shell);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  shell.remove();
  container.remove();
  vi.unstubAllGlobals();
});

test('ilk ziyarette resim yuklemeden hafif acilis kapisini kurar', async () => {
  vi.stubGlobal(
    'Image',
    class {
      constructor() {
        throw new Error('the live opening must not allocate frame images');
      }
    },
  );

  await act(async () => {
    root.render(<Acilis />);
    await Promise.resolve();
  });

  expect(container.querySelector('[data-opening-gate]')).not.toBeNull();
});

test('ayni oturumda kapidan donen kisinin uzay kilidini acar', async () => {
  oturumYaz(oturumDeposu(), ACILIS_SEEN_KEY, '1');

  await act(async () => {
    root.render(<Acilis />);
    await Promise.resolve();
  });

  expect(container.querySelector('[data-opening-gate]')).toBeNull();
  expect(shell.hasAttribute('inert')).toBe(false);
  expect(shell.hasAttribute('aria-hidden')).toBe(false);
});

test('azaltilmis harekette kapinin tamamini atlar ve oturumu isaretler', async () => {
  reduceMotion = true;

  await act(async () => {
    root.render(<Acilis />);
    await Promise.resolve();
  });

  expect(container.querySelector('[data-opening-gate]')).toBeNull();
  expect(shell.hasAttribute('inert')).toBe(false);
  expect(oturumOku(oturumDeposu(), ACILIS_SEEN_KEY)).toBe('1');
});
