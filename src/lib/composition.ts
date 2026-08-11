import { hasNote } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import type { Perfume, PerfumeNote } from '@/data/types';
import { similarity } from './similarity';

/**
 * Kendi kompozisyonun — Patron'un asıl sebebi.
 *
 * Sahip süsleme fikirlerini reddetti (*"bunlar çok basit kaçıyor, ben
 * almazdım"*) ve haklıydı. Satılan şey artık bir süs değil bir **araç**:
 * 136 notadan kendi parfümünü kuruyorsun, site onun evrim eğrisini çiziyor,
 * 52'nin arasına yerleştiriyor ve en çok neye benzediğini söylüyor.
 *
 * ⚠️ **Yeni bir motor YAZILMADI ve yazılmayacak.** Bütün numara şu tek
 * satırda: taslak `Perfume` şeklini aldığı an `similarity`, `evolutionAt` ve
 * `projectToSpace` olduğu gibi çalışıyor. İkinci bir benzerlik hesabı açmak,
 * kullanıcının parfümünü sitenin 52'sinden farklı bir ölçüyle değerlendirmek
 * olurdu — ve karşılaştırmanın bütün anlamı aynı ölçüde.
 *
 * ⚠️ İçerik satılmıyor: 52 parfüm ve ansiklopedi herkese açık kalıyor.
 * Satılan, kişinin **kendi ürettiği** şeyin okunması.
 */

export const MIN_COMPOSITION_NOTES = 2;
/**
 * Üst sınır 12: gerçek parfümlerin ortalaması 9.4 nota ve en kalabalığı bu
 * bandın içinde. Daha fazlası hem eğriyi çamura çeviriyor hem de "her notayı
 * seç, en yakın çıksın" oyununu davet ediyor.
 */
export const MAX_COMPOSITION_NOTES = 12;

export type CompositionError = 'tooFew' | 'tooMany' | 'duplicate' | 'unknown' | 'weight';

/** Kuralı çiğneyen ilk şey, ya da `null`. */
export function compositionError(notes: readonly PerfumeNote[]): CompositionError | null {
  if (notes.length < MIN_COMPOSITION_NOTES) return 'tooFew';
  if (notes.length > MAX_COMPOSITION_NOTES) return 'tooMany';
  if (new Set(notes.map((note) => note.noteId)).size !== notes.length) return 'duplicate';
  if (notes.some((note) => !hasNote(note.noteId))) return 'unknown';
  if (notes.some((note) => !(note.weight > 0 && note.weight <= 1))) return 'weight';
  return null;
}

/**
 * Taslağı motorun anladığı şekle sokar.
 *
 * `id`, `brand` ve `year` motorun okumadığı alanlar ama tip zorunlu kılıyor;
 * uydurma değerler bilerek göze batıyor ki bir gün ekrana sızarsa fark
 * edilsin. `curated: false` — bu bir küratör seçkisi değil.
 */
export function asPerfume(notes: readonly PerfumeNote[], name: string): Perfume {
  return {
    id: '__taslak__',
    name,
    brand: '—',
    year: new Date().getFullYear(),
    curated: false,
    notes: notes.filter((note) => hasNote(note.noteId)),
  };
}

export interface CompositionMatch {
  readonly perfumeId: string;
  /** Kosinüs benzerliği, 0–1. */
  readonly score: number;
}

/**
 * Kompozisyona en çok benzeyen parfümler — güçlüden zayıfa.
 *
 * Geçersiz kompozisyonda **boş dönüyor, patlamıyor**: ekran kullanıcı nota
 * eklerken her tuşta bunu çağırıyor ve yarım bir kompozisyon normal bir ara
 * durum, hata değil.
 */
export function nearestToComposition(
  notes: readonly PerfumeNote[],
  limit: number,
): readonly CompositionMatch[] {
  if (compositionError(notes) !== null) return [];

  const draft = asPerfume(notes, 'taslak');

  return PERFUMES.map((perfume) => ({
    perfumeId: perfume.id,
    score: similarity(draft, perfume),
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
