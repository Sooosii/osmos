import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/**
 * Haritada olmayan adresin kurulumu.
 *
 * Bu sınama bir modülü değil bir **kurulumu** koruyor: 404 dört ayrı dosyanın
 * birlikte durmasıyla çalışıyor ve biri sessizce düşerse kimse fark etmez —
 * sayfa yine bir şey gösterir, yalnızca yanlışını gösterir (Next'in çıplak hata
 * belgesi, ya da doğru görüntü ama HTTP 200). Hangi hâlin ne verdiği ölçüldü;
 * gerekçeler `global-not-found.tsx` ve `proxy.ts`in başında.
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
    */
    const source = read('src/proxy.ts');

    expect(source).toContain("matcher: ['/((?!_next).*)']");
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
