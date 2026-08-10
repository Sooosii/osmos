import Link from 'next/link';
import { BANDS, NOTES } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import { countUsedNotes, noteColor } from '@/lib/note-marks';
import { ScreenFrame, type FrameReadout } from '@/components/ScreenFrame';
import { dictFor, getDict, localeFor, say } from '@/i18n/dict';
import { withLocale } from '@/i18n/locale';
import { languageAlternates } from '@/lib/site-url';

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

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const t = dictFor((await params).lang);
  return {
    title: t.notesIndex.title(NOTES.length),
    description: t.notesIndex.description,
    alternates: { languages: languageAlternates('/notes') },
  };
}

/*
  Notanın baskın aile rengi `note-marks.ts`ten geliyor.

  Burada bir kopyası duruyordu ve mantık aynıydı; tek fark aslında ailesiz
  notaya karşı gürültülü bir hata olması, kopyada olmamasıydı. İki kaynak,
  eşitlik durumunda bir gün ayrışabilecek iki karar demekti — renk zincirinin
  tek olması sitenin baştan beri verdiği söz.
*/

export default async function NotesIndex({ params }: { params: Promise<{ lang: string }> }) {
  const locale = localeFor((await params).lang);
  const t = getDict(locale);

  /*
    Çerçevedeki her sayı gerçek (`ScreenFrame.tsx`). Üst şeritte paletin kendi
    yapısı — bant başına kaç malzeme; alt şeritte paletin büyüklüğü ve ne
    kadarının seçkide gerçekten geçtiği.

    Sağ alttaki sayı sayfanın başka hiçbir yerinde yazmıyor ve sayfanın aşağıda
    savunduğu şeyi rakama çeviriyor: palet ile kullanım listesi aynı şey değil.
  */
  const readouts: readonly FrameReadout[] = BANDS.map(({ band, notes }) => ({
    label: t.bands[band],
    value: String(notes.length),
  }));

  const used = countUsedNotes(NOTES, PERFUMES);

  return (
    <main className="min-h-dvh bg-[#050507] text-white">
      <ScreenFrame
        nav={
          <nav className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-white/50">
            <Link href={withLocale(locale, '/')} className="transition-colors hover:text-white">
              {t.site.name}
            </Link>
          </nav>
        }
        readouts={readouts}
        status={t.notesIndex.status(NOTES.length)}
        tail={t.notesIndex.tail(used)}
      >
        <div className="relative mx-auto max-w-3xl px-6 sm:px-10">
          <header className="pt-8 sm:pt-14">
            <h1 className="text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
              {t.notesIndex.heading}
            </h1>
            <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-white/50">
              {t.notesIndex.lede(NOTES.length)}
            </p>
          </header>

          {BANDS.map(({ band, notes }) => (
            <section key={band} className="pt-16">
              <h2 className="mb-6 text-xs tracking-[0.3em] text-white/50">
                {t.bands[band]}
                <span className="ml-3 text-white/50">{notes.length}</span>
              </h2>

              <ul className="grid grid-cols-1 gap-x-8 gap-y-px sm:grid-cols-2">
                {notes.map((note) => (
                  <li key={note.id}>
                    <Link
                      href={withLocale(locale, `/note/${note.id}`)}
                      /*
                        ⚠️ **Önden getirme burada kapalı, ölçülerek.** Next
                        görüş alanına giren her bağlantıyı önden getiriyor ve
                        bu dizinde 136 bağlantı var: sayfa açılışında **131
                        istek / 165 KB** fazladan iniyordu. Ölçüm (üretim
                        derlemesi): 421 KB / 154 istek → **269 KB / 32 istek**.
                        Ziyaretçi buradan bir
                        ya da iki notaya giriyor; kalan 134'ün verisi boşuna
                        indiriliyordu.

                        Bedeli: ilk tıklamada sayfa artık hazır beklemiyor,
                        o an getiriliyor. Nota sayfaları durağan HTML olduğu
                        için bu tek bir istek. Geri istenirse tek prop.
                      */
                      prefetch={false}
                      className="group flex items-baseline gap-3 py-2 transition-colors"
                    >
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 translate-y-[-2px] rounded-full opacity-60 transition-opacity group-hover:opacity-100"
                        style={{ backgroundColor: noteColor(note) }}
                      />
                      <span className="text-sm font-light text-white/60 transition-colors group-hover:text-white">
                        {say(note.name, locale)}
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
