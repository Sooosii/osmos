import type { Perfume } from './types';
import { hasNote } from './notes';
import { CURATED_A } from './perfume-sets/curated-a';
import { CURATED_B } from './perfume-sets/curated-b';
import { CURATED_C } from './perfume-sets/curated-c';
import { CURATED_D } from './perfume-sets/curated-d';
import { CURATED_E } from './perfume-sets/curated-e';
import { CURATED_F } from './perfume-sets/curated-f';
import { FILLERS } from './perfume-sets/fillers';

/**
 * Parfüm veritabanı — toplayıcı.
 *
 * Notalarda olduğu gibi veri gruplara bölündü (`perfume-sets/`); 44 parfüm tek
 * dosyada 800 satırı aşıyor. Bu modül onları birleştirip tek giriş noktası
 * sunuyor, böylece `@/data/perfumes` yolu ve `PERFUMES` / `getPerfume`
 * sözleşmesi değişmiyor.
 */
export const PERFUMES: readonly Perfume[] = [
  ...CURATED_A,
  ...CURATED_B,
  ...CURATED_C,
  ...CURATED_D,
  ...CURATED_E,
  ...CURATED_F,
  ...FILLERS,
];

const PERFUME_BY_ID = new Map<string, Perfume>();
for (const perfume of PERFUMES) {
  // Aynı kimlik iki grupta birden tanımlanırsa sessizce biri kazanır ve uzayda
  // bir nokta eksik çıkar. Erken ve gürültülü patlamak daha iyi.
  if (PERFUME_BY_ID.has(perfume.id)) {
    throw new Error(`Parfüm kimliği iki kez tanımlanmış: ${perfume.id}`);
  }
  PERFUME_BY_ID.set(perfume.id, perfume);

  // Nota kimliği yanlış yazılırsa `getNote` ancak o parfüm ekrana geldiğinde
  // patlıyordu — 44 parfümde bir harf hatası fark edilmeden kalabilir.
  // Yükleme anında hepsi birden denetleniyor.
  for (const entry of perfume.notes) {
    if (!hasNote(entry.noteId)) {
      throw new Error(`${perfume.id} bilinmeyen notaya işaret ediyor: ${entry.noteId}`);
    }
  }
}

export function getPerfume(id: string): Perfume {
  const perfume = PERFUME_BY_ID.get(id);
  if (!perfume) {
    throw new Error(`Bilinmeyen parfüm: ${id}`);
  }
  return perfume;
}
