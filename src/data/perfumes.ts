import type { Perfume } from './types';
import { hasNote } from './notes';
import { CURATED_A } from './perfume-sets/curated-a';
import { CURATED_B } from './perfume-sets/curated-b';
import { CURATED_C } from './perfume-sets/curated-c';
import { CURATED_D } from './perfume-sets/curated-d';
import { CURATED_E } from './perfume-sets/curated-e';
import { CURATED_F } from './perfume-sets/curated-f';
import { FILLERS } from './perfume-sets/fillers';
import { SPACE_2_PERFUMES } from './perfume-sets/space-2';
import {
  buildPerfumeSpaces,
  findPerfumeSpaceId,
  type PerfumeSpace,
} from './perfume-spaces';

/**
 * Parfüm veritabanı — toplayıcı.
 *
 * Notalarda olduğu gibi veri gruplara bölündü (`perfume-sets/`); 52 parfüm tek
 * dosyada 800 satırı aşıyor. Bu modül onları birleştirip tek giriş noktası
 * sunuyor, böylece `@/data/perfumes` yolu ve `PERFUMES` / `getPerfume`
 * sözleşmesi değişmiyor.
 */
const LEGACY_PERFUMES: readonly Perfume[] = [
  ...CURATED_A,
  ...CURATED_B,
  ...CURATED_C,
  ...CURATED_D,
  ...CURATED_E,
  ...CURATED_F,
  ...FILLERS,
];

export const PERFUME_SPACES = buildPerfumeSpaces(LEGACY_PERFUMES, SPACE_2_PERFUMES);
export const PERFUMES: readonly Perfume[] = PERFUME_SPACES.flatMap((space) => space.perfumes);

const PERFUME_BY_ID = new Map<string, Perfume>();
for (const perfume of PERFUMES) {
  // Aynı kimlik iki grupta birden tanımlanırsa sessizce biri kazanır ve uzayda
  // bir nokta eksik çıkar. Erken ve gürültülü patlamak daha iyi.
  if (PERFUME_BY_ID.has(perfume.id)) {
    throw new Error(`Parfüm kimliği iki kez tanımlanmış: ${perfume.id}`);
  }
  PERFUME_BY_ID.set(perfume.id, perfume);

  // Nota kimliği yanlış yazılırsa `getNote` ancak o parfüm ekrana geldiğinde
  // patlıyordu — 52 parfümde bir harf hatası fark edilmeden kalabilir.
  // Yükleme anında hepsi birden denetleniyor.
  for (const entry of perfume.notes) {
    if (!hasNote(entry.noteId)) {
      throw new Error(`${perfume.id} bilinmeyen notaya işaret ediyor: ${entry.noteId}`);
    }
  }
}

/**
 * Kimlik veride var mı — `hasNote`in parfüm karşılığı.
 *
 * Kullanıcıdan gelen kimliği doğrulayan her kapı (Top 4, raflar) buradan
 * geçiyor. Ayrı ayrı `PERFUMES.some(...)` yazmak hem üç kopya hem her
 * çağrıda 52'lik bir tarama demekti; harita zaten kurulu.
 */
export function hasPerfume(id: string): boolean {
  return PERFUME_BY_ID.has(id);
}

export function getPerfume(id: string): Perfume {
  const perfume = PERFUME_BY_ID.get(id);
  if (!perfume) {
    throw new Error(`Bilinmeyen parfüm: ${id}`);
  }
  return perfume;
}

export function getPerfumeSpaceId(id: string): number {
  return getPerfumeSpace(id).id;
}

export function getPerfumeSpace(id: string): PerfumeSpace {
  const spaceId = findPerfumeSpaceId(PERFUME_SPACES, id);
  const space = PERFUME_SPACES.find((candidate) => candidate.id === spaceId);
  if (!space) {
    throw new Error(`Bilinmeyen parfüm: ${id}`);
  }
  return space;
}
