import type { MetadataRoute } from 'next';
import { absolute } from '@/lib/site-url';
import { activeTenant } from '@/lib/tenant';

/**
 * Gizlenecek bir şey yok: site bir harita, bulunması işine yarıyor.
 *
 * ⚠️ **Tek istisna demo kiracılar.** Bir işletmenin adıyla, onayı alınmadan
 * kurulmuş bir çalışma arama sonuçlarında görünmemeli — ne o işletme için ne
 * bizim için. `indexable: false` olan kiracıda robots her şeyi kapatıyor ve
 * sitemap hiç duyurulmuyor. Kiracı gerçek müşteriye dönüştüğü gün bayrak
 * açılır; kaydın kendisi (`tenants/registry.ts`) tek karar yeri.
 */
export default function robots(): MetadataRoute.Robots {
  if (!activeTenant().indexable) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absolute('/sitemap.xml'),
  };
}
