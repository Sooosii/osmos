import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NotFoundBody } from '@/components/NotFoundBody';
import { getDict } from '@/i18n/dict';
import { requestLocale } from '@/i18n/request-locale';
import './globals.css';

/**
 * Haritada olmayan adres — sitenin 404'ü, tek dosya.
 *
 * ⚠️ **`[lang]/not-found.tsx` bu işi YAPAMIYOR, ölçüldü ve dosya silindi.**
 * Kök düzenimiz üst düzey bir dinamik segmentte (`app/[lang]/layout.tsx`)
 * duruyor; Next'in kendi belgesi bu yapıyı `global-not-found`un iki
 * gerekçesinden biri olarak sayıyor. Sınır dosyası iki durumun **ikisinde de**
 * hiç çalışmadı — işaretle ölçüldü, ikisi de buraya düştü:
 *
 *   · haritada olmayan adres (`/yok`)          → rota hiç eşleşmiyor
 *   · eşleşen rotada `notFound()` (`/note/yok`) → çizim sırasında atılıyor
 *
 * Denenip bırakılan öbür yol: yakalayıcı rota (`[...]/page.tsx`) 404 arayüzünü
 * doğrudan çiziyordu ve **görüntüsü doğruydu ama HTTP 200 dönüyordu**. Soft 404
 * kabul edilmedi; bu dosya gerçek 404 dönüyor.
 *
 * ⚠️ Bayrak zorunlu: `next.config.ts`teki `globalNotFound` kapalıyken bu dosya
 * hiç derlenmiyor — hata da vermiyor, sessizce yok sayılıyor.
 *
 * ⚠️ **Düzen atlanıyor, yani `<html>` ve `<body>` burada elle kuruluyor** —
 * bu bir üslup tercihi değil, dosyanın sözleşmesi. Yazı tipleri ve `globals.css`
 * de bu yüzden burada ayrıca içeri alınıyor; `[lang]/layout.tsx`e eklenen bir
 * şey buraya kendiliğinden gelmez.
 *
 * Dil `params`tan gelemiyor (ortada eşleşen rota yok), adresten okunuyor:
 * gerekçesi `request-locale.ts`te.
 */

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await requestLocale());
  return {
    title: `${t.notFound.mark} — ${t.site.name}`,
    /*
      `robots: noindex` elle yazılmıyor: Next 404 dönen sayfalara onu
      kendiliğinden basıyor (belge: not-found.md). İki kaynak olmasın.
    */
  };
}

export default async function GlobalNotFound() {
  const locale = await requestLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NotFoundBody locale={locale} />
      </body>
    </html>
  );
}
