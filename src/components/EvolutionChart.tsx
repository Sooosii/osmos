'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getNote } from '@/data/notes';
import { evolutionAt } from '@/lib/evolution';
import type { Perfume, PyramidTier } from '@/data/types';

/**
 * Evrim çizelgesi — bir parfümün notaları zaman içinde yükselip düşüyor.
 *
 * Parfümünü kendi seçmiyor, **dışarıdan alıyor**. Eskiden seçici de başlık da
 * bu bileşenin içindeydi ve `PERFUMES`'ı doğrudan import ediyordu; o hâliyle
 * parfüm sayfasına konulamazdı, çünkü sayfa tek bir parfümü gösteriyor ve
 * başlığını kendisi kuruyor. Seçici `EvolutionTimeline`'da kaldı — orası
 * `/evrim` doğrulama ekranı, iki ucu karşılaştırmak için var.
 *
 * Kaydıraç logaritmik: ilk yarısı ilk saati, ikinci yarısı kalan 11 saati
 * kaplıyor. Doğrusal olsaydı bütün hareket kaydıracın ilk %2'sinde sıkışırdı —
 * kokunun ilginç kısmı ilk bir saatte oluyor.
 *
 * Akıcılık için üç kural (ölçülerek konuldu, korunmalı):
 *   1. Çubuklar `width` ile değil `transform: scaleX()` ile büyüyor.
 *      width her karede yeniden yerleşim (layout) tetikler; transform tetiklemez.
 *   2. Kaydıraç kontrolsüz (`defaultValue`). Tarayıcı topuzu React'ı beklemeden
 *      kendi hızında sürüyor; React sadece türetilen görüntüyü güncelliyor.
 *   3. Durum güncellemesi requestAnimationFrame ile kare başına bir kez.
 *      Fare 120 Hz olay üretse bile render 60 fps'te kalıyor.
 */

const MAX_MINUTES = 720;
const SLIDER_STEPS = 1000;
/** Kaydıraç en baştan açılıyor. Taban varlığı sayesinde 0. dakikada da
 *  hiçbir çubuk boş değil — kompozisyonun tamamı zaten tende. */
const INITIAL_STEP = 0;

/** Katman renkleri — referans görseldeki turuncu / pembe / mor ayrımı. */
const TIER_COLOR: Record<PyramidTier, string> = {
  top: '#F5A65B',
  heart: '#E87FA8',
  base: '#9B87D4',
};

const TIER_LABEL: Record<PyramidTier, string> = {
  top: 'Üst',
  heart: 'Kalp',
  base: 'Dip',
};

function sliderToMinutes(step: number): number {
  const position = step / SLIDER_STEPS;
  return Math.expm1(position * Math.log1p(MAX_MINUTES));
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return 'ilk saniyeler';
  if (minutes < 60) return `${Math.round(minutes)} dakika`;

  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest === 0 ? `${hours} saat` : `${hours} saat ${rest} dakika`;
}

function phaseLabel(minutes: number): string {
  if (minutes < 15) return 'Açılış';
  if (minutes < 120) return 'Kalp';
  return 'Dip';
}

interface EvolutionChartProps {
  readonly perfume: Perfume;
}

export function EvolutionChart({ perfume }: EvolutionChartProps) {
  const [step, setStep] = useState(INITIAL_STEP);

  // Kaydıraçtan gelen ham değer ve bekleyen kare — render dışında tutuluyor.
  const pendingStepRef = useRef(INITIAL_STEP);
  const frameRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Kaydıracı başlangıç konumuna zorla.
   *
   * İki ayrı sebeple gerekli. React hidrasyonda `defaultValue`'yu DOM'a
   * geçirmiyor; girdi "dirty" işaretlenip yanlış değerde kalıyor. Ayrıca
   * tarayıcı, sayfa yenilendiğinde form değerlerini geri yüklüyor ve bunu
   * React'in efektinden SONRA yapıyor — ölçüldü: 870'e sürükleyip yenileyince
   * topuz 0'a düşüyor, etiket "3 dakika" diyordu. Girdide `autoComplete="off"`
   * geri yüklemeyi kapatıyor; buradaki çift rAF ise atlatılan bir durum kalırsa
   * son sözü söylüyor.
   */
  useEffect(() => {
    const apply = () => {
      if (inputRef.current) inputRef.current.value = String(INITIAL_STEP);
      pendingStepRef.current = INITIAL_STEP;
      setStep(INITIAL_STEP);
    };
    apply();

    // Kendi kare kimliklerini tut — frameRef kaydıraç kısıtlayıcısına ait,
    // orayı doldurmak "kare bekliyor" sanılıp kaydıracı dondururdu.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(apply);
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  const handleSliderInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    pendingStepRef.current = Number(event.target.value);
    if (frameRef.current !== null) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      setStep(pendingStepRef.current);
    });
  }, []);

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  /** Sabit satır bilgisi — parfüm değişmedikçe yeniden hesaplanmıyor. */
  const rows = useMemo(
    () =>
      perfume.notes.map((entry) => ({
        noteId: entry.noteId,
        label: getNote(entry.noteId).name.tr,
        color: TIER_COLOR[entry.tier],
      })),
    [perfume],
  );

  const minutes = useMemo(() => sliderToMinutes(step), [step]);
  const bars = useMemo(() => evolutionAt(perfume.notes, minutes), [perfume, minutes]);

  return (
    <div className="w-full">
      {/* Zaman kaydıracı */}
      <div className="mb-12">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-sm tracking-wide text-white/80">{phaseLabel(minutes)}</span>
          <span className="text-white/25">·</span>
          <span className="text-sm tabular-nums text-white/50">{formatDuration(minutes)}</span>
        </div>
        <input
          ref={inputRef}
          type="range"
          min={0}
          max={SLIDER_STEPS}
          step={1}
          defaultValue={INITIAL_STEP}
          autoComplete="off"
          onChange={handleSliderInput}
          aria-label="Zaman"
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-white outline-none"
        />
      </div>

      {/* Nota kanalları */}
      <ul className="space-y-5">
        {rows.map((row, index) => {
          const level = bars[index].level;
          const percent = Math.round(level * 100);
          // 375 px'te etiket sütunu daraltılıyor: sabit 144 px bırakıldığında
          // kanala yalnızca 99 px kalıyor ve grafik okunmaz hâle geliyor.
          return (
            <li key={row.noteId} className="flex items-center gap-3 sm:gap-5">
              <span
                className="w-24 shrink-0 truncate text-sm font-light text-white/60 sm:w-36"
                title={row.label}
              >
                {row.label}
              </span>
              <span className="h-px flex-1 overflow-hidden bg-white/[0.07]">
                {/*
                  %0'a yuvarlanan nota tamamen kayboluyor. scaleX çok küçük bir
                  değerde bile (0.0016) geniş bir kanalda hâlâ birkaç piksel
                  çiziyor; sayı 0 derken çizgi duruyordu.
                */}
                <span
                  className="block h-full w-full origin-left will-change-transform"
                  style={{
                    transform: `scaleX(${level})`,
                    backgroundColor: row.color,
                    opacity: percent === 0 ? 0 : 1,
                  }}
                />
              </span>
              <span className="w-9 shrink-0 text-right text-xs font-light tabular-nums text-white/35 sm:w-11">
                {percent}%
              </span>
            </li>
          );
        })}
      </ul>

      {/* Katman göstergesi */}
      <div className="mt-8 flex gap-5">
        {(Object.keys(TIER_COLOR) as PyramidTier[]).map((tier) => (
          <span key={tier} className="flex items-center gap-2 text-xs text-white/35">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: TIER_COLOR[tier] }}
            />
            {TIER_LABEL[tier]}
          </span>
        ))}
      </div>

      <p className="mt-10 max-w-lg text-xs leading-relaxed text-white/25">
        Bu çizelge bir tahmindir, ölçüm değil. Notaların uçuculuğundan modellenmiştir;
        gerçek gelişim sıcaklığa, tene ve konsantrasyona göre değişir.
      </p>
    </div>
  );
}
