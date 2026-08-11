import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NoseSignature } from '@/components/NoseSignature';
import { PatronBackdrop } from '@/components/PatronBackdrop';
import { SignatureClip } from '@/components/SignatureClip';
import { PerfumeMiniCard } from '@/components/PerfumeMiniCard';
import { ScreenFrame } from '@/components/ScreenFrame';
import { dictFor, getDict, localeFor } from '@/i18n/dict';
import { withLocale } from '@/i18n/locale';
import { currentViewer, publicProfile } from '@/lib/dal';
import { MIN_NOSE_PERFUMES } from '@/lib/nose';
import { cardsFor } from '@/lib/perfume-cards';
import { SHELF_KINDS } from '@/lib/shelf';
import { normalizeUsername } from '@/lib/username';

/**
 * Herkese açık profil — üyeliğin görünen yüzü.
 *
 * Üç şey var: kullanıcı adı, tek satırlık cümle, ve Top 4'ten türeyen imza
 * ile dört kart. Fotoğraf yok — sahibin kararı; kimlik işareti veriden
 * doğuyor.
 *
 * ⚠️ **Dinamik ve öyle olmak zorunda**: içerik kullanıcıya ait ve her an
 * değişebilir. Sitenin geri kalanı (394 sayfa) statik kalıyor; buranın
 * dinamikliği oraya bulaşmıyor.
 *
 * ⚠️ **Gizli profil 404 döndürüyor, "gizli" sayfası göstermiyor.** "Bu
 * kullanıcı profilini gizlemiş" demek, kullanıcının var olduğunu söylemektir
 * — gizlemenin amacı tam olarak bunu söylememek. Aynı sebeple olmayan
 * kullanıcı ile gizli kullanıcı **ayırt edilemiyor**.
 *
 * ⚠️ Sitemap'te yok: kullanıcı dizini yayımlamak ayrı bir karar ve alınmadı.
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
    title: t.account.profile.title(profile.username),
    description: profile.bio ?? t.account.profile.description(profile.username),
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: string; username: string }>;
}) {
  const { lang, username } = await params;
  const locale = localeFor(lang);
  const t = getDict(locale);

  const profile = await publicProfile(normalizeUsername(username));
  if (!profile) notFound();

  const viewer = await currentViewer();
  const isOwn = viewer?.username === profile.username;
  const cards = cardsFor(profile.topFour);
  const shelfTotal = SHELF_KINDS.reduce((sum, kind) => sum + profile.shelf[kind].length, 0);

  /*
    Burun raporunun bağlantısı ancak rapor GERÇEKTEN çıkacaksa çiziliyor.
    Kural `publicNose`unkiyle aynı olmak zorunda (okunanlar = Top 4 + sahibim
    + denedim), yoksa profil "rapor var" der, sayfa "yetmiyor" derdi.
  */
  const readable = new Set([
    ...profile.topFour,
    ...profile.shelf.owned,
    ...profile.shelf.tried,
  ]).size;

  return (
    <main className="min-h-dvh bg-[#050507] text-white">
      {/*
        Patron zemini — imzanın büyütülmüş, sönük ve yavaşça dönen hâli.
        Yalnızca Patron profilinde ve yalnızca dört parfüm seçilmişse:
        boş bir imzadan zemin de doğmuyor.
      */}
      {profile.patron && profile.topFour.length > 0 ? (
        <PatronBackdrop perfumeIds={profile.topFour} />
      ) : null}

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
        tail={`${cards.length}/4`}
      >
        <div className="relative mx-auto max-w-3xl px-6 pt-8 sm:px-10 sm:pt-14">
          <header className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-12">
            {/* İmza — fotoğrafın durduğu yer; Top 4'ten türetiliyor. */}
            <NoseSignature
              perfumeIds={profile.topFour}
              size={132}
              label={t.account.profile.signatureLabel(profile.username)}
            />

            <div className="min-w-0">
              <h1 className="text-3xl font-light leading-tight tracking-tight sm:text-4xl">
                {profile.username}
              </h1>
              {/*
                Patron rozeti — çerçevenin mikro-tipografisinde, sönük.
                Bağırmıyor: ücretli üyelik bir statü işareti değil, bir
                destek işareti; büyük bir rozet burayı reklam panosuna
                çevirirdi.
              */}
              {profile.patron ? (
                <p className="mt-2 text-[9px] tracking-[0.24em] text-white/35">
                  {t.studio.patronMark}
                </p>
              ) : null}
              {profile.bio ? (
                <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-white/60">
                  {profile.bio}
                </p>
              ) : null}
              {isOwn ? (
                <p className="mt-4 flex items-center gap-4">
                  <Link
                    href={withLocale(locale, '/settings')}
                    className="text-xs font-light text-white/40 transition-colors hover:text-white/70"
                  >
                    {t.account.profile.edit}
                  </Link>
                  {/*
                    Klip yalnızca profilin SAHİBİNE ve yalnızca Patron'a:
                    başkasının imzasını indirmek onun işareti üzerinden
                    paylaşım yapmak olurdu.
                  */}
                  {profile.patron ? (
                    <SignatureClip perfumeIds={profile.topFour} username={profile.username} />
                  ) : null}
                </p>
              ) : null}
            </div>
          </header>

          <section className="mt-16">
            <h2 className="mb-6 text-xs tracking-[0.3em] text-white/50">
              {t.account.profile.topFour}
            </h2>

            {cards.length === 0 ? (
              <p className="text-sm font-light text-white/40">{t.account.profile.empty}</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {cards.map((card) => (
                  <PerfumeMiniCard key={card.id} card={card} locale={locale} />
                ))}
              </div>
            )}
          </section>

          {/*
            Raflar — profilde yalnızca üç sayı, tamamı kendi sayfasında.

            Sahibin kararı ("çok da ağzına kadar değil"): profil sade kalıyor.
            Boşken satır HİÇ çizilmiyor; profillerin çoğunda raf boş olacak ve
            boş bir başlık "burada bir eksik var" der.
          */}
          {shelfTotal > 0 ? (
            <section className="mt-14">
              <Link
                href={withLocale(locale, `/u/${profile.username}/shelf`)}
                className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm font-light text-white/45 transition-colors hover:text-white/80"
              >
                <span className="text-xs tracking-[0.3em] text-white/50">{t.shelf.heading}</span>
                {SHELF_KINDS.filter((kind) => profile.shelf[kind].length > 0).map((kind) => (
                  <span key={kind} className="tabular-nums">
                    {t.shelf.counts[kind](profile.shelf[kind].length)}
                  </span>
                ))}
                <span aria-hidden="true" className="text-white/25 group-hover:text-white/60">
                  →
                </span>
              </Link>
            </section>
          ) : null}

          {readable >= MIN_NOSE_PERFUMES ? (
            <section className="mt-4">
              <Link
                href={withLocale(locale, `/u/${profile.username}/nose`)}
                className="group flex items-baseline gap-4 text-sm font-light transition-colors"
              >
                <span className="text-xs tracking-[0.3em] text-white/50 group-hover:text-white/80">
                  {t.nose.heading}
                </span>
                <span aria-hidden="true" className="text-white/25 group-hover:text-white/60">
                  →
                </span>
              </Link>
            </section>
          ) : null}

          {/*
            Kompozisyonlar — kişinin kendi kurdukları.

            Boşken bölüm HİÇ çizilmiyor: profilin çoğunda bu liste boş olacak
            ve boş bir başlık "burada bir eksik var" der. Kendi profiline
            bakan kişi davetini zaten kurma aracında görüyor.
          */}
          {profile.compositions.length > 0 ? (
            <section className="mt-16">
              <h2 className="mb-5 text-xs tracking-[0.3em] text-white/50">{t.studio.mine}</h2>
              <ul className="space-y-2">
                {profile.compositions.map((entry) => (
                  <li key={entry.slug}>
                    <Link
                      href={withLocale(locale, `/u/${profile.username}/k/${entry.slug}`)}
                      className="text-sm font-light text-white/70 transition-colors hover:text-white"
                    >
                      {entry.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <footer className="mt-24">
            <Link
              href={withLocale(locale, '/')}
              className="text-sm font-light text-white/50 transition-colors hover:text-white/80"
            >
              {t.nav.backToSpace}
            </Link>
          </footer>
        </div>
      </ScreenFrame>
    </main>
  );
}
