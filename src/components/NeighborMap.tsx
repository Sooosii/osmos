import Link from 'next/link';
import { RevealOnView } from '@/components/RevealOnView';
import { PERFUMES } from '@/data/perfumes';
import { dominantFamily, getFamily } from '@/data/families';
import { familyVector, nearestNeighbors } from '@/lib/similarity';
import {
  CENTER_X,
  CENTER_Y,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  radialLayout,
} from '@/lib/neighbor-map';
import type { Perfume } from '@/data/types';

/**
 * Uzaydaki komşular — parfüme en çok benzeyenler, çevresinde.
 *
 * Sayfanın bugüne kadar karşılıksız bıraktığı dürtüyü karşılıyor: imzayı okuyup
 * "buna benzeyen ne var?" diyen kişi uzaya dönüp noktayı yeniden aramak zorunda
 * kalmıyor.
 *
 * Komşular merkezde toplu belirip dağılıyor. En benzeyen en yakında duruyor ve
 * hepsi dört bir yana yayılıyor — sıra değil çember. Yarıçap doğrudan benzerlik
 * skoru, dolayısıyla "ne kadar benziyor" göz kararı değil ölçü.
 *
 * **`'use client'` yok ve olmamalı.** Dağılma saf CSS (`osmos-komsu-dagil`),
 * gezinme `next/link`. İstemci bileşeni yapılsaydı 44×44'lük benzerlik motoru
 * tarayıcı paketine inerdi — `space-marks.ts:11-13`'ün kuralı, Task 2'de bir kez
 * savunuldu.
 *
 * Konumların uzaydaki gerçek yerler OLMADIĞINA dair karar geçmişi
 * `lib/neighbor-map.ts` başında; oraya bakmadan gerçek konumlara döndürmeyin.
 */

/** Kaç komşu gösteriliyor. Etiket çakışması nokta sayısıyla hızla arttığı için beş. */
const NEIGHBOR_COUNT = 5;

/** Dağılmanın süresi. */
const SPREAD_MS = 620;

interface NeighborMapProps {
  readonly perfume: Perfume;
}

function colorOf(perfume: Perfume): string {
  // Sayfanın tepesindeki ışıkla aynı zincir: familyVector → dominantFamily →
  // getFamily().color. İkinci bir renk kaynağı açsaydık harita bir renk, bu bölüm
  // başka bir renk gösterebilirdi (`page.tsx:24-27`).
  return getFamily(dominantFamily(familyVector(perfume))).color;
}

export function NeighborMap({ perfume }: NeighborMapProps) {
  const neighbors = nearestNeighbors(perfume, PERFUMES, NEIGHBOR_COUNT);
  const placed = radialLayout(
    neighbors.map((entry) => ({ id: entry.perfume.id, score: entry.score })),
  );
  const byId = new Map(neighbors.map((entry) => [entry.perfume.id, entry]));
  const centerColor = colorOf(perfume);

  return (
    <RevealOnView>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="mx-auto block w-full max-w-md"
        role="img"
        aria-label={`${perfume.name} parfümüne en çok benzeyen ${
          neighbors.length
        } parfüm: ${neighbors
          .map((entry) => `${entry.perfume.name} (${Math.round(entry.score * 100)}%)`)
          .join(', ')}.`}
      >
        {placed.map((dot) => {
          const entry = byId.get(dot.id);
          if (!entry) return null;
          const color = colorOf(entry.perfume);
          // Animasyonun kendisi globals.css'te ve yalnızca bölüm görüş alanına
          // girince çalışıyor; burada sadece o noktaya ait değerler veriliyor.
          const style = {
            '--dx': `${dot.fromDx}px`,
            '--dy': `${dot.fromDy}px`,
            '--sure': `${SPREAD_MS}ms`,
            '--gecikme': `${dot.delayMs}ms`,
          } as React.CSSProperties;

          return (
            <g key={dot.id} className="osmos-komsu" style={style}>
              {/* Merkeze bağlayan çizgi: uzaklığı okunur kılan şey bu. Çizgi
                  olmadan noktalar bağımsız bir bulut gibi duruyordu. */}
              <line
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={dot.x}
                y2={dot.y}
                stroke={color}
                strokeWidth={0.6}
                opacity={0.22}
              />
              <Link href={`/parfum/${dot.id}`} className="group">
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={8}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  opacity={0}
                  className="transition-opacity group-hover:opacity-60"
                />
                <circle cx={dot.x} cy={dot.y} r={4} fill={color} />
                <text
                  x={dot.x + (dot.anchor === 'end' ? -8 : 8)}
                  y={dot.labelY + 3.2}
                  textAnchor={dot.anchor}
                  fill="#ffffff"
                  fontSize="9"
                  opacity={0.75}
                  className="transition-opacity group-hover:opacity-100"
                >
                  {entry.perfume.name}
                </text>
              </Link>
            </g>
          );
        })}

        {/* Merkez en sonda çiziliyor: dağılan noktalar altından geçsin, üstüne
            binmesin. Tıklanmıyor — zaten bu sayfadasın. */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={13}
          fill="none"
          stroke={centerColor}
          strokeWidth={1}
          opacity={0.45}
        />
        <circle cx={CENTER_X} cy={CENTER_Y} r={5.5} fill={centerColor} />
      </svg>

      <p className="mt-6 max-w-lg text-xs leading-relaxed text-white/25">
        Merkezdeki bu parfüm. Çevresindekiler ona en çok benzeyenler; ne kadar
        yakınsa o kadar benziyor. Benzerlik notaların, ailelerin ve karakterin
        karşılaştırılmasından hesaplanıyor.
      </p>
    </RevealOnView>
  );
}
