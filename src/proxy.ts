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

  if (first === DEFAULT_LOCALE) {
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
  Uzantılı dosyalar dışarıda kalmak zorunda: `public/intro.js` ve `favicon.ico`
  yeniden yazılsaydı `/en/intro.js` olur ve 404 dönerlerdi. `_next` de aynı
  sebeple.
*/
export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
