import webpush from 'web-push';
import { PERFUMES } from '../src/data/perfumes';
import { pushMessage, type PushMessage } from '../src/lib/push-payload';
import {
  announcedIds,
  deleteSubscription,
  listSubscriptions,
  markAnnounced,
} from '../src/lib/push-store';
import type { StoredSubscription } from '../src/lib/push-subscription';

/**
 * Gönderici — GitHub Action'da koşar (`.github/workflows/push-notify.yml`),
 * sitede DEĞİL. VAPID özel anahtarı yalnızca bu sürecin ortamında yaşıyor;
 * Vercel'e hiç girmiyor.
 *
 * "Yeni parfüm" git geçmişinden değil depodan okunur: `push:announced`
 * kümesinde olmayan her kimlik yenidir. Merge/squash geçmişin şeklini nasıl
 * değiştirirse değiştirsin fark doğru çıkar.
 *
 * Üç kip:
 *   (varsayılan)        — yeni parfümleri bul, abonelere kendi dilinde gönder.
 *   PUSH_TEST_MESSAGE   — veri farkına bakmadan bu metni herkese yolla
 *                         (workflow_dispatch'in deneme gönderimi).
 *   --dry-run           — hiçbir şey yazmadan/yollamadan ne olacağını say.
 *
 * ⚠️ İlk çalışma TOHUMLAR: küme boşken bütün kimlikler yazılır, gönderim
 * yapılmaz. Yoksa kurulum günü herkese 52 bildirim düşerdi.
 *
 * ⚠️ Depo env'i yoksa betik durur. `push-store` geliştirmede bellek yoluna
 * düşebiliyor; burada o yol sessiz bir "0 abone, 0 gönderim" başarısı üretirdi
 * — eksik secret, hata olarak görünmek zorunda.
 */

const dryRun = process.argv.includes('--dry-run');
const testMessage = process.env.PUSH_TEST_MESSAGE?.trim();

function hasStoreEnv(): boolean {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(url && token);
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} tanımlı değil — GitHub secrets'a bak`);
  return value;
}

/** Gönderim sonucu: kayıt ya yaşıyor ya push servisi "artık yok" dedi. */
async function send(sub: StoredSubscription, message: PushMessage): Promise<'alive' | 'dead'> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify(message),
    );
    return 'alive';
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    /* 404/410 push servisinin sözleşmesi: abonelik öldü, kayıt budanır. */
    if (status === 404 || status === 410) return 'dead';
    /* Geçici hata (5xx, ağ) — kayıt kalır, bir sonraki turda tekrar denenir. */
    console.error(`gönderilemedi (${status ?? 'ağ'}): ${sub.endpoint.slice(0, 60)}…`);
    return 'alive';
  }
}

/** Her yeni parfüm × her canlı abone; ölen kayıt anında budanır. */
async function broadcast(
  subs: readonly StoredSubscription[],
  messageFor: (sub: StoredSubscription) => PushMessage,
): Promise<{ sent: number; pruned: number }> {
  let sent = 0;
  let pruned = 0;
  for (const sub of subs) {
    const result = await send(sub, messageFor(sub));
    if (result === 'dead') {
      await deleteSubscription(sub.endpoint);
      pruned += 1;
    } else {
      sent += 1;
    }
  }
  return { sent, pruned };
}

async function main(): Promise<void> {
  if (!hasStoreEnv()) {
    if (!dryRun) {
      throw new Error('KV_REST_API_URL/_TOKEN yok — gönderici bellek deposuyla çalışmaz');
    }
    console.log('kuru çalışma: depo env yok, bellek deposu boş sayılır');
  }

  if (!dryRun) {
    webpush.setVapidDetails(
      requireEnv('VAPID_SUBJECT'),
      requireEnv('VAPID_PUBLIC_KEY'),
      requireEnv('VAPID_PRIVATE_KEY'),
    );
  }

  /* Deneme gönderimi: veri farkına bakılmaz, küme değişmez. */
  if (testMessage) {
    const subs = await listSubscriptions();
    console.log(`deneme gönderimi: ${subs.length} abone`);
    if (dryRun) return;
    const { sent, pruned } = await broadcast(subs, () => ({
      title: 'OSMOS',
      body: testMessage,
      url: '/',
    }));
    console.log(`gitti: ${sent} · budandı: ${pruned}`);
    return;
  }

  const announced = await announcedIds();
  const currentIds = PERFUMES.map((perfume) => perfume.id);

  if (announced.size === 0) {
    console.log(`ilk çalışma: ${currentIds.length} kimlik tohumlanıyor, gönderim yok`);
    if (dryRun) return;
    await markAnnounced(currentIds);
    return;
  }

  const fresh = PERFUMES.filter((perfume) => !announced.has(perfume.id));
  if (fresh.length === 0) {
    console.log('yeni parfüm yok');
    return;
  }

  console.log(`yeni: ${fresh.map((perfume) => perfume.id).join(', ')}`);
  if (dryRun) return;

  let subs = await listSubscriptions();
  console.log(`${subs.length} abone`);

  for (const perfume of fresh) {
    const { sent, pruned } = await broadcast(subs, (sub) => pushMessage(perfume, sub.lang));
    console.log(`${perfume.id}: gitti ${sent} · budandı ${pruned}`);
    if (pruned > 0) {
      /* Budanan kayıt sonraki parfümde tekrar denenmesin. */
      subs = await listSubscriptions();
    }
  }

  await markAnnounced(fresh.map((perfume) => perfume.id));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
