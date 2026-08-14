import { describe, expect, test, vi } from 'vitest';
import { waitUntilPerfumeIsLive } from './push-deploy';

describe('waitUntilPerfumeIsLive', () => {
  test('sayfa 200 ve yeni kimliği içerene kadar bekler', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('old deployment', { status: 404 }))
      .mockResolvedValueOnce(new Response('still old', { status: 200 }))
      .mockResolvedValueOnce(new Response('goldfield-banks-bohemian-lime', { status: 200 }));
    const sleep = vi.fn(async () => undefined);

    await waitUntilPerfumeIsLive({
      baseUrl: 'https://osmos.example/',
      perfume: { id: 'goldfield-banks-bohemian-lime', name: 'Bohemian Lime' },
      attempts: 3,
      intervalMs: 1,
      requestTimeoutMs: 50,
      fetcher,
      sleep,
    });

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher).toHaveBeenCalledWith(
      'https://osmos.example/perfume/goldfield-banks-bohemian-lime',
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  test('her canlılık isteğine tekil zaman aşımı sinyali bağlar', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('new-one', { status: 200 }),
    );

    await waitUntilPerfumeIsLive({
      baseUrl: 'https://osmos.example',
      perfume: { id: 'new-one', name: 'New One' },
      attempts: 1,
      requestTimeoutMs: 25,
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledWith(
      'https://osmos.example/perfume/new-one',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test('sınır dolunca gönderimi durduracak hata verir', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('old', { status: 200 }));

    await expect(
      waitUntilPerfumeIsLive({
        baseUrl: 'https://osmos.example',
        perfume: { id: 'new-one', name: 'New One' },
        attempts: 2,
        intervalMs: 1,
        fetcher,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow('Canlı yayın new-one kaydını göstermedi');
  });
});
