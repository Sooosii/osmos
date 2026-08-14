import type { Locale } from '@/i18n/locale';

export interface PerfumeSearchNote {
  readonly id: string;
  readonly en: string;
  readonly tr: string;
}

export interface PerfumeSearchDocument {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  readonly aliases: readonly string[];
  readonly notes: readonly PerfumeSearchNote[];
}

export interface PerfumeSearchResult {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  readonly matchingNotes: readonly string[];
}

const COMBINING_MARKS = /[\u0300-\u036f]/g;
const NON_ALPHANUMERIC = /[^a-z0-9]+/g;

/** The same search alphabet is used by the API data, English, and Turkish UI. */
export function normalizeSearchText(value: string): string {
  return value
    .replaceAll('\u0131', 'i')
    .replaceAll('\u0130', 'I')
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

interface RankedResult extends PerfumeSearchResult {
  readonly rank: number;
  readonly order: number;
}

function rankDocument(
  document: PerfumeSearchDocument,
  query: string,
  tokens: readonly string[],
  locale: Locale,
  order: number,
): RankedResult | null {
  const name = normalizeSearchText(document.name);
  const brand = normalizeSearchText(document.brand);
  const aliases = document.aliases.map(normalizeSearchText);
  const noteTexts = document.notes.map((note) => ({
    note,
    values: [normalizeSearchText(note.en), normalizeSearchText(note['tr'])],
  }));
  const fields = [name, brand, ...aliases, ...noteTexts.flatMap(({ values }) => values)];

  if (!tokens.every((token) => fields.some((field) => field.includes(token)))) return null;

  let rank = 6;
  if (name === query || aliases.some((alias) => alias === query)) rank = 0;
  else if (name.startsWith(query) || aliases.some((alias) => alias.startsWith(query))) rank = 1;
  else if (brand === query || brand.startsWith(query)) rank = 2;
  else if (name.includes(query) || aliases.some((alias) => alias.includes(query))) rank = 3;
  else if (brand.includes(query)) rank = 4;
  else if (noteTexts.some(({ values }) => values.some((value) => value.includes(query)))) rank = 5;

  const matchingNotes = noteTexts
    .filter(({ values }) => tokens.some((token) => values.some((value) => value.includes(token))))
    .slice(0, 2)
    .map(({ note }) => note[locale]);

  return {
    id: document.id,
    name: document.name,
    brand: document.brand,
    matchingNotes,
    rank,
    order,
  };
}

export function searchPerfumes(
  documents: readonly PerfumeSearchDocument[],
  rawQuery: string,
  locale: Locale,
  limit = 8,
): readonly PerfumeSearchResult[] {
  const query = normalizeSearchText(rawQuery);
  if (!query || limit <= 0) return [];

  const tokens = query.split(' ');
  return documents
    .map((document, order) => rankDocument(document, query, tokens, locale, order))
    .filter((result): result is RankedResult => result !== null)
    .sort((left, right) => left.rank - right.rank || left.order - right.order)
    .slice(0, limit)
    .map((result) => ({
      id: result.id,
      name: result.name,
      brand: result.brand,
      matchingNotes: result.matchingNotes,
    }));
}
