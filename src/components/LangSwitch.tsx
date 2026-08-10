'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LOCALES, stripLocale, switchPath } from '@/i18n/locale';

/**
 * Dil değiştirici — sitenin tek "meta" kontrolü.
 *
 * ⚠️ **`useSearchParams` bilerek kullanılmıyor.** Suspense sınırı olmadan bütün
 * sayfayı istemciye düşürüyor (`app/[lang]/page.tsx`in kendi yorumu bunu
 * ölçmüş ve yazmış); sınır koyup yedek göstermek de kötü, çünkü üretilen
 * HTML'de dil düğmesi **eksik** olur ve sonradan belirir. Bir gezinme kontrolü
 * için kabul edilemez.
 *
 * Bunun yerine: bağlantı yalnızca yoldan kuruluyor — statik güvenli ve her
 * zaman doğru — düz sol tıklama yakalanıp adres parametreleri **canlı**
 * `window.location.search`ten ekleniyor. Ctrl/⌘/Shift/orta tık dokunulmadan
 * geçiyor ve yeni sekmede parametresiz açılıyor; yeni sekme zaten taze bir
 * başlangıç.
 *
 * Parametrelerin korunması süs değil: uzayda bir parfüm seçiliyken (`?mark=`)
 * ya da kaydıraçlar ayarlıyken (`?feel=`) dil değiştiren kişi durumunu
 * kaybetmemeli.
 */
export function LangSwitch({ className = '' }: { readonly className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = stripLocale(pathname).locale;

  return (
    <div
      className={`flex items-center gap-1.5 text-[9px] tracking-[0.18em] ${className}`}
    >
      {LOCALES.map((locale, index) => (
        <span key={locale} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span aria-hidden="true" className="text-white/15">
              |
            </span>
          ) : null}

          {locale === active ? (
            <span aria-current="true" className="text-white/70">
              {locale.toUpperCase()}
            </span>
          ) : (
            <Link
              href={switchPath(pathname, '', locale)}
              hrefLang={locale}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
                  return;
                }
                event.preventDefault();
                router.push(switchPath(pathname, window.location.search, locale));
              }}
              className="text-white/30 transition-colors hover:text-white/70"
            >
              {locale.toUpperCase()}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
