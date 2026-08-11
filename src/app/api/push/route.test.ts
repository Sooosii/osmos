import { afterEach, describe, expect, test, vi } from 'vitest';
import { DELETE, POST } from '@/app/api/push/route';
import { __clearMemoryStore, listSubscriptions } from '@/lib/push-store';

/**
 * Rota işleyicisi düz `Request` alıp düz `Response` döndürüyor — sunucu
 * kurmadan, doğrudan çağrılarak sınanıyor. Depo sınama ortamında bellek
 * yolunda (env yok), yani uçtan uca kaydet-sil döngüsü de burada dönüyor.
 */

const SUB = {
  endpoint: 'https://fcm.example/send/route-test',
  keys: { p256dh: 'BPusYd-2yQuVqIIZ3PdCEz', auth: 'sEcReT-auth_123' },
  lang: 'en',
};

function post(body: string): Promise<Response> {
  return POST(new Request('https://osmos.example/api/push', { method: 'POST', body }));
}

function del(body: string): Promise<Response> {
  return DELETE(new Request('https://osmos.example/api/push', { method: 'DELETE', body }));
}

afterEach(() => {
  vi.unstubAllEnvs();
  __clearMemoryStore();
});

describe('POST /api/push', () => {
  test('gecerli abone 204 ve depoda', async () => {
    const response = await post(JSON.stringify(SUB));
    expect(response.status).toBe(204);
    expect(await listSubscriptions()).toEqual([SUB]);
  });

  test('bozuk json 400', async () => {
    expect((await post('{bozuk')).status).toBe(400);
  });

  test('gecersiz kayit 400 ve depoya yazilmiyor', async () => {
    const response = await post(JSON.stringify({ ...SUB, endpoint: 'http://degil' }));
    expect(response.status).toBe(400);
    expect(await listSubscriptions()).toHaveLength(0);
  });

  test('sisik govde 413', async () => {
    const response = await post(JSON.stringify({ ...SUB, dolgu: 'x'.repeat(5000) }));
    expect(response.status).toBe(413);
  });

  test('uretimde depo yoksa 503 — yarim soz verilmez', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect((await post(JSON.stringify(SUB))).status).toBe(503);
  });
});

describe('DELETE /api/push', () => {
  test('kayit silinir, 204', async () => {
    await post(JSON.stringify(SUB));
    const response = await del(JSON.stringify({ endpoint: SUB.endpoint }));
    expect(response.status).toBe(204);
    expect(await listSubscriptions()).toHaveLength(0);
  });

  test('gecersiz govde 400', async () => {
    expect((await del('{bozuk')).status).toBe(400);
    expect((await del(JSON.stringify({ endpoint: 'ftp://x' }))).status).toBe(400);
  });
});
