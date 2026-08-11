import { parseEndpoint, parseSubscription } from '@/lib/push-subscription';
import { allow, clientIp, tooManyRequests } from '@/lib/rate-limit';
import { deleteSubscription, saveSubscription, storeReady } from '@/lib/push-store';

/**
 * `/api/push` — sitenin ilk (ve tek) sunucu parçası.
 *
 * Yalnızca abone kaydı: `POST` yazar, `DELETE` siler. Gönderim burada DEĞİL —
 * GitHub Action'da (`scripts/push-send.ts`); VAPID özel anahtarı bu sürece
 * hiç girmiyor. "Hesap sunucuda kalır, sayfalar statik kalır" sözü bozulmadı:
 * bu uç sayfa çizmiyor, tek satır veri alıp bırakıyor.
 *
 * ⚠️ Kök varlık: `proxy.ts`teki `ROOT_ASSETS`te satırı var. Düşerse istekler
 * dil önekiyle yeniden yazılır ve uç hiç ulaşılamaz olur.
 *
 * Uç herkese açık; kapılar sırayla: gövde sınırı (413) → JSON (400) →
 * `parseSubscription` (400) → depo (503/500). Hata gövdeleri bilerek boş —
 * içeriden hiçbir ayrıntı sızmaz, ayrıntı sunucu günlüğünde kalır.
 */

const MAX_BODY = 4096;

type Parsed = { readonly ok: true; readonly value: unknown } | { readonly ok: false; readonly response: Response };

async function readJson(request: Request): Promise<Parsed> {
  const text = await request.text();
  if (text.length > MAX_BODY) {
    return { ok: false, response: new Response(null, { status: 413 }) };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, response: new Response(null, { status: 400 }) };
  }
}

/*
  Abonelik kaydı seyrek bir eylem: kişi düğmeye bir kez basıyor. Sınır bu
  yüzden dar — bir betiğin depoyu sahte kayıtla doldurmasını engelliyor.
*/
const RATE_LIMIT = 10;
const RATE_WINDOW = 60;

export async function POST(request: Request): Promise<Response> {
  const verdict = await allow('push', clientIp(request.headers), RATE_LIMIT, RATE_WINDOW);
  if (!verdict.ok) return tooManyRequests(verdict);

  if (!storeReady()) return new Response(null, { status: 503 });

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const sub = parseSubscription(parsed.value);
  if (!sub) return new Response(null, { status: 400 });

  try {
    await saveSubscription(sub);
  } catch (error) {
    console.error('/api/push kayit yazilamadi', error);
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 204 });
}

export async function DELETE(request: Request): Promise<Response> {
  const verdict = await allow('push', clientIp(request.headers), RATE_LIMIT, RATE_WINDOW);
  if (!verdict.ok) return tooManyRequests(verdict);

  if (!storeReady()) return new Response(null, { status: 503 });

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const endpoint = parseEndpoint(parsed.value);
  if (!endpoint) return new Response(null, { status: 400 });

  try {
    await deleteSubscription(endpoint);
  } catch (error) {
    console.error('/api/push kayit silinemedi', error);
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
