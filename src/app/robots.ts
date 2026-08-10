import type { MetadataRoute } from 'next';
import { absolute } from '@/lib/site-url';

/** Gizlenecek bir şey yok: site bir harita, bulunması işine yarıyor. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absolute('/sitemap.xml'),
  };
}
