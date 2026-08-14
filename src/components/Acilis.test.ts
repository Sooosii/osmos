import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { Acilis } from './Acilis';

test('oturum karari verilmeden yukleme durumunu parlatmaz', () => {
  const html = renderToStaticMarkup(createElement(Acilis));

  expect(html).toContain('data-opening-decision="pending"');
  expect(html).not.toContain('data-opening-gate="true"');
  expect(html).not.toContain('role="status"');
});
