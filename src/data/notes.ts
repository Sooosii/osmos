import type { Note } from './types';
import { TOP_NOTES } from './note-sets/top';
import { HEART_NOTES } from './note-sets/heart';
import { BASE_NOTES } from './note-sets/base';

/**
 * Nota veritabanı — toplayıcı.
 *
 * Notalar uçuculuk bandına göre üç dosyaya bölündü (`note-sets/`); tek dosyada
 * 1000 satırı aşıyordu. Bu modül onları birleştirip tek giriş noktası sunuyor,
 * böylece `@/data/notes` yolu ve `getNote` / `hasNote` sözleşmesi değişmiyor.
 *
 * Her notanın üç özelliği farklı bir gösterimi sürüyor — ayrıntı: types.ts
 */
export const NOTES: readonly Note[] = [...TOP_NOTES, ...HEART_NOTES, ...BASE_NOTES];

const NOTE_BY_ID = new Map<string, Note>();
for (const note of NOTES) {
  // Aynı kimlik iki dosyada birden tanımlanırsa sessizce biri kazanır ve
  // parfüm verisi yanlış eğriyi çeker. Erken ve gürültülü patlamak daha iyi.
  if (NOTE_BY_ID.has(note.id)) {
    throw new Error(`Nota kimliği iki kez tanımlanmış: ${note.id}`);
  }
  NOTE_BY_ID.set(note.id, note);
}

export function getNote(id: string): Note {
  const note = NOTE_BY_ID.get(id);
  if (!note) {
    throw new Error(`Bilinmeyen nota: ${id}`);
  }
  return note;
}

export function hasNote(id: string): boolean {
  return NOTE_BY_ID.has(id);
}
