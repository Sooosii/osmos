'use client';

import { usePathname } from 'next/navigation';
import { ErrorBody } from '@/components/ErrorBody';
import { stripLocale } from '@/i18n/locale';

/**
 * Sayfa çizilirken bir şey patlarsa.
 *
 * ⚠️ **Sınır düzenin İÇİNDE duruyor**, yani `[lang]/layout.tsx` çizilmiş
 * oluyor: `<html>`, yazı tipi ve `globals.css` hazır geliyor, burada yeniden
 * kurulmuyor. Düzenin KENDİSİ patlarsa bu dosya devreye giremiyor — o durumun
 * karşılığı `app/global-error.tsx`.
 *
 * ⚠️ Prop adı `unstable_retry`, `reset` DEĞİL. Next 16'da belge ikisini de
 * tanıyor ama `reset` yalnızca sınırın durumunu temizliyor; `unstable_retry`
 * içeriği yeniden getirip yeniden çiziyor ve önerilen o
 * (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`).
 *
 * ⚠️ **Ölçüldü (üretim derlemesi):** çizim SUNUCUDA patlarsa Next boş bir kabuk
 * gönderiyor (`<html id="__next_error__">`) ve bu ekran ancak tarayıcıda,
 * hidrasyondan sonra beliriyor; durum kodu 500. Yani JavaScript kapalıysa
 * ziyaretçi boş sayfa görür — bu Next'in davranışı, sınırın eksiği değil.
 *
 * Dil adresten okunuyor: sınır bileşenlerine Next parametre geçmiyor.
 */
export default function SegmentError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const { locale } = stripLocale(usePathname());

  return <ErrorBody locale={locale} onRetry={unstable_retry} />;
}
