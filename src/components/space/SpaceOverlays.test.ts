import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { NO_FEEL } from '@/lib/space-feel';
import { SpaceOverlays } from './SpaceOverlays';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
}));

test('uzay kapidan sonra ikinci bir yaklasma esigi olmadan hazir cizilir', () => {
  const html = renderToStaticMarkup(
    createElement(
      SpaceOverlays,
      {
        labelRef: { current: null },
        feelTargetRef: { current: NO_FEEL },
        appliedFeel: null,
        railWordsRef: { current: null },
        onSlide: () => undefined,
        requestDraw: () => undefined,
        labelled: null,
        selectedLine: null,
        entryHint: false,
        entryProgress: 0,
        spaceId: 1,
        spaceCount: 2,
        spacePerfumeCount: 52,
        previousSpaceId: null,
        nextSpaceId: 2,
        isWarping: false,
        onNavigateSpace: () => undefined,
      },
      createElement('p', null, 'OSMOS'),
    ),
  );

  expect(html).toContain('data-space-controls="ready"');
  expect(html).not.toContain('data-approach-cue');
  expect(html).toContain('52 perfumes');
  expect(html).toContain('SPACE 1 / 2');
  expect(html).toContain('aria-live="polite"');
  expect(html).toContain('aria-label="Next scent space"');
  expect(html).toContain('aria-label="Previous scent space"');
  expect(html).toContain('aria-label="Search perfumes"');
});
