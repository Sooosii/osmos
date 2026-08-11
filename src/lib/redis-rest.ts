/**
 * Upstash Redis'e SDK'sız REST — taşıma katmanı.
 *
 * Abone deposunda (`push-store.ts`) doğmuştu; hız sınırı da aynı Redis'i
 * kullanınca buraya çıkarıldı. İkinci bir `fetch` sarmalayıcısı yazmak, bir
 * gün birinin yalnız birini düzeltmesi demekti.
 *
 * SDK bilerek yok: gereken komutlar tek bir sarmalayıcıya sığıyor ve çalışma
 * anına yeni bağımlılık girmiyor.
 */

export interface RedisTarget {
  readonly url: string;
  readonly token: string;
}

/*
  İki ad da okunuyor: Vercel'in Upstash entegrasyonu kurulum yaşına göre
  `KV_REST_API_*` (eski Vercel KV adları) ya da `UPSTASH_REDIS_REST_*` basıyor.
  Tek adı desteklemek, öbür adla kurulmuş panelde her şeyin sessizce ölmesi demek.
*/
export function redisTarget(): RedisTarget | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

/** Env yokken bellek yoluna izin var mı — üretimde asla. */
export function memoryAllowed(): boolean {
  return process.env.NODE_ENV !== 'production';
}

async function post(target: RedisTarget, path: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${target.url}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${target.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`Redis ${response.status}`);
  return response.json();
}

/** Tek komut. */
export async function redisCommand(
  target: RedisTarget,
  command: readonly string[],
): Promise<unknown> {
  const data = (await post(target, '', command)) as { result?: unknown; error?: string };
  if (data.error) throw new Error(`Redis: ${data.error}`);
  return data.result;
}

/**
 * Birden çok komut, **tek gidiş-dönüş**.
 *
 * Hız sınırı iki komut çalıştırıyor (`INCR` + `EXPIRE`) ve bunları ayrı ayrı
 * göndermek her istekte iki ağ turu demekti — sınırın kendisi yavaşlatan şey
 * hâline gelirdi. Boru hattı ikisini bir istekte topluyor.
 */
export async function redisPipeline(
  target: RedisTarget,
  commands: readonly (readonly string[])[],
): Promise<readonly unknown[]> {
  const data = (await post(target, '/pipeline', commands)) as readonly {
    result?: unknown;
    error?: string;
  }[];

  if (!Array.isArray(data)) throw new Error('Redis: boru hattı yanıtı beklenmedik');
  return data.map((entry) => {
    if (entry.error) throw new Error(`Redis: ${entry.error}`);
    return entry.result;
  });
}
