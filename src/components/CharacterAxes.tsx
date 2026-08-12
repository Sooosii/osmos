import type { Character } from '@/data/types';
import type { Dict } from '@/i18n/en';
import { AXIS_STEPS, axesFor, axisSpan, axisWord } from '@/lib/note-measures';

/** Dolu basamağın opaklığı — aile rengi metnin önüne geçmesin. */
const FILLED_OPACITY = 0.7;

/**
 * Dört karakter ekseni — durgun bir ölçüm.
 *
 * **Iki sayfa da bunu çiziyor:** nota sayfası notanın ölçüsünü, künye parfümün
 * ölçüsünü (`perfume-character.ts`). Cetvel ikisinde de aynı (−1…+1) ve
 * bileşenin ortak olması bunun garantisi: sözcükler, basamak sayısı, orta çizgi
 * ve okuma sırası tek yerde duruyor. Ayrı ayrı yazılsalardı bir gün biri
 * kayardı ve iki sayfa aynı veriyi farklı gösterirdi.
 *
 * ⚠️ **Kaydıraç değil.** Topuz yok, tutulacak yer yok, `cursor` değişmiyor,
 * odaklanmıyor, basamaklı. Uzaydaki kaydıraç bir **arama** aracı; burası
 * verilmiş bir ölçü. İkisi aynı görünürse kullanıcı bu sayfalarda da arama
 * yaptığını sanar — nota ansiklopedisi spec'inin ④. kararının ikinci gerekçesi
 * buydu.
 *
 * Basamaklar `aria-hidden`; ekran okuyucuya giden şey `axisWord`ün cümlesi.
 * Basamağı "12/16" diye okutmak ölçüyü olduğundan kesin gösterirdi.
 *
 * **Sunucu bileşeni ve öyle kalmalı:** durum yok, animasyon yok.
 */
export function CharacterAxes({
  character,
  color,
  t,
}: {
  readonly character: Character;
  readonly color: string;
  readonly t: Dict;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {axesFor(t).map((axis) => {
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
            <span aria-hidden="true" className="text-[9px] tracking-[0.16em] text-white/50">
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

            <span aria-hidden="true" className="text-[9px] tracking-[0.16em] text-white/50">
              {axis.high}
            </span>

            <span className="sr-only">{axisWord(axis, value, t.axisWords)}</span>
          </li>
        );
      })}
    </ul>
  );
}
