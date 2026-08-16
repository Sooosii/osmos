import Link from 'next/link';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SignInForm } from '@/components/SignInForm';
import { dictFor, getDict, localeFor } from '@/i18n/dict';
import { withLocale } from '@/i18n/locale';
import { pageAlternates } from '@/lib/site-url';
import { requireAccounts } from '@/lib/tenant-guard';

/**
 * Giriş ekranı.
 *
 * ⚠️ Sayfa **statik**: içinde kullanıcıya özel hiçbir şey yok, formun tamamı
 * istemci tarafında. Oturum okusaydı iki sayfa daha dinamiğe düşerdi ve
 * karşılığında hiçbir şey kazanmazdık.
 *
 * ⚠️ `noindex`: giriş ekranının aramada çıkacak bir işi yok ve orada
 * bulunması sitenin "üyelik isteğe bağlı, sessiz bir köşede" duruşuna
 * aykırı olurdu.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = dictFor(lang);
  return {
    title: t.account.signInTitle,
    alternates: pageAlternates('/signin', localeFor(lang)),
    robots: { index: false, follow: true },
  };
}

export default async function SignInPage({ params }: { params: Promise<{ lang: string }> }) {
  requireAccounts();

  const locale = localeFor((await params).lang);
  const t = getDict(locale);

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
        status=""
        tail=""
      >
        <div className="relative mx-auto max-w-sm px-6 pt-10 sm:pt-20">
          <header>
            <h1 className="text-3xl font-light leading-tight tracking-tight">
              {t.account.signIn}
            </h1>
            <p className="mt-4 text-sm font-light leading-relaxed text-white/50">
              {t.account.signInLede}
            </p>
          </header>

          <div className="mt-12">
            <SignInForm />
          </div>

          <footer className="mt-16 space-y-4">
            <p>
              <Link
                href={withLocale(locale, '/privacy')}
                className="text-xs font-light text-white/30 transition-colors hover:text-white/60"
              >
                {t.account.privacy.heading}
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
