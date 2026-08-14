import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { AcilisObsidyen } from './AcilisObsidyen';

test('renders a silent two-state atomizer that owns opening input', () => {
  const html = renderToStaticMarkup(
    createElement(AcilisObsidyen, {
      onEngage: () => undefined,
      onComplete: () => undefined,
    }),
  );

  expect(html).toContain('data-opening-gate="true"');
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('touch-action:none');
  expect(html).toContain('data-obsidyen-frame="rest"');
  expect(html).toContain('data-obsidyen-frame="squeezed"');
  expect(html).not.toContain('role="status"');
  expect(html).not.toContain('<canvas');
});
