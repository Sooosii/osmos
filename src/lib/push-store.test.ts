import { afterEach, describe, expect, test, vi } from 'vitest';
import type { StoredSubscription } from '@/lib/push-subscription';
import {
  announcedIds,
  deleteSubscription,
  listSubscriptions,
  markAnnounced,
  clearDigestDelivery,
  deliveredDigestEndpoints,
  markDigestDelivered,
  activeDigestBatch,
  clearActiveDigestBatch,
  setActiveDigestBatch,
  saveSubscription,
  storeReady,
  __clearMemoryStore,
} from '@/lib/push-store';

const SUB: StoredSubscription = {
  endpoint: 'https://fcm.example/send/abc',
  keys: { p256dh: 'BPusYd-2yQuVqIIZ3PdCEz', auth: 'sEcReT-auth_123' },
  lang: 'en',
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  __clearMemoryStore();
});

describe('bellek yolu (env yokken, uretim disi)', () => {
  test('depo hazir sayilir — yerel demo calissin diye', () => {
    expect(storeReady()).toBe(true);
  });

  test('kaydet → listele → sil dongusu', async () => {
    await saveSubscription(SUB);
    await saveSubscription({ ...SUB, endpoint: 'https://fcm.example/send/xyz', lang: 'tr' });
    expect(await listSubscriptions()).toHaveLength(2);

    await deleteSubscription(SUB.endpoint);
    const rest = await listSubscriptions();
    expect(rest).toHaveLength(1);
    expect(rest[0]?.lang).toBe('tr');
  });

  test('ayni endpoint ustune yazar, cogaltmaz', async () => {
    await saveSubscription(SUB);
    await saveSubscription({ ...SUB, lang: 'tr' });
    const all = await listSubscriptions();
    expect(all).toHaveLength(1);
    expect(all[0]?.lang).toBe('tr');
  });

  test('duyurulmuslar kumesi', async () => {
    expect((await announcedIds()).size).toBe(0);
    await markAnnounced(['a', 'b']);
    await markAnnounced([]);
    const ids = await announcedIds();
    expect(ids).toEqual(new Set(['a', 'b']));
  });

  test('toplu bildirim teslim ilerlemesini saklar ve temizler', async () => {
    expect(await deliveredDigestEndpoints('batch-a')).toEqual(new Set());
    await markDigestDelivered('batch-a', SUB.endpoint);
    expect(await deliveredDigestEndpoints('batch-a')).toEqual(new Set([SUB.endpoint]));
    await clearDigestDelivery('batch-a');
    expect(await deliveredDigestEndpoints('batch-a')).toEqual(new Set());
  });

  test('aktif batch manifestini sonraki koşu için saklar', async () => {
    expect(await activeDigestBatch()).toBeNull();
    await setActiveDigestBatch({ id: 'batch-a', perfumeIds: ['one', 'two'] });
    expect(await activeDigestBatch()).toEqual({ id: 'batch-a', perfumeIds: ['one', 'two'] });
    await clearActiveDigestBatch();
    expect(await activeDigestBatch()).toBeNull();
  });
});

describe('redis yolu (env varken)', () => {
  function stubRedis(result: unknown) {
    vi.stubEnv('KV_REST_API_URL', 'https://redis.example');
    vi.stubEnv('KV_REST_API_TOKEN', 'token123');
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response(JSON.stringify({ result }));
      }),
    );
    return calls;
  }

  test('kaydetme HSET komutu olarak gidiyor, yetki basligiyla', async () => {
    const calls = stubRedis('OK');
    await saveSubscription(SUB);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe('https://redis.example');
    expect(new Headers(calls[0]?.init.headers).get('Authorization')).toBe('Bearer token123');
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual([
      'HSET',
      'push:subs',
      SUB.endpoint,
      JSON.stringify(SUB),
    ]);
  });

  test('silme HDEL, kume SADD/SMEMBERS', async () => {
    const calls = stubRedis(1);
    await deleteSubscription(SUB.endpoint);
    await markAnnounced(['a']);
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual(['HDEL', 'push:subs', SUB.endpoint]);
    expect(JSON.parse(String(calls[1]?.init.body))).toEqual(['SADD', 'push:announced', 'a']);
  });

  test('toplu teslim ilerlemesi ayrı Redis kümesinde tutulur', async () => {
    const calls = stubRedis(1);
    await markDigestDelivered('batch-a', SUB.endpoint);
    await clearDigestDelivery('batch-a');

    expect(JSON.parse(String(calls[0]?.init.body))).toEqual([
      'SADD',
      'push:delivery:batch-a',
      SUB.endpoint,
    ]);
    expect(JSON.parse(String(calls[1]?.init.body))).toEqual(['DEL', 'push:delivery:batch-a']);
  });

  test('aktif batch manifesti Redis SET ve DEL kullanır', async () => {
    const calls = stubRedis('OK');
    const batch = { id: 'batch-a', perfumeIds: ['one', 'two'] };
    await setActiveDigestBatch(batch);
    await clearActiveDigestBatch();

    expect(JSON.parse(String(calls[0]?.init.body))).toEqual([
      'SET',
      'push:delivery:active',
      JSON.stringify(batch),
    ]);
    expect(JSON.parse(String(calls[1]?.init.body))).toEqual(['DEL', 'push:delivery:active']);
  });

  test('listeleme HGETALL duz dizisini cozuyor, bozuk kaydi atliyor', async () => {
    stubRedis([SUB.endpoint, JSON.stringify(SUB), 'https://x.example/bozuk', '{bozuk json']);
    const subs = await listSubscriptions();
    expect(subs).toEqual([SUB]);
  });

  test('http hatasi yutulmuyor', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://redis.example');
    vi.stubEnv('KV_REST_API_TOKEN', 'token123');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    await expect(saveSubscription(SUB)).rejects.toThrow('500');
  });
});
