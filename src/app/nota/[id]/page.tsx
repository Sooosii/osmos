import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NOTES, BAND_LABEL, hasNote, getNote, noteBand } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import { buildNotePage } from '@/lib/note-marks';
import { NoteOrbit } from '@/components/NoteOrbit';
import { ScreenFrame, type FrameReadout } from '@/components/ScreenFrame';
import { DitherBackdrop } from '@/components/DitherBackdrop';
import { NoteMeasures } from '@/components/NoteMeasures';

/**
 * Nota sayfası — Aşama 3, ansiklopedinin yaprağı.
 *
 * Şemanın en eski sözü buydu (`types.ts`): `description` alanı nota
 * ansiklopedisiyle birlikte dolacaktı. Dört spec boyunca "kapsam dışı" satırında
 * bekledi; 136 notanın 136'sı artık açıklamalı ve burası onların göründüğü yer.
 *
 * Sayfa üç şeyden ibaret ve dördüncüsü bilerek yok:
 *
 *   ① ad + bant + tarif        ← notanın ne olduğu
 *   ② yörünge                  ← "peki bu hangi parfümlerde var?"
 *   ③ geri yollar
 *
 * **Uçuculuk eğrisi ve dört karakter ekseni yok.** İkisi de veride hazırdı ve
 * çizmesi kolaydı, ama ikisi de çubuk-ve-eğri; sahip bunu açıkça reddetti. Eksenler
 * ayrıca ikinci bir tuzak taşıyordu: uzaydaki kaydıraç bir ARAMA aracı, buradaki
 * eksen durgun bir ÖLÇÜM olurdu ve aynı görünselerdi kullanıcı nota sayfasında da
 * arama yaptığını sanırdı. Gerekçenin tamamı
 * `docs/superpowers/specs/2026-08-05-nota-ansiklopedisi-design.md` ④'te.
 *
 * Renk parfüm sayfasındakiyle aynı zincirden geliyor (`note-marks.ts`), ikinci bir
 * kaynak açılmadı — harita, parfüm ve nota aynı rengi göstermek zorunda.
 */

export function generateStaticParams() {
  return NOTES.map((note) => ({ id: note.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasNote(id)) return {};

  const note = getNote(id);
  return {
    title: `${note.name.tr} — nota · OSMOS`,
    description: note.description.tr,
  };
}

/** Dakikayı çerçevenin dar alanına sığan biçime indirger: 90′ değil 1s 30′. */
function minutesLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}′`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}s` : `${hours}s ${rest}′`;
}

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasNote(id)) notFound();

  const note = getNote(id);
  const page = buildNotePage(note, PERFUMES);
  const band = BAND_LABEL[noteBand(id)];

  /*
    Çerçevedeki her sayı gerçek veri; uydurma sayaç yok (`ScreenFrame.tsx`).
    Üçü de notanın kendi fiziği: hangi bantta, ne zaman tepe yapıyor, ne kadar
    sürüyor. Uçuculuk eğrisi hâlâ çizilmiyor — sahip çubuk-ve-eğriyi reddetti —
    ama aynı veri iki sayı olarak burada duruyor.
  */
  const readouts: readonly FrameReadout[] = [
    { label: 'BANT', value: band },
    { label: 'TEPE', value: minutesLabel(note.volatility.peakMinutes) },
    { label: 'ÖMÜR', value: minutesLabel(note.volatility.halfLifeMinutes) },
  ];

  const index = NOTES.findIndex((entry) => entry.id === id) + 1;
  const position = `NOTA ${String(index).padStart(3, '0')}/${NOTES.length}`;
  const usage = `${page.carriers.length}/${PERFUMES.length} PARFÜM`;

  return (
    <main className="min-h-dvh bg-[#050507] text-white">
      {/*
        Arka plan: notanın kendi fiziğinden beslenen hareketli tram alanı.
        Uçuculuk dalganın hızını, ömür yayılmasını sürüyor — her nota sayfası
        farklı görünüyor. Gerekçe ve reddedilen kaynak `dither-field.ts`te.
      */}
      <DitherBackdrop
        color={page.color}
        peakMinutes={note.volatility.peakMinutes}
        halfLifeMinutes={note.volatility.halfLifeMinutes}
      />

      {/*
        Aile rengi tepede ince bir ışık olarak duruyor — parfüm sayfasının deseni.
        Fotoğraf yok; rengin kendisi notanın tek görsel imzası.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[45vh] opacity-20"
        style={{ background: `radial-gradient(60% 100% at 50% 0%, ${page.color}, transparent 70%)` }}
      />

      <ScreenFrame
        nav={
          <nav className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-white/40">
            <Link href="/" className="transition-colors hover:text-white">
              OSMOS
            </Link>
            <span aria-hidden="true" className="text-white/20">
              ·
            </span>
            <Link href="/notalar" className="transition-colors hover:text-white">
              NOTALAR
            </Link>
          </nav>
        }
        readouts={readouts}
        status={position}
        tail={usage}
      >
        <div className="relative mx-auto max-w-3xl px-6 sm:px-10">
          {/* ① — notanın ne olduğu */}
          <header className="pt-8 sm:pt-14">
            <p className="text-sm tracking-[0.2em] text-white/40">{band}</p>
            <h1 className="mt-3 text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
              {page.name}
            </h1>
            <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-white/70 sm:text-lg">
              {page.description}
            </p>
          </header>

          {/*
            ③ — "peki bu nasıl bir şey?"
            Tarif ile taşıyıcı listesinin arasında duruyor: ne → nasıl → nerede.
            Ansiklopedi spec'inin ④. kararını deviriyor; gerekçe `note-measures.ts`te.
          */}
          <NoteMeasures
            volatility={note.volatility}
            character={note.character}
            color={page.color}
          />

          {/* ② — "peki bu hangi parfümlerde var?" */}
          <section className="pt-16">
            <h2 className="mb-8 text-xs tracking-[0.3em] text-white/30">
              {page.carriers.length > 0
                ? `${page.carriers.length} PARFÜMDE`
                : 'HENÜZ HİÇBİR PARFÜMDE'}
            </h2>

            {page.carriers.length > 0 ? (
              <>
                <NoteOrbit carriers={page.carriers} noteName={page.name} noteColor={page.color} />

                {/*
                  Yörüngenin altındaki liste süs değil, tek gerçek yol: yörünge bir
                  tuval ve tuvale link konmaz. Sekmeyle gezen biri de, adı dönmesini
                  beklemek istemeyen biri de buradan gidiyor.
                */}
                <ul className="mt-10 flex flex-col gap-px">
                  {page.carriers.map((carrier) => (
                    <li key={carrier.id}>
                      <Link
                        href={`/parfum/${carrier.id}`}
                        className="group flex items-baseline gap-3 py-2 transition-colors hover:text-white"
                      >
                        <span
                          aria-hidden="true"
                          className="size-1.5 shrink-0 translate-y-[-2px] rounded-full"
                          style={{ backgroundColor: carrier.color }}
                        />
                        <span className="text-sm font-light text-white/70 transition-colors group-hover:text-white">
                          {carrier.name}
                        </span>
                        <span className="text-xs text-white/25">{carrier.brand}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              /*
                Boş yörünge hata değil: nota veritabanı 136 malzemelik bir palet,
                parfüm listesi 52 parfümlük bir seçki. Paletteki bir rengin henüz
                kullanılmamış olması normal — gerekçe `note-marks.ts`te.
              */
              <p className="max-w-xl text-sm font-light leading-relaxed text-white/40">
                Bu nota paletin parçası ama seçkideki {PERFUMES.length} parfümün hiçbirinde
                geçmiyor. Ansiklopedi bir nota sözlüğü; kullanım listesi değil.
              </p>
            )}
          </section>

          <div className="mt-24 flex flex-col gap-3">
            <Link
              href="/notalar"
              className="text-sm font-light text-white/40 transition-colors hover:text-white/80"
            >
              ← bütün notalar
            </Link>
            <Link
              href="/"
              className="text-sm font-light text-white/40 transition-colors hover:text-white/80"
            >
              ← uzaya dön
            </Link>
          </div>
        </div>
      </ScreenFrame>
    </main>
  );
}
