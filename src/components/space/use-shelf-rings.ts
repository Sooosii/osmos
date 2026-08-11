import { useEffect, type RefObject } from 'react';
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
  useEffect(() => {
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
  }, [shelvedRef, requestDraw]);
}
