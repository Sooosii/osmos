import Link from 'next/link';
import { BANDS, BAND_LABEL, NOTES } from '@/data/notes';
import { getFamily } from '@/data/families';
import type { Note } from '@/data/types';

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
  title: `Notalar — ${NOTES.length} malzeme · OSMOS`,
  description: 'Koku uzayını besleyen nota veritabanı, uçuculuk bandına göre.',
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
  return (
    <main className="min-h-dvh bg-[#050507] text-white">
      <div className="relative mx-auto max-w-3xl px-6 pb-32 sm:px-10">
        <nav className="pt-10">
          <Link
            href="/"
            className="text-xs tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
          >
            OSMOS
          </Link>
        </nav>

        <header className="pt-14 sm:pt-20">
          <h1 className="text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
            Notalar
          </h1>
          <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-white/50">
            {NOTES.length} malzeme, uçuculuk bandına göre. Renk baskın koku ailesi —
            uzaydaki noktalarla aynı palet.
          </p>
        </header>

        {BANDS.map(({ band, notes }) => (
          <section key={band} className="pt-16">
            <h2 className="mb-6 text-xs tracking-[0.3em] text-white/30">
              {BAND_LABEL[band]}
              <span className="ml-3 text-white/20">{notes.length}</span>
            </h2>

            <ul className="grid grid-cols-1 gap-x-8 gap-y-px sm:grid-cols-2">
              {notes.map((note) => (
                <li key={note.id}>
                  <Link
                    href={`/nota/${note.id}`}
                    className="group flex items-baseline gap-3 py-2 transition-colors"
                  >
                    <span
                      aria-hidden="true"
                      className="size-1.5 shrink-0 translate-y-[-2px] rounded-full opacity-60 transition-opacity group-hover:opacity-100"
                      style={{ backgroundColor: noteColor(note) }}
                    />
                    <span className="text-sm font-light text-white/60 transition-colors group-hover:text-white">
                      {note.name.tr}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
