import type { Note, Perfume } from '@/data/types';
import { getNote } from '@/data/notes';
import { dominantFamily, getFamily } from '@/data/families';
import { familyVector } from './similarity';
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
