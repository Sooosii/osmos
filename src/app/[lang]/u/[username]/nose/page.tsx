import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NoseReadout } from '@/components/NoseReadout';
import { ScreenFrame } from '@/components/ScreenFrame';
import { dictFor, getDict, localeFor } from '@/i18n/dict';
import { withLocale } from '@/i18n/locale';
import { publicNose } from '@/lib/dal';
import { MIN_NOSE_PERFUMES } from '@/lib/nose';
import { normalizeUsername } from '@/lib/username';

/**
 * Burun raporu — üyeliğin kişiye geri verdiği şey.
 *
 * Site bugüne kadar kişi hakkında dört şey biliyordu ve söyleyecek bir cümlesi
 * yoktu. Raflarla birlikte bir portre çıkıyor: hangi aileler, nasıl bir
 * karakter, ne kadar geniş, aradaki yabancı kim, sırada ne var.
 *
 * ⚠️ **Rapor kaç parfümden okunduğunu YAZIYOR.** Üç parfümlük bir portre ile
 * yirmi parfümlük olanı ayırt etmek okuyanın hakkı; site hiçbir yerde
 * elindekinden fazlasını iddia etmiyor.
 *
 * ⚠️ Gizli profilin raporu da açılmıyor — `publicNose` `null` dönüyor.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; username: string }>;
}) {
  const { lang, username } = await params;
  const nose = await publicNose(normalizeUsername(username));
  if (!nose) return {};

  const t = dictFor(lang);
  return {
    title: t.nose.title(nose.username),
    description: t.nose.description(nose.username),
  };
}

export default async function NosePage({
  params,
}: {
  params: Promise<{ lang: string; username: string }>;
}) {
  const { lang, username } = await params;
  const locale = localeFor(lang);
  const t = getDict(locale);

  const nose = await publicNose(normalizeUsername(username));
  if (!nose) notFound();

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
        status={nose.username.toUpperCase()}
        tail={String(nose.count)}
      >
        <div className="relative mx-auto max-w-2xl px-6 pt-8 sm:px-10 sm:pt-14">
          <header>
            <p className="text-[10px] tracking-[0.22em] text-white/40">
              <Link
                href={withLocale(locale, `/u/${nose.username}`)}
                className="transition-colors hover:text-white/70"
              >
                {nose.username.toUpperCase()}
              </Link>
            </p>
            <h1 className="mt-2 text-3xl font-light leading-tight tracking-tight sm:text-4xl">
              {t.nose.heading}
            </h1>

            {nose.report ? (
              /* Dürüstlük satırı — raporun dayanağı kaç parfüm. */
              <p className="mt-4 text-sm font-light text-white/40">
                {t.nose.readFrom(nose.report.count)}
              </p>
            ) : null}
          </header>

          {nose.report ? (
            <NoseReadout report={nose.report} t={t} locale={locale} />
          ) : (
            /*
              Yetmiyor. Kilitli bir kapı değil, bir davet: kaç tane kaldığı
              yazıyor ve raflara giden yol açık.
            */
            <p className="mt-12 text-sm font-light leading-relaxed text-white/50">
              {t.nose.notEnough(MIN_NOSE_PERFUMES - nose.count)}
            </p>
          )}

          <footer className="mt-24 space-y-3">
            <p>
              <Link
                href={withLocale(locale, `/u/${nose.username}/shelf`)}
                className="text-sm font-light text-white/60 transition-colors hover:text-white"
              >
                {t.shelf.heading} →
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
