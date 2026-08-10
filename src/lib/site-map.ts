import type { MetadataRoute } from 'next';
import { NOTES } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import { LOCALES, withLocale } from '@/i18n/locale';
import { absolute } from './site-url';

/**
 * Sitemap girdileri — saf, sınanabilir.
 *
 * `app/sitemap.ts` yalnızca bunu döndürüyor: dosya konvansiyonu sınanamıyor,
 * bu modül sınanabiliyor. Depodaki her saf modülle aynı sözleşme.
 *
 * hreflang ayrı bir iş değil: Next'in `alternates.languages` alanı onu
 * doğrudan üretiyor
 * (`node_modules/next/dist/docs/.../01-metadata/sitemap.md`).
 */
const STATIC_PATHS = ['/', '/notes', '/evolution', '/space'] as const;

export function sitemapEntries(): MetadataRoute.Sitemap {
  const paths = [
    ...STATIC_PATHS,
    ...NOTES.map((note) => `/note/${note.id}`),
    ...PERFUMES.map((perfume) => `/perfume/${perfume.id}`),
  ];

  const now = new Date();

  /*
    Her yol iki kez giriyor: bir kez İngilizce adresiyle, bir kez Türkçe. İkisi
    de aynı `alternates` bloğunu taşıyor — arama motoru hangisine girerse
    girsin öbürünü buluyor.
  */
  return paths.flatMap((path) => {
    const languages = Object.fromEntries(
      LOCALES.map((locale) => [locale, absolute(withLocale(locale, path))]),
    );

    return LOCALES.map((locale) => ({
      url: absolute(withLocale(locale, path)),
      lastModified: now,
      alternates: { languages },
    }));
  });
}
