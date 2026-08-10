'use client';

import { Geist } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { ErrorBody } from '@/components/ErrorBody';
import { getDict } from '@/i18n/dict';
import { stripLocale } from '@/i18n/locale';
import { SITE_BACKGROUND } from '@/lib/site-color';
import './globals.css';

/**
 * Kök düzenin kendisi patlarsa — sitenin en dip ağı.
 *
 * `[lang]/error.tsx` düzenin içinde duruyor ve düzen çizilemediğinde devreye
 * giremiyor. Bu dosya o durumu karşılıyor: **kök düzenin yerine geçiyor**,
 * yani `<html>`, `<body>`, yazı tipi ve `globals.css` burada elle kuruluyor
 * (`global-not-found.tsx` ile aynı sözleşme, aynı sebep).
 *
 * ⚠️ **Üstveri yok, `<title>` React'ten geliyor.** Sınır bileşenleri istemci
 * bileşeni olmak zorunda ve istemci bileşenlerinde `metadata`/`generateMetadata`
 * çalışmıyor; Next'in belgesi bu durumda React'in `<title>`ını öneriyor
 * (`.../03-file-conventions/error.md`, "Global Error").
 *
 * ⚠️ **Ölçüldü — bu dosya kök düzenin İSTEMCİDEKİ hatasını yakalıyor.**
 * `LocaleProvider` bilerek patlatıldı ve ekran doğru dilde, doğru başlıkla
 * çıktı. Kök düzen SUNUCUDA patlarsa hiçbir şey yakalayamıyor: Next düz metin
 * "Internal Server Error" gönderiyor, ortada hidrate edilecek belge bile yok.
 * Sınır bileşeni olmanın sınırı bu — o yüzden kök düzen sade kalmalı.
 *
 * Dil yine adresten. Burada `usePathname` kullanılabiliyor çünkü dosya zaten
 * bir istemci bileşeni — sunucuda dili başlıktan okuyan `request-locale.ts`e
 * gerek yok.
 */

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const { locale } = stripLocale(usePathname());
  const t = getDict(locale);

  return (
    <html lang={locale} className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <title>{`${t.error.mark} — ${t.site.name}`}</title>
        {/*
          Çubuk rengi burada `viewport` dışa aktarımıyla değil elle yazılıyor:
          istemci bileşenlerinde o dışa aktarım çalışmıyor, `<title>` ile aynı
          sebep. React ikisini de head'e taşıyor.
        */}
        <meta name="theme-color" content={SITE_BACKGROUND} />
        <ErrorBody locale={locale} onRetry={unstable_retry} />
      </body>
    </html>
  );
}
