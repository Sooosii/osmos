import { parseSubscription, type StoredSubscription } from './push-subscription';

/**
 * Abone deposu — Upstash Redis'e SDK'sız REST.
 *
 * Sitenin ilk sunucu parçasının hafızası. SDK bilerek yok: gereken beş komut
 * (`HSET`/`HDEL`/`HGETALL`/`SMEMBERS`/`SADD`) tek bir `fetch` sarmalayıcısına
 * sığıyor ve çalışma anına yeni bağımlılık girmiyor. Aynı modülü hem `/api/push`
 * rotası hem gönderici (`scripts/push-send.ts`, GitHub Action) kullanıyor —
 * komut biçimi tek yerde.
 *
 * İki anahtar yaşıyor:
 *   `push:subs`      — hash; alan = abone endpoint'i, değer = kayıt JSON'u.
 *                      Aynı endpoint üstüne yazar: kayıt çoğalmaz.
 *   `push:announced` — küme; duyurulmuş parfüm kimlikleri. Gönderici "yeni"yi
 *                      git geçmişinden değil bu kümeden ayırt eder.
 *
 * ⚠️ Env yokken üretimde depo "hazır değil" (uç 503 döner); geliştirme ve
 * sınamada bellek içi harita devreye girer — yerel demo Upstash hesabı olmadan
 * uçtan uca çalışsın diye. Bellek yolu üretimde BİLEREK kapalı: kayıtlar her
 * soğuk başlatmada uçar ve bu sessiz bir veri kaybı olurdu.
 */

const SUBS_KEY = 'push:subs';
const ANNOUNCED_KEY = 'push:announced';

interface RedisTarget {
  readonly url: string;
  readonly token: string;
}

/*
  İki ad da okunuyor: Vercel'in Upstash entegrasyonu kurulum yaşına göre
  `KV_REST_API_*` (eski Vercel KV adları) ya da `UPSTASH_REDIS_REST_*` basıyor.
  Tek adı desteklemek, öbür adla kurulmuş panelde ölçümün sessizce ölmesi demek.
*/
function redisTarget(): RedisTarget | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

function memoryAllowed(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/** Uç bunu 503'e çevirir; depo yokken tarayıcıya yarım söz verilmez. */
export function storeReady(): boolean {
  return redisTarget() !== null || memoryAllowed();
}

async function redis(target: RedisTarget, command: readonly string[]): Promise<unknown> {
  const response = await fetch(target.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${target.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Redis ${response.status}: ${command[0]}`);
  }
  const data = (await response.json()) as { result?: unknown; error?: string };
  if (data.error) {
    throw new Error(`Redis: ${data.error}`);
  }
  return data.result;
}

const memorySubs = new Map<string, StoredSubscription>();
const memoryAnnounced = new Set<string>();

/** Yalnızca sınamalar için — bellek yolu sınamalar arasında sızmasın. */
export function __clearMemoryStore(): void {
  memorySubs.clear();
  memoryAnnounced.clear();
}

function requireTarget(): RedisTarget | null {
  const target = redisTarget();
  if (target) return target;
  if (memoryAllowed()) return null;
  /* Rota storeReady() ile korunuyor; burası savunma hattı. */
  throw new Error('Abone deposu yapılandırılmadı (KV_REST_API_URL / _TOKEN)');
}

export async function saveSubscription(sub: StoredSubscription): Promise<void> {
  const target = requireTarget();
  if (!target) {
    memorySubs.set(sub.endpoint, sub);
    return;
  }
  await redis(target, ['HSET', SUBS_KEY, sub.endpoint, JSON.stringify(sub)]);
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  const target = requireTarget();
  if (!target) {
    memorySubs.delete(endpoint);
    return;
  }
  await redis(target, ['HDEL', SUBS_KEY, endpoint]);
}

export async function listSubscriptions(): Promise<readonly StoredSubscription[]> {
  const target = requireTarget();
  if (!target) return [...memorySubs.values()];

  /* HGETALL düz dizi döner: [alan, değer, alan, değer, ...] */
  const flat = (await redis(target, ['HGETALL', SUBS_KEY])) as readonly string[];
  const subs: StoredSubscription[] = [];
  for (let i = 1; i < flat.length; i += 2) {
    /*
      Depoya yalnızca `parseSubscription`dan geçen kayıt yazılıyor; yine de
      okurken ikinci kez doğrulanıyor. Bozuk tek bir kayıt bütün gönderimi
      düşürmesin — atlanır, gönderici görmez ve döngü sürer.
    */
    let parsed: unknown;
    try {
      parsed = JSON.parse(flat[i]);
    } catch {
      continue;
    }
    const sub = parseSubscription(parsed);
    if (sub) subs.push(sub);
  }
  return subs;
}

export async function announcedIds(): Promise<ReadonlySet<string>> {
  const target = requireTarget();
  if (!target) return new Set(memoryAnnounced);
  const members = (await redis(target, ['SMEMBERS', ANNOUNCED_KEY])) as readonly string[];
  return new Set(members);
}

export async function markAnnounced(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  const target = requireTarget();
  if (!target) {
    for (const id of ids) memoryAnnounced.add(id);
    return;
  }
  await redis(target, ['SADD', ANNOUNCED_KEY, ...ids]);
}
