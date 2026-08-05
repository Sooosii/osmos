import type { Perfume, SpaceMark } from '@/data/types';
import { dominantFamily, getFamily } from '@/data/families';
import { characterVector, familyVector, nearestNeighbors, projectToSpace } from './similarity';
import { normalizeAxis } from './space-feel';

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
 * `characterVector`ün eksen sırasındaki yerleri — `similarity.ts:99`'daki dizilim.
 *
 * Sinestezi kaydıraçları dördün ikisini kullanıyor. Doku ve yakınlık atlanıyor
 * ama veride duruyor: benzerlik hesabına girmeye devam ediyorlar.
 */
const TEMPERATURE = 0;
const CLEANLINESS = 2;

export function buildMarks(perfumes: readonly Perfume[]): readonly SpaceMark[] {
  const points = projectToSpace(perfumes);
  const pointById = new Map(points.map((point) => [point.perfumeId, point]));

  /*
   * Kaydıraç eksenleri iki geçişte kuruluyor, tek geçişte değil: bir değeri
   * gözlenen aralığa yaymak için önce bütün havuzun görülmüş olması gerekiyor.
   * Gerekçenin tamamı `space-feel.ts`in `normalizeAxis`inde.
   */
  const characters = perfumes.map((perfume) => characterVector(perfume));
  const warmth = normalizeAxis(characters.map((character) => character[TEMPERATURE]));
  const clean = normalizeAxis(characters.map((character) => character[CLEANLINESS]));

  return perfumes.map((perfume, index) => {
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
      feel: [warmth[index], clean[index]] as const,
    };
  });
}
