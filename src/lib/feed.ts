import type { Perfume } from '@/data/types';
import { EN } from '@/i18n/en';

/**
 * RSS beslemesi — saf üretici.
 *
 * Duyuru kanalının sunucusuz yarısı: `/feed.xml` derlemede üretilir, abone
 * olan okuyucu robot yeni parfümü kendi görür. Tek dil İngilizce ve
 * bağlantılar kanonik öneksiz adresler — besleme bir duyuru kanalı, belge
 * değil (gerekçe ve reddedilenler:
 * `docs/superpowers/specs/2026-08-11-web-push-ve-rss-design.md`).
 *
 * ⚠️ **Madde tarihi bilerek yok.** RSS 2.0'da `pubDate` isteğe bağlı ve 52
 * parfümün eklenme tarihi hiçbir yerde ölçülü durmuyor — uydurmak olmaz.
 * Okuyucular yeniyi `guid`den tanır; `guid` kanonik sayfa adresi. Sıra da
 * bundan: yeni parfüm veri dosyasının sonuna eklenir, besleme ters çevirip
 * en yeniyi en üste koyar.
 */

/** Metin düğümüne ya da öznitelik değerine girecek her şey buradan geçer. */
export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function buildFeedXml(perfumes: readonly Perfume[], baseUrl: string): string {
  const items = [...perfumes].reverse().map((perfume) => {
    const link = `${baseUrl}/perfume/${perfume.id}`;
    const description =
      perfume.line?.en ?? EN.perfume.fallbackDescription(perfume.name, perfume.brand);

    return [
      '    <item>',
      `      <title>${escapeXml(`${perfume.name} — ${perfume.brand}`)}</title>`,
      `      <link>${link}</link>`,
      `      <guid isPermaLink="true">${link}</guid>`,
      `      <description>${escapeXml(description)}</description>`,
      '    </item>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(EN.site.name)}</title>`,
    `    <link>${baseUrl}</link>`,
    `    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>`,
    `    <description>${escapeXml(EN.site.description)}</description>`,
    '    <language>en</language>',
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}
