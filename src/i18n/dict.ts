import type { Localized } from '@/data/types';
import { DEFAULT_LOCALE, isLocale, type Locale } from './locale';
import { EN, type Dict } from './en';
import { TR } from './tr';

/**
 * Dil kodundan sözlüğe — statik harita.
 *
 * ⚠️ Next rehberinin önerdiği `import()` ile tembel yükleme **kullanılmıyor.**
 * Sebep `LocaleProvider`da yazılı: sözlük istemciye prop olarak geçemiyor
 * (içinde işlev var), o yüzden istemci onu kendi paketinden çözmek zorunda.
 * İki sözlük de pakete iniyor; ikisi de gerçekten kullanıldığı için israf değil.
 */
const DICTS: Readonly<Record<Locale, Dict>> = { en: EN, tr: TR };

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}

/**
 * Doğrulanmamış bir dizeden sözlük; tanınmayan dil varsayılana düşer.
 *
 * Sayfalar `params.lang`i `string` olarak alıyor ve `notFound()` ile zaten
 * korunuyorlar; bu yalnızca tipi daraltmanın ve elle yazılmış adreslerin
 * patlamamasının yolu.
 */
export function dictFor(value: string): Dict {
  return isLocale(value) ? DICTS[value] : DICTS[DEFAULT_LOCALE];
}

/** Doğrulanmamış bir dizeden dil kodu; tanınmayan dil varsayılana düşer. */
export function localeFor(value: string): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * İki dilli bir veri alanının o dildeki hâli.
 *
 * Faz 1'de bütün okumalar `.en`e sabitlenmişti; artık seçim dile bağlı ve tek
 * yerden geçiyor. Alan adını çağıranın hatırlaması gerekmiyor.
 */
export function say(value: Localized, locale: Locale): string {
  return value[locale];
}
