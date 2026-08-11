import { NOTES, noteBand } from '@/data/notes';
import { say } from '@/i18n/dict';
import { LOCALES, type Locale } from '@/i18n/locale';
import { noteColor } from './note-marks';

/**
 * Kurma aracının nota listesi — istemciye inen tek biçim.
 *
 * ⚠️ **`Note` nesnelerinin tamamı gönderilmiyor** ve bu bilinçli: her nota
 * aile ağırlıkları, uçuculuk sayıları, dört karakter ekseni ve iki dilde
 * tarif taşıyor. 136'sının hepsi inseydi paket birkaç kat büyürdü ve
 * ansiklopedinin verisi tarayıcıya kopyalanmış olurdu. Seçici yalnızca
 * seçtirmek için gerekeni taşıyor: ad, renk, bant ve arama metni.
 *
 * Ağırlık ve katman kullanıcının kararı; uçuculuk hesabı sunucuda kalıyor.
 */
export interface NoteOption {
  readonly id: string;
  readonly name: string;
  /** Baskın ailesinin rengi — seçicideki nokta. */
  readonly color: string;
  /** Uçuculuk bandı; katmanı önermek için. */
  readonly band: 'top' | 'heart' | 'base';
  readonly search: string;
}

export function noteOptions(locale: Locale): readonly NoteOption[] {
  return NOTES.map((note) => {
    const name = say(note.name, locale);
    return {
      id: note.id,
      name,
      /*
        Renk zinciri notanın kendi yardımcısından: `dominantFamily` vektör
        bekliyor ve notanın `families` kaydı zaten o vektör değil —
        dönüşümü `noteColor` yapıyor ve tek yerde duruyor.
      */
      color: noteColor(note),
      band: noteBand(note.id),
      /*
        Arama **iki dili birden** kapsıyor: Türkçe gezen biri "oud" yazabilir,
        İngilizce gezen "incir". Tek dile bakmak, bildiği adı yazan kişiye
        "eşleşme yok" demek olurdu.

        ⚠️ Dil alanları doğrudan okunmuyor, `say` üzerinden geçiliyor: alan
        adlarını modüllere dağıtmak bu depoda bir kez düzeltilmiş bir hataydı
        ve bir sınama onu denetliyor. (Sınama satır satır tarıyor ve yorumları
        atlamıyor — bu cümlede alan adını yazmak bile onu tetikliyordu.)
      */
      search: LOCALES.map((l) => say(note.name, l)).join(' ').toLowerCase(),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}
