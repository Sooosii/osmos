import type { Note, Perfume } from '@/data/types';
import { dominantFamily, getFamily } from '@/data/families';
import { say } from '@/i18n/dict';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/locale';
import { familyVector, projectToSpace } from './similarity';

/**
 * Bir notayı içeren parfümlerin çizilmeye hazır hâli.
 *
 * `space-marks.ts`in sözleşmesi burada da geçerli ve aynı sebeple: bu modül
 * **sunucuda** çalışıyor. `projectToSpace` 52×52'lik bir kosinüs matrisi kurup
 * üç özvektör çıkarıyor; tarayıcıya inen şey yalnızca sonuç — ad, marka, renk,
 * ağırlık, derinlik. Nota veritabanı ve benzerlik motoru istemci paketine hiç
 * girmiyor.
 *
 * Renk uzaydaki noktanın renginden türetilmiyor, **aynı zincirden geliyor**:
 * `familyVector → dominantFamily → getFamily().color`. İkinci bir kaynak
 * açsaydık harita bir renk, nota sayfası başka bir renk gösterebilirdi.
 */

/** Notayı içeren bir parfüm — yörüngeye inen tek biçim. */
export interface NoteMark {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  /** Notanın bu parfümdeki ağırlığı, 0–1. Yörüngede yarıçapı belirliyor. */
  readonly weight: number;
  /** Derinlik katmanı 0–1; yörüngede yüksekliği belirliyor. */
  readonly depth: number;
  /** Baskın koku ailesinin rengi. */
  readonly color: string;
}

/** Nota sayfasının ihtiyaç duyduğu her şey, tek nesnede. */
export interface NotePage {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Notanın kendi baskın ailesinin rengi — merkezdeki diskin rengi. */
  readonly color: string;
  /** Notayı içeren parfümler, ağırlıktan hafife sıralı. */
  readonly carriers: readonly NoteMark[];
}

/**
 * Notanın baskın ailesi — parfümdekiyle aynı mantık, tek farkla.
 *
 * `dominantFamily` bir vektör bekliyor ve parfüm için `familyVector` onu
 * notaların ağırlıklı ortalamasından kuruyor. Nota tek başınayken ortalanacak
 * bir şey yok: `families` zaten o vektörün ta kendisi.
 */
export function noteColor(note: Note): string {
  const weights = Object.entries(note.families) as readonly [string, number][];
  if (weights.length === 0) {
    // Ailesiz nota veride yok, ama olsaydı sessizce siyah çizilmesindense
    // gürültülü patlamak daha iyi — `notes.ts`in kimlik denetimiyle aynı ilke.
    throw new Error(`Ailesi olmayan nota: ${note.id}`);
  }

  let bestFamily = weights[0][0];
  let bestWeight = weights[0][1];
  for (const [family, weight] of weights) {
    if (weight > bestWeight) {
      bestFamily = family;
      bestWeight = weight;
    }
  }

  return getFamily(bestFamily as Parameters<typeof getFamily>[0]).color;
}

/**
 * Paletin kaç notasının seçkide gerçekten geçtiği.
 *
 * Nota dizininin çerçevesinde duran sayı. Sayfanın zaten savunduğu şeyi rakama
 * çeviriyor: palet 136 malzeme, seçki 52 parfüm ve ikisi aynı şey değil.
 *
 * **Kesişim sayılıyor, `Set` boyutu değil.** Parfüm verisi palette olmayan bir
 * `noteId`ye işaret etseydi kimlikleri saymak ekrana 136'yı aşan bir sayı
 * yazdırırdı — çerçevede uydurma sayı olmaz (`ScreenFrame.tsx`).
 */
export function countUsedNotes(notes: readonly Note[], perfumes: readonly Perfume[]): number {
  const used = new Set<string>();
  for (const perfume of perfumes) {
    for (const entry of perfume.notes) {
      used.add(entry.noteId);
    }
  }

  let count = 0;
  for (const note of notes) {
    if (used.has(note.id)) count += 1;
  }
  return count;
}

/**
 * Nota sayfasını kurar.
 *
 * Bir notayı hiçbir parfümün içermemesi **hata değil**: nota veritabanı 136
 * malzemelik bir palet, parfüm listesi ise 52 parfümlük bir seçki. Paletteki bir
 * rengin henüz kullanılmamış olması normal ve sayfa o durumda da açılıyor —
 * yörünge boş, tarif yerinde. Ansiklopedi bir nota sözlüğü; kullanım listesi değil.
 */
export function buildNotePage(
  note: Note,
  perfumes: readonly Perfume[],
  locale: Locale = DEFAULT_LOCALE,
): NotePage {
  const points = projectToSpace(perfumes);
  const depthById = new Map(points.map((point) => [point.perfumeId, point.depth]));

  const carriers: NoteMark[] = [];
  for (const perfume of perfumes) {
    const entry = perfume.notes.find((candidate) => candidate.noteId === note.id);
    if (!entry) continue;

    const depth = depthById.get(perfume.id);
    if (depth === undefined) {
      throw new Error(`Uzayda yeri hesaplanmamış parfüm: ${perfume.id}`);
    }

    carriers.push({
      id: perfume.id,
      name: perfume.name,
      brand: perfume.brand,
      weight: entry.weight,
      depth,
      color: getFamily(dominantFamily(familyVector(perfume))).color,
    });
  }

  carriers.sort((a, b) => b.weight - a.weight);

  return {
    id: note.id,
    name: say(note.name, locale),
    description: say(note.description, locale),
    color: noteColor(note),
    carriers,
  };
}
