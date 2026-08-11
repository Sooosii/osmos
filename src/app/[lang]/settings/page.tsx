import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SettingsForm } from '@/components/SettingsForm';
import { BIO_MAX } from '@/db/schema';
import { dictFor, getDict, localeFor } from '@/i18n/dict';
import { withLocale } from '@/i18n/locale';
import { currentViewer, topFourOf } from '@/lib/dal';
import { allCards, cardsFor } from '@/lib/perfume-cards';
import { pageAlternates } from '@/lib/site-url';

/**
 * Ayarlar — hesabın tek yönetim yeri.
 *
 * ⚠️ **Yetki denetimi burada, düzende değil.** Next'in kılavuzunun uyarısı:
 * düzenler gezinmede yeniden çizilmiyor, oraya konan denetim ilk yüklemeden
 * sonra sessizce atlanır. Sayfanın kendi ilk satırı `currentViewer()`.
 *
 * ⚠️ Denetim tek başına yetmez: sayfanın çağırdığı **her Server Action da
 * kendi yetkisini ayrıca denetliyor** (`[lang]/actions.ts`). Ekranı gizlemek
 * koruma değil — eylemler herkese açık uçlar.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = dictFor(lang);
  return {
    title: t.account.settings.title,
    alternates: pageAlternates('/settings', localeFor(lang)),
    robots: { index: false, follow: false },
  };
}

export default async function SettingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const locale = localeFor((await params).lang);
  const t = getDict(locale);

  const viewer = await currentViewer();
  if (!viewer) redirect(withLocale(locale, '/signin'));

  const topFour = await topFourOf(viewer.id);

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
        status={viewer.username?.toUpperCase() ?? ''}
        tail=""
      >
        <div className="relative mx-auto max-w-3xl px-6 pt-8 sm:px-10 sm:pt-14">
          <SettingsForm
            username={viewer.username}
            bio={viewer.bio}
            hidden={viewer.hidden}
            emailOptIn={viewer.emailOptIn}
            topFour={cardsFor(topFour)}
            all={allCards()}
            bioMax={BIO_MAX}
          />

          <footer className="mt-20 space-y-3">
            {viewer.username ? (
              <p>
                <Link
                  href={withLocale(locale, `/u/${viewer.username}`)}
                  className="text-xs font-light text-white/40 transition-colors hover:text-white/70"
                >
                  {t.account.profile.title(viewer.username)}
                </Link>
              </p>
            ) : null}
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
