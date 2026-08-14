import { describe, expect, test, vi } from 'vitest';
import type { PushMessage } from './push-payload';
import type { StoredSubscription } from './push-subscription';
import { broadcastPush } from './push-broadcast';

const MESSAGE: PushMessage = { title: 'OSMOS', body: 'Digest', url: '/' };
const SUBSCRIPTIONS: readonly StoredSubscription[] = ['sent', 'dead', 'retry'].map((name) => ({
  endpoint: `https://push.example/${name}`,
  keys: { p256dh: 'key', auth: 'auth' },
  lang: 'en',
}));

describe('broadcastPush', () => {
  test('başarı, ölü kayıt ve geçici hatayı birbirinden ayırır', async () => {
    const remove = vi.fn(async () => undefined);
    const send = vi.fn(async (subscription: StoredSubscription) => {
      if (subscription.endpoint.endsWith('/dead')) return 'dead' as const;
      if (subscription.endpoint.endsWith('/retry')) return 'retryable' as const;
      return 'sent' as const;
    });

    const summary = await broadcastPush(SUBSCRIPTIONS, () => MESSAGE, { send, remove });

    expect(summary).toEqual({ sent: 1, pruned: 1, retryable: 1, skipped: 0 });
    expect(remove).toHaveBeenCalledWith('https://push.example/dead');
  });

  test('önceki koşuda teslim edilen endpointi atlar ve yeni başarıyı kaydeder', async () => {
    const send = vi.fn(async () => 'sent' as const);
    const recordSent = vi.fn(async () => undefined);

    const summary = await broadcastPush(SUBSCRIPTIONS.slice(0, 2), () => MESSAGE, {
      send,
      remove: async () => undefined,
      alreadySent: new Set(['https://push.example/sent']),
      recordSent,
    });

    expect(summary).toEqual({ sent: 1, pruned: 0, retryable: 0, skipped: 1 });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(SUBSCRIPTIONS[1], MESSAGE);
    expect(recordSent).toHaveBeenCalledWith('https://push.example/dead');
  });
});
