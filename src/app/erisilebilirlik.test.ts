import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

/**
 * Erişilebilirliğin sessizce kapanan kapıları.
 *
 * Bu dosya bir modülü değil beş **kurulumu** koruyor. Beşi de 2026-08-12'de
 * gerçek tarayıcıda ölçülerek bulundu ve beşinin de ortak huyu şu: kırıldığında
 * hiçbir şey kırılmıyor. Derleme geçer, lint susar, sayfa çizilir; yalnızca
 * fare kullanmayan ya da ekranı görmeyen biri dışarıda kalır — ve o kişi
 * geri bildirim göndermez.
 *
 * Sınamalar kaynak metnine bakıyor, davranışa değil. Kaba ama doğru araç:
 * korunan şeyin tamamı zaten birer satırlık kurulum.
 */

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('acilis kapisi', () => {
  test('klavyeyle de aciliyor', () => {
    /*
      ⚠️ ÖLÇÜLDÜ (2026-08-12, Chromium): uğurlama yalnızca `wheel`, `scroll` ve
      `pointerdown`a bağlıyken faresiz gezen biri perdenin arkasında kalıyordu.
      Uzay `fixed inset-0 overflow-hidden`, yani Tab ile odak gezdirmek sayfayı
      kaydırmıyor da — üç olayın üçü birden hiç ateşlenmiyordu. Tab + Enter
      denendi: odak alttaki listeye geçiyor ama katman tam opaklıkta duruyordu.

      Bu satır kalkarsa hata sessizce geri gelir: içerik yine erişilebilir
      görünür (katman `pointer-events-none`), yalnızca ekranda siyah bir
      astronot durur.
    */
    const source = read('src/components/AstronotIntro.tsx');

    expect(source).toContain("window.addEventListener('keydown', leave");
    expect(source).toContain("window.removeEventListener('keydown', leave)");
  });

  test('sus tuvalleri duyurulmuyor', () => {
    /*
      Zemin ve astronot saf süs; adsız bir tuval ekran okuyucuda anlamsız bir
      gürültü. Uzayın tuvalinde aynı politika zaten vardı, açılışta yoktu.
    */
    const source = read('src/components/AstronotIntro.tsx');
    const canvases = source.match(/<canvas[\s\S]*?\/>/g) ?? [];

    expect(canvases.length).toBeGreaterThan(0);
    for (const canvas of canvases) {
      expect(canvas, canvas.slice(0, 60)).toContain('aria-hidden="true"');
    }
  });
});

describe('her sayfanin govdesi', () => {
  /* `join` bilerek: Windows'ta `readdirSync` ayraci ters egik veriyor. */
  const pages = readdirSync('src/app/[lang]', { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.endsWith('page.tsx'))
    .map((entry) => join('src/app/[lang]', entry));

  test('sayfalar bulundu', () => {
    /* Dizin okuma sessizce boş dönerse aşağıdaki döngü hiç çalışmazdı. */
    expect(pages.length).toBeGreaterThan(10);
  });

  test('hepsinde main isareti var', () => {
    /*
      ⚠️ İki taslak sayfada (`space`, `evolution`) yoktu — ölçüldü. Landmark
      olmadan ekran okuyucu "ana içeriğe atla" diyemiyor, kişi menüden
      başlayarak her şeyi dinlemek zorunda kalıyor.
    */
    for (const page of pages) {
      expect(read(page), page).toMatch(/<main[\s>]/);
    }
  });

  test('kapida bir baslik var', () => {
    /*
      ⚠️ Sitenin en çok görülen sayfasında **hiç başlık yoktu** (hiçbir
      düzeyde). Görünmez bir başlık eklenmedi: ekranda zaten duran ad `h1`
      yapıldı, yani gören ve görmeyen aynı şeyi okuyor. `p`ye geri
      çevrilirse sayfa yine başlıksız kalır.
    */
    expect(read('src/app/[lang]/page.tsx')).toMatch(/<h1[\s>]/);
  });
});

describe('adsiz denetim yok', () => {
  test('stuydonun arama kutusunun adi var', () => {
    /*
      ⚠️ Sitedeki tek adsız denetim buydu: kutunun tek adı `placeholder`dı ve
      o, yazmaya başlayınca kayboluyor. Giriş, ayar ve şifre formlarının
      alanları zaten etiketli — bu sınama o kuralın yazılı hâli.
    */
    const source = read('src/components/Studio.tsx');
    const inputs = source.match(/<input[\s\S]*?\/>/g) ?? [];

    expect(inputs.length).toBeGreaterThan(0);
    for (const input of inputs) {
      if (!input.includes('placeholder=')) continue;
      expect(input, input.slice(0, 80)).toMatch(/aria-label=/);
    }
  });
});
