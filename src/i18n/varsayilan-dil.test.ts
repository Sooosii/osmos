import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Öneksiz dilin kiracıdan gelmesi.
 *
 * ⚠️ **Neden gerekti:** `DEFAULT_LOCALE` sabit `'en'`di ve bu bir teslim
 * engeliydi. Türk bir dükkânın kiracı sitesi `/` adresinde Ingilizce açılıyordu;
 * listedeki **45 Türkçe hesap** tam bu yüzden ilk partiden çıkarılmıştı.
 *
 * ⚠️ Sabit modül yüklenirken hesaplanıyor (ortam derleme zamanında gömülüyor),
 * o yüzden her durum `resetModules` ile yeniden yükleniyor. Bu olmadan sınama
 * ilk durumun değerini ölçer ve **yalan söyler** — aynı tuzağa
 * `KaynakKunyesi.test.tsx`te bir kez düşüldü.
 */

const eski = process.env.NEXT_PUBLIC_TENANT;

afterEach(() => {
  if (eski === undefined) delete process.env.NEXT_PUBLIC_TENANT;
  else process.env.NEXT_PUBLIC_TENANT = eski;
  vi.resetModules();
});

async function yukle(kiraci: string | undefined) {
  if (kiraci === undefined) delete process.env.NEXT_PUBLIC_TENANT;
  else process.env.NEXT_PUBLIC_TENANT = kiraci;
  vi.resetModules();
  return import('./locale');
}

describe('varsayılan dil', () => {
  it('OSMOS derlemesinde Ingilizce — bugunku davranis birebir korunuyor', async () => {
    const { DEFAULT_LOCALE } = await yukle(undefined);
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('kiraci dil bildirmezse yine Ingilizce', async () => {
    const { DEFAULT_LOCALE } = await yukle('osmos');
    expect(DEFAULT_LOCALE).toBe('en');
  });

  /*
    ⚠️ Asıl kapı. SELVA `locales: ['tr', 'en']` yazıyor, yani Türkçe önce.
    Bu sınama düşerse Türk bir dükkânın sitesi `/` adresinde Ingilizce açılıyor
    demektir — sessizce, ve satış konuşmasında ancak müşteri fark eder.
  */
  it('kiracinin ILK bildirdigi dil oneksiz oluyor', async () => {
    const { DEFAULT_LOCALE } = await yukle('demo-selva');
    expect(DEFAULT_LOCALE).toBe('tr');
  });

  it('tek dilli Ingilizce kiraci etkilenmiyor', async () => {
    const { DEFAULT_LOCALE } = await yukle('nischengold');
    expect(DEFAULT_LOCALE).toBe('en');
  });

  /*
    Bilinmeyen kimlikte PATLAMIYOR: bu modül `global-not-found` dahil her yerde
    yükleniyor ve buradaki bir istisna sitenin kendi hata sayfasını da götürürdü.
    Kimliğin geçerliliğini `resolveTenant` derleme zamanında zaten denetliyor.
  */
  it('bilinmeyen kimlikte patlamiyor, Ingilizceye dusuyor', async () => {
    const { DEFAULT_LOCALE } = await yukle('boyle-bir-kiraci-yok');
    expect(DEFAULT_LOCALE).toBe('en');
  });
});

describe('adres biçimi varsayılan dile uyuyor', () => {
  it('Turkce varsayilanda /tr oneksiz, /en onekli', async () => {
    const { withLocale, stripLocale } = await yukle('demo-selva');

    expect(withLocale('tr', '/notes')).toBe('/notes');
    expect(withLocale('en', '/notes')).toBe('/en/notes');

    /* Öneksiz yol varsayılan dile çözülüyor — 404 sayfası buna bağlı. */
    expect(stripLocale('/notes')).toEqual({ locale: 'tr', rest: '/notes' });
    expect(stripLocale('/en/notes')).toEqual({ locale: 'en', rest: '/notes' });
  });

  it('OSMOS tarafinda hicbir sey degismiyor', async () => {
    const { withLocale, stripLocale } = await yukle(undefined);

    expect(withLocale('en', '/notes')).toBe('/notes');
    expect(withLocale('tr', '/notes')).toBe('/tr/notes');
    expect(stripLocale('/notes')).toEqual({ locale: 'en', rest: '/notes' });
  });
});
