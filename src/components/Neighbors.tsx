import { PERFUMES } from '@/data/perfumes';
import { dominantFamily, getFamily } from '@/data/families';
import { familyVector, nearestNeighbors, projectToSpace } from '@/lib/similarity';
import { NeighborOrbit } from '@/components/NeighborOrbit';
import type { Perfume } from '@/data/types';
import { EN } from '@/i18n/en';

/**
 * Uzaydaki komşular — hesabın yapıldığı yer.
 *
 * **Sunucu bileşeni ve öyle kalmalı.** Benzerlik motoru 52×52'lik bir kosinüs
 * matrisi kuruyor (`space-marks.ts:11-13`); istemciye inseydi tarayıcı paketi
 * bütün veri setini ve benzerlik hesabını taşırdı. Burada hesaplanıp aşağıya düz
 * veri olarak geçiyor, dönen çizim `NeighborOrbit`te.
 *
 * `depth` de buradan gidiyor: takımyıldızın dikey ekseni o. Uzay noktasının
 * üçüncü bileşeni, haritanın iki boyuta sığdıramadığı fark.
 */

/** Kaç komşu gösteriliyor. Beşten fazlası dönen düzende ad kalabalığı yapıyor. */
const NEIGHBOR_COUNT = 5;

interface NeighborsProps {
  readonly perfume: Perfume;
}

function colorOf(perfume: Perfume): string {
  // Sayfanın tepesindeki ışıkla aynı zincir: familyVector → dominantFamily →
  // getFamily().color. İkinci bir renk kaynağı açsaydık uzaydaki nokta bir renk,
  // bu bölüm başka bir renk gösterebilirdi (`page.tsx:24-27`).
  return getFamily(dominantFamily(familyVector(perfume))).color;
}

export function Neighbors({ perfume }: NeighborsProps) {
  const depths = new Map(
    projectToSpace(PERFUMES).map((point) => [point.perfumeId, point.depth]),
  );

  const neighbors = nearestNeighbors(perfume, PERFUMES, NEIGHBOR_COUNT).map(
    (entry) => ({
      id: entry.perfume.id,
      name: entry.perfume.name,
      score: entry.score,
      depth: depths.get(entry.perfume.id) ?? 0.5,
      color: colorOf(entry.perfume),
    }),
  );

  if (neighbors.length === 0) return null;

  return (
    <div className="w-full">
      <NeighborOrbit
        neighbors={neighbors}
        centerDepth={depths.get(perfume.id) ?? 0.5}
        centerColor={colorOf(perfume)}
        /*
          Yüzde işareti dile göre taraf değiştiriyor (%85 ↔ 85%), o yüzden
          biçim burada değil sözlükte: `neighbourEntry`.
        */
        label={EN.perfume.neighbourLabel(
          perfume.name,
          neighbors.length,
          neighbors
            .map((entry) =>
              EN.perfume.neighbourEntry(entry.name, Math.round(entry.score * 100)),
            )
            .join('; '),
        )}
      />

      <p className="mx-auto mt-8 max-w-lg text-xs leading-relaxed text-white/25">
        {EN.perfume.neighbourCaption}
      </p>
    </div>
  );
}
