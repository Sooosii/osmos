// @vitest-environment jsdom

import { act, createElement, type ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { LocaleProvider } from '@/i18n/LocaleProvider';
import type { PerfumeSearchDocument } from '@/lib/perfume-search';
import { PerfumeSearch } from './PerfumeSearch';

const DOCUMENTS: readonly PerfumeSearchDocument[] = [
  {
    id: 'rose-silence',
    name: 'Rose Silence',
    brand: 'Miller Harris',
    aliases: [],
    notes: [{ id: 'rose', en: 'Rose', tr: 'Gül' }],
  },
];

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(DOCUMENTS)));
  document.body.innerHTML = '<button id="outside">outside</button><div id="root"></div>';
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

test('arama panelini açar, sonucu yerel adrese bağlar ve Escape ile odağı geri verir', async () => {
  const container = document.querySelector('#root');
  if (!container) throw new Error('test root missing');
  const root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(
        LocaleProvider,
        { locale: 'tr' } as ComponentProps<typeof LocaleProvider>,
        createElement(PerfumeSearch),
      ),
    );
  });

  const trigger = document.querySelector<HTMLButtonElement>('button[aria-label="Parfüm ara"]');
  expect(trigger).not.toBeNull();

  await act(async () => {
    trigger?.click();
  });

  const dialog = document.querySelector('[role="dialog"]');
  const input = document.querySelector<HTMLInputElement>('input[type="search"]');
  expect(dialog).not.toBeNull();
  expect(input).toBe(document.activeElement);
  expect(dialog?.querySelector('[role="status"]')).not.toBeNull();
  expect(dialog?.querySelector('[class*="motion-reduce:transition-none"]')).not.toBeNull();

  const outside = document.querySelector<HTMLButtonElement>('#outside');
  outside?.focus();
  await act(async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  });
  expect(input).toBe(document.activeElement);

  await act(async () => {
    if (!input) return;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setValue?.call(input, 'rose');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  expect(document.querySelector<HTMLAnchorElement>('a[href="/tr/perfume/rose-silence"]')?.textContent).toContain(
    'Rose Silence',
  );

  await act(async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });

  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(trigger).toBe(document.activeElement);

  await act(async () => root.unmount());
});
