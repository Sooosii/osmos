import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NOTES, hasNote, getNote, noteBand } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import { buildNotePage } from '@/lib/note-marks';
import { NoteOrbit } from '@/components/NoteOrbit';
import { ScreenFrame, type FrameReadout } from '@/components/ScreenFrame';
import { DitherBackdrop } from '@/components/DitherBackdrop';
import { NoteMeasures } from '@/components/NoteMeasures';
import { EN } from '@/i18n/en';

/**
 * Nota sayfası — Aşama 3, ansiklopedinin yaprağı.
 *
 * Şemanın en eski sözü buydu (`types.ts`): `description` alanı nota
 * ansiklopedisiyle birlikte dolacaktı. Dört spec boyunca "kapsam dışı" satırında
 * bekledi; 136 notanın 136'sı artık açıklamalı ve burası onların göründüğü yer.
 *
 * Sayfa dört şeyden ibaret:
 *
 *   ① ad + bant                ← notanın ne olduğu
 *   ③ ölçümler                 ← "peki nasıl bir şey?"
 *   ② yörünge                  ← "peki bu hangi parfümlerde var?"
 *     geri yollar
 *
 * ③ sonradan geldi ve ansiklopedi spec'inin ④. kararını devirdi: uçuculuk ile
 * karakter eksenleri oradan bilerek çıkarılmıştı (çubuk-ve-eğri reddedilmişti,
 * eksenler de uzaydaki ARAMA kaydıraçlarına benzeyip yanıltabilirdi) ama karar
 * "istenirse ayrı iş" diye bitiyordu. Sahip istedi; iki gerekçe de tasarımla
 * aşıldı, yok sayılarak değil — **şerit doku yoğunluğu, eksenler ortadan iki yana
 * açılan durgun basamaklar.** Tamamı
 * `docs/superpowers/specs/2026-08-06-nota-olcumleri-design.md`te.
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
    title: EN.note.title(note.name.en),
    description: note.description.en,
  };
}

/** Dakikayı çerçevenin dar alanına sığan biçime indirger: 90′ değil 1h 30′. */
function minutesLabel(minutes: number): string {
  if (minutes < 60) return EN.note.shortMinutes(minutes);

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? EN.note.shortHours(hours) : EN.note.shortHoursMinutes(hours, rest);
}

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasNote(id)) notFound();

  const note = getNote(id);
  const page = buildNotePage(note, PERFUMES);
  const band = EN.bands[noteBand(id)];

  /*
    Çerçevedeki her sayı gerçek veri; uydurma sayaç yok (`ScreenFrame.tsx`).
    Üçü de notanın kendi fiziği: hangi bantta, ne zaman tepe yapıyor, ne kadar
    sürüyor. Aynı iki sayı ③'te uzun biçimde de yazılıyor; burada çerçevenin dar
    alanına sığan kısaltma var (`minutesLabel`).
  */
  const readouts: readonly FrameReadout[] = [
    { label: EN.note.frame.band, value: band },
    { label: EN.note.frame.peak, value: minutesLabel(note.volatility.peakMinutes) },
    { label: EN.note.frame.life, value: minutesLabel(note.volatility.halfLifeMinutes) },
  ];

  const index = NOTES.findIndex((entry) => entry.id === id) + 1;
  const position = EN.note.position(index, NOTES.length);
  const usage = EN.note.usage(page.carriers.length, PERFUMES.length);

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
            <Link href="/notes" className="transition-colors hover:text-white">
              {EN.nav.notes}
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
            {/*
              Tarif cümlesi ekrandan kaldırıldı — sahip istedi. Veri duruyor:
              `description` 136 notanın 136'sında dolu ve `generateMetadata`
              arama sonucunda hâlâ onu yazıyor. Geri gelmesi tek satır.
            */}
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
            <h2 className="mb-8 text-xs tracking-[0.3em] text-white/45">
              {EN.note.carriersHeading(page.carriers.length)}
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
                        href={`/perfume/${carrier.id}`}
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
                {EN.note.unused(PERFUMES.length)}
              </p>
            )}
          </section>

          <div className="mt-24 flex flex-col gap-3">
            <Link
              href="/notes"
              className="text-sm font-light text-white/40 transition-colors hover:text-white/80"
            >
              {EN.nav.allNotes}
            </Link>
            <Link
              href="/"
              className="text-sm font-light text-white/40 transition-colors hover:text-white/80"
            >
              {EN.nav.backToSpace}
            </Link>
          </div>
        </div>
      </ScreenFrame>
    </main>
  );
}
