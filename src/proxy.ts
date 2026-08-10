import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale';

/**
 * Dil öneki katmanı.
 *
 * Üç durum var:
 *
 *   · `/tr/...`  → dokunulmuyor.
 *   · `/en/...`  → öneksiz hâline **yönlendiriliyor**. İngilizcenin tek bir
 *                  kanonik adresi olsun diye; aynı sayfa iki adreste durmasın.
 *   · geri kalan → içeriden `/en/...`e **yeniden yazılıyor**. Adres çubuğu
 *                  değişmiyor, yani `/` bugünkü gibi kalıyor. Sahibin kararı
 *                  buydu: kök bir yönlendirme değil, sayfanın kendisi.
 *
 * Next 16'da bu dosyanın adı `proxy.ts` — eskiden `middleware.ts`'ti
 * (`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split('/')[1] ?? '';

  /*
    ⚠️ Üstveri rotaları kanonik yönlendirmenin dışında.

    Next, `og:image` adresini iç yoluyla basıyor: `/en/opengraph-image`. Onu da
    `/opengraph-image`e yönlendirseydik her paylaşım robotu görseli bir atlama
    sonra alırdı — çoğu takip eder ama katı olanı almaz, ve bir paylaşım
    kartının çıkmaması sessizce olur. Ölçüldü: yönlendirmeyle 1 atlama,
    bu istisnayla 0.

    Sayfalar için kanonik kural aynen duruyor: `/en/notes` → `/notes`.
  */
  const isMetadataRoute = pathname.includes('/opengraph-image');

  if (first === DEFAULT_LOCALE && !isMetadataRoute) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || '/';
    return NextResponse.redirect(url);
  }

  if (isLocale(first)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.rewrite(url);
}

/*
  Yeniden yazmanın dışında kalması gerekenler:

  · `_next` — çatının kendi varlıkları.
  · Uzantılı dosyalar — `public/intro.js`, `sitemap.xml`, `robots.txt`.
    `/en/intro.js` diye bir şey yok, 404 dönerlerdi.
  · `icon` ve `apple-icon` — ⚠️ bunlar `app/` KÖKÜNDE duruyor, `[lang]` altında
    değil, çünkü simge dile bağlı değil. Yeniden yazılsalardı `/en/icon`a
    giderlerdi ve orada rota yok: sayfanın head'inde bağlantı görünür, tıklanan
    yerde 404 çıkardı. Sekme simgesinin gelmemesi sessizce olur — ölçülerek
    bulundu.

  `opengraph-image` bilerek bu listede DEĞİL: o `[lang]` altında ve yeniden
  yazılması gerekiyor. Onun kanonik yönlendirme istisnası yukarıda ayrı duruyor.
*/
export const config = {
  matcher: ['/((?!_next|icon|apple-icon|.*\\..*).*)'],
};
