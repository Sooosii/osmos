import Link from 'next/link';
import { BANDS, NOTES } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import { getFamily } from '@/data/families';
import { countUsedNotes } from '@/lib/note-marks';
import { ScreenFrame, type FrameReadout } from '@/components/ScreenFrame';
import type { Note } from '@/data/types';
import { EN } from '@/i18n/en';

/**
 * Nota dizini — ansiklopedinin ikinci kapısı.
 *
 * Birinci kapı evrim imzasındaki etiketler: merak orada doğuyor ("bu davana da
 * neymiş"). Ama tek kapı bırakılsaydı bir notaya ulaşmak için onu içeren parfümü
 * önceden bulmak gerekirdi ve 136 tarifin çoğu pratikte hiç görülmezdi — tek
 * parfümde geçen bir nota neredeyse ulaşılamaz olurdu. Karar gerekçesi
 * `docs/superpowers/specs/2026-08-05-nota-ansiklopedisi-design.md` ②'de.
 *
 * Gruplama uçuculuk bandına göre, alfabetik değil. Bant verilmiş bir karar
 * (`note-sets/` dosya ayrımı) ve paletin gerçek yapısını gösteriyor: açılışı
 * kuran uçucular, ortayı tutan kalp, saatlerce duran dip.
 *
 * Sunucu bileşeni; istemci JavaScript'i yok.
 */

export const metadata = {
  title: EN.notesIndex.title(NOTES.length),
  description: EN.notesIndex.description,
};

/** Notanın baskın ailesi — `note-marks.ts`teki `noteColor` ile aynı mantık. */
function noteColor(note: Note): string {
  const weights = Object.entries(note.families) as readonly [string, number][];
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

export default function NotesIndex() {
  /*
    Çerçevedeki her sayı gerçek (`ScreenFrame.tsx`). Üst şeritte paletin kendi
    yapısı — bant başına kaç malzeme; alt şeritte paletin büyüklüğü ve ne
    kadarının seçkide gerçekten geçtiği.

    Sağ alttaki sayı sayfanın başka hiçbir yerinde yazmıyor ve sayfanın aşağıda
    savunduğu şeyi rakama çeviriyor: palet ile kullanım listesi aynı şey değil.
  */
  const readouts: readonly FrameReadout[] = BANDS.map(({ band, notes }) => ({
    label: EN.bands[band],
    value: String(notes.length),
  }));

  const used = countUsedNotes(NOTES, PERFUMES);

  return (
    <main className="min-h-dvh bg-[#050507] text-white">
      <ScreenFrame
        nav={
          <nav className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-white/40">
            <Link href="/" className="transition-colors hover:text-white">
              {EN.site.name}
            </Link>
          </nav>
        }
        readouts={readouts}
        status={EN.notesIndex.status(NOTES.length)}
        tail={EN.notesIndex.tail(used)}
      >
        <div className="relative mx-auto max-w-3xl px-6 sm:px-10">
          <header className="pt-8 sm:pt-14">
            <h1 className="text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
              {EN.notesIndex.heading}
            </h1>
            <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-white/50">
              {EN.notesIndex.lede(NOTES.length)}
            </p>
          </header>

          {BANDS.map(({ band, notes }) => (
            <section key={band} className="pt-16">
              <h2 className="mb-6 text-xs tracking-[0.3em] text-white/30">
                {EN.bands[band]}
                <span className="ml-3 text-white/20">{notes.length}</span>
              </h2>

              <ul className="grid grid-cols-1 gap-x-8 gap-y-px sm:grid-cols-2">
                {notes.map((note) => (
                  <li key={note.id}>
                    <Link
                      href={`/note/${note.id}`}
                      className="group flex items-baseline gap-3 py-2 transition-colors"
                    >
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 translate-y-[-2px] rounded-full opacity-60 transition-opacity group-hover:opacity-100"
                        style={{ backgroundColor: noteColor(note) }}
                      />
                      <span className="text-sm font-light text-white/60 transition-colors group-hover:text-white">
                        {note.name.en}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </ScreenFrame>
    </main>
  );
}
