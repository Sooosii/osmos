import type { Perfume } from '../types';
import { DEMO_SELVA_CATALOG } from './demo-selva/catalog';
import { NISCHENGOLD_CATALOG } from './nischengold/catalog';

/**
 * Kiracı kimliğinden kataloğuna.
 *
 * ⚠️ Ana site (`osmos`) burada YOK: onun katalogu `perfumes.ts`te uzay yapısıyla
 * birlikte kuruluyor (uzay 1 tam 52 şartı oraya ait). Kiracılar düz liste
 * veriyor, bölmeyi `buildTenantSpaces` yapıyor.
 *
 * ⚠️ Her kiracının katalogu her derlemeye giriyor — kiracı başına ayrı derleme
 * yapılsa da paket hepsini taşıyor. Katalog müşterinin kendi sitesinde zaten
 * açık bilgi olduğu için gizlilik sorunu değil; bilinerek kabul edilmiş bir
 * durum. Rakip iki müşteri aynı anda varken bu hatırlanmalı.
 */
export const TENANT_CATALOGS: Readonly<Record<string, readonly Perfume[]>> = {
  'demo-selva': DEMO_SELVA_CATALOG,
  nischengold: NISCHENGOLD_CATALOG,
};
