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

/**
 * Uçuculuk bandı — notanın hangi dosyada durduğu.
 *
 * Ansiklopedi dizini notaları banda göre grupluyor ve nota sayfası bandı
 * yazıyor. Bilgi zaten dosya bölünmesinde vardı ama `NOTES` düzleştiği anda
 * kayboluyordu; burada geri veriliyor.
 *
 * `volatility`den yeniden türetilmiyor ve bu bilinçli: eşik (`peakMinutes < 15`)
 * bir yorum, dosya ayrımı ise verilmiş bir karar. İkisi bir gün ayrışırsa dizin
 * dosyalarla çelişen bir gruplama gösterirdi.
 */
export type NoteBand = 'top' | 'heart' | 'base';

const BAND_BY_ID = new Map<string, NoteBand>([
  ...TOP_NOTES.map((note) => [note.id, 'top'] as const),
  ...HEART_NOTES.map((note) => [note.id, 'heart'] as const),
  ...BASE_NOTES.map((note) => [note.id, 'base'] as const),
]);

export function noteBand(id: string): NoteBand {
  const band = BAND_BY_ID.get(id);
  if (!band) {
    throw new Error(`Bilinmeyen nota: ${id}`);
  }
  return band;
}

/*
  Bandın ekranda görünen adı burada DEĞİL, `i18n/en.ts`teki `bands` içinde.

  Bir zamanlar burada duruyordu ve yanlış yerdeydi: bu klasör iki dilli veri
  tutuyor, o ise tek dilli ekran metniydi. Fark önemli çünkü kaçak Türkçe
  avcısı `src/data/**`ı muaf tutuyor — orada kalsaydı taramadan görünmeden
  geçerdi. Kural: ekran metni veri klasöründe durmaz.
*/

/** Bandlar, dizinde göründükleri sırayla. */
export const BANDS: readonly { readonly band: NoteBand; readonly notes: readonly Note[] }[] = [
  { band: 'top', notes: TOP_NOTES },
  { band: 'heart', notes: HEART_NOTES },
  { band: 'base', notes: BASE_NOTES },
];

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
