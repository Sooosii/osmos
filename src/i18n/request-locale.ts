import { headers } from 'next/headers';
import { PATH_HEADER, stripLocale, type Locale } from './locale';

/**
 * İsteğin dili — rotadan değil, adresten.
 *
 * ⚠️ Bu, 404 sayfalarının dili çözmesinin **tek** yolu. Next `not-found` ve
 * `global-not-found` bileşenlerine prop geçmiyor (belge: not-found.md,
 * "Props"), yani `params.lang` yok. `usePathname` de çare değil: sunucuda
 * çalışmaz, `<html lang>`i ve üstveriyi kuramaz.
 *
 * `proxy.ts` gelen yolu `PATH_HEADER`a yazıyor, burası okuyor:
 * `/tr/yok` → tr, `/yok` → en. Başlık düşerse sessizce `DEFAULT_LOCALE`e
 * iner — yanlış dil, kırık sayfa değil.
 *
 * Ayrı dosyada duruyor çünkü `next/headers` sunucuya bağlı; `locale.ts` saf
 * kalmalı, onu istemci bileşenleri de içeri alıyor.
 */
export async function requestLocale(): Promise<Locale> {
  const path = (await headers()).get(PATH_HEADER);
  return stripLocale(path ?? '/').locale;
}
