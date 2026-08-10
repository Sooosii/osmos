'use client';

import { useEffect, useMemo, useRef } from 'react';
import { getNote } from '@/data/notes';
import { FAMILY_ORDER, dominantFamily, getFamily } from '@/data/families';
import { intensityAt } from '@/lib/evolution';
import {
  SIGNATURE_MAX_MINUTES,
  cycleProgress,
  formatDuration,
  minutesAt,
  morphAt,
  phaseLabel,
} from '@/lib/evolution-loop';
import type { Perfume, ScentFamily, Volatility } from '@/data/types';

/**
 * Evrim imzası — parfümün 8 saatlik ömrü, kendiliğinden ve hiç durmadan.
 *
 * Kaydıraç yok, kaydırma yok, tetikleyici yok. Turda iki şey birden döngüde:
 * **biçim** (eğriler ↔ çizelge çubukları) ve **zaman** (0 → 8 saat → 0).
 * Bu bir süs değil: eğri dümdüz olup çubuğa oturduğunda çubuğun uzunluğu o
 * notanın o andaki yüzdesi. Aynı sayılar, iki biçim — "aa, o aslında veriymiş".
 *
 * Neden tuval değil SVG: nota adları ve yüzdeler gerçek `<text>` kalmalı.
 * `ScentSpaceCanvas.tsx`'in başlık yorumu aynı kararı bir kez zaten
 * vermiş — orada gerekçe nokta sayısı, burada nota adları.
 *
 * Neden kare başına `setState` yok: `EvolutionChart.tsx:26`'nın ölçerek koyduğu
 * kural. Burada React yalnızca iskeleti bir kez kuruyor; her kare `d`, `opacity`
 * ve metin içeriği ref üzerinden DOM'a yazılıyor.
 *
 * Erişilebilirlik notu: `prefers-reduced-motion` ayrımı **bilerek yok** —
 * kullanıcı kararı. Bilinçli bir ödün; hareketin büyük alanlı bir kayma değil
 * çubuk uzunluğu değişimi olması riski sınırlıyor.
 */

/** SVG'nin iç koordinat genişliği; ekranda `width:100%` ile esniyor. */
const VIEW_WIDTH = 300;
const PAD = 8;
/**
 * Nota adı sütunu.
 *
 * Veri setindeki en uzun nota adına göre ayarlı: "Çarkıfelek meyvesi" (18 karakter).
 * Etiket kırpılmıyor, `textLength` ile sıkıştırılmıyor — bu yüzden sütun onu
 * taşımadan barındıracak kadar geniş olmak zorunda. 56 değeriyle bu ad (ve veri
 * setinde 13+ karakterli dokuz ad daha) çubuğun üzerine biniyordu; 84'e çıkarmanın
 * bedeli çubuk uzunluğunun (span) ~14% kısalması — kabul edilen ödün. Küçültmeden
 * önce veri setindeki en uzun adları kontrol et.
 */
const LABEL_WIDTH = 84;
/** Yüzde sütunu. */
const VALUE_WIDTH = 26;
/** İlk satırın üstündeki boşluk. */
const TOP = 14;
/** Çizelge hâlindeki satır aralığı. */
const ROW_GAP = 22;
/** Her eğriyi kaç parçaya bölerek çiziyoruz. */
const SAMPLES = 80;
/**
 * Etiketler bu morph değerinden sonra belirmeye başlıyor.
 *
 * `morphAt` turda tek gidiş geliş yaptığı için okunur bant zaten turun büyük
 * kısmını kaplıyor; bu değer (eskiden 0.15) ve aşağıdaki kare-kök eğrisiyle
 * birlikte bant turun ~%87'sine çıkıyor — sahibin canlı örnekte onayladığı
 * değer. Amaç: notalar erkenden kaybolmasın, "vanish too early" şikâyeti.
 */
const LABEL_FADE_START = 0.04;

/**
 * Eğri hâlindeki çizgi kalınlığı ve çizelgeye oturunca eklenen fark.
 *
 * Sabit olmalarının sebebi tek bir yerde durmaları: taban değer hem sunucuda
 * çizilen ilk kareye (JSX `strokeWidth`) hem de her karede yazılan değere giriyor.
 * İki ayrı `1.8` olduğunda biri değiştirilip diğeri unutulursa mount anında tek
 * karelik bir titreme kalıyordu.
 */
const STROKE_BASE = 1.8;
const STROKE_GROWTH = 1.4;

interface Geometry {
  readonly viewHeight: number;
  readonly x0: number;
  readonly span: number;
  readonly baseY: number;
  readonly curveHeight: number;
}

interface SignatureRow {
  readonly noteId: string;
  readonly label: string;
  readonly family: ScentFamily;
  readonly volatility: Volatility;
  readonly weight: number;
}

function rowY(index: number): number {
  return TOP + ROW_GAP * index;
}

function geometryFor(rowCount: number): Geometry {
  const viewHeight = TOP + ROW_GAP * Math.max(rowCount - 1, 0) + PAD;
  const x0 = PAD + LABEL_WIDTH;
  return {
    viewHeight,
    x0,
    span: VIEW_WIDTH - PAD - VALUE_WIDTH - x0,
    baseY: viewHeight - PAD,
    curveHeight: viewHeight - PAD - TOP,
  };
}

interface CurvePoint {
  /** Örneğin tur içindeki yeri, 0–1. Çubuk hâlindeki x'i bundan türüyor. */
  readonly u: number;
  readonly x: number;
  readonly y: number;
}

/**
 * Bir notanın eğri hâlindeki noktaları.
 *
 * Zamandan **tamamen bağımsız**: yalnızca notanın uçuculuğuna, ağırlığına ve
 * geometriye bakıyor. O yüzden parfüm başına bir kez hesaplanıyor, kare başına
 * değil. Eskiden `pathFor`un içindeydi ve her karede yeniden üretiliyordu — altı
 * notalı bir parfümde saniyede ~29 bin `intensityAt` çağrısı. Kare başına gerçekten
 * değişen tek şey `morph` ve `level`.
 */
function curveFor(row: SignatureRow, geometry: Geometry): readonly CurvePoint[] {
  const points: CurvePoint[] = [];

  for (let j = 0; j <= SAMPLES; j += 1) {
    const u = j / SAMPLES;
    points.push({
      u,
      x: geometry.x0 + u * geometry.span,
      y:
        geometry.baseY -
        intensityAt(row.volatility, minutesAt(u, SIGNATURE_MAX_MINUTES)) *
          row.weight *
          geometry.curveHeight,
    });
  }

  return points;
}

/**
 * Bir notanın o karedeki yolu.
 *
 * `morph = 0` eğri, `morph = 1` çubuk, arası doğrusal karışım. Nokta sayısı iki
 * hâlde de aynı olduğu için karışım nokta nokta yapılabiliyor — SVG'nin morph
 * için ayrı bir mekanizmasına ihtiyaç yok.
 *
 * Eğri tarafı hazır geliyor (`curveFor`); kare başına kalan iş çubuk x'i ve iki
 * harmanlama. `morph = 1`'de çubuğun ucu tam `x0 + level·span` oluyor — çubuk
 * uzunluğunun yanındaki yüzdeyle birebir aynı şeyi söylemesi buna dayanıyor.
 */
function pathFor(
  curve: readonly CurvePoint[],
  index: number,
  morph: number,
  level: number,
  geometry: Geometry,
): string {
  const y1 = rowY(index);
  let d = '';

  for (let j = 0; j < curve.length; j += 1) {
    const point = curve[j];
    const barX = geometry.x0 + point.u * level * geometry.span;

    const x = point.x + (barX - point.x) * morph;
    const y = point.y + (y1 - point.y) * morph;
    d += `${j === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
  }

  return d;
}

/**
 * Etiket saydamlığı — biçim çizelgeye yaklaştıkça beliriyor.
 *
 * Kare kök eğrisi bilerek: doğrusala göre etiket hızlı belirip uzun süre
 * kalıyor (eğrinin başındaki dik yükseliş, sonundaki yatay seyir). Sahibin
 * "isimler ve yüzdeler çok erken kayboluyor" şikâyetine karşılık geldi.
 */
function labelOpacity(morph: number, max: number): string {
  if (morph <= LABEL_FADE_START) return '0';
  return (Math.sqrt((morph - LABEL_FADE_START) / (1 - LABEL_FADE_START)) * max).toFixed(2);
}

interface EvolutionSignatureProps {
  readonly perfume: Perfume;
}

export function EvolutionSignature({ perfume }: EvolutionSignatureProps) {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const nameRefs = useRef<(SVGTextElement | null)[]>([]);
  const valueRefs = useRef<(SVGTextElement | null)[]>([]);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const durationRef = useRef<HTMLSpanElement>(null);

  /** Sabit satır bilgisi — parfüm değişmedikçe yeniden hesaplanmıyor. */
  const rows = useMemo<readonly SignatureRow[]>(
    () =>
      perfume.notes.map((entry) => {
        const note = getNote(entry.noteId);
        // Ham vektör: `dominantFamily` sırayı `FAMILY_ORDER`'dan bekliyor.
        // Yeni bir argmax yazmıyoruz ki eşitlikler uzaydakiyle aynı çözülsün.
        const vector = FAMILY_ORDER.map((family) => note.families[family] ?? 0);
        return {
          noteId: entry.noteId,
          label: note.name.en,
          family: dominantFamily(vector),
          volatility: note.volatility,
          weight: entry.weight,
        };
      }),
    [perfume],
  );

  const geometry = useMemo(() => geometryFor(rows.length), [rows.length]);

  /**
   * Bu parfümde geçen aileler — göstergeyi besleyen liste.
   *
   * Sıra `FAMILY_ORDER`dan geliyor, notaların sırasından değil: gösterge her
   * parfümde aynı düzende okunsun ki `families.ts:6-7`'nin istediği "kullanıcı
   * 15-20 parfüm gezdikten sonra renk kodunu çözebilmeli" işlesin. Nota sırasına
   * bırakılsaydı aynı aile her sayfada başka yerde çıkar, kod öğrenilemezdi.
   */
  const families = useMemo(() => {
    const seen = new Set(rows.map((row) => row.family));
    return FAMILY_ORDER.filter((family) => seen.has(family)).map(getFamily);
  }, [rows]);

  /** Eğri noktaları — zamandan bağımsız, parfüm başına bir kez. */
  const curves = useMemo(() => rows.map((row) => curveFor(row, geometry)), [rows, geometry]);

  /**
   * Sunucuda çizilen ilk kare — `progress = 0`, yani saf eğri hâli.
   *
   * Boş `d` ile başlansaydı JavaScript inene kadar (ve JS hiç çalışmazsa
   * tamamen) boş bir kutu görünürdü. Bu hâliyle imza, animasyon başlamadan
   * önce de doğru şeyi gösteriyor.
   *
   * `level` olarak 0 geçiliyor çünkü `morph = 0`'da harmanlama çubuk x'ini
   * tamamen atıyor — eğri hâlinde çubuk uzunluğunun bir anlamı yok. Burada
   * eskiden `intensityAt(...)` ile hesaplanmış bir değer vardı; sonucu hiçbir
   * yere gitmiyordu ama okuyana anlamlıymış gibi görünüyordu.
   */
  const initialPaths = useMemo(
    () => curves.map((curve, index) => pathFor(curve, index, 0, 0, geometry)),
    [curves, geometry],
  );

  useEffect(() => {
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now: number) {
      const progress = cycleProgress(now - start);
      const morph = morphAt(progress);
      const minutes = minutesAt(progress, SIGNATURE_MAX_MINUTES);

      rows.forEach((row, index) => {
        const level = intensityAt(row.volatility, minutes) * row.weight;

        const path = pathRefs.current[index];
        if (path) {
          path.setAttribute('d', pathFor(curves[index], index, morph, level, geometry));
          path.setAttribute(
            'stroke-width',
            (STROKE_BASE + morph * STROKE_GROWTH).toFixed(2),
          );
        }

        const name = nameRefs.current[index];
        if (name) name.setAttribute('opacity', labelOpacity(morph, 0.72));

        const value = valueRefs.current[index];
        if (value) {
          value.setAttribute('opacity', labelOpacity(morph, 0.5));
          // Yüzde her karede aynı yuvarlanmış değere düşebiliyor; aynı metni
          // tekrar yazmak gereksiz layout kirletiyordu (sahip: "hafif bir
          // takılma" fark etti) — değişmemişse dokunma.
          const percentText = `${Math.round(level * 100)}%`;
          if (value.textContent !== percentText) value.textContent = percentText;
        }
      });

      // Saat metinleri saniyede birkaç kez değil, yalnızca gösterdikleri değer
      // gerçekten değiştiğinde yazılıyor — aynı gerekçe: gereksiz yazım, gereksiz
      // layout kirliliği, hissedilir takılma.
      if (phaseRef.current) {
        const phaseText = phaseLabel(minutes);
        if (phaseRef.current.textContent !== phaseText) phaseRef.current.textContent = phaseText;
      }
      if (durationRef.current) {
        const durationText = formatDuration(minutes);
        if (durationRef.current.textContent !== durationText) {
          durationRef.current.textContent = durationText;
        }
      }

      frame = requestAnimationFrame(step);
    });

    // Sökülürken kareyi iptal et. `ScentSpaceCanvas.tsx`'in temizleme etkisi aynı tuzağı
    // anlatıyor: iptal edilmeyen kare, bileşen geri geldiğinde "zaten kare
    // bekliyor" sanılıp döngüyü kilitliyor.
    return () => cancelAnimationFrame(frame);
  }, [rows, curves, geometry]);

  return (
    <div className="w-full">
      {/* Saat yazısı — hareketin neyi anlattığını söyleyen tek satır. */}
      <div className="mb-6 flex items-baseline gap-2">
        <span ref={phaseRef} className="text-sm tracking-wide text-white/80">
          Açılış
        </span>
        <span className="text-white/25">·</span>
        <span ref={durationRef} className="text-sm tabular-nums text-white/50">
          ilk saniyeler
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${geometry.viewHeight}`}
        className="block w-full"
        role="img"
        aria-label={`${perfume.name} evrim imzası: ${rows
          .map((row) => row.label)
          .join(', ')} notalarının 8 saat boyunca yükselip düşüşü.`}
      >
        {rows.map((row, index) => (
          <g key={row.noteId}>
            <path
              ref={(element) => {
                pathRefs.current[index] = element;
              }}
              d={initialPaths[index]}
              fill="none"
              stroke={getFamily(row.family).color}
              strokeWidth={STROKE_BASE}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              ref={(element) => {
                nameRefs.current[index] = element;
              }}
              x={PAD}
              y={rowY(index) + 3}
              opacity="0"
              fill="#ffffff"
              fontSize="8.5"
            >
              {row.label}
            </text>
            <text
              ref={(element) => {
                valueRefs.current[index] = element;
              }}
              x={VIEW_WIDTH - PAD}
              y={rowY(index) + 3}
              opacity="0"
              textAnchor="end"
              fill="#ffffff"
              fontSize="8.5"
              /* Sürekli değişen yüzdeyi ekran okuyucuya canlı okutmak gürültü olurdu. */
              aria-hidden="true"
            >
              0%
            </text>
          </g>
        ))}
      </svg>

      {/*
        Renk = aile. Katman göstergesi (Üst/Kalp/Dip) burada YOK: imzada renk
        katmanı değil aileyi anlatıyor, o gösterge yanlış bilgi verirdi. Katmanlı
        hâli kaydıraçlı çizelgede, `/evolution`'da duruyor.
      */}
      <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
        {families.map((family) => (
          <span key={family.id} className="flex items-center gap-2 text-xs text-white/35">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: family.color }}
            />
            {family.name.en}
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
