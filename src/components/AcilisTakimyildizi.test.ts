import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { AcilisTakimyildizi } from './AcilisTakimyildizi';

test('renders one silent canvas that owns opening input', () => {
  const html = renderToStaticMarkup(
    createElement(AcilisTakimyildizi, {
      onEngage: () => undefined,
      onComplete: () => undefined,
    }),
  );

  expect(html).toContain('data-opening-gate="true"');
  expect(html).toContain('<canvas aria-hidden="true"');
  expect(html).toContain('touch-action:none');
  expect(html).not.toContain('role="status"');
});
