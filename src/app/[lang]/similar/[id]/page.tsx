import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PERFUMES } from '@/data/perfumes';
import { getNote } from '@/data/notes';
import { ScreenFrame, type FrameReadout } from '@/components/ScreenFrame';
import { getDict, localeFor, say } from '@/i18n/dict';
import { withLocale } from '@/i18n/locale';
import { aktifDiller } from '@/lib/tenant';
import { cardsFor } from '@/lib/perfume-cards';
import { SIMILAR_COUNT, similarTo } from '@/lib/similar';
import { pageAlternates } from '@/lib/site-url';

/**
 * "Buna benzeyenler" — arama motorundan gelen ziyaretçinin kapısı.
 *
 * "X'e benzeyen parfümler" yüksek niyetli bir arama ve sitenin bu soruya
 * verecek gerçek bir cevabı var. 52×2 yeni statik sayfa, her biri ayrı bir
 * kapı.
 *
 * ⚠️ **Künyedeki komşu bölümünün kopyası DEĞİL.** Orada beş komşu dönen bir
 * takımyıldızda duruyor ama *neden* benzedikleri hiç yazmıyor. Burada sekiz
 * komşu var ve her birinin yanında **paylaşılan notalar** — sitenin elinde
 * olan, başka hiçbir yerde olmayan bilgi. Aynı listeyi ikinci bir adreste
 * tekrar yayınlamak ince bir kapı sayfası olurdu; arama motoru onu
 * cezalandırır ve haklı olarak, çünkü okura yeni bir şey vermez.
 *
 * ⚠️ Hesap sunucuda: `similarTo` benzerlik motorunu çağırıyor ve sayfa
 * derlemede üretiliyor, yani tarayıcıya yalnızca sonuç iniyor.
 */

/* Bilinmeyen kimlik rotaya hiç girmiyor — `perfume/[id]` ile aynı gerekçe. */
export const dynamicParams = false;

export function generateStaticParams() {
  return aktifDiller().flatMap((lang) => PERFUMES.map((perfume) => ({ lang, id: perfume.id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const perfume = PERFUMES.find((entry) => entry.id === id);
  if (!perfume) return {};

  const locale = localeFor(lang);
  const t = getDict(locale);
  return {
    title: t.similar.title(perfume.name, perfume.brand),
    description: t.similar.description(perfume.name, SIMILAR_COUNT),
    alternates: pageAlternates(`/similar/${id}`, locale),
  };
}

export default async function SimilarPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const perfume = PERFUMES.find((entry) => entry.id === id);
  if (!perfume) notFound();

  const locale = localeFor(lang);
  const t = getDict(locale);

  const entries = similarTo(id);
  const cards = new Map(cardsFor(entries.map((entry) => entry.perfumeId)).map((c) => [c.id, c]));

  const readouts: readonly FrameReadout[] = [
    { label: t.perfume.frame.notes, value: String(perfume.notes.length) },
  ];

  return (
    <main className="min-h-dvh bg-[#050507] text-white">
      <ScreenFrame
        nav={
          <nav className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-white/50">
            <Link
              href={withLocale(locale, '/')}
              /* Cerceve baglantisi: onden getirilmiyor, gerekce `LangSwitch`te. */
              prefetch={false}
              className="transition-colors hover:text-white"
            >
              {t.site.name}
            </Link>
            <span aria-hidden="true" className="text-white/20">
              ·
            </span>
            <Link
              href={withLocale(locale, '/notes')}
              /* Cerceve baglantisi: onden getirilmiyor, gerekce `LangSwitch`te. */
              prefetch={false}
              className="transition-colors hover:text-white"
            >
              {t.nav.notes}
            </Link>
          </nav>
        }
        readouts={readouts}
        status={perfume.brand.toUpperCase()}
        tail={String(SIMILAR_COUNT)}
      >
        <div className="relative mx-auto max-w-2xl px-6 pt-8 sm:px-10 sm:pt-14">
          <header>
            <p className="text-[10px] tracking-[0.22em] text-white/40">
              <Link
                href={withLocale(locale, `/perfume/${perfume.id}`)}
                className="transition-colors hover:text-white/70"
              >
                {perfume.brand.toUpperCase()}
              </Link>
            </p>
            <h1 className="mt-2 text-3xl font-light leading-tight tracking-tight sm:text-4xl">
              {t.similar.heading(perfume.name)}
            </h1>
            <p className="mt-4 text-sm font-light text-white/45">{t.similar.lede(SIMILAR_COUNT)}</p>
          </header>

          <ul className="mt-12 space-y-8">
            {entries.map((entry) => {
              const card = cards.get(entry.perfumeId);
              if (!card) return null;

              return (
                <li key={entry.perfumeId} className="relative">
                  <p className="flex items-baseline gap-3 text-sm font-light">
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 translate-y-[-1px] rounded-full"
                      style={{ backgroundColor: card.color }}
                    />
                    <Link
                      href={withLocale(locale, `/perfume/${card.id}`)}
                      className="text-white/85 transition-colors before:absolute before:inset-0 before:content-[''] hover:text-white"
                    >
                      {card.name}
                    </Link>
                    <span className="truncate text-white/30">{card.brand}</span>
                    <span className="ml-auto shrink-0 tabular-nums text-white/40">
                      {Math.round(entry.score * 100)}%
                    </span>
                  </p>

                  {/*
                    Sayfanın var olma sebebi: NEDEN benziyorlar. Ortak notası
                    olmayan komşu gizlenmiyor — benzerlik ailede ve karakterde
                    de olabiliyor ve bunu söylememek haritayı yanlış anlatmak
                    olurdu.
                  */}
                  <p className="mt-2 pl-5 text-xs font-light leading-relaxed text-white/40">
                    {entry.shared.length > 0 ? (
                      <>
                        {t.similar.sharedLabel}{' '}
                        {entry.shared
                          .map((note) => say(getNote(note.noteId).name, locale))
                          .join(' · ')}
                      </>
                    ) : (
                      t.similar.noShared
                    )}
                  </p>
                </li>
              );
            })}
          </ul>

          <footer className="mt-24 space-y-3">
            <p>
              <Link
                href={withLocale(locale, `/perfume/${perfume.id}`)}
                className="text-sm font-light text-white/60 transition-colors hover:text-white"
              >
                ← {t.similar.back(perfume.name)}
              </Link>
            </p>
            <p>
              <Link
                href={withLocale(locale, '/')}
                className="text-sm font-light text-white/50 transition-colors hover:text-white/80"
              >
                {t.nav.backToSpace}
              </Link>
            </p>
          </footer>
        </div>
      </ScreenFrame>
    </main>
  );
}
