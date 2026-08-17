import { PERFUMES } from '@/data/perfumes';
import type { PerfumeNote } from '@/data/types';
import { similarity } from './similarity';
import { asPerfume, compositionError, type CompositionMatch } from './composition';

/*
  ⚠️ **Bu fonksiyon `composition.ts`ten AYRILDI ve geri konmamalı.**

  Tek sebebi katalog ithali: `composition.ts`i `Studio` (bir `'use client'`
  bileşeni) `asPerfume` ve `MAX_COMPOSITION_NOTES` için ithal ediyor. Modül
  `@/data/perfumes`e dokunduğu sürece o iki küçük şey için **bütün katalog**
  tarayıcı paketine giriyordu. Ölçüldü (2026-08-17): kiracı derlemesinde
  OSMOS'un 154 kaydı, elle yazılmış küratör cümleleriyle, müşterinin alan
  adından herkese açık iniyordu.

  Buradaki tek kullanıcı sunucu: kompozisyon sayfası ve paylaşım kartı.
  `kiraci-sizinti.test.ts` ayrımı tutuyor.
*/

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
