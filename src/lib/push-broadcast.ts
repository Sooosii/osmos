import type { PushMessage } from './push-payload';
import type { StoredSubscription } from './push-subscription';

export type PushDeliveryResult = 'sent' | 'dead' | 'retryable';

interface BroadcastDependencies {
  readonly send: (
    subscription: StoredSubscription,
    message: PushMessage,
  ) => Promise<PushDeliveryResult>;
  readonly remove: (endpoint: string) => Promise<void>;
  readonly alreadySent?: ReadonlySet<string>;
  readonly recordSent?: (endpoint: string) => Promise<void>;
}

export interface PushBroadcastSummary {
  readonly sent: number;
  readonly pruned: number;
  readonly retryable: number;
  readonly skipped: number;
}

export async function broadcastPush(
  subscriptions: readonly StoredSubscription[],
  messageFor: (subscription: StoredSubscription) => PushMessage,
  { send, remove, alreadySent = new Set(), recordSent = async () => undefined }: BroadcastDependencies,
): Promise<PushBroadcastSummary> {
  let sent = 0;
  let pruned = 0;
  let retryable = 0;
  let skipped = 0;

  for (const subscription of subscriptions) {
    if (alreadySent.has(subscription.endpoint)) {
      skipped += 1;
      continue;
    }
    const result = await send(subscription, messageFor(subscription));
    if (result === 'dead') {
      await remove(subscription.endpoint);
      pruned += 1;
    } else if (result === 'retryable') {
      retryable += 1;
    } else {
      await recordSent(subscription.endpoint);
      sent += 1;
    }
  }

  return { sent, pruned, retryable, skipped };
}
