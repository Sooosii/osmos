import type { Perfume } from './types';

export const SPACE_CAPACITY = 52;

export interface PerfumeSpace {
  readonly id: number;
  readonly perfumes: readonly Perfume[];
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

  const spaces: PerfumeSpace[] = [{ id: 1, perfumes: legacyPerfumes }];
  const expansionSpaceCount = Math.ceil(expansionPerfumes.length / SPACE_CAPACITY);
  const baseSize = expansionSpaceCount === 0 ? 0 : Math.floor(expansionPerfumes.length / expansionSpaceCount);
  const largerSpaceCount = expansionSpaceCount === 0 ? 0 : expansionPerfumes.length % expansionSpaceCount;
  let start = 0;

  for (let index = 0; index < expansionSpaceCount; index += 1) {
    const size = baseSize + (index < largerSpaceCount ? 1 : 0);
    spaces.push({
      id: spaces.length + 1,
      perfumes: expansionPerfumes.slice(start, start + size),
    });
    start += size;
  }
  return spaces;
}

export function findPerfumeSpaceId(
  spaces: readonly PerfumeSpace[],
  perfumeId: string,
): number | null {
  return spaces.find((space) => space.perfumes.some((perfume) => perfume.id === perfumeId))?.id ?? null;
}
