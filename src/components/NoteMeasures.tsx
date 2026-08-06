import type { Character, Volatility } from '@/data/types';
import { formatDuration, SIGNATURE_MAX_MINUTES } from '@/lib/evolution-loop';
import {
  AXES,
  AXIS_STEPS,
  STRIP_COLUMNS,
  STRIP_FIRST_MINUTE,
  STRIP_ROWS,
  axisSpan,
  axisWord,
  lifeStripCells,
} from '@/lib/note-measures';

/**
 * Notanın kendi ölçümleri — ③, ① ile ② arasında.
 *
 * Sayfa bugüne kadar "bu nota nedir" ve "hangi parfümlerde var" diyordu;
 * eksik olan "nasıl bir şeydir"di. Matematik `lib/note-measures.ts`te ve orada
 * sınanıyor — burada yalnızca çizim var.
 *
 * **Sunucu bileşeni ve öyle kalmalı:** durum yok, animasyon yok, istemci
 * paketine hiçbir şey inmiyor. Ölçüm durgun olduğu için gerek de yok — ve o
 * durgunluk, eksenleri uzaydaki arama kaydıraçlarından ayıran şeyin ta kendisi.
 * Buraya `'use client'` eklenmesi gerekiyorsa tasarım kaymış demektir.
 */

interface NoteMeasuresProps {
  readonly volatility: Volatility;
  readonly character: Character;
  /** Notanın baskın aile rengi — sayfadaki öbür renklerle aynı zincirden. */
  readonly color: string;
}

/** Dolu basamağın opaklığı — aile rengi metnin önüne geçmesin. */
const FILLED_OPACITY = 0.7;

/**
 * Tram hücrelerinden tek bir SVG yolu.
 *
 * Hücre başına bir `<rect>` koymak 1440 eleman demekti; yatayda bitişik dolu
 * hücreler tek parçaya katlanınca bu sayı bir avuca iniyor. Görüntü birebir
 * aynı — `crispEdges` ile kenarlar da yumuşamıyor.
 */
function stripPath(cells: readonly boolean[]): string {
  let path = '';

  for (let row = 0; row < STRIP_ROWS; row += 1) {
    let column = 0;

    while (column < STRIP_COLUMNS) {
      if (!cells[row * STRIP_COLUMNS + column]) {
        column += 1;
        continue;
      }

      const start = column;
      while (column < STRIP_COLUMNS && cells[row * STRIP_COLUMNS + column]) column += 1;

      const span = column - start;
      path += `M${start} ${row}h${span}v1h-${span}z`;
    }
  }

  return path;
}

/**
 * Ömür şeridi — sekiz saat, soldan sağa, logaritmik.
 *
 * ⚠️ **Çubuk grafiği değil ve olmamalı.** Yükseklik hiçbir şeyi kodlamıyor:
 * bilgiyi taşıyan tek şey doku yoğunluğu. Eksen çizgisi, ızgara, okunacak sayı
 * yok — iki uç damgası ve iki ölçüm var, o kadar. Buraya bir ızgara ya da
 * yükseklik kodlaması girerse ③'te reddedilen şeye dönüşür.
 */
function LifeStrip({ volatility, color }: { readonly volatility: Volatility; readonly color: string }) {
  const path = stripPath(lifeStripCells(volatility));

  return (
    <div>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${STRIP_COLUMNS} ${STRIP_ROWS}`}
        shapeRendering="crispEdges"
        className="w-full"
        style={{ color }}
      >
        <path d={path} fill="currentColor" opacity={FILLED_OPACITY} />
      </svg>

      {/*
        Kontrast sitenin alışıldık `text-white/25`inden yüksek ve bu bilerek:
        o değer düz zemine göre seçilmişti, burada arkada hareketli bir tram
        alanı var ve ince etiketler noktaların içinde kayboluyordu.
      */}
      <div className="mt-2 flex justify-between text-[9px] uppercase tracking-[0.2em] text-white/45">
        <span>{formatDuration(STRIP_FIRST_MINUTE)}</span>
        <span>{formatDuration(SIGNATURE_MAX_MINUTES)}</span>
      </div>

      {/*
        Şeridin okunur karşılığı. Görme engelli biri için tek bilgi kaynağı bu —
        tuval `aria-hidden`. Sayılar `evolution-loop.ts`in biçimlendiricisinden
        geçiyor, ikinci bir biçim açılmıyor.
      */}
      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-2 text-[10px] tracking-[0.18em] text-white/45">
        <div className="flex items-baseline gap-2">
          <dt>TEPE</dt>
          <dd className="tabular-nums text-white/60">{formatDuration(volatility.peakMinutes)}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt>YARI ÖMÜR</dt>
          <dd className="tabular-nums text-white/60">{formatDuration(volatility.halfLifeMinutes)}</dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Dört karakter ekseni — durgun bir ölçüm.
 *
 * ⚠️ **Kaydıraç değil.** Topuz yok, tutulacak yer yok, `cursor` değişmiyor,
 * odaklanmıyor, basamaklı. Uzaydaki kaydıraç bir **arama** aracı; burası
 * notanın verilmiş bir ölçüsü. İkisi aynı görünürse kullanıcı nota sayfasında
 * da arama yaptığını sanar — nota ansiklopedisi spec'inin ④. kararının ikinci
 * gerekçesi buydu.
 *
 * Basamaklar `aria-hidden`; ekran okuyucuya giden şey `axisWord`ün cümlesi.
 * Basamağı "12/16" diye okutmak ölçüyü olduğundan kesin gösterirdi.
 */
function CharacterAxes({ character, color }: { readonly character: Character; readonly color: string }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {AXES.map((axis) => {
        const value = character[axis.id];
        const span = axisSpan(value);

        return (
          <li
            key={axis.id}
            className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-3 sm:grid-cols-[6rem_1fr_6rem] sm:gap-5"
          >
            {/*
              Sola dayalı, sağa değil. Sağa dayalıyken dört etiket dört ayrı
              yerden başlıyordu (SOĞUK / PÜRÜZSÜZ / KİRLİ / UZAK) ve blok
              ekranda kaymış görünüyordu. Sol kenar artık sayfanın öbür bütün
              öğeleriyle — başlık, tarif, bölüm adları — aynı hizada.
            */}
            <span aria-hidden="true" className="text-[9px] tracking-[0.16em] text-white/45">
              {axis.low}
            </span>

            {/*
              Orta çizgi hep duruyor: tarafsız bir nota (|değer| < 0.15, veride
              %15'i) hiçbir hücre doldurmuyor ve çizgi olmasa satır eksik veri
              gibi görünürdü.
            */}
            <span aria-hidden="true" className="relative flex gap-[2px]">
              <span className="absolute inset-y-[-3px] left-1/2 w-px -translate-x-1/2 bg-white/20" />

              {Array.from({ length: AXIS_STEPS }, (_, step) => {
                const filled = step >= span.from && step < span.to;
                return (
                  <span
                    key={step}
                    className={`h-2 flex-1 ${filled ? '' : 'bg-white/[0.07]'}`}
                    style={filled ? { backgroundColor: color, opacity: FILLED_OPACITY } : undefined}
                  />
                );
              })}
            </span>

            <span aria-hidden="true" className="text-[9px] tracking-[0.16em] text-white/45">
              {axis.high}
            </span>

            <span className="sr-only">{axisWord(axis, value)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function NoteMeasures({ volatility, character, color }: NoteMeasuresProps) {
  return (
    <>
      <section className="pt-16">
        <h2 className="mb-8 text-xs tracking-[0.3em] text-white/45">UÇUCULUK</h2>
        <LifeStrip volatility={volatility} color={color} />
      </section>

      <section className="pt-16">
        <h2 className="mb-8 text-xs tracking-[0.3em] text-white/45">KARAKTER</h2>
        <CharacterAxes character={character} color={color} />
      </section>
    </>
  );
}
