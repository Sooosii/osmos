import Link from 'next/link';
import { ResetPasswordForm } from '@/components/ResetPasswordForm';
import { ScreenFrame } from '@/components/ScreenFrame';
import { dictFor, getDict, localeFor } from '@/i18n/dict';
import { withLocale } from '@/i18n/locale';
import { pageAlternates } from '@/lib/site-url';
import { requireAccounts } from '@/lib/tenant-guard';

/**
 * Yeni şifre — sıfırlama mektubundaki bağlantının indiği sayfa.
 *
 * ⚠️ Sayfa **statik**: belirteç adreste ve istemcide okunuyor, sunucu ona hiç
 * dokunmuyor. Sunucuda okusaydık sayfa dinamiğe düşerdi ve karşılığında
 * hiçbir şey kazanmazdık — doğrulamayı zaten Better Auth'un ucu yapıyor.
 *
 * ⚠️ `noindex`: tek kullanımlık bir bağlantının indeksinde işi yok.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = dictFor(lang);
  return {
    title: t.account.resetTitle,
    alternates: pageAlternates('/reset-password', localeFor(lang)),
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
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
          <h1 className="text-3xl font-light leading-tight tracking-tight">
            {t.account.resetHeading}
          </h1>

          <div className="mt-12">
            <ResetPasswordForm />
          </div>

          <footer className="mt-16">
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
