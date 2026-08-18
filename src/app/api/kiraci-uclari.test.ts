import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

/**
 * Kiracıda hangi ucun açık, hangisinin kapalı olduğunun kapısı.
 *
 * ⚠️ **Bu sınamanın işi kapatmak değil, KARAR VERDİRMEK.** Kapalı özelliğin
 * sayfaları 404 dönüyor (`requireAccounts`, `requireMainSite`) ama uçları
 * dönmüyordu: 2026-08-18'de ölçüldü, `/api/shelf` kiracıda **200
 * `{"entries":[]}`** veriyordu. Veri sızmıyordu, yine de cümle yanlıştı —
 * müşterinin sitesinde olmayan bir özelliğin ucu cevap veremez.
 *
 * ⚠️ **"Hepsini kapat" yanlış cevaptı ve ölçüm onu eledi.**
 * `/api/perfume-search` kiracıda ÇALIŞIYOR: arama kutusu hem çerçevede
 * (`ScreenFrame.tsx`) hem uzayda (`space/SpaceOverlays.tsx`) çiziliyor ve uç
 * kiracı derlemesinde yalnız **kiracının kendi** katalogunu basıyor
 * (`data/perfumes.ts` dikişi). Kapatmak kiracının aramasını öldürürdü.
 *
 * Kural: `src/app/api/` altındaki her `route.ts` ya `ucKapali(...)` çağırır ya
 * da aşağıdaki listede **gerekçesiyle** durur. Yeni bir uç eklendiğinde bu
 * sınama düşer ve karar vermeden geçilemez — asıl istenen bu.
 */

const API = resolve(__dirname);

/**
 * Kiracıda bilerek AÇIK kalan uçlar.
 *
 * Buraya bir satır eklemek "bu uç müşterinin sitesinde de çalışsın" demektir.
 * Gerekçesi yazılmadan eklenmemeli.
 */
const ACIK: Readonly<Record<string, string>> = {
  'perfume-search/route.ts':
    'Arama kutusu kiracıda da çiziliyor ve uç kiracının KENDI katalogunu basıyor.',
};

function rotaDosyalari(dizin: string): string[] {
  const cikti: string[] = [];
  for (const ad of readdirSync(dizin)) {
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) {
      cikti.push(...rotaDosyalari(yol));
      continue;
    }
    if (ad === 'route.ts' || ad === 'route.tsx') cikti.push(yol);
  }
  return cikti;
}

describe('kiracı uçları', () => {
  const dosyalar = rotaDosyalari(API);

  it('en az bir uç bulundu (tarayıcı sessizce boşa düşmesin)', () => {
    expect(dosyalar.length).toBeGreaterThan(0);
  });

  it.each(dosyalar.map((d) => relative(API, d).split(sep).join('/')))(
    '%s ya kapıyı çağırıyor ya da gerekçeli açık listesinde',
    (bagil) => {
      const kaynak = readFileSync(join(API, bagil), 'utf8');
      const kapiVar = kaynak.includes('ucKapali(');
      const acikMi = bagil in ACIK;

      /*
        İkisi birden olamaz: hem kapı çağırıp hem "bu uç açık" demek, okuyan
        kişiye iki farklı şey söyler.
      */
      expect(kapiVar && acikMi, `${bagil}: hem kapı hem açık listesi`).toBe(false);
      expect(kapiVar || acikMi, `${bagil}: karar verilmemiş — ya ucKapali(...) çağır ya ACIK listesine gerekçesiyle ekle`).toBe(true);
    },
  );

  it('açık listesindeki her satırın gerekçesi yazılı', () => {
    for (const [ad, gerekce] of Object.entries(ACIK)) {
      expect(gerekce.length, `${ad} gerekçesiz`).toBeGreaterThan(20);
    }
  });

  it('açık listesinde artık var olmayan bir uç kalmamış', () => {
    const mevcut = new Set(dosyalar.map((d) => relative(API, d).split(sep).join('/')));
    for (const ad of Object.keys(ACIK)) {
      expect(mevcut.has(ad), `${ad} listede ama dosya yok`).toBe(true);
    }
  });
});
