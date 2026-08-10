import Link from 'next/link';
import { getDict } from '@/i18n/dict';
import { withLocale, type Locale } from '@/i18n/locale';

/**
 * Haritada olmayan adresin gövdesi.
 *
 * `global-not-found.tsx`ten ayrı duruyor çünkü orası bir Next sözleşmesi
 * (tam belge, yazı tipleri, üstveri); burası yalnızca ekranda görünen şey.
 *
 * Dili prop olarak alıyor: sayfanın kendisi de onu adresten çözüyor, iki
 * kaynak olmasın.
 */
export function NotFoundBody({ locale }: { locale: Locale }) {
  const t = getDict(locale);

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-[#050507] px-6 text-white sm:px-10">
      <div className="mx-auto w-full max-w-xl">
        <p className="text-xs tracking-[0.3em] text-white/50">{t.site.name}</p>

        <h1 className="mt-6 text-3xl font-light leading-tight tracking-tight sm:text-4xl">
          {t.notFound.mark}
        </h1>

        <p className="mt-5 max-w-md text-sm font-light leading-relaxed text-white/50">
          {t.notFound.line}
        </p>

        <div className="mt-12 flex flex-col gap-3">
          <Link
            href={withLocale(locale, '/')}
            className="text-sm font-light text-white/50 transition-colors hover:text-white/80"
          >
            {t.nav.backToSpace}
          </Link>
          <Link
            href={withLocale(locale, '/notes')}
            className="text-sm font-light text-white/50 transition-colors hover:text-white/80"
          >
            {t.nav.allNotes}
          </Link>
        </div>
      </div>
    </main>
  );
}
