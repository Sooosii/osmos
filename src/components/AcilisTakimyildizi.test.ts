import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { AcilisTakimyildizi } from './AcilisTakimyildizi';

vi.mock('@/i18n/LocaleProvider', () => ({
  useDict: () => ({
    openingGate: {
      scrollHint: 'Kokuyu uyandırmak için kaydır',
      touchHint: 'Kokuyu uyandırmak için yukarı sürükle',
      skip: 'Açılışı geç ve koku uzayına gir',
    },
  }),
}));

test('explains the opening gesture and keeps the canvas silent', () => {
  const html = renderToStaticMarkup(
    createElement(AcilisTakimyildizi, {
      onEngage: () => undefined,
      onComplete: () => undefined,
    }),
  );

  expect(html).toContain('data-opening-gate="true"');
  expect(html).toContain('<canvas aria-hidden="true"');
  expect(html).toContain('touch-action:none');
  expect(html).toContain('Kokuyu uyandırmak için kaydır');
  expect(html).toContain('Kokuyu uyandırmak için yukarı sürükle');
  expect(html).toContain('Açılışı geç ve koku uzayına gir');
  expect(html).toContain('<button');
  expect(html).not.toContain('data-atomizer-status');
  expect(html).not.toContain('role="status"');
});
