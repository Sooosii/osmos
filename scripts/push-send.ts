import webpush from 'web-push';
import { createHash } from 'node:crypto';
import { PERFUMES } from '../src/data/perfumes';
import { pushDigestMessage, type PushMessage } from '../src/lib/push-payload';
import { waitUntilPerfumeIsLive } from '../src/lib/push-deploy';
import { broadcastPush, type PushDeliveryResult } from '../src/lib/push-broadcast';
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
async function send(sub: StoredSubscription, message: PushMessage): Promise<PushDeliveryResult> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify(message),
    );
    return 'sent';
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    /* 404/410 push servisinin sözleşmesi: abonelik öldü, kayıt budanır. */
    if (status === 404 || status === 410) return 'dead';
    /* Geçici hata (5xx, ağ) — kayıt kalır, bir sonraki turda tekrar denenir. */
    console.error(`gönderilemedi (${status ?? 'ağ'}): ${sub.endpoint.slice(0, 60)}…`);
    return 'retryable';
  }
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
    const { sent, pruned } = await broadcastPush(subs, () => ({
      title: 'OSMOS',
      body: testMessage,
      url: '/',
    }), { send, remove: deleteSubscription });
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

  const initiallyFresh = PERFUMES.filter((perfume) => !announced.has(perfume.id));
  if (dryRun) {
    console.log(
      initiallyFresh.length === 0
        ? 'yeni parfüm yok'
        : `yeni: ${initiallyFresh.map((perfume) => perfume.id).join(', ')}`,
    );
    return;
  }

  const perfumeById = new Map(PERFUMES.map((perfume) => [perfume.id, perfume]));
  let processedBatch = false;

  while (true) {
    const latestAnnounced = await announcedIds();
    const remaining = PERFUMES.filter((perfume) => !latestAnnounced.has(perfume.id));
    let active = await activeDigestBatch();

    if (active && active.perfumeIds.every((id) => latestAnnounced.has(id))) {
      await clearDigestDelivery(active.id);
      await clearActiveDigestBatch();
      active = null;
    }

    if (!active && remaining.length === 0) {
      console.log(processedBatch ? 'bütün yeni batchler tamamlandı' : 'yeni parfüm yok');
      return;
    }

    if (!active) {
      const perfumeIds = remaining.map((perfume) => perfume.id);
      active = {
        id: createHash('sha256').update(perfumeIds.join('\0')).digest('hex'),
        perfumeIds,
      };
      await setActiveDigestBatch(active);
    }

    const fresh = active.perfumeIds.map((id) => {
      const perfume = perfumeById.get(id);
      if (!perfume) throw new Error(`Aktif push batchinde katalogda olmayan kimlik var: ${id}`);
      if (latestAnnounced.has(id)) {
        throw new Error(`Aktif push batchi kısmen duyurulmuş durumda: ${id}`);
      }
      return perfume;
    });

    console.log(`batch ${active.id.slice(0, 8)}: ${fresh.map((perfume) => perfume.id).join(', ')}`);
    const publicSiteUrl = requireEnv('PUSH_PUBLIC_SITE_URL');
    console.log(`canlı yayın bekleniyor: ${fresh[0].id}`);
    await waitUntilPerfumeIsLive({ baseUrl: publicSiteUrl, perfume: fresh[0] });

    const subs = await listSubscriptions();
    console.log(`${subs.length} abone`);
    const alreadySent = await deliveredDigestEndpoints(active.id);
    const { sent, pruned, retryable, skipped } = await broadcastPush(
      subs,
      (sub) => pushDigestMessage(fresh, sub.lang),
      {
        send,
        remove: deleteSubscription,
        alreadySent,
        recordSent: (endpoint) => markDigestDelivered(active.id, endpoint),
      },
    );
    console.log(`${fresh.length} parfümlük özet: gitti ${sent} · önce teslim ${skipped} · budandı ${pruned} · yeniden denenecek ${retryable}`);

    if (retryable > 0) {
      throw new Error(`${retryable} geçici gönderim hatası var — kimlikler duyurulmuş işaretlenmedi`);
    }

    await markAnnounced(active.perfumeIds);
    await clearDigestDelivery(active.id);
    await clearActiveDigestBatch();
    processedBatch = true;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
