import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ScreenFrame } from '@/components/ScreenFrame';
import { dictFor, getDict, localeFor } from '@/i18n/dict';
import { withLocale } from '@/i18n/locale';
import { publicProfile } from '@/lib/dal';
import { cardsFor } from '@/lib/perfume-cards';
import { SHELF_KINDS } from '@/lib/shelf';
import { normalizeUsername } from '@/lib/username';

/**
 * Rafların kendi sayfası — "elimde ne var, neyi kokladım, ne istiyorum".
 *
 * Profilde yalnızca üç sayı duruyor; tamamı burada. Sahibin kararı
 * ("çok da ağzına kadar değil"): profil sade kalsın, liste kendi adresinde
 * yaşasın — böylece paylaşılabilir de oluyor.
 *
 * ⚠️ Kart yerine **satır**: bir raf katalog boyuna kadar (52) uzayabiliyor ve
 * kart ızgarası o boyda okunmaz bir duvara dönüyor. Top 4 kartlarla çünkü
 * orada sayı dört ve her biri bir iddia.
 *
 * ⚠️ Gizli profilin rafı da açılmıyor: gizlemek, kişinin var olduğunu
 * söylememek demek — raf adresi açık kalsaydı varlık oradan sızardı.
 * `publicProfile` zaten `null` dönüyor.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; username: string }>;
}) {
  const { lang, username } = await params;
  const profile = await publicProfile(normalizeUsername(username));
  if (!profile) return {};

  const t = dictFor(lang);
  return {
    title: t.shelf.title(profile.username),
    description: t.shelf.description(profile.username),
  };
}

export default async function ShelfPage({
  params,
}: {
  params: Promise<{ lang: string; username: string }>;
}) {
  const { lang, username } = await params;
  const locale = localeFor(lang);
  const t = getDict(locale);

  const profile = await publicProfile(normalizeUsername(username));
  if (!profile) notFound();

  /* Üç raf tek geçişte karta çevriliyor; `cardsFor` veriden çıkanı zaten atıyor. */
  const shelves = SHELF_KINDS.map((kind) => ({
    kind,
    cards: cardsFor(profile.shelf[kind]),
  })).filter((entry) => entry.cards.length > 0);

  const total = shelves.reduce((sum, entry) => sum + entry.cards.length, 0);

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
        readouts={[]}
        status={profile.username.toUpperCase()}
        tail={String(total)}
      >
        <div className="relative mx-auto max-w-2xl px-6 pt-8 sm:px-10 sm:pt-14">
          <header>
            <p className="text-[10px] tracking-[0.22em] text-white/40">
              <Link
                href={withLocale(locale, `/u/${profile.username}`)}
                className="transition-colors hover:text-white/70"
              >
                {profile.username.toUpperCase()}
              </Link>
            </p>
            <h1 className="mt-2 text-3xl font-light leading-tight tracking-tight sm:text-4xl">
              {t.shelf.heading}
            </h1>
          </header>

          {shelves.length === 0 ? (
            <p className="mt-12 text-sm font-light text-white/40">{t.shelf.empty}</p>
          ) : (
            shelves.map(({ kind, cards }) => (
              <section key={kind} className="mt-14">
                <h2 className="mb-5 flex items-baseline gap-3 text-xs tracking-[0.3em] text-white/50">
                  {t.shelf.headings[kind]}
                  <span className="tabular-nums text-[10px] text-white/25">{cards.length}</span>
                </h2>
                <ul className="space-y-2">
                  {cards.map((card) => (
                    <li key={card.id} className="flex items-center gap-3 text-sm font-light">
                      {/* Renk = koku ailesi; sitenin her yerinde aynı kod. */}
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: card.color }}
                      />
                      <Link
                        href={withLocale(locale, `/perfume/${card.id}`)}
                        className="text-white/75 transition-colors hover:text-white"
                      >
                        {card.name}
                      </Link>
                      <span className="truncate text-white/30">{card.brand}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}

          <footer className="mt-24 space-y-3">
            <p>
              <Link
                href={withLocale(locale, `/u/${profile.username}/nose`)}
                className="text-sm font-light text-white/60 transition-colors hover:text-white"
              >
                {t.nose.heading} →
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
