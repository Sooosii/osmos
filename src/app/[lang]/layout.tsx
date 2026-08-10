import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locale";
import { dictFor } from "@/i18n/dict";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { SITE_BACKGROUND } from "@/lib/site-color";
import { siteUrl } from "@/lib/site-url";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Telefon tarayıcısının çubuğu da siteyle aynı siyah.
 *
 * ⚠️ Bu satır olmadan çubuk cihazın varsayılanında kalıyor: koyu sayfanın
 * üstünde açık renkli bir şerit. Masaüstünde hiç görünmüyor, telefonda her
 * sayfada görünüyor.
 */
export const viewport: Viewport = {
  themeColor: SITE_BACKGROUND,
};

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = dictFor(lang);
  return {
    /*
      Paylaşım görsellerinin mutlak adresi buradan çözülüyor. Tek kaynak
      `lib/site-url.ts`; yayına çıkıldığı gün değişecek tek satır orada.
    */
    metadataBase: new URL(siteUrl()),
    title: t.site.title,
    description: t.site.description,
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  /*
    ⚠️ `lang` artık gerçekten sayfanın dili ve bu bir davranış değişikliği:
    `lang="tr"` altında tarayıcı Türkçe büyütme kuralına geçiyor ve CSS
    `text-transform: uppercase` küçük i'yi noktalı İ'ye çevirirdi. Sitede CSS
    `uppercase` hiç kalmadığı için (bir sınama denetliyor) sorun çıkmıyor —
    o temizlik bu satırın önkoşuluydu.
  */
  return (
    <html
      lang={lang}
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider locale={lang}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
