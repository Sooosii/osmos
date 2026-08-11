import type { Note, Perfume } from '@/data/types';
import { getNote } from '@/data/notes';
import { dominantFamily, getFamily } from '@/data/families';
import { familyVector, projectToSpace } from './similarity';
import { noteColor } from './note-marks';

/**
 * Paylaşım kartındaki imza satırını besleyen saf modül.
 *
 * `note-marks.ts` ve `space-marks.ts` ile aynı sözleşme ve aynı gerekçe:
 * `opengraph-image.tsx` sınanamaz, bu modül sınanabilir. Bileşen yalnızca
 * çiziyor; hangi noktaların çizileceğine dair tek bir karar taşımıyor.
 *
 * Renk zinciri tek: `noteColor` ve `familyVector → dominantFamily →
 * getFamily().color`. İkinci bir kaynak açılmıyor — bu modül yazılırken
 * `noteColor`ın iki kopyası bire indirildi.
 */
export interface ShareDot {
  /** Baskın koku ailesinin rengi — haritadaki noktalarla aynı palet. */
  readonly color: string;
  /** 0–1. Kartta nokta çapına çevriliyor. */
  readonly weight: number;
}

/**
 * Kartta en fazla kaç nokta.
 *
 * Altı, kalabalıkla sessizlik arasındaki sınır: daha fazlası imza satırını bir
 * grafiğe çeviriyor, daha azı kompozisyonu eksik anlatıyor.
 */
export const SHARE_DOT_LIMIT = 6;

/** Parfümün notaları: ağırlıktan hafife, en fazla altı. */
export function perfumeDots(perfume: Perfume): readonly ShareDot[] {
  return [...perfume.notes]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, SHARE_DOT_LIMIT)
    .map((entry) => ({ color: noteColor(getNote(entry.noteId)), weight: entry.weight }));
}

/**
 * Notayı taşıyan parfümlerin renkleri — yörüngenin durağan hâli.
 *
 * Taşıyıcısı olmayan nota boş liste veriyor ve bu bir hata değil: palet 136
 * malzemelik, seçki 52 parfümlük. Gerekçe `note-marks.ts`te yazılı.
 */
export function noteDots(note: Note, perfumes: readonly Perfume[]): readonly ShareDot[] {
  return perfumes
    .filter((perfume) => perfume.notes.some((entry) => entry.noteId === note.id))
    .slice(0, SHARE_DOT_LIMIT)
    .map((perfume) => ({
      color: getFamily(dominantFamily(familyVector(perfume))).color,
      weight: perfume.notes.find((entry) => entry.noteId === note.id)?.weight ?? 0.5,
    }));
}

/* ─────────────────────────  Haritanın kendisi  ───────────────────────── */

export interface MapDot {
  /** Kutunun sol/üst kenarına göre piksel — Satori mutlak konum istiyor. */
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly color: string;
  readonly opacity: number;
}

/** Kartta noktanın en küçük ve en büyük çapı (px). */
const DOT_MIN = 5;
const DOT_RANGE = 7;

/** Derinlikten gelen opaklık — uzaktakiler sönük, tıpkı sitede olduğu gibi. */
const ALPHA_MIN = 0.45;
const ALPHA_RANGE = 0.55;

/**
 * Koku Uzayı'nın kendisi, paylaşım kartına sığacak biçimde.
 *
 * Kart bugüne kadar düz siyah bir yazıydı ve sitenin bütün cazibesi olan
 * haritayı hiç göstermiyordu — oysa Reddit'te, HN'de ve X'te tıklamayı
 * belirleyen şey o önizleme.
 *
 * ⚠️ **İki eksen AYNI çarpanla ölçekleniyor.** `projectToSpace` bunu zaten
 * kendi içinde yapıyor ve gerekçesi orada yazılı: ayrı ayrı normalize
 * edilirse harita gerilir ve uzaklıklar yalan söyler. Kart dikdörtgen
 * (1200×630) ama nokta bulutu kare kalmak zorunda; bu yüzden kutu **kare**
 * veriliyor ve kartın düzeni ona göre kuruluyor, tersi değil.
 *
 * Tuval yok: Satori yalnız kutu, daire ve yazı biliyor. Nokta = yuvarlatılmış
 * bir `div`; kompozisyon kartındaki çubuk kararının aynısı.
 */
export function mapDots(perfumes: readonly Perfume[], box: number): readonly MapDot[] {
  const points = projectToSpace(perfumes);
  const byId = new Map(perfumes.map((perfume) => [perfume.id, perfume]));

  /* En büyük nokta kenardan taşmasın diye kenar payı. */
  const pad = DOT_MIN + DOT_RANGE;
  const span = box - pad * 2;

  return points.map((point) => {
    const perfume = byId.get(point.perfumeId);
    const color = perfume
      ? getFamily(dominantFamily(familyVector(perfume))).color
      : '#ffffff';

    return {
      /* [-1, 1] → [0, span]; ikisi de aynı `span` ile, gerilme yok. */
      x: pad + ((point.x + 1) / 2) * span,
      y: pad + ((1 - point.y) / 2) * span,
      size: DOT_MIN + point.depth * DOT_RANGE,
      color,
      opacity: ALPHA_MIN + point.depth * ALPHA_RANGE,
    };
  });
}
