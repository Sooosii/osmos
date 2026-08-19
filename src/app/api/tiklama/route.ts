import { z } from 'zod';
import { getPerfume, hasPerfume } from '@/data/perfumes';
import { activeTenant } from '@/lib/tenant';
import { allow, clientIp, tooManyRequests } from '@/lib/rate-limit';
import { storeReady, tiklamaSay } from '@/lib/tiklama-store';

/**
 * `/api/tiklama` — turnike.
 *
 * Künyedeki "nerede bulunur" satırındaki bağlantıya basıldığında
 * `SaticiBaglantisi` buraya bir `sendBeacon` bırakıyor. Uç tek iş yapıyor:
 * `(parfüm, satıcı)` çiftinin o ayki sayacını bir artırmak.
 *
 * ⚠️ **Kiracıda AÇIK kalmak zorunda** — kiracı kapısını çağırmıyor ve bu bir
 * unutma değil, kararın kendisi: `kiraci-uclari.test.ts` içindeki `ACIK`
 * listesinde gerekçesiyle duruyor. Müşteriye satılan yenileme ücretinin
 * karşılığı bu sayaç: kapatılırsa €290/yıl yine savunulamaz hâle gelir.
 *
 * ⚠️ **Kiracı kimliği gövdeden OKUNMUYOR.** Sunucu kendi derlemesinin
 * kiracısını `activeTenant()`ten alıyor. Gövdeden alsaydı herhangi biri
 * başka bir müşterinin sayacını şişirebilirdi — ve o rakam faturaya dayanak
 * olarak gösteriliyor. Sayının müşteriye söylenmesi, onu doğrulanabilir
 * tutmayı zorunlu kılıyor.
 *
 * ⚠️ **Parfüm ve satıcı katalogla doğrulanıyor, serbest metin kabul
 * edilmiyor.** Yalnız bu derlemede var olan bir parfümün, gerçekten kendi
 * künyesinde duran bir satıcısı sayılabiliyor. Bunun iki işi var: uydurma
 * satır rapora giremiyor, ve anahtar evreni katalogla sınırlı kalıyor —
 * aksi hâlde bir betik depoyu sonsuz sayıda çöp alanla doldururdu.
 *
 * Kişisel veri yok: ne IP, ne çerez, ne oturum yazılıyor. IP yalnızca hız
 * sınırı penceresinde geçici olarak görülüyor, sayaca hiç girmiyor.
 *
 * Kapılar sırayla: gövde sınırı (413) → JSON (400) → şema (400) → katalog
 * (400) → depo (503/500). Hata gövdeleri bilerek boş — `/api/push`taki
 * kural: içeriden hiçbir ayrıntı sızmaz, ayrıntı sunucu günlüğünde kalır.
 */

const MAX_BODY = 512;

/*
  Sayaç bir satış rakamı; şişmesi, boş kalmasından daha kötü. Sınır bu yüzden
  gerçek bir insanın davranışına göre değil, bir betiği kesmeye göre seçildi:
  bir dakikada 30 satıcı bağlantısına basan ziyaretçi yok.
*/
const RATE_LIMIT = 30;
const RATE_WINDOW = 60;

const govdeSemasi = z.object({
  perfume: z.string().min(1).max(120),
  retailer: z.string().min(1).max(120),
});

export async function POST(request: Request): Promise<Response> {
  const verdict = await allow('tiklama', clientIp(request.headers), RATE_LIMIT, RATE_WINDOW);
  if (!verdict.ok) return tooManyRequests(verdict);

  if (!storeReady()) return new Response(null, { status: 503 });

  const text = await request.text();
  if (text.length > MAX_BODY) return new Response(null, { status: 413 });

  let ham: unknown;
  try {
    ham = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }

  const govde = govdeSemasi.safeParse(ham);
  if (!govde.success) return new Response(null, { status: 400 });

  const { perfume, retailer } = govde.data;

  /*
    Katalog kapısı. `hasPerfume` önce çağrılıyor çünkü `getPerfume` bilinmeyen
    kimlikte patlıyor — uç 500 dönmemeli, 400 dönmeli: hatalı olan istek.
  */
  if (!hasPerfume(perfume)) return new Response(null, { status: 400 });
  const kayit = getPerfume(perfume);
  const taniniyor = kayit.retailers?.some((r) => r.name === retailer) ?? false;
  if (!taniniyor) return new Response(null, { status: 400 });

  try {
    await tiklamaSay(activeTenant().id, perfume, retailer, new Date());
  } catch (error) {
    console.error('/api/tiklama sayac yazilamadi', error);
    return new Response(null, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
