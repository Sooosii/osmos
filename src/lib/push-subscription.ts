import { isLocale, type Locale } from '@/i18n/locale';

/**
 * Abone kaydının doğrulanması — `/api/push` ucunun kapısı.
 *
 * Uç herkese açık; buradan geçmeyen hiçbir şey depoya yazılmıyor. Şartlar
 * tarayıcının `PushSubscription.toJSON()` sözleşmesinden geliyor: `https`
 * endpoint (push servisleri başka şema kullanmaz) ve base64url iki anahtar.
 * Uzunluk sınırları depoyu çöp kayıtla şişirmeye karşı — gerçek endpoint'ler
 * birkaç yüz karakter, anahtarlar sabit boyda.
 */
export interface StoredSubscription {
  readonly endpoint: string;
  readonly keys: { readonly p256dh: string; readonly auth: string };
  /** Abone olunan sayfanın dili — bildirim bu dilde gider. */
  readonly lang: Locale;
}

const MAX_ENDPOINT = 2000;
const MAX_KEY = 512;
/** base64url; sonda dolgu `=` görülebiliyor (kütüphaneden kütüphaneye değişir). */
const BASE64URL = /^[A-Za-z0-9_-]+=*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isKey(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_KEY &&
    BASE64URL.test(value)
  );
}

function isEndpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_ENDPOINT) {
    return false;
  }
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/** `DELETE` gövdesi yalnızca endpoint taşıyor; aynı sınırlardan geçer. */
export function parseEndpoint(input: unknown): string | null {
  if (!isRecord(input)) return null;
  return isEndpoint(input.endpoint) ? input.endpoint : null;
}

/** Doğrulanmış kayıt ya da `null` — uç `null`u 400'e çevirir. */
export function parseSubscription(input: unknown): StoredSubscription | null {
  if (!isRecord(input)) return null;

  const { endpoint, keys, lang } = input;
  if (!isEndpoint(endpoint)) return null;
  if (!isRecord(keys) || !isKey(keys.p256dh) || !isKey(keys.auth)) return null;
  if (typeof lang !== 'string' || !isLocale(lang)) return null;

  return {
    endpoint,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
    lang,
  };
}
