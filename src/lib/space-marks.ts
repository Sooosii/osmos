import type { Perfume, SpaceMark } from '@/data/types';
import { dominantFamily, getFamily } from '@/data/families';
import { characterVector, familyVector, nearestNeighbors, projectToSpace } from './similarity';
import { normalizeAxis } from './space-feel';

/**
 * Parfüm listesinden çizilmeye hazır nokta listesi.
 *
 * Bu modül **sunucuda** çalışıyor ve orada kalmalı: `projectToSpace` 52×52'lik
 * bir kosinüs matrisi kurup üç özvektör çıkarıyor, `nearestNeighbors` her parfüm
 * için tüm havuzu tarıyor. Tarayıcıya inen şey yalnızca sonuç — koordinat, renk,
 * komşu kimlikleri. Nota veritabanı ve benzerlik motoru istemci paketine hiç
 * girmiyor.
 *
 * Hem Koku Uzayı hem `/space` doğrulama taslağı buradan besleniyor. İki ayrı
 * kopya olsaydı biri düzeltilip diğeri unutulduğunda taslak "doğru" derken
 * harita başka bir şey gösterirdi.
 */

/** Uzayda her noktaya çizilen komşu bağlantısı sayısı. */
const NEIGHBOR_COUNT = 3;

/**
 * `characterVector`ün eksen sayısı — `similarity.ts:99`'daki dizilim:
 * sıcaklık, doku, temizlik, yakınlık.
 *
 * Dördü de noktaya biniyor. Ekranda ikisi açık duruyor, ikisi "…" ile geliyor;
 * hangisinin görüneceği arayüzün kararı, verinin değil.
 */
const AXIS_COUNT = 4;

export function buildMarks(perfumes: readonly Perfume[]): readonly SpaceMark[] {
  const points = projectToSpace(perfumes);
  const pointById = new Map(points.map((point) => [point.perfumeId, point]));

  /*
   * Kaydıraç eksenleri iki geçişte kuruluyor, tek geçişte değil: bir değeri
   * gözlenen aralığa yaymak için önce bütün havuzun görülmüş olması gerekiyor.
   * Gerekçenin tamamı `space-feel.ts`in `normalizeAxis`inde.
   */
  const characters = perfumes.map((perfume) => characterVector(perfume));
  const axes = Array.from({ length: AXIS_COUNT }, (_, axis) =>
    normalizeAxis(characters.map((character) => character[axis])),
  );

  return perfumes.map((perfume, index) => {
    const point = pointById.get(perfume.id);
    if (!point) {
      throw new Error(`Uzayda yeri hesaplanmamış parfüm: ${perfume.id}`);
    }

    return {
      id: perfume.id,
      name: perfume.name,
      brand: perfume.brand,
      line: perfume.line?.en ?? null,
      color: getFamily(dominantFamily(familyVector(perfume))).color,
      x: point.x,
      y: point.y,
      depth: point.depth,
      neighborIds: nearestNeighbors(perfume, perfumes, NEIGHBOR_COUNT).map((n) => n.perfume.id),
      feel: [axes[0][index], axes[1][index], axes[2][index], axes[3][index]] as const,
    };
  });
}
