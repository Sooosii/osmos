'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import {
  CENTER_X,
  CENTER_Y,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  LABEL_RISE,
  horizonPath,
  orbitSeats,
  projectSeat,
  type OrbitNeighbor,
} from '@/lib/neighbor-orbit';

/**
 * Komşu takımyıldızı — hiç durmadan dönen, gerçekten üç boyutlu.
 *
 * Merkezde bu parfüm; çevresinde ona en çok benzeyen beşi. Yarıçap benzerlik,
 * yükseklik `depth` farkı, dönüş o üçüncü boyutu görünür kılan şey. Geometrinin
 * tamamı `lib/neighbor-orbit.ts`te ve neden öyle olduğu orada yazılı.
 *
 * Bu bileşen istemcide çalışıyor ama **veriyi kendisi hesaplamıyor**: benzerlik
 * ve derinlik sunucuda çıkarılıp düz veri olarak geliyor (`Neighbors.tsx`).
 * Böylece 44×44'lük benzerlik motoru tarayıcı paketine inmiyor —
 * `space-marks.ts:11-13`'ün kuralı.
 *
 * Kare başına `setState` yok: `EvolutionChart.tsx:26`'nın ölçerek koyduğu kural.
 * React iskeleti bir kez kuruyor, döngü öznitelikleri ref üzerinden yazıyor.
 *
 * Öndeki komşu merkezin önünden, arkadaki arkasından geçiyor. Bu örtme, dönüşün
 * gerçekten derinlik taşıdığını anlatan en güçlü işaret; onsuz eğik bir daire
 * gibi dururdu.
 */

/** Bir turun süresi. İmzanın 12 saniyesinden belirgin biçimde yavaş: aynı sayfada
 *  iki animasyon var ve bu olan biteni değil, ortamı anlatıyor. */
const ROTATION_MS = 30_000;

interface NeighborOrbitProps {
  readonly neighbors: readonly (OrbitNeighbor & {
    readonly name: string;
    readonly color: string;
  })[];
  readonly centerDepth: number;
  readonly centerColor: string;
  readonly label: string;
}

export function NeighborOrbit({
  neighbors,
  centerDepth,
  centerColor,
  label,
}: NeighborOrbitProps) {
  const groupRefs = useRef<(SVGGElement | null)[]>([]);
  const haloRefs = useRef<(SVGCircleElement | null)[]>([]);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const textRefs = useRef<(SVGTextElement | null)[]>([]);
  const backRef = useRef<SVGGElement>(null);
  const frontRef = useRef<SVGGElement>(null);

  const seats = useMemo(
    () => orbitSeats(neighbors, centerDepth),
    [neighbors, centerDepth],
  );
  const horizon = useMemo(() => horizonPath(), []);

  useEffect(() => {
    /*
     * Hareket azaltılmışsa dönmüyor: tek bir kare çizilip duruluyor.
     *
     * İmza bu ayrımı bilerek yapmıyor (kullanıcı kararı) ama gerekçesi oraya
     * özgü: orada hareketin kendisi anlatının konusu, zamanın geçişi. Burada
     * dönüş yalnızca üçüncü boyutu göstermenin yolu ve bilgi durduğunda da
     * ayakta kalıyor — yarıçap, yükseklik ve renk yerinde.
     */
    const still =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    const start = performance.now();
    // Hangi komşunun merkezin önünde/arkasında olduğu; yalnızca taraf
    // değiştiğinde DOM'a dokunuyoruz, her karede değil.
    const side: (boolean | null)[] = seats.map(() => null);

    let frame = requestAnimationFrame(function step(now: number) {
      // Durgun modda sabit bir çeyrek tur: hiçbir komşu tam arkada saklı kalmasın.
      const phase = still ? Math.PI / 5 : ((now - start) / ROTATION_MS) * Math.PI * 2;

      seats.forEach((seat, index) => {
        const node = projectSeat(seat, phase);

        const group = groupRefs.current[index];
        const isBehind = node.z > 0;
        if (group && side[index] !== isBehind) {
          side[index] = isBehind;
          (isBehind ? backRef.current : frontRef.current)?.appendChild(group);
        }

        const halo = haloRefs.current[index];
        if (halo) {
          halo.setAttribute('cx', node.x.toFixed(1));
          halo.setAttribute('cy', node.y.toFixed(1));
          halo.setAttribute('r', (9 * node.scale).toFixed(2));
          halo.setAttribute('opacity', (0.05 + node.fade * 0.13).toFixed(3));
        }

        const dot = dotRefs.current[index];
        if (dot) {
          dot.setAttribute('cx', node.x.toFixed(1));
          dot.setAttribute('cy', node.y.toFixed(1));
          dot.setAttribute('r', (3.2 * node.scale).toFixed(2));
          dot.setAttribute('opacity', (0.45 + node.fade * 0.55).toFixed(3));
        }

        const text = textRefs.current[index];
        if (text) {
          // Ortalı ve hep noktanın üstünde: yan seçimi yok, dolayısıyla dönerken
          // sıçrama da yok. `text-anchor` bir kez JSX'te veriliyor, her karede
          // yazılmıyor.
          text.setAttribute('x', node.x.toFixed(1));
          text.setAttribute('y', (node.y - LABEL_RISE * node.scale).toFixed(1));
          text.setAttribute('opacity', (0.28 + node.fade * 0.62).toFixed(3));
        }
      });

      if (!still) frame = requestAnimationFrame(step);
    });

    // Sökülürken kareyi iptal et. `ScentSpaceCanvas.tsx:634` aynı tuzağı anlatıyor:
    // iptal edilmeyen kare, bileşen geri geldiğinde döngüyü kilitliyor.
    return () => cancelAnimationFrame(frame);
  }, [seats]);

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className="mx-auto block w-full max-w-lg"
      role="img"
      aria-label={label}
    >
      {/* Merkezin derinlik düzlemi. Komşunun bu halkanın üstünde mi altında mı
          durduğu, o parfümün daha derin mi yüzeysel mi olduğunu söylüyor. */}
      <path d={horizon} fill="none" stroke="#ffffff" strokeWidth={0.5} opacity={0.09} />

      <g ref={backRef} />

      {/* Merkez: bu parfüm. Tıklanmıyor, zaten buradasın. */}
      <circle cx={CENTER_X} cy={CENTER_Y} r={17} fill={centerColor} opacity={0.1} />
      <circle cx={CENTER_X} cy={CENTER_Y} r={9} fill={centerColor} opacity={0.22} />
      <circle cx={CENTER_X} cy={CENTER_Y} r={4.6} fill={centerColor} />

      <g ref={frontRef}>
        {seats.map((seat, index) => {
          const neighbor = neighbors.find((entry) => entry.id === seat.id);
          if (!neighbor) return null;

          return (
            <g
              key={seat.id}
              ref={(element) => {
                groupRefs.current[index] = element;
              }}
            >
              <Link href={`/parfum/${neighbor.id}`} className="group">
                <circle
                  ref={(element) => {
                    haloRefs.current[index] = element;
                  }}
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={9}
                  fill={neighbor.color}
                  opacity={0}
                  className="transition-opacity duration-300 group-hover:!opacity-40"
                />
                <circle
                  ref={(element) => {
                    dotRefs.current[index] = element;
                  }}
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={3.2}
                  fill={neighbor.color}
                  opacity={0}
                />
                <text
                  ref={(element) => {
                    textRefs.current[index] = element;
                  }}
                  x={CENTER_X}
                  y={CENTER_Y}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9.5"
                  opacity={0}
                  /* Koyu kontur: iki ad üst üste geldiğinde bile okunur kalsın.
                     Dönen bir düzende çakışma kaçınılmaz, engellemek yerine
                     okunabilir kılıyoruz. */
                  stroke="#050507"
                  strokeWidth={2.6}
                  paintOrder="stroke"
                  className="transition-opacity group-hover:!opacity-100"
                >
                  {neighbor.name}
                  <tspan opacity={0.45}> {Math.round(neighbor.score * 100)}%</tspan>
                </text>
              </Link>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
