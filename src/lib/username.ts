/**
 * Kullanıcı adı kuralları — saf, sınanabilir.
 *
 * Ad iki yerde yaşıyor: veritabanında benzersiz bir sütun ve adreste bir
 * segment (`/u/sooosii`). İkisi de bu modülden geçiyor; kural iki yere
 * kopyalanırsa biri gevşer ve fark ancak birisi tuhaf bir ad aldığında
 * görülür.
 *
 * Hata **anahtar** olarak dönüyor, cümle olarak değil: metin sözlükte
 * (`i18n/en.ts`, `tr.ts`) ve iki dilde yazılıyor. Saf modülün içine ekran
 * metni koymak, sitenin bir kez düzelttiği bir hataydı.
 */

export const MIN_USERNAME = 3;
export const MAX_USERNAME = 20;

/**
 * Kullanıcıya verilmeyen adlar.
 *
 * ⚠️ **Sitenin kök yolları burada olmak zorunda.** Profiller `/u/` altında
 * duruyor, yani teknik bir çakışma yok — ama `/u/notes` ile `/notes` insan
 * gözünde karışıyor, ve daha kötüsü: bugün olmayan bir yol yarın bir sayfaya
 * dönüşürse o adı almış kullanıcının profili sessizce gölgelenir. Yeni bir
 * kök yol eklendiğinde buraya da bir satır (bir sınama denetliyor).
 *
 * `osmos` sitenin kendi adı; `admin`, `support`, `help` kimliğe bürünmeye
 * açık adlar.
 */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  // Sitenin yolları
  'u',
  'signin',
  'signup',
  'signout',
  'settings',
  'privacy',
  'api',
  'notes',
  'note',
  'perfume',
  'space',
  'evolution',
  'feed',
  'sitemap',
  'robots',
  'manifest',
  'icon',
  // Diller
  'en',
  'tr',
  // Kimlik
  'osmos',
  'admin',
  'root',
  'support',
  'help',
  'about',
  'contact',
  'me',
]);

const SHAPE = /^[a-z0-9_]+$/;

/** Adres ve veritabanı için tek biçim: küçük harf, boşluksuz. */
export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Kuralı çiğneyen ilk şey, ya da `null`.
 *
 * Girdi **normalize edilmiş** bekleniyor; çağıran önce `normalizeUsername`
 * çağırıyor. Büyük harfi burada hata saymak, kullanıcıya düzeltilebilir bir
 * şeyi hata diye göstermek olurdu.
 */
export type UsernameError =
  | 'tooShort'
  | 'tooLong'
  | 'charset'
  | 'startsWithDigit'
  | 'reserved';

export function usernameError(value: string): UsernameError | null {
  if (value.length < MIN_USERNAME) return 'tooShort';
  if (value.length > MAX_USERNAME) return 'tooLong';
  if (!SHAPE.test(value)) return 'charset';
  /*
    Harfle başlama şartı: `/u/404` ya da `/u/2026` gibi adresler sayfa mı
    kullanıcı mı belirsiz görünüyor. Alt tire de başta olmuyor — görünmez
    farklarla birbirine benzeyen adlar (`_ali`, `ali`) taklit kapısı.
  */
  if (!/^[a-z]/.test(value)) return 'startsWithDigit';
  if (RESERVED_USERNAMES.has(value)) return 'reserved';
  return null;
}
