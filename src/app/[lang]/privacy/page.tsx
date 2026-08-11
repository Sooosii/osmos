import Link from 'next/link';
import { ScreenFrame } from '@/components/ScreenFrame';
import { dictFor, getDict, localeFor } from '@/i18n/dict';
import { withLocale } from '@/i18n/locale';
import { pageAlternates } from '@/lib/site-url';

/**
 * Gizlilik — kısa, dürüst ve tamamen statik.
 *
 * Hesaplar turunun getirdiği yasal zorunluluk, ama asıl sebebi o değil: site
 * bugüne kadar **hiç çerez yazmıyordu** ve bunu README'de bir övünme cümlesi
 * olarak söylüyordu. Oturum çerezi bunu değiştiriyor. Sessizce bırakmak,
 * verilmiş bir sözü kimseye söylemeden geri almak olurdu; sayfa tam olarak
 * neyin değiştiğini yazıyor.
 *
 * ⚠️ Sayfa **statik** ve öyle kalmalı: içinde kullanıcıya özel hiçbir şey
 * yok. Oturum okusaydı 2 sayfa daha dinamiğe düşerdi.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const t = dictFor((await params).lang);
  return {
    title: t.account.privacy.title,
    alternates: pageAlternates('/privacy'),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
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
        <div className="relative mx-auto max-w-2xl px-6 sm:px-10">
          <header className="pt-8 sm:pt-14">
            <h1 className="text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl">
              {t.account.privacy.heading}
            </h1>
          </header>

          <div className="mt-10 space-y-6">
            {t.account.privacy.body.map((paragraph) => (
              <p key={paragraph} className="text-base font-light leading-relaxed text-white/70">
                {paragraph}
              </p>
            ))}
          </div>

          <footer className="mt-20">
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
