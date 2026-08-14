import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/**
 * Sitenin sınırları — yolun bittiği iki yer.
 *
 * Bu sınama bir modülü değil iki **kurulumu** koruyor: haritada olmayan adres
 * ve kırılan sayfa. İkisi de birden çok dosyanın birlikte durmasıyla çalışıyor
 * ve biri sessizce düşerse kimse fark etmez — sayfa yine bir şey gösterir,
 * yalnızca yanlışını gösterir (Next'in çıplak belgesi, ya da doğru görüntü ama
 * HTTP 200). Hangi hâlin ne verdiği üretim derlemesinde ölçüldü; gerekçeler
 * `global-not-found.tsx`, `global-error.tsx` ve `proxy.ts`in başında.
 */

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('haritada olmayan adres', () => {
  test('global-not-found bayragi acik', () => {
    /* Bayrak kapalıyken dosya hiç derlenmiyor — hata da vermiyor (ölçüldü). */
    expect(read('next.config.ts')).toMatch(/globalNotFound:\s*true/);
  });

  test('404 sayfasi tam belge kuruyor', () => {
    const source = read('src/app/global-not-found.tsx');

    /*
      ⚠️ Düzen atlanıyor: `<html>`, `<body>`, yazı tipleri ve `globals.css` bu
      dosyada elle duruyor. Biri düşerse 404 biçimsiz açılır.
    */
    expect(source).toContain('<html');
    expect(source).toContain('<body');
    expect(source).toContain('globals.css');
    expect(source).toContain('requestLocale');
  });

  test('404 tek dosya — sinir dosyasi geri gelmedi', () => {
    /*
      ⚠️ `[lang]/not-found.tsx` denendi ve **hiç çalışmadı**: ne eşleşmeyen
      adreste ne de `notFound()` atıldığında. Geri koymak, çalışıyormuş gibi
      duran ölü bir dosya demek — ikinci kez yazılmasın.
    */
    expect(existsSync('src/app/[lang]/not-found.tsx')).toBe(false);
  });

  test('proxy gelen yolu basliga yaziyor', () => {
    const source = read('src/proxy.ts');

    /*
      İki dal da başlığı taşımak zorunda: `/tr/...` dokunulmadan geçiyor
      (`next`), geri kalanı yeniden yazılıyor (`rewrite`). Biri unutulursa o
      daldaki 404 sessizce İngilizceye düşer.
    */
    expect(source).toContain('headers.set(PATH_HEADER');
    expect(source).toMatch(/NextResponse\.next\(\{ request: \{ headers \} \}\)/);
    expect(source).toMatch(/NextResponse\.rewrite\(url, \{ request: \{ headers \} \}\)/);
  });

  test('esleyici uzanti istisnasi tasimiyor', () => {
    /*
      ⚠️ Eşleyicide uzantı istisnası (`.*\..*`) bir delikti: `/foo.js` gibi
      uydurma adresler proxy'ye uğramadan `[lang]`e düşüyor ve çıplak hata
      belgesi gösteriyordu. Kök varlıklar artık `ROOT_ASSETS`te ada ada sayılı.

      Dışarıda duran iki önek platformun kendi yolları, uzantı istisnası değil:
      `_next` çatının varlıkları, `_vercel` analitiğin damarı (`proxy.ts`teki
      gerekçe). İkisi de ada bakıyor, noktaya değil — delik geri açılmıyor.
    */
    const source = read('src/proxy.ts');

    expect(source).toContain("matcher: ['/((?!_next|_vercel).*)']");
    expect(source).toContain('ROOT_ASSETS.has(pathname)');
  });

  test('bilinmeyen kimlik hic cizilmiyor', () => {
    for (const path of [
      'src/app/[lang]/perfume/[id]/page.tsx',
      'src/app/[lang]/note/[id]/page.tsx',
    ]) {
      expect(read(path), path).toMatch(/export const dynamicParams = false;/);
    }
  });
});

/**
 * Bir şey kırıldığında.
 *
 * 404'ün kardeşi ve aynı sebeple burada: hata ekranı da birden çok dosyanın
 * birlikte durmasıyla çalışıyor, biri düşerse ziyaretçi sitenin dünyasından
 * çıkıyor. İkisi de ölçüldü (üretim derlemesi, bilerek patlatılarak).
 */
describe('bir sey kirildiginda', () => {
  test('iki sinir da yerinde', () => {
    /*
      ⚠️ İkisi ayrı iki olayı karşılıyor, biri diğerinin yerine geçmiyor:
      `[lang]/error.tsx` sayfanın (ve altındaki düzenlerin) hatasını, kök
      düzenin kendi hatasını ise yalnızca `global-error.tsx` yakalıyor.
    */
    expect(existsSync('src/app/[lang]/error.tsx')).toBe(true);
    expect(existsSync('src/app/global-error.tsx')).toBe(true);
  });

  test('sinirlar istemci bileseni', () => {
    /* Sınır bileşeni olmanın şartı; `use client` düşerse derleme kırılır. */
    for (const path of ['src/app/[lang]/error.tsx', 'src/app/global-error.tsx']) {
      expect(read(path), path).toMatch(/^'use client';/);
    }
  });

  test('kok sinir kendi belgesini kuruyor', () => {
    const source = read('src/app/global-error.tsx');

    /*
      ⚠️ Kök düzenin yerine geçiyor: `<html>`, `<body>`, yazı tipi ve
      `globals.css` burada elle duruyor. Üstveri dışa aktarımı istemci
      bileşeninde çalışmadığı için başlık React'in `<title>`ından geliyor.
    */
    expect(source).toContain('<html');
    expect(source).toContain('<body');
    expect(source).toContain('globals.css');
    expect(source).toContain('<title>');
  });

  test('yeniden deneme unstable_retry ile', () => {
    /*
      ⚠️ Next 16'da prop adı `unstable_retry`; `reset` de duruyor ama yalnızca
      sınırın durumunu temizliyor, içeriği yeniden getirmiyor. Belgenin önerisi
      `unstable_retry` (error.md).
    */
    for (const path of ['src/app/[lang]/error.tsx', 'src/app/global-error.tsx']) {
      expect(read(path), path).toContain('unstable_retry');
    }
  });
});

/**
 * Kökte duran varlıklar.
 *
 * Hepsi `proxy.ts`teki `ROOT_ASSETS` listesinden geçiyor; listede olmayan bir
 * kök adres dil önekiyle yeniden yazılır ve 404 döner. Bu **sessizce** olur:
 * site çalışmaya devam eder, yalnızca o varlık kaybolur.
 */
describe('kok varliklari', () => {
  test('kok rotasi olan her sey listede', () => {
    const source = read('src/proxy.ts');

    for (const path of [
      '/robots.txt',
      '/sitemap.xml',
      '/icon',
      '/apple-icon',
      '/manifest.webmanifest',
      '/icon-512',
      '/feed.xml',
      '/sw.js',
    ]) {
      expect(source, path).toContain(`'${path}'`);
    }
  });

  test('api adresleri onekle geciyor, esleyicinin disinda degil', () => {
    /*
      ⚠️ İki ayrı şey ve karıştırılmamalı:

        · `/api/...` proxy'den GEÇİYOR (eşleyicinin içinde) — yalnızca yeniden
          yazılmıyor. Önek listesi bunun için.
        · Eşleyiciye `api` eklenseydi o adresler proxy'ye hiç uğramazdı ve
          kapatılmış delik geri açılırdı: proxy'siz adres `[lang]`e düşer,
          kök düzen `notFound()` atar, hiçbir sınır saramaz.

      Bu sınama ikisini birden tutuyor: önek var, eşleyici temiz.
    */
    const source = read('src/proxy.ts');

    expect(source).toContain("ROOT_PREFIXES");
    expect(source).toContain("'/api/'");
    expect(source).toContain('isRootPath(pathname)');
    expect(source).toContain("matcher: ['/((?!_next|_vercel).*)']");
  });

  test('manifest simgeleri gercek rotalari gosteriyor', () => {
    /*
      ⚠️ Manifest'teki adresler elle yazılıyor; biri yoksa telefon simgeyi
      indiremez ve bunu kimse görmez. Üçünün de bir dosyası olmalı.
    */
    const manifest = read('src/app/manifest.ts');

    expect(manifest).toContain("'/icon'");
    expect(existsSync('src/app/icon.tsx')).toBe(true);
    expect(manifest).toContain("'/apple-icon'");
    expect(existsSync('src/app/apple-icon.tsx')).toBe(true);
    expect(manifest).toContain("'/icon-512'");
    expect(existsSync('src/app/icon-512/route.tsx')).toBe(true);
  });

  test('service worker iki olayi da dinliyor', () => {
    /*
      Çalışanın tek işi bildirim: push olayını ekrana çevirmek ve dokunuşu
      sayfaya açmak. Sayfa önbelleği ya da fetch araya girmesi YOK — biri
      eklenirse bu sınama değil, tasarım kararı değişmiş demektir.
    */
    const source = read('public/sw.js');
    expect(source).toContain("addEventListener('push'");
    expect(source).toContain("addEventListener('notificationclick'");
    /* Çalışan kendi kendine yeter; dışarıdan betik çekmek delik olurdu. */
    expect(source).not.toContain('importScripts');
  });

  test('sw.js http onbellegine takilmiyor', () => {
    /*
      ⚠️ Tarayıcı çalışanı HTTP önbelleğinden tazeleyebiliyor; başlık düşerse
      eski çalışan günlerce takılı kalır ve bunu kimse görmez. Kayıt tarafı
      da `updateViaCache: 'none'` ile aynı sözü veriyor (`NotifyControl`).
    */
    expect(read('next.config.ts')).toMatch(/source: '\/sw\.js'/);
    expect(read('next.config.ts')).toContain('no-cache');
  });

  test('simge cizimi tek yerde', () => {
    /*
      Üç rota da aynı kareyi basıyor. Çizim kopyalanırsa biri düzeltilip
      öbürleri unutulduğunda site sekmede başka, ana ekranda başka görünür.
    */
    for (const path of ['src/app/icon.tsx', 'src/app/apple-icon.tsx', 'src/app/icon-512/route.tsx']) {
      expect(read(path), path).toContain('logoSquare');
      expect(read(path), path).not.toContain('LOGO_DOTS');
    }
  });
});
