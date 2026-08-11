import 'server-only';

import { memoryAllowed, redisPipeline, redisTarget } from './redis-rest';

/**
 * Hız sınırı — sabit pencereli sayaç, Upstash Redis üzerinde.
 *
 * Sahibin sorusuydu (2026-08-11): *"isteklerimde rate limiting var mı?"*
 * Cevap "kısmen"di — Better Auth kendi uçlarını koruyordu (60 sn'de 30),
 * ama Server Action'lar ve üç uç tamamen açıktı.
 *
 * ⚠️ En kırılgan yer `/api/compose/nearest`: her istekte benzerlik motorunu
 * 52 parfüm üzerinde çalıştırıyor, yani **gerçek CPU harcıyor** ve girişsiz
 * herkese açık. Bir bot saniyede yüzlerce istek atarsa hem site yavaşlar hem
 * fatura şişer. Sınırın asıl sebebi bu uç.
 *
 * ⚠️ **Arıza hâlinde GEÇİRİYOR (fail-open), engellemiyor.** Redis'e
 * ulaşılamazsa istek kabul ediliyor. Ters karar — sayaç okunamadığında
 * reddetmek — bir Redis kesintisini site kesintisine çevirirdi. Bu bir
 * güvenlik sınırı değil, bir **koruma**: yetkiyi Server Action'lardaki
 * `currentViewer()` veriyor, burası yalnızca gürültüyü kesiyor.
 *
 * Sabit pencere seçildi, kayan pencere değil: tek `INCR` ile çalışıyor,
 * kayan pencere her istekte sıralı küme bakımı isterdi. Bedeli pencere
 * sınırındaki iki katlık patlama — bir botu durdurmak için fazlasıyla yeterli.
 */

export interface RateVerdict {
  readonly ok: boolean;
  /** Pencerenin bitmesine kalan saniye — `Retry-After` başlığına gidiyor. */
  readonly retryAfter: number;
}

/** Şu anki pencere dilimi. Anahtar buna göre adlanıyor, süresi de bu kadar. */
export function windowSlot(nowMs: number, windowSeconds: number): number {
  return Math.floor(nowMs / 1000 / windowSeconds);
}

/** Pencerenin kapanmasına kalan saniye; en az 1. */
export function secondsLeft(nowMs: number, windowSeconds: number): number {
  const passed = Math.floor(nowMs / 1000) % windowSeconds;
  return Math.max(1, windowSeconds - passed);
}

/** Sayaç okunduktan sonraki karar. Saf — sınamanın tuttuğu yer burası. */
export function verdictOf(
  count: number,
  limit: number,
  nowMs: number,
  windowSeconds: number,
): RateVerdict {
  if (count <= limit) return { ok: true, retryAfter: 0 };
  return { ok: false, retryAfter: secondsLeft(nowMs, windowSeconds) };
}

/**
 * İsteği atan kim?
 *
 * ⚠️ Sıra önemli: `x-real-ip` **Vercel'in kendi bastığı** başlık, istemci
 * uyduramıyor. `x-forwarded-for` yedek ve orada yalnızca ilk giriş okunuyor.
 * Vercel'de ikisi de platform tarafından yazıldığı için güvenilir; başka bir
 * yere taşınırsa ve önünde saf bir vekil olursa ilk giriş **uydurulabilir**
 * hâle gelir ve sınır atlanır. Sınırın koruma olup güvenlik sınırı olmaması
 * bu yüzden önemli.
 *
 * Başlık hiç yoksa herkes tek kovaya düşüyor — yerel geliştirmede olan budur
 * ve zararsız; üretimde Vercel başlığı her zaman basıyor.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get('x-real-ip')?.trim();
  if (real) return real;

  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;

  return 'bilinmeyen';
}

/* Bellek yolu: yalnız geliştirme ve sınama; üretimde Redis şart. */
const memory = new Map<string, { count: number; expiresAt: number }>();

/** Yalnızca sınamalar için — sayaçlar sınamalar arasında sızmasın. */
export function __clearRateMemory(): void {
  memory.clear();
}

function takeFromMemory(key: string, nowMs: number, windowSeconds: number): number {
  const found = memory.get(key);
  if (!found || found.expiresAt <= nowMs) {
    memory.set(key, { count: 1, expiresAt: nowMs + windowSeconds * 1000 });
    return 1;
  }
  found.count += 1;
  return found.count;
}

/**
 * Bir jeton al. Sayaç sınırı aşarsa `ok: false`.
 *
 * @param bucket   Hangi kapı — `nearest`, `shelf`, `write` …
 * @param identity IP ya da kullanıcı kimliği.
 */
export async function allow(
  bucket: string,
  identity: string,
  limit: number,
  windowSeconds: number,
): Promise<RateVerdict> {
  const nowMs = Date.now();
  const key = `rate:${bucket}:${identity}:${windowSlot(nowMs, windowSeconds)}`;

  const target = redisTarget();
  if (!target) {
    /* Üretimde Redis yoksa sınır uygulanamıyor; sessizce geçiriyoruz. */
    if (!memoryAllowed()) return { ok: true, retryAfter: 0 };
    return verdictOf(takeFromMemory(key, nowMs, windowSeconds), limit, nowMs, windowSeconds);
  }

  try {
    /*
      ⚠️ `EXPIRE ... NX` — süre YALNIZCA ilk kez konuyor. Her istekte
      yenilenseydi sabit pencere hiç kapanmaz, sürekli istek atan kullanıcı
      sonsuza kadar kilitli kalırdı. `NX` olmadan bu hata sessiz olurdu:
      sınır çalışıyor görünür, yalnızca kurtulmak imkânsızlaşırdı.
    */
    const [count] = await redisPipeline(target, [
      ['INCR', key],
      ['EXPIRE', key, String(windowSeconds), 'NX'],
    ]);

    return verdictOf(Number(count), limit, nowMs, windowSeconds);
  } catch {
    /* Fail-open: Redis kesintisi site kesintisine dönüşmemeli. */
    return { ok: true, retryAfter: 0 };
  }
}

/** 429 yanıtı — uçların ortak dili. */
export function tooManyRequests(verdict: RateVerdict): Response {
  return new Response(null, {
    status: 429,
    headers: { 'Retry-After': String(verdict.retryAfter), 'Cache-Control': 'no-store' },
  });
}
