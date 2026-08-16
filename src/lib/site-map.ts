import type { MetadataRoute } from 'next';
import { NOTES } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import { withLocale } from '@/i18n/locale';
import { aktifDiller, isOsmos } from '@/lib/tenant';
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
/**
 * ⚠️ Doğrulama ekranları (`/evolution`, `/space`) bilerek YOK.
 *
 * Ekranların kendisi kalıyor — sahibin kararı, bir daha sorulmayacak. Ama
 * sitemap'te durmaları ayrı bir şeydi ve kimse sormamıştı: sekme başlıkları
 * harfiyen "Space draft · OSMOS" ve aramadan gelen ziyaretçi kendini "taslak"
 * diye tanıtan bir sayfaya düşüyordu. İç araç, vitrin değil.
 *
 * Sitemap'ten çıkmak tek başına yetmez — sitemap bir davet, yasak değil.
 * İki sayfa ayrıca `robots: { index: false }` taşıyor (kendi
 * `generateMetadata`larında). Biri kalkarsa sayfalar sessizce indekse döner.
 */
/**
 * Her derlemede bulunan sabit yollar.
 *
 * ⚠️ `/notes` kiracıda site haritasına GİRMİYOR. Nota sayfalarının kendisi
 * kiracıda `noindex` (158 sayfa her kiracıda birebir aynı); listeyi haritada
 * bırakmak arama motorunu yalnız kapalı kapılara götürürdü. Liste sayfası
 * ziyaretçi için duruyor, gezinme bozulmuyor.
 */
const STATIC_PATHS = ['/', '/notes'] as const;
const KIRACI_STATIC_PATHS = ['/'] as const;

export function sitemapEntries(): MetadataRoute.Sitemap {
  const paths = [
    ...(isOsmos() ? STATIC_PATHS : KIRACI_STATIC_PATHS),
    /*
      ⚠️ Nota sayfaları kiracıda site haritasına GİRMİYOR. Sayfanın kendisi
      `noindex` (gerekçe `note/[id]/page.tsx`te: 158 sayfa her kiracıda
      birebir aynı, iki müşteride kopya içerik olur). Site haritasında
      bırakmak, arama motoruna "gel ama girme" demek olurdu.
    */
    ...(isOsmos() ? NOTES.map((note) => `/note/${note.id}`) : []),
    ...PERFUMES.map((perfume) => `/perfume/${perfume.id}`),
    /*
      "Buna benzeyenler" sayfaları — parfüm başına bir tane, arama motorundan
      gelen "X'e benzeyen parfümler" sorusunun kapısı. Künyenin kopyası
      değiller: paylaşılan notaları yazıyorlar (gerekçe `similar.ts`te).
    */
    ...PERFUMES.map((perfume) => `/similar/${perfume.id}`),
  ];

  const now = new Date();

  /*
    Her yol iki kez giriyor: bir kez İngilizce adresiyle, bir kez Türkçe. İkisi
    de aynı `alternates` bloğunu taşıyor — arama motoru hangisine girerse
    girsin öbürünü buluyor.
  */
  return paths.flatMap((path) => {
    const languages = Object.fromEntries(
      aktifDiller().map((locale) => [locale, absolute(withLocale(locale, path))]),
    );

    return aktifDiller().map((locale) => ({
      url: absolute(withLocale(locale, path)),
      lastModified: now,
      alternates: { languages },
    }));
  });
}
