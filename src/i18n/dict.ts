import type { Localized } from '@/data/types';
import { DEFAULT_LOCALE, isLocale, type Locale } from './locale';
import { EN, type Dict } from './en';
import { TR } from './tr';
import { activeTenant, isOsmos } from '@/lib/tenant';
import { brandStrings } from './brand';

/**
 * Kiracının markası sözlüğe burada giriyor.
 *
 * ⚠️ **Markalamanın tek dikişi burası ve bu bilinçli.** Ekranda "OSMOS" yazan
 * yirmiden fazla yer var (çerçeve, künye altı, 404, hata ekranı, sekme
 * başlıkları, manifest) ve hepsi zaten `t.site.name` okuyor. Sözlüğü giriş
 * noktasında markalamak, o yirmi yeri tek tek elden geçirmeden hepsini
 * kiracının adına çeviriyor. Yeni bir sayfa da doğru adı bedava alıyor —
 * markayı elle yazan bir sayfa ise kiracıda yanlış görünür, o yüzden ekrana
 * marka basan her yer `t.site.name`den geçmek zorunda.
 *
 * ⚠️ Ana sitede sözlük **nesne olarak** dönüyor, kopyası değil: `isOsmos()`
 * erken çıkışı bugünkü OSMOS'un birebir aynı kalmasının garantisi.
 */
function branded(dict: Dict, locale: Locale): Dict {
  if (isOsmos()) return dict;

  const tenant = activeTenant();

  /*
    Önce sözlüğün TAMAMINDAKİ marka adı değişiyor (başlıkların içine gömülü
    olanlar dahil, `brand.ts`), sonra `site` bloğu kiracının kendi başlığı ve
    tarifiyle eziliyor. Sıra önemli: ters olsaydı geçiş `site.title`ı da
    tarayıp kiracının başlığını bozardı.
  */
  const swapped = brandStrings(dict, EN.site.name, tenant.name);

  return {
    ...swapped,
    site: {
      name: tenant.name,
      title: tenant.title[locale],
      description: tenant.description[locale],
    },
  };
}

/**
 * Dil kodundan sözlüğe — statik harita.
 *
 * ⚠️ Next rehberinin önerdiği `import()` ile tembel yükleme **kullanılmıyor.**
 * Sebep `LocaleProvider`da yazılı: sözlük istemciye prop olarak geçemiyor
 * (içinde işlev var), o yüzden istemci onu kendi paketinden çözmek zorunda.
 * İki sözlük de pakete iniyor; ikisi de gerçekten kullanıldığı için israf değil.
 */
const DICTS: Readonly<Record<Locale, Dict>> = { en: branded(EN, 'en'), tr: branded(TR, 'tr') };

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
