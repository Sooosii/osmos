import type { MetadataRoute } from 'next';
import { sitemapEntries } from '@/lib/site-map';

/**
 * Sitemap — girdileri kuran şey `lib/site-map.ts`te ve orada sınanıyor.
 *
 * Bu dosya `app/` kökünde duruyor, `[lang]` altında değil: sitemap tek ve
 * bütün dilleri birden listeliyor.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries();
}
