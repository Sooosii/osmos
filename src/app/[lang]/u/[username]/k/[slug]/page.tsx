import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EvolutionSignature } from '@/components/EvolutionSignature';
import { ScreenFrame } from '@/components/ScreenFrame';
import { dictFor, getDict, localeFor, say } from '@/i18n/dict';
import { withLocale } from '@/i18n/locale';
import { getNote } from '@/data/notes';
import { publicComposition } from '@/lib/dal';
import { asPerfume, nearestToComposition } from '@/lib/composition';
import { cardsFor } from '@/lib/perfume-cards';
import { normalizeUsername } from '@/lib/username';

/**
 * Bir kompozisyonun kendi sayfası — paylaşılan bağlantının indiği yer.
 *
 * Büyüme motorunun asıl parçası: kişi kendi kurduğu şeyi paylaşıyor,
 * bağlantıya tıklayan siteye giriyor ve aynı aracı deneyebiliyor.
 *
 * ⚠️ En yakın parfümler **burada sunucuda** hesaplanıyor (kurma aracında uç
 * üzerinden yapılıyordu, çünkü orası istemci). Aynı saf fonksiyon; ikinci bir
 * hesap yok.
 *
 * ⚠️ Gizli profilin kompozisyonu da açılmıyor (`publicComposition` null
 * dönüyor): gizlemek, kişinin var olduğunu söylememek demek — kompozisyon
 * adresi açık kalsaydı varlık oradan sızardı.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; username: string; slug: string }>;
}) {
  const { lang, username, slug } = await params;
  const found = await publicComposition(normalizeUsername(username), slug);
  if (!found) return {};

  const t = dictFor(lang);
  return {
    title: `${found.name} · ${found.username} · ${t.site.name}`,
    description: t.studio.lede,
  };
}

export default async function CompositionPage({
  params,
}: {
  params: Promise<{ lang: string; username: string; slug: string }>;
}) {
  const { lang, username, slug } = await params;
  const locale = localeFor(lang);
  const t = getDict(locale);

  const found = await publicComposition(normalizeUsername(username), slug);
  if (!found) notFound();

  const perfume = asPerfume(found.notes, found.name);
  /* Bir kez hesaplanıyor: 52 kosinüs, iki kez çağırmanın karşılığı yok. */
  const matches = nearestToComposition(found.notes, 5);
  const near = cardsFor(matches.map((match) => match.perfumeId));
  const scores = new Map(matches.map((match) => [match.perfumeId, match.score]));

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
        status={found.username.toUpperCase()}
        tail={`${found.notes.length}`}
      >
        <div className="relative mx-auto max-w-2xl px-6 pt-8 sm:px-10 sm:pt-14">
          <header>
            <p className="text-[10px] tracking-[0.22em] text-white/40">
              <Link
                href={withLocale(locale, `/u/${found.username}`)}
                className="transition-colors hover:text-white/70"
              >
                {found.username.toUpperCase()}
              </Link>
            </p>
            <h1 className="mt-2 text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl">
              {found.name}
            </h1>
          </header>

          {/* Notalar — katmanıyla ve ağırlığıyla, kurulduğu hâliyle. */}
          <section className="mt-12 space-y-2">
            {found.notes.map((entry) => (
              <p
                key={entry.noteId}
                className="flex items-baseline gap-3 text-sm font-light text-white/70"
              >
                <span className="w-12 shrink-0 text-[9px] tracking-[0.2em] text-white/35">
                  {t.bands[entry.tier]}
                </span>
                <Link
                  href={withLocale(locale, `/note/${entry.noteId}`)}
                  className="transition-colors hover:text-white"
                >
                  {say(getNote(entry.noteId).name, locale)}
                </Link>
                <span className="ml-auto tabular-nums text-white/30">
                  {entry.weight.toFixed(2)}
                </span>
              </p>
            ))}
          </section>

          <section className="mt-16">
            <h2 className="mb-6 text-xs tracking-[0.3em] text-white/50">{t.studio.curve}</h2>
            <EvolutionSignature perfume={perfume} />
          </section>

          {near.length > 0 ? (
            <section className="mt-16">
              <h2 className="mb-5 text-xs tracking-[0.3em] text-white/50">{t.studio.nearest}</h2>
              <ul className="space-y-2">
                {near.map((card) => (
                  <li key={card.id} className="flex items-center gap-3 text-sm font-light">
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
                    <span className="text-white/30">{card.brand}</span>
                    <span className="ml-auto tabular-nums text-white/40">
                      {Math.round((scores.get(card.id) ?? 0) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <footer className="mt-24 space-y-3">
            <p>
              <Link
                href={withLocale(locale, '/studio')}
                className="text-sm font-light text-white/60 transition-colors hover:text-white"
              >
                {t.studio.heading} →
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
