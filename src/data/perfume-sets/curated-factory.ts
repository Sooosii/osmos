import type { Perfume, PerfumeNote } from '../types';

export type NoteSpec = readonly [
  noteId: string,
  tier: PerfumeNote['tier'],
  weight: number,
];

export interface CuratedPerfumeSpec {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  readonly year: number;
  readonly perfumer?: string;
  readonly aliases?: readonly string[];
  readonly line: readonly [en: string, tr: string];
  readonly notes: readonly NoteSpec[];
}

/**
 * Expansions are deliberately kept as compact editorial rows. This helper is
 * the single place that expands them into the public, immutable Perfume shape.
 */
export function defineCuratedPerfumes(
  specs: readonly CuratedPerfumeSpec[],
): readonly Perfume[] {
  return specs.map((spec) => ({
    id: spec.id,
    name: spec.name,
    brand: spec.brand,
    year: spec.year,
    ...(spec.perfumer ? { perfumer: spec.perfumer } : {}),
    ...(spec.aliases ? { aliases: spec.aliases } : {}),
    curated: true,
    line: { en: spec.line[0], tr: spec.line[1] },
    notes: spec.notes.map(([noteId, tier, weight]) => ({ noteId, tier, weight })),
  }));
}
