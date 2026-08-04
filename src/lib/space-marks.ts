import type { Perfume, ScentFamily, SpaceMark } from '@/data/types';
import { FAMILY_ORDER, getFamily } from '@/data/families';
import { familyVector, nearestNeighbors, projectToSpace } from './similarity';

/**
 * Parfüm listesinden çizilmeye hazır nokta listesi.
 *
 * Bu modül **sunucuda** çalışıyor ve orada kalmalı: `projectToSpace` 44×44'lük
 * bir kosinüs matrisi kurup üç özvektör çıkarıyor, `nearestNeighbors` her parfüm
 * için tüm havuzu tarıyor. Tarayıcıya inen şey yalnızca sonuç — koordinat, renk,
 * komşu kimlikleri. Nota veritabanı ve benzerlik motoru istemci paketine hiç
 * girmiyor.
 *
 * Hem Koku Uzayı hem `/uzay` doğrulama taslağı buradan besleniyor. İki ayrı
 * kopya olsaydı biri düzeltilip diğeri unutulduğunda taslak "doğru" derken
 * harita başka bir şey gösterirdi.
 */

/** Uzayda her noktaya çizilen komşu bağlantısı sayısı. */
const NEIGHBOR_COUNT = 3;

/**
 * Vektörün en ağır bastığı aile — noktanın rengi bundan geliyor.
 *
 * Eşitlikte ilk sıradaki kazanıyor; `FAMILY_ORDER` sabit olduğu için bu seçim
 * de her çalıştırmada aynı.
 */
export function dominantFamily(vector: readonly number[]): ScentFamily {
  let best = 0;
  for (let i = 1; i < vector.length; i += 1) {
    if (vector[i] > vector[best]) best = i;
  }
  return FAMILY_ORDER[best];
}

export function buildMarks(perfumes: readonly Perfume[]): readonly SpaceMark[] {
  const points = projectToSpace(perfumes);
  const pointById = new Map(points.map((point) => [point.perfumeId, point]));

  return perfumes.map((perfume) => {
    const point = pointById.get(perfume.id);
    if (!point) {
      throw new Error(`Uzayda yeri hesaplanmamış parfüm: ${perfume.id}`);
    }

    return {
      id: perfume.id,
      name: perfume.name,
      brand: perfume.brand,
      line: perfume.line?.tr ?? null,
      color: getFamily(dominantFamily(familyVector(perfume))).color,
      x: point.x,
      y: point.y,
      depth: point.depth,
      neighborIds: nearestNeighbors(perfume, perfumes, NEIGHBOR_COUNT).map((n) => n.perfume.id),
    };
  });
}
