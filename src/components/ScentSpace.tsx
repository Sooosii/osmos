'use client';

import { useState } from 'react';
import type { SpaceMark } from '@/data/types';
import { useDict } from '@/i18n/LocaleProvider';

/**
 * Koku Uzayı — haritanın kendisi.
 *
 * Tasarım kararı: isimler varsayılan olarak GİZLİ. Kırk dört etiket aynı anda
 * ekrandayken harita bir etiket yığınına dönüşüyor ve asıl bilgi — noktaların
 * birbirine göre duruşu — okunmaz oluyor. Bilgi istendiğinde geliyor: üstüne
 * gelince ad, tıklayınca adın yanında küratör cümlesi ve en yakın üç komşuya
 * çizilen bağlantılar.
 *
 * Etiketler SVG içinde değil, üstüne bindirilmiş HTML olarak çiziliyor. SVG
 * metni harita ölçeğine bağlı olurdu (0.05px gibi tuhaf boyutlar) ve yakınlaşma
 * geldiğinde birlikte büyürdü. HTML katmanı metni haritadan bağımsız tutuyor:
 * puntolar her zaman okunabilir kalıyor.
 */

/** Haritanın yarı genişliği. Nokta bulutu [−1, 1]'e sığıyor; kalanı kenar payı. */
const VIEW = 1.12;

/** Nokta yarıçapı — derinliğe göre bu aralıkta değişiyor (SVG kullanıcı birimi). */
const RADIUS_MIN = 0.012;
const RADIUS_RANGE = 0.016;

/** Harita koordinatını yüzdeye çevirir — HTML etiket katmanının konumu. */
function toPercent(value: number, flip: boolean): string {
  const normalized = flip ? VIEW - value : value + VIEW;
  return `${(normalized / (VIEW * 2)) * 100}%`;
}

export function ScentSpace({ marks }: { readonly marks: readonly SpaceMark[] }) {
  const t = useDict();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const byId = new Map(marks.map((mark) => [mark.id, mark]));
  const selected = selectedId ? (byId.get(selectedId) ?? null) : null;
  const hovered = hoveredId ? (byId.get(hoveredId) ?? null) : null;

  // Seçim varken yalnızca o parfüm ve komşuları tam parlaklıkta kalıyor.
  const highlighted = selected ? new Set([selected.id, ...selected.neighborIds]) : null;

  // Üstüne gelinen nokta seçiliyi bastırmıyor: seçim kalıcı, hover geçici.
  const labelled = hovered ?? selected;

  return (
    <div className="relative mt-10 aspect-square w-full">
      <svg
        viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
        className="h-full w-full rounded-lg border border-white/10 bg-black/40"
        role="img"
        aria-label={t.draft.spaceLabel}
        onClick={() => setSelectedId(null)}
      >
        {/* Bağlantılar seçimden önce çiziliyor ki noktaların altında kalsınlar. */}
        {selected?.neighborIds.map((neighborId) => {
          const neighbor = byId.get(neighborId);
          if (!neighbor) return null;
          return (
            <line
              key={neighborId}
              x1={selected.x}
              y1={-selected.y}
              x2={neighbor.x}
              y2={-neighbor.y}
              stroke="rgba(255,255,255,0.28)"
              strokeWidth={0.003}
            />
          );
        })}

        {marks.map((mark) => {
          const dimmed = highlighted !== null && !highlighted.has(mark.id);
          const active = mark.id === labelled?.id;

          return (
            <circle
              key={mark.id}
              cx={mark.x}
              cy={-mark.y}
              r={RADIUS_MIN + mark.depth * RADIUS_RANGE + (active ? 0.008 : 0)}
              fill={mark.color}
              opacity={dimmed ? 0.16 : 0.55 + mark.depth * 0.45}
              className="cursor-pointer transition-[opacity,r] duration-200"
              tabIndex={0}
              role="button"
              aria-label={`${mark.name}, ${mark.brand}`}
              onClick={(event) => {
                // Tuval tıklaması seçimi temizliyor; nokta tıklaması ona ulaşmasın.
                event.stopPropagation();
                setSelectedId(mark.id === selectedId ? null : mark.id);
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                setSelectedId(mark.id === selectedId ? null : mark.id);
              }}
              onMouseEnter={() => setHoveredId(mark.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(mark.id)}
              onBlur={() => setHoveredId(null)}
            />
          );
        })}
      </svg>

      {/* Etiket katmanı — haritanın üstünde, ölçeğinden bağımsız. */}
      {labelled && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full pb-3 text-center"
          style={{ left: toPercent(labelled.x, false), top: toPercent(labelled.y, true) }}
        >
          <p className="whitespace-nowrap text-[13px] leading-tight text-white/90">
            {labelled.name}
          </p>
          <p className="whitespace-nowrap text-[11px] leading-tight text-white/50">
            {labelled.brand}
          </p>
        </div>
      )}

      {/* Küratör cümlesi yalnızca seçimde — üstüne gelmekle gelmiyor ki
          fare gezdirirken alt metin sürekli değişip huzursuz etmesin. */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p
          className={`text-sm italic leading-relaxed text-white/50 transition-opacity duration-300 ${
            selected?.line ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {selected?.line ?? ' '}
        </p>
      </div>
    </div>
  );
}
