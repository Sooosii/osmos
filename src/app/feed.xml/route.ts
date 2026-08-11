import { PERFUMES } from '@/data/perfumes';
import { buildFeedXml } from '@/lib/feed';
import { siteUrl } from '@/lib/site-url';

/**
 * `/feed.xml` — duyuru kanalının sunucusuz yarısı.
 *
 * Rota işleyicileri Next 16'da varsayılan olarak dinamik; bu satır beslemeyi
 * derlemede ürettirip statik dosya olarak sunduruyor
 * (`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`,
 * Caching). Yeni parfüm bir sonraki yayınla beslemeye düşer — site tamamen
 * statik kalır.
 *
 * ⚠️ Kök varlık: `proxy.ts`teki `ROOT_ASSETS`te satırı var. Satır düşerse
 * adres dil önekiyle yeniden yazılır ve besleme **sessizce** 404 döner.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(buildFeedXml(PERFUMES, siteUrl()), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
