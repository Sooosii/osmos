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

export const OSMOS_ALL: readonly Perfume[] = [...OSMOS_LEGACY, ...OSMOS_EXPANSION];
