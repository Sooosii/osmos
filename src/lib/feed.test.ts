import { describe, expect, test } from 'vitest';
import { PERFUMES } from '@/data/perfumes';
import type { Perfume } from '@/data/types';
import { buildFeedXml, escapeXml } from '@/lib/feed';

const BASE = 'https://osmos.example';

/** Besleme sınaması için asgari geçerli parfüm — notasız da madde olur. */
function fake(id: string, name: string, brand: string, line?: string): Perfume {
  return {
    id,
    name,
    brand,
    year: 2020,
    notes: [],
    curated: false,
    ...(line ? { line: { en: line, tr: line } } : {}),
  };
}

describe('escapeXml', () => {
  test('bes ozel karakteri kaciriyor', () => {
    expect(escapeXml(`<a & 'b' "c">`)).toBe('&lt;a &amp; &apos;b&apos; &quot;c&quot;&gt;');
  });
});

describe('buildFeedXml', () => {
  const xml = buildFeedXml(PERFUMES, BASE);

  test('rss iskeleti ve kendine bakan atom baglantisi', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain(`<atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml"/>`);
  });

  test('her parfum bir madde', () => {
    expect(xml.match(/<item>/g)?.length).toBe(PERFUMES.length);
  });

  test('en yeni ustte — veri sirasinin tersi', () => {
    /*
      Yeni parfüm dosyanın SONUNA eklenir (bugüne kadarki alışkanlık);
      besleme ters çevirip onu en üste koyar. Okuyucu robot yeniyi guid'den
      tanır ama insan gözü beslemeyi yukarıdan okur.
    */
    const newest = PERFUMES[PERFUMES.length - 1];
    const oldest = PERFUMES[0];
    expect(xml.indexOf(`/perfume/${newest.id}<`)).toBeGreaterThan(-1);
    expect(xml.indexOf(`/perfume/${newest.id}<`)).toBeLessThan(xml.indexOf(`/perfume/${oldest.id}<`));
  });

  test('guid kanonik sayfa adresi', () => {
    const perfume = PERFUMES[0];
    expect(xml).toContain(`<guid isPermaLink="true">${BASE}/perfume/${perfume.id}</guid>`);
  });

  test('tarih alani bilerek yok', () => {
    /*
      RSS 2.0'da pubDate isteğe bağlı; 52 parfüme tarih uydurmak ölçülmemiş
      sayı yazmak olurdu. lastBuildDate de yok: her derlemede değişip yenilik
      yokken yenilik sinyali verirdi. Bu sınama alanların geri gelmesini tutar.
    */
    expect(xml).not.toContain('pubDate');
    expect(xml).not.toContain('lastBuildDate');
  });

  test('kuratör cumlesi varsa madde tarifi odur, yoksa ad-marka', () => {
    const withLine = fake('lined', 'Lined', 'Brand', 'A quiet line.');
    const bare = fake('bare', 'Bare', 'Brand');
    const out = buildFeedXml([withLine, bare], BASE);
    expect(out).toContain('<description>A quiet line.</description>');
    expect(out).toContain('<description>Bare, Brand.</description>');
  });

  test('ham veri kaciriliyor', () => {
    const spiky = fake('spiky', 'Rose & Oud <n>', 'B"r&nd');
    const out = buildFeedXml([spiky], BASE);
    expect(out).toContain('Rose &amp; Oud &lt;n&gt; — B&quot;r&amp;nd');
    expect(out).not.toMatch(/<n>/);
  });
});
