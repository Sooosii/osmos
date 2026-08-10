/**
 * Adres katının saf tarafı — React, DOM ve Next tanımıyor.
 *
 * `space-feel-url.ts` ile aynı sözleşme ve aynı gerekçe: değiştirici bileşeni
 * sınanamaz, bu modül sınanabilir.
 *
 * İngilizce **öneksiz** duruyor (`/notes`), Türkçe önekli (`/tr/notes`). Bu bir
 * tercih değil sahibin kararı: `/` her zaman İngilizce açılır, hatırlama yok —
 * çerez de oturum bayrağı da reddedildi, gerekçeleri
 * `docs/superpowers/specs/2026-08-10-turkceye-gecis-design.md` ①'de.
 */
export const LOCALES = ['en', 'tr'] as const;

export type Locale = (typeof LOCALES)[number];

/** Öneksiz yolların dili. */
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Yolu dil öneki ve geri kalanı olarak ayırır.
 *
 * Geri kalan **öneksiz İngilizce yol**: `/tr/note/oud` → `/note/oud`. Bütün
 * bağlantılar bu biçimde yazılıyor; dil eklemek `withLocale`in işi.
 *
 * `DEFAULT_LOCALE` öneki bilerek tanınmıyor: `/en/...` ortada dolaşan bir adres
 * değil, `proxy.ts` onu öneksiz hâline yönlendiriyor.
 */
export function stripLocale(pathname: string): { readonly locale: Locale; readonly rest: string } {
  const segments = pathname.split('/');
  const first = segments[1] ?? '';

  if (isLocale(first) && first !== DEFAULT_LOCALE) {
    const rest = segments.slice(2).join('/');
    return { locale: first, rest: rest === '' ? '/' : `/${rest}` };
  }

  return { locale: DEFAULT_LOCALE, rest: pathname };
}

/** Öneksiz yola dil önekini takar. Varsayılan dil önek almaz. */
export function withLocale(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

/**
 * Bulunulan sayfanın öbür dildeki adresi — parametreleriyle birlikte.
 *
 * ⚠️ Parametreler bilerek taşınıyor: uzayda bir parfüm seçiliyken (`?mark=`) ya
 * da kaydıraçlar ayarlıyken (`?feel=`) dil değiştiren kişi durumunu
 * kaybetmemeli. Kaybı fark etmek zor, sebebini anlamak daha da zor.
 */
export function switchPath(pathname: string, search: string, target: Locale): string {
  const { rest } = stripLocale(pathname);
  const path = withLocale(target, rest);

  const query = search.startsWith('?') ? search.slice(1) : search;
  return query === '' ? path : `${path}?${query}`;
}
