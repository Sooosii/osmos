import { getNote } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import type { PerfumeSearchDocument } from '@/lib/perfume-search';
import { say } from '@/i18n/dict';

export const dynamic = 'force-static';

const DOCUMENTS: readonly PerfumeSearchDocument[] = PERFUMES.map((perfume) => ({
  id: perfume.id,
  name: perfume.name,
  brand: perfume.brand,
  aliases: perfume.aliases ?? [],
  notes: perfume.notes.map(({ noteId }) => {
    const note = getNote(noteId);
    return { id: note.id, en: say(note.name, 'en'), tr: say(note.name, 'tr') };
  }),
}));

export function GET(): Response {
  return Response.json(DOCUMENTS, {
    headers: { 'Cache-Control': 'public, max-age=0, s-maxage=31536000, immutable' },
  });
}
