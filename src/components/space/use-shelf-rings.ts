import { useEffect, type RefObject } from 'react';
import { useSession } from '@/lib/auth-client';
import type { ShelfEntry } from '@/lib/shelf';

/**
 * Uzaydaki raf halkaları — okuyucunun sahip olduğu parfümler.
 *
 * Sahibin istediği şey ("site de değişsin ya"): harita giriş yapmış kişiyi
 * tanıyor. Üyeliğin uzayda görünen tek karşılığı bu.
 *
 * ⚠️ **Sayfa STATİK kalıyor.** Oturum sunucuda okunsaydı uzay dinamiğe
 * düşerdi ve sitenin en büyük teknik iddiası ölürdü. İstek ilk boyamadan
 * sonra gidiyor; girişsiz ziyaretçi bugünkü uzayı görüyor.
 *
 * ⚠️ Sonuç **durumda değil ref'te** ve gerekçe dosyanın açık disiplini
 * (`ScentSpaceCanvas`: kamera ve `feelTargetRef` de öyle): bu değeri React'in
 * yeniden çizeceği hiçbir metin okumuyor, yalnız tuval okuyor. `setState`
 * demek boş yere bir React ağacı demek olurdu.
 *
 * ⚠️ Yalnızca **"sahibim"** rafı iniyor halkaya; gerekçe `space-draw.ts`te.
 *
 * Ağ düşerse sessiz kalıyor: kullanıcı bir şey istemedi, sayfa kendiliğinden
 * sordu. Uzay halkasız çiziliyor ve hiçbir şey bozulmuyor.
 */
export function useShelfRings(
  shelvedRef: RefObject<ReadonlySet<string>>,
  requestDraw: () => void,
): void {
  /*
   * ⚠️ **Girişsizken istek hiç gidilmiyor — ölçüldü** (2026-08-12, üretim
   * derlemesi). Bu kanca `/api/shelf`i koşulsuz çağırıyordu: girişi olmayan
   * ziyaretçi de, bugün olduğu gibi giriş daveti kapalıyken **herkes** de.
   * Yani ana sayfayı açan her insan boş bir cevap için bir sunucu çağrısı ve
   * bir hız-sınırı sorgusu harcıyordu. Künyedeki `ShelfPicker` bu denetimi
   * baştan beri yapıyordu; eksik olan yalnız burasıydı.
   *
   * ⚠️ **`useSession` ikinci bir istek AÇMIYOR** — ölçüldü: künye sayfasında
   * üç ayrı bileşen (`SignInLink`, `ShelfPicker`, `AddToTopFour`) bu kancayı
   * kullanıyor ve ağda `/api/auth/get-session` **bir kez** görünüyor;
   * better-auth oturumu bileşenler arasında paylaşıyor. Yani bu denetim
   * bedava, sadece bir isteği siliyor.
   *
   * `isPending` sırasında beklemek şart: oturum çözülmeden "girişsiz" saymak
   * girişli kişinin halkalarını hiç çizmemek olurdu.
   */
  const { data, isPending } = useSession();
  const signedIn = Boolean(data?.user);

  useEffect(() => {
    if (isPending || !signedIn) return;

    let alive = true;

    void (async () => {
      try {
        const response = await fetch('/api/shelf');
        if (!response.ok) return;

        const body = (await response.json()) as { entries?: readonly ShelfEntry[] };
        const owned = (body.entries ?? [])
          .filter((entry) => entry.kind === 'owned')
          .map((entry) => entry.perfumeId);

        if (!alive || owned.length === 0) return;

        shelvedRef.current = new Set(owned);
        requestDraw();
      } catch {
        /* Sessiz: halkasız uzay tam olarak bugünkü uzay. */
      }
    })();

    return () => {
      alive = false;
    };
  }, [shelvedRef, requestDraw, isPending, signedIn]);
}
