import Link from 'next/link';
import { getDict } from '@/i18n/dict';
import { withLocale, type Locale } from '@/i18n/locale';

/**
 * Bir şey kırıldığında görünen gövde.
 *
 * `NotFoundBody` ile aynı biçim ve aynı gerekçe: iki dosya (`[lang]/error.tsx`
 * ve `global-error.tsx`) aynı ekranı gösteriyor, biri düzenin içinde biri kendi
 * belgesini kurarak. Görünen şey tek yerde dursun.
 *
 * ⚠️ Hata **metni ekrana yazılmıyor.** Next üretimde sunucu hatalarının
 * mesajını zaten istemciye vermiyor (sızıntı olmasın diye) ve istemci
 * hatalarının yığın izi ziyaretçiye bir şey anlatmıyor. Ekranda tek bir cümle,
 * bir "tekrar dene" ve geri dönüş yolu var.
 */
export function ErrorBody({
  locale,
  onRetry,
}: {
  locale: Locale;
  onRetry: () => void;
}) {
  const t = getDict(locale);

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-[#050507] px-6 text-white sm:px-10">
      <div className="mx-auto w-full max-w-xl">
        <p className="text-xs tracking-[0.3em] text-white/50">{t.site.name}</p>

        <h1 className="mt-6 text-3xl font-light leading-tight tracking-tight sm:text-4xl">
          {t.error.mark}
        </h1>

        <p className="mt-5 max-w-md text-sm font-light leading-relaxed text-white/50">
          {t.error.line}
        </p>

        <div className="mt-12 flex flex-col items-start gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-light text-white/60 transition-colors hover:text-white"
          >
            {t.error.retry}
          </button>
          <Link
            href={withLocale(locale, '/')}
            className="text-sm font-light text-white/50 transition-colors hover:text-white/80"
          >
            {t.nav.backToSpace}
          </Link>
        </div>
      </div>
    </main>
  );
}
