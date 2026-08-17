/**
 * Top 4'ün tek sayısı — katalogdan bağımsız tutuluyor.
 *
 * ⚠️ Ayrı dosya olmasının sebebi güvenlik: `top-four.ts` kimlik doğrulamak
 * için `@/data/perfumes`e dokunuyor, `SettingsForm` ise bir `'use client'`
 * bileşeni ve oradan yalnızca bu sayıyı istiyordu. Sayı orada kaldığı sürece
 * istemci paketi bütün katalogu taşıyordu. `kiraci-sizinti.test.ts` tutuyor.
 */
export const MAX_TOP_FOUR = 4;
