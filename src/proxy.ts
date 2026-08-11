import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEFAULT_LOCALE, PATH_HEADER, isLocale } from '@/i18n/locale';
import { hostOf, shouldMoveToCanonical } from '@/lib/canonical-host';

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
/**
 * Kökte gerçekten duran adresler — yeniden yazılmayacak olanlar.
 *
 * ⚠️ **Uzantıya bakan bir kural değil, ada bakan bir liste. Bu bir delik
 * kapattı:** eskiden "nokta içeren her yol" proxy'nin dışındaydı ve
 * `/wp-login.php`, `/foo.js`, `/random.txt` gibi uydurma adresler `[lang]`
 * segmentine düşüyordu. Orada kök düzen `notFound()` atıyor ve o çağrıyı
 * hiçbir sınır saramıyor — kök düzenin kendisi kırıldığı için. Ziyaretçi
 * Next'in çıplak hata belgesini görüyordu (ölçüldü: `<html id="__next_error__">`).
 * Şimdi o adresler de buradan geçiyor, eşleşmiyorlar ve
 * `app/global-not-found.tsx`e düşüyorlar: sitenin kendi 404'ü.
 *
 * Liste kısa kalmalı; `public/` bir dosya, geri kalanı üstveri rotası. Yeni bir
 * kök varlık eklendiğinde buraya da yazılmazsa o adres 404 döner.
 */
const ROOT_ASSETS: ReadonlySet<string> = new Set([
  '/intro.js',
  '/robots.txt',
  '/sitemap.xml',
  /*
    ⚠️ `icon` ve `apple-icon` `app/` KÖKÜNDE duruyor, `[lang]` altında değil,
    çünkü simge dile bağlı değil. Yeniden yazılsalardı `/en/icon`a giderlerdi ve
    orada rota yok: sayfanın head'inde bağlantı görünür, tıklanan yerde 404
    çıkardı. Sekme simgesinin gelmemesi sessizce olur — ölçülerek bulundu.
  */
  '/icon',
  '/apple-icon',
  /*
    ⚠️ Manifest ve büyük simge de burada olmak zorunda. Yazılmazlarsa dil
    önekiyle yeniden yazılıp 404 dönerler ve bu **sessizce** olur: site
    çalışmaya devam eder, yalnızca telefonda ana ekrana eklenince site adı,
    rengi ve simgesi gelmez.
  */
  '/manifest.webmanifest',
  '/icon-512',
  /*
    Duyuru kanalları (2026-08-11): besleme derlemede üretilen statik XML,
    `sw.js` public'te duran service worker, `api/push` abone kaydının ucu.
    Üçü de dil bilmez; öneklenirlerse besleme ve çalışan sessizce 404 döner,
    abone kaydı ise hiç ulaşılamaz hâle gelir.
  */
  '/feed.xml',
  '/sw.js',
]);

/**
 * Kökte duran **adres aileleri** — tam ad değil, önek.
 *
 * ⚠️ `ROOT_ASSETS` tam adres eşleştiriyor ve bu `/api/push` için yetiyordu:
 * tek bir adres. Giriş sistemi öyle değil — Better Auth'un işleyicisi altında
 * sayısız alt yol var (`/api/auth/callback/google`, `/api/auth/sign-in/email`,
 * `/api/auth/sign-out` …) ve hepsini ada ada saymak imkânsız. Bu yüzden bir
 * önek listesi.
 *
 * ⚠️ **Eşleyiciye `api` EKLENMEYECEK** — kolay görünen ama yanlış olan yol
 * bu. `_next`/`_vercel` platformun kendi yolları; `/api` bizim. Eşleyicinin
 * dışına çıkarsa o adresler proxy'ye hiç uğramaz ve depoda bir kez ölçülüp
 * kapatılmış delik geri açılabilir: proxy'ye uğramayan adres `[lang]`e düşer,
 * orada kök düzen `notFound()` atar ve o çağrıyı hiçbir sınır saramaz —
 * ziyaretçi Next'in çıplak hata belgesini görür. Önek burada duruyor ki
 * `/api/...` proxy'den GEÇSİN, yalnızca yeniden yazılmasın.
 */
const ROOT_PREFIXES: readonly string[] = ['/api/'];

function isRootPath(pathname: string): boolean {
  return (
    ROOT_ASSETS.has(pathname) ||
    ROOT_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

/**
 * Kanonik ana bilgisayar, derleme anında bir kez çözülüyor.
 *
 * `NEXT_PUBLIC_SITE_URL` kurulu değilken `null` ve kural tamamen uykuda —
 * yani bu kod, değişken kurulmadan da güvenle yayına çıkabiliyor.
 */
const CANONICAL_HOST = hostOf(process.env.NEXT_PUBLIC_SITE_URL);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split('/')[1] ?? '';

  /*
    Eski `.vercel.app` adresi kanonik adrese taşınıyor.

    ⚠️ **Her şeyden önce**, `isRootPath`ten bile önce: sitemap, besleme ve
    paylaşım kartları da doğru adresten servis edilmeli. Aşağıdaki erken
    dönüş onları proxy'nin dışına çıkarıyor, dolayısıyla bu satır oranın
    üstünde olmak zorunda.

    ⚠️ 308, 302 değil: yöntem korunuyor (POST bir uçta bozulmasın) ve arama
    motoru kalıcı taşınma olarak okuyor. Kuralın neden yalnızca `.vercel.app`
    ile sınırlı olduğu — sonsuz döngü — `canonical-host.ts`te.
  */
  if (shouldMoveToCanonical(request.headers.get('host'), CANONICAL_HOST, process.env.VERCEL_ENV)) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = CANONICAL_HOST as string;
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  if (isRootPath(pathname)) return NextResponse.next();

  /*
    Gelen yol başlığa yazılıyor: haritada olmayan adresin sayfası dilini
    buradan çözüyor. Gerekçe `locale.ts`te `PATH_HEADER`ın başında.
  */
  const headers = new Headers(request.headers);
  headers.set(PATH_HEADER, pathname);

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

  if (isLocale(first)) return NextResponse.next({ request: { headers } });

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

/*
  Eşleyicinin dışında yalnızca `_next` ve `_vercel` var — ikisi de platformun
  kendi yolu, uzantı istisnası değil. `_next` çatının varlıkları; `_vercel`
  ölçümün damarı: Vercel Analytics komut dosyası ve sinyali
  `/_vercel/insights/...`ten akıyor. Eşleyicinin içine girseydi dil önekiyle
  `/en/_vercel/...`e yazılır, 404 döner ve ölçüm **sessizce** ölürdü — panel
  boş kalır, kimse bir hata görmezdi.

  ⚠️ Geri kalan her şey bilerek içeride. Eşleyiciye uzantı istisnası eklemek
  cazip ama tam da o, yukarıdaki deliği açan şeydi: proxy'ye uğramayan adres
  `[lang]`e düşer ve çıplak hata belgesi gösterir. Kökte duran gerçek varlıklar
  `ROOT_ASSETS`te ada ada sayılıyor.

  `opengraph-image` de bilerek içeride: o `[lang]` altında ve yeniden yazılması
  gerekiyor. Onun kanonik yönlendirme istisnası yukarıda ayrı duruyor.
*/
export const config = {
  matcher: ['/((?!_next|_vercel).*)'],
};
