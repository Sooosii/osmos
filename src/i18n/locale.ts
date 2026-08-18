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
import { TENANTS } from '@/data/tenants/registry';
import { TENANT_ID } from '@/lib/tenant-id';

export const LOCALES = ['en', 'tr'] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * Öneksiz yolların dili — **kiracıdan geliyor.**
 *
 * ⚠️ **Eskiden sabit `'en'`di ve bu bir teslim engeliydi.** Türk bir dükkânın
 * kiracı sitesi `/` adresinde Ingilizce açılıyordu; Türkiye'den gelen bir "evet"
 * yarım bir ürünle karşılaşırdı. Listedeki 45 Türkçe hesap tam bu yüzden ilk
 * partiden çıkarılmıştı.
 *
 * Kural: **kiracının BILDIRDIĞI ilk dil öneksiz olandır.** `locales: ['tr']`
 * yazan bir kiracıda `/` Türkçe açılıyor, `/tr/...` kanonik hâline yönleniyor
 * ve `/en/...` hiç üretilmiyor. Kiracı dil bildirmezse (OSMOS dahil) eskisi
 * gibi Ingilizce.
 *
 * ⚠️ **Kayıt `registry`den okunuyor, `tenant.ts`ten DEĞİL** — `tenant.ts` bu
 * dosyadan `LOCALES` alıyor ve ters yönde bir değer ithali çalışma zamanında
 * döngü kurardı. `registry` bu dosyadan yalnız **tip** alıyor, o kenar derlemede
 * siliniyor. Ortam okuması ikisinin de altındaki `lib/tenant-id.ts`te.
 *
 * ⚠️ Bilinmeyen kimlikte **patlamıyor**, Ingilizceye düşüyor: bu modül
 * `global-not-found` dahil her yerde yükleniyor ve buradaki bir istisna sitenin
 * kendi hata sayfasını da götürürdü. Kimliğin geçerliliğini `resolveTenant`
 * zaten derleme zamanında gürültüyle denetliyor.
 */
export const DEFAULT_LOCALE: Locale = varsayilanDil();

function varsayilanDil(): Locale {
  const kayit = TENANTS.find((t) => t.id === TENANT_ID);
  const ilk = kayit?.locales?.[0];
  return ilk !== undefined && (LOCALES as readonly string[]).includes(ilk) ? ilk : 'en';
}

/**
 * Adresi sunucuya taşıyan başlık.
 *
 * ⚠️ Bunun sebebi 404 sayfası. `global-not-found` eşleşmeyen adreslerde
 * çalışıyor, yani ortada bir rota yok — Next ona `params` geçemiyor ve
 * `usePathname` de sunucuda `<html lang>`i kuramaz. `proxy.ts` gelen yolu bu
 * başlığa yazıyor, sayfa da dilini oradan çözüyor. Başlık düşerse 404 sayfası
 * sessizce hep İngilizce açılır.
 */
export const PATH_HEADER = 'x-osmos-path';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Yolu dil öneki ve geri kalanı olarak ayırır.
 *
 * Geri kalan **öneksiz İngilizce yol**: `/tr/note/oud` → `/note/oud`. Bütün
 * bağlantılar bu biçimde yazılıyor; dil eklemek `withLocale`in işi.
 *
 * ⚠️ **`/en/...` öneki de ayrılmak ZORUNDA** ve bu bir 404 ölçülerek öğrenildi
 * (2026-08-11). Burada eskiden `first !== DEFAULT_LOCALE` şartı vardı; gerekçe
 * "`/en/...` ortada dolaşan bir adres değil, proxy onu öneksiz hâline
 * yönlendiriyor" idi. Gerekçenin yarısı eksikti: proxy **öneksiz** yolları da
 * içeriden `/en/...`e yeniden yazıyor ve `usePathname()` statik üretimde o iç
 * yolu döndürüyor. Önek tanınmayınca `switchPath` üstüne bir de `/tr` ekliyordu:
 *
 *     /notes → usePathname() '/en/notes' → TR bağlantısı '/tr/en/notes' → 404
 *
 * Yani her İngilizce sayfa bir 404'e bağlanıyordu. Hata gizliydi çünkü
 * `LangSwitch` düz sol tıkta araya girip doğru adrese gidiyor — kırılan
 * Ctrl/orta tık, "bağlantıyı kopyala" ve **arama motorlarıydı.** Şart geri
 * konursa hata da geri gelir; `locale.test.ts` tutuyor.
 */
export function stripLocale(pathname: string): { readonly locale: Locale; readonly rest: string } {
  const segments = pathname.split('/');
  const first = segments[1] ?? '';

  if (isLocale(first)) {
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
