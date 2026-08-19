import { afterEach, describe, expect, test, vi } from 'vitest';
import { absolute, pageAlternates, siteUrl } from './site-url';

/**
 * Taban adres.
 *
 * ⚠️ Varsayılan bilerek `localhost`: uydurma bir alan adı yazmak, yayına
 * çıkıldığı gün kimsenin fark etmeyeceği yanlış bir sitemap üretirdi. Yanlış
 * adres sessizce çalışır; eksik adres çalışmaz ve fark edilir.
 */
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('siteUrl', () => {
  test('hicbir cevre degiskeni yoksa localhost', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
    expect(siteUrl()).toBe('http://localhost:3000');
  });

  test('Vercel kendi adresini veriyorsa o kullaniliyor', () => {
    // Vercel bu degiskeni derleme aninda kendisi doldurup basina protokol
    // koymuyor; ilk yayinda sitemap dogru olsun diye https eklenip okunuyor.
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'osmos.vercel.app');
    expect(siteUrl()).toBe('https://osmos.vercel.app');
  });

  test('acikca yazilan adres Vercelin verdigini geciyor', () => {
    // Kendi alan adi alindigi gun tek yapilacak sey bu degiskeni koymak.
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'osmos.vercel.app');
    expect(siteUrl()).toBe('https://osmos.example');
  });

  test('cevre degiskeni dinleniyor', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example');
    expect(siteUrl()).toBe('https://osmos.example');
  });

  test('sondaki egik cizgi atiliyor — cift egik cizgi uretmesin', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example/');
    expect(siteUrl()).toBe('https://osmos.example');
  });
});

describe('absolute', () => {
  test('yolu tabana ekliyor', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example');
    expect(absolute('/tr/notes')).toBe('https://osmos.example/tr/notes');
    expect(absolute('/')).toBe('https://osmos.example/');
  });
});

describe('pageAlternates — canonical', () => {
  test('her dilin KENDI canonicali var', () => {
    /*
      ⚠️ İkisini birbirine işaret ettirmek, Türkçe sayfayı indeksten silmek
      olurdu. Eşleştirmeyi hreflang yapıyor, canonical değil.
    */
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example');
    expect(pageAlternates('/notes', 'en').canonical).toBe('https://osmos.example/notes');
    expect(pageAlternates('/notes', 'tr').canonical).toBe('https://osmos.example/tr/notes');
  });

  test('canonical SORGUSUZ yolu gosteriyor', () => {
    /*
      Kararın sebebi: uzay sayfası `?mark=<id>` (52 değer) ve `?feel=...`
      (sonsuz değer) taşıyor. Canonical olmasa sitenin en önemli sayfası
      onlarca kopya hâlinde indekslenirdi.
    */
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example');
    expect(pageAlternates('/', 'en').canonical).toBe('https://osmos.example/');
    expect(pageAlternates('/', 'tr').canonical).toBe('https://osmos.example/tr');
  });

  test('hreflang ve besleme otokesfi duruyor', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example');
    const alt = pageAlternates('/notes', 'tr');
    /*
      ⚠️ Köşeli parantez bilerek: `i18n.test.ts`teki koruma, i18n dışında
      Türkçe alanın nokta ile okunmasını yasaklıyor ve nokta yazımı bu satırı
      yakalıyordu. Burada okunan bir `Localized` değil, `Record<Locale,
      string>` — yani yanlış alarm. Yine de koruma daraltılmadı: kaba
      kalması, gerçek bir sızıntının gelecekte kaçmamasının teminatı.
      (Yorumun kendisi de aynı tuzağa düşmüştü; nokta yazımı buradan da
      çıkarıldı.)
    */
    expect(alt.languages.en).toBe('https://osmos.example/notes');
    expect(alt.languages['tr']).toBe('https://osmos.example/tr/notes');
    expect(alt.types['application/rss+xml']).toBe('/feed.xml');
  });
});

/**
 * ⚠️ **Ölçülmüş kusur (2026-08-20, nicheessence yayına alınırken).**
 *
 * Kiracının `<head>`i `/feed.xml`e `rel="alternate"` veriyordu, ama o uç
 * kiracıda 404 dönüyor (`features.feed: false`). Yani müşterinin sitesinin
 * başlığında var olmayan bir beslemeye bağlantı duruyordu — sessizce: sayfa
 * çalışır, yalnız besleme okuyucusu ve arama motoru boşa gider.
 *
 * Kapalı özelliğin sayfaları 404 (`requireAccounts`), uçları 404
 * (`ucKapali`); başlıktaki bağlantısı da olmamalı.
 */
describe('feed baglantisi kiracinin ozelligine bagli', () => {
  test('feed ACIKKEN baglanti var', () => {
    expect(pageAlternates('en', '/notes').types).toEqual({
      'application/rss+xml': '/feed.xml',
    });
  });

  test('feed KAPALIYKEN baglanti hic cizilmiyor', async () => {
    /*
      `activeTenant()` derleme zamanı değişkeninden geliyor ve sınamada
      değiştirilemiyor; bu yüzden modül taze ithal edilip kiracı katmanı
      feed'i kapalı bir kiracıymış gibi veriliyor. Ölçülen şey kayıt değil
      DAVRANIŞ: çıktıda `types` alanı hiç bulunmamalı.
    */
    vi.resetModules();
    vi.doMock('@/lib/tenant', async () => {
      const gercek = await vi.importActual<typeof import('@/lib/tenant')>('@/lib/tenant');
      return {
        ...gercek,
        activeTenant: () => ({
          ...gercek.activeTenant(),
          features: { accounts: false, notify: false, feed: false },
        }),
      };
    });

    const { pageAlternates: kapali } = await import('@/lib/site-url');
    expect(kapali('en', '/notes').types).toBeUndefined();

    vi.doUnmock('@/lib/tenant');
    vi.resetModules();
  });
});
