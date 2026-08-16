import type { Perfume } from './types';

export const SPACE_CAPACITY = 52;

export interface PerfumeSpace {
  readonly id: number;
  readonly perfumes: readonly Perfume[];
}

/**
 * Bir listeyi eşit boyda uzaylara böler.
 *
 * Bölme **eşit dağıtıyor, doldurup taşırmıyor**: 53 parfüm 52 + 1 değil 27 + 26
 * oluyor. Sebep görsel — tek parfümlük bir uzay harita değil, yalnız bir nokta.
 *
 * `startId` ana sitede 2 (birinci uzay elle kuruluyor), kiracıda 1.
 */
function chunkIntoSpaces(
  perfumes: readonly Perfume[],
  startId: number,
): readonly PerfumeSpace[] {
  const count = Math.ceil(perfumes.length / SPACE_CAPACITY);
  if (count === 0) return [];

  const baseSize = Math.floor(perfumes.length / count);
  const largerCount = perfumes.length % count;
  const spaces: PerfumeSpace[] = [];
  let start = 0;

  for (let index = 0; index < count; index += 1) {
    const size = baseSize + (index < largerCount ? 1 : 0);
    spaces.push({ id: startId + index, perfumes: perfumes.slice(start, start + size) });
    start += size;
  }
  return spaces;
}

export function buildPerfumeSpaces(
  legacyPerfumes: readonly Perfume[],
  expansionPerfumes: readonly Perfume[],
): readonly PerfumeSpace[] {
  if (legacyPerfumes.length !== SPACE_CAPACITY) {
    throw new Error(
      `Uzay 1 tam ${SPACE_CAPACITY} parfüm içermeli; alınan: ${legacyPerfumes.length}`,
    );
  }

  const seen = new Set<string>();
  for (const perfume of [...legacyPerfumes, ...expansionPerfumes]) {
    if (seen.has(perfume.id)) {
      throw new Error(`Parfüm kimliği iki uzayda birden tanımlanmış: ${perfume.id}`);
    }
    seen.add(perfume.id);
  }

  return [{ id: 1, perfumes: legacyPerfumes }, ...chunkIntoSpaces(expansionPerfumes, 2)];
}

/**
 * Kiracının uzayları.
 *
 * ⚠️ **`buildPerfumeSpaces`in "birinci uzay tam 52" şartı burada YOK ve
 * olmamalı.** O şart ana sitenin tarihine ait: uzay 1 küratörlü 52'nin kendisi
 * ve eksik bir uzay 1 bir veri kaybı olurdu. Kiracının katalogu ise ne kadarsa
 * o kadar — 18 parfümlük bir marka da, 400 parfümlük bir mağaza da geçerli.
 * Şartı kiracıya uygulamak, 52'nin katı olmayan her katalogu reddetmek olurdu.
 *
 * Boş katalog yine de patlıyor: noktasız bir harita satılamaz.
 */
export function buildTenantSpaces(perfumes: readonly Perfume[]): readonly PerfumeSpace[] {
  if (perfumes.length === 0) {
    throw new Error('Kiracı katalogu boş — haritada çizilecek nokta yok.');
  }
  return chunkIntoSpaces(perfumes, 1);
}

export function findPerfumeSpaceId(
  spaces: readonly PerfumeSpace[],
  perfumeId: string,
): number | null {
  return spaces.find((space) => space.perfumes.some((perfume) => perfume.id === perfumeId))?.id ?? null;
}
