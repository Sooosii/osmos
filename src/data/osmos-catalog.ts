import type { Perfume } from './types';
import { CURATED_A } from './perfume-sets/curated-a';
import { CURATED_B } from './perfume-sets/curated-b';
import { CURATED_C } from './perfume-sets/curated-c';
import { CURATED_D } from './perfume-sets/curated-d';
import { CURATED_E } from './perfume-sets/curated-e';
import { CURATED_F } from './perfume-sets/curated-f';
import { FILLERS } from './perfume-sets/fillers';
import { SPACE_2_PERFUMES } from './perfume-sets/space-2';
import { SPACE_2_ADDITIONS } from './perfume-sets/space-2-additions';
import { SPACE_3_A } from './perfume-sets/space-3-a';
import { SPACE_3_B } from './perfume-sets/space-3-b';
import { SPACE_3_C } from './perfume-sets/space-3-c';

/**
 * Ana sitenin katalogu — gruplardan birleşmiş hâli.
 *
 * ⚠️ `perfumes.ts`ten **ayrıldı ki kiracı katalogları da okuyabilsin.** Demo
 * kiracının seçkisi var olan parfümlere işaret ediyor; bunu `perfumes.ts`ten
 * alsaydı döngü olurdu (`perfumes` → `tenants/catalogs` → `perfumes`).
 * Buradaki iki dizi ham veri, hiçbir doğrulamadan geçmemiş — kimlik ve nota
 * denetimleri `perfumes.ts`te, tek yerde duruyor.
 */
export const OSMOS_LEGACY: readonly Perfume[] = [
  ...CURATED_A,
  ...CURATED_B,
  ...CURATED_C,
  ...CURATED_D,
  ...CURATED_E,
  ...CURATED_F,
  ...FILLERS,
];

export const OSMOS_EXPANSION: readonly Perfume[] = [
  ...SPACE_2_PERFUMES,
  ...SPACE_2_ADDITIONS,
  ...SPACE_3_A,
  ...SPACE_3_B,
];

/**
 * Yalnız kiracılar için girilen parfümler — ana sitenin uzaylarına GİRMEZ.
 *
 * ⚠️ Bu ayrım bir ölçümün sonucu. Dört Matière Première kaydı önce
 * `OSMOS_EXPANSION`a eklenmişti ve sınamalar üç şeyi birden yakaladı: katalog
 * 150'den 154'e çıktı, uzay dengesi bozuldu ve **uzay renkleri kaydı**
 * (`fruity, citrus` → `floral, resinous`). Yani bir müşteri demosu için
 * girilen veri, osmos.me'nin ekranda görünüşünü değiştiriyordu.
 *
 * Renk sahibin ayrı bir turda ölçerek karara bağladığı bir şey ve her yeni
 * demo onu bir kez daha kaydırırdı. Bu yüzden kiracı için girilen parfümler
 * `OSMOS_ALL`da duruyor (kiracı seçkisi oradan okuyor) ama uzaylara
 * karışmıyor. Ana sitenin katalogu 150'de kalıyor ve üç sınama da yeşil.
 *
 * Bir kayıt buradan ana katalogA taşınmak istenirse bu bilinçli bir karar
 * olur: uzay renkleri yeniden ölçülür ve `space-identity.test.ts` güncellenir.
 */
export const OSMOS_TENANT_ONLY: readonly Perfume[] = [...SPACE_3_C];

export const OSMOS_ALL: readonly Perfume[] = [
  ...OSMOS_LEGACY,
  ...OSMOS_EXPANSION,
  ...OSMOS_TENANT_ONLY,
];
