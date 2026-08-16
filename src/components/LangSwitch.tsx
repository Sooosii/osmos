'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { stripLocale, switchPath } from '@/i18n/locale';
import { aktifDiller } from '@/lib/tenant';

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
  const diller = aktifDiller();

  /*
    ⚠️ Tek dilli kiracıda hiç çizilmiyor. Tek seçenekli bir "değiştirici"
    kontrol değil, gürültü — üstelik müşteriye sitenin başka bir dili
    olduğunu ama ona verilmediğini düşündürür.

    `NEXT_PUBLIC_TENANT` derleme anında paketin içine gömüldüğü için bu
    istemci bileşeninde de okunabiliyor.
  */
  if (diller.length < 2) return null;

  return (
    <div
      className={`flex items-center gap-1.5 text-[9px] tracking-[0.18em] ${className}`}
    >
      {diller.map((locale, index) => (
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
              /*
                ⚠️ **Çerçevede önden getirme kapalı — ölçüldü** (2026-08-12,
                üretim derlemesi). Next görüş alanındaki her bağlantıyı önden
                getiriyor; künye sayfasında bunun faturası **20 istek / 34 KB**tı
                ve tamamı çerçeveye gidiyordu: `/notes` 6, dil anahtarı 6,
                `/` 4, `/signin` 4 kez. Aynı adres birden çok kez, çünkü Next
                ayrı önbellek anahtarlarıyla ayrı ayrı soruyor.

                Okurun asıl yolu olan komşu bağlantıları o listede **hiç
                yoktu** — yani bütçenin yüzde yüzü, nadiren tıklanan dört
                bağlantıya harcanıyordu.

                Nota dizininde verilen kararın aynısı (`notes/page.tsx`).
                Bedeli: ilk tıklamada sayfa hazır beklemiyor. Dil değiştirmek
                bir oturumda en fazla bir kez yapılıyor; hazır bekletmeye
                değmez. Geri istenirse tek prop.
              */
              prefetch={false}
              hrefLang={locale}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
                  return;
                }
                event.preventDefault();
                router.push(switchPath(pathname, window.location.search, locale));
              }}
              className="text-white/50 transition-colors hover:text-white/70"
            >
              {locale.toUpperCase()}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
