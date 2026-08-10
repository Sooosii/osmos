'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getDict } from '@/i18n/dict';
import { stripLocale, withLocale } from '@/i18n/locale';

/**
 * Haritada olmayan adresin gövdesi.
 *
 * ⚠️ **Dil `params`tan gelmiyor, adresten okunuyor.** Next `not-found`a
 * parametre geçmiyor — sayfa eşleşmediği için geçecek bir parametre de yok.
 * Ama tarayıcıdaki yol duruyor ve `stripLocale` onu zaten çözebiliyor:
 * `/tr/yok` → tr, `/yok` → en. Aynı okuma bağlantıları da doğru dile bağlıyor.
 *
 * İstemci bileşeni olmasının tek sebebi `usePathname`; başka durumu ya da
 * etkisi yok. Sınır `not-found.tsx`te değil burada, çünkü Next'in sınır
 * dosyasının kendisi sunucu bileşeni olarak duruyor.
 */
export function NotFoundBody() {
  const { locale } = stripLocale(usePathname());
  const t = getDict(locale);

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-[#050507] px-6 text-white sm:px-10">
      <div className="mx-auto w-full max-w-xl">
        <p className="text-xs tracking-[0.3em] text-white/30">{t.site.name}</p>

        <h1 className="mt-6 text-3xl font-light leading-tight tracking-tight sm:text-4xl">
          {t.notFound.mark}
        </h1>

        <p className="mt-5 max-w-md text-sm font-light leading-relaxed text-white/45">
          {t.notFound.line}
        </p>

        <div className="mt-12 flex flex-col gap-3">
          <Link
            href={withLocale(locale, '/')}
            className="text-sm font-light text-white/40 transition-colors hover:text-white/80"
          >
            {t.nav.backToSpace}
          </Link>
          <Link
            href={withLocale(locale, '/notes')}
            className="text-sm font-light text-white/40 transition-colors hover:text-white/80"
          >
            {t.nav.allNotes}
          </Link>
        </div>
      </div>
    </main>
  );
}
