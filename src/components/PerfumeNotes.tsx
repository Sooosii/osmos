import Link from 'next/link';
import type { Perfume, PyramidTier } from '@/data/types';
import { getNote } from '@/data/notes';
import { getFamily } from '@/data/families';
import { getDict, localeFor, say } from '@/i18n/dict';
import { withLocale } from '@/i18n/locale';

/**
 * Parfümün nota listesi — ansiklopediye açılan kapı.
 *
 * ## Neden imzadaki etiketler link olmadı
 *
 * Ansiklopedi kararı "evrim imzasındaki etiketler tıklansın" diyordu. Uygulamada
 * çıkmadı ve sebebi mekanik: `EvolutionSignature.tsx`teki `labelOpacity`, adları
 * `morph` değerine göre **tamamen sıfırlıyor** — 12 saniyelik turun bir bölümünde
 * bütün nota adları görünmez. Etiket bir `<a>` olsaydı yarı zamanlı bir link
 * doğardı: görünmezken hâlâ tıklanabilir, sekmeyle hâlâ odaklanılabilir.
 *
 * Depo bu tuzağı iki kez yazmış. Kaydıraçlarda `inert` tam bu yüzden var
 * (opaklığı 0 olan bir `<input>` hâlâ odaklanılabiliyordu) ve
 * `SpaceOverlays.tsx:115` "denenmediği sürece görünmez bir hareket" diyor.
 * Nota sayfası da aynı ilkeyi kendi yörüngesi için yazdı: tuvale link konmaz.
 *
 * Duran bir liste üçünü birden çözüyor: her zaman görünür, her zaman tıklanabilir,
 * sekmeyle sıralı. Ayrıca bir eksiği kapatıyor — parfüm sayfası bugüne kadar
 * notalarını hiç listelemiyordu, notalar siteye yalnızca imzadaki etiketler
 * olarak giriyordu.
 *
 * ## Piramide göre gruplu
 *
 * `tier` markanın yayımladığı biçim (`types.ts`) ve okuyucunun beklediği de bu.
 * Eğriyi belirleyen `volatility`, bu alan değil — iki bilgi ayrı ve burada
 * gösterilen markanınki.
 */

const TIER_ORDER: readonly PyramidTier[] = ['top', 'heart', 'base'];

/*
  Katman adları için ayrı bir harita yok: `EN.bands` aynı üç değeri taşıyor ve
  `PyramidTier` ile `NoteBand` aynı dize birleşimi. İkinci bir harita tutmak
  "aynı veriye iki ad takmak" olurdu — bu depoda bir kez şikâyet konusu oldu.
*/

interface PerfumeNotesProps {
  readonly perfume: Perfume;
  /**
   * Sayfanın dili.
   *
   * ⚠️ Prop olarak **dil geçiyor, sözlük değil**: sözlükte işlev var ve bu
   * bileşen bir gün `'use client'` alırsa sözlük prop'u serileştirilemezdi.
   */
  readonly lang: string;
}

export function PerfumeNotes({ perfume, lang }: PerfumeNotesProps) {
  const locale = localeFor(lang);
  const t = getDict(locale);

  return (
    <div className="flex flex-col gap-8">
      {TIER_ORDER.map((tier) => {
        // Ağırlıktan hafife: baskın notayı önce okumak kompozisyonu anlatıyor.
        const entries = perfume.notes
          .filter((entry) => entry.tier === tier)
          .sort((a, b) => b.weight - a.weight);

        // Her parfümde her katman dolu değil — Santal Majuscule'de üst nota yok.
        if (entries.length === 0) return null;

        return (
          <section key={tier}>
            <h3 className="mb-3 text-[0.65rem] tracking-[0.3em] text-white/25">
              {t.bands[tier]}
            </h3>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {entries.map((entry) => {
                const note = getNote(entry.noteId);
                const families = Object.entries(note.families) as readonly [string, number][];
                const dominant = families.reduce((best, current) =>
                  current[1] > best[1] ? current : best,
                );

                return (
                  <li key={entry.noteId}>
                    <Link
                      href={withLocale(locale, `/note/${entry.noteId}`)}
                      className="group flex items-baseline gap-2 py-1"
                    >
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 translate-y-[-2px] rounded-full opacity-60 transition-opacity group-hover:opacity-100"
                        style={{
                          backgroundColor: getFamily(
                            dominant[0] as Parameters<typeof getFamily>[0],
                          ).color,
                        }}
                      />
                      <span className="text-sm font-light text-white/60 transition-colors group-hover:text-white">
                        {say(note.name, locale)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
