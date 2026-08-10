import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locale";
import { dictFor } from "@/i18n/dict";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  return { title: t.site.title, description: t.site.description };
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider locale={lang}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
