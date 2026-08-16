import type { MetadataRoute } from 'next';
import { getDict } from '@/i18n/dict';
import { DEFAULT_LOCALE } from '@/i18n/locale';
import { SITE_BACKGROUND } from '@/lib/site-color';

/**
 * Ana ekrana eklenen sitenin kimliği.
 *
 * ⚠️ **Tek dilli ve bu bilerek**: manifest bir tane, sitenin birincil dili
 * İngilizce. Sözlükten okunuyor ki isim ve tarif iki yerde ayrışmasın.
 *
 * ⚠️ Adresi `/manifest.webmanifest` ve `proxy.ts`teki `ROOT_ASSETS`e yazılmak
 * zorunda: yazılmazsa dil önekiyle yeniden yazılır ve telefon manifest'i hiç
 * bulamaz. Bu sessizce olur — site çalışmaya devam eder, yalnızca ana ekrana
 * eklenince adı ve rengi gelmez.
 *
 * `display: 'standalone'` — ana ekrandan açılınca tarayıcı çubuğu görünmüyor.
 * Sitenin kendi çıkışları her sayfada var (üst şerit, "← uzaya dön"), yani
 * adres çubuğu olmadan da yol kaybolmuyor.
 */
export default function manifest(): MetadataRoute.Manifest {
  const t = getDict(DEFAULT_LOCALE);

  return {
    name: t.site.title,
    short_name: t.site.name,
    description: t.site.description,
    start_url: '/',
    display: 'standalone',
    background_color: SITE_BACKGROUND,
    theme_color: SITE_BACKGROUND,
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png' },
    ],
  };
}
