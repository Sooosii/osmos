import Link from 'next/link';
import { ScreenFrame } from '@/components/ScreenFrame';
import { Studio } from '@/components/Studio';
import { COMPOSITION_NAME_MAX, FREE_COMPOSITION_NOTES } from '@/db/schema';
import { dictFor, getDict, localeFor } from '@/i18n/dict';
import { withLocale } from '@/i18n/locale';
import { currentViewer } from '@/lib/dal';
import { noteOptions } from '@/lib/note-options';
import { allCards } from '@/lib/perfume-cards';
import { pageAlternates } from '@/lib/site-url';

/**
 * Kurma aracının sayfası.
 *
 * ⚠️ **Girişsiz de açılıyor** ve bu sahibin kararı: *"insan denemeden
 * ödemiyor."* Üç notaya kadar herkes kurabiliyor, eğriyi ve en yakınları
 * görüyor; kaydetmek giriş, dördüncü nota Patron istiyor.
 *
 * ⚠️ Sayfa **dinamik**: oturumu sunucuda okuyor (üç mü on iki nota, kaydet
 * düğmesi mi davet). İstemcide okunabilirdi ama o zaman sayfa ilk boyamada
 * yanlış sınırı gösterip düzeltirdi — kişi tam nota eklerken sayacın
 * değişmesi kötü. Bu sayfa statik listede değil, bedeli yok.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = dictFor(lang);
  return {
    title: t.studio.title,
    description: t.studio.lede,
    alternates: pageAlternates('/studio', localeFor(lang)),
  };
}

export default async function StudioPage({ params }: { params: Promise<{ lang: string }> }) {
  const locale = localeFor((await params).lang);
  const t = getDict(locale);

  const viewer = await currentViewer();

  /*
    Kart sözlüğü: en yakın sonuçlar kimlik döndürüyor, ekran ad ve renk
    çiziyor. 52 küçük kayıt — `allCards`in aynısı, kimliğe göre anahtarlı.
  */
  const cards = Object.fromEntries(allCards().map((card) => [card.id, card]));

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
        <div className="relative mx-auto max-w-2xl px-6 pt-8 sm:px-10 sm:pt-14">
          <header>
            <h1 className="text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl">
              {t.studio.heading}
            </h1>
            <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-white/60">
              {t.studio.lede}
            </p>
          </header>

          <div className="mt-14">
            <Studio
              notes={noteOptions(locale)}
              freeLimit={FREE_COMPOSITION_NOTES}
              isPatron={viewer?.patron ?? false}
              signedIn={Boolean(viewer)}
              nameMax={COMPOSITION_NAME_MAX}
              cards={cards}
            />
          </div>

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
