import { PERFUMES, getPerfume } from '@/data/perfumes';
import type { Perfume } from '@/data/types';
import { similarity } from './similarity';

/**
 * "Buna benzeyenler" sayfasının verisi.
 *
 * ⚠️ **Bu sayfa künyedeki komşu bölümünün kopyası DEĞİL ve olmamalı.** Künye
 * beş komşuyu dönen bir takımyıldızda gösteriyor ama *neden* benzediklerini
 * hiç söylemiyor. Aynı listeyi ikinci bir adreste tekrar yayınlamak ince bir
 * kapı sayfası olurdu — arama motoru onu cezalandırır, ve haklı olarak:
 * okura yeni bir şey vermiyor.
 *
 * Bu sayfanın verdiği yeni şey **paylaşılan notalar**: iki parfümün ortak
 * malzemeleri ve her birinde ne kadar durduğu. Sitenin elinde olan, başka
 * hiçbir yerde olmayan bilgi — ve "neden benziyorlar" sorusunun tek dürüst
 * cevabı.
 *
 * Yeni motor yok: `similarity` olduğu gibi çağrılıyor.
 */

/** Sayfada kaç benzer parfüm. Künyedeki beşten fazla — sayfanın var olma sebebi. */
export const SIMILAR_COUNT = 8;

/** Bir satırda kaç ortak nota yazılıyor. */
export const SHARED_NOTE_LIMIT = 5;

export interface SharedNote {
  readonly noteId: string;
  /**
   * İkisinde birden bulunan miktar — `min(bizimki, onunki)`.
   *
   * Ortalama ya da toplam değil: bir parfümde 1.0, ötekinde 0.1 olan bir nota
   * "ortak" sayılırsa liste yalan söyler. Asgari, gerçekten paylaşılanı verir.
   */
  readonly shared: number;
}

export interface SimilarEntry {
  readonly perfumeId: string;
  /** Kosinüs benzerliği, 0–1. */
  readonly score: number;
  /** Ortak notalar, çok paylaşılandan aza. Ortak yoksa boş. */
  readonly shared: readonly SharedNote[];
}

/** İki parfümün ortak notaları, paylaşılan miktara göre sıralı. */
export function sharedNotes(a: Perfume, b: Perfume): readonly SharedNote[] {
  const theirs = new Map(b.notes.map((note) => [note.noteId, note.weight]));

  return a.notes
    .map((note) => ({ noteId: note.noteId, weight: note.weight, other: theirs.get(note.noteId) }))
    .filter((entry) => entry.other !== undefined)
    .map((entry) => ({ noteId: entry.noteId, shared: Math.min(entry.weight, entry.other as number) }))
    .sort((x, y) => y.shared - x.shared)
    .slice(0, SHARED_NOTE_LIMIT);
}

/**
 * Bir parfüme en çok benzeyenler, paylaştıklarıyla birlikte.
 *
 * ⚠️ Ortak notası olmayan komşu **listeden düşmüyor** ve bu bilinçli: benzerlik
 * üç kanaldan geliyor (aile, karakter, nota) ve iki parfüm tek bir malzemeyi
 * paylaşmadan da birbirine benzeyebilir. Onu gizlemek haritanın nasıl
 * çalıştığını yanlış anlatmak olurdu; ekran "ortak notası yok" diyecek ve bu
 * kendi başına ilginç bir bilgi.
 */
export function similarTo(id: string, limit: number = SIMILAR_COUNT): readonly SimilarEntry[] {
  const perfume = getPerfume(id);

  return PERFUMES.filter((candidate) => candidate.id !== id)
    .map((candidate) => ({
      perfumeId: candidate.id,
      score: similarity(perfume, candidate),
      shared: sharedNotes(perfume, candidate),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
