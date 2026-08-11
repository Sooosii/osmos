import { describe, expect, test } from 'vitest';
import { DEFAULT_LOCALE, LOCALES, isLocale, stripLocale, switchPath, withLocale } from './locale';

/**
 * Adres katının saf tarafı.
 *
 * `space-feel-url.ts` ile aynı sözleşme ve aynı gerekçe: değiştirici bileşeni
 * sınanamaz, bu modül sınanabilir.
 */

describe('isLocale', () => {
  test('yalnizca bilinen diller', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('tr')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale('')).toBe(false);
    expect(isLocale('note')).toBe(false);
  });
});

describe('stripLocale', () => {
  test('oneksiz yol varsayilan dile ait', () => {
    expect(stripLocale('/')).toEqual({ locale: 'en', rest: '/' });
    expect(stripLocale('/notes')).toEqual({ locale: 'en', rest: '/notes' });
    expect(stripLocale('/note/oud')).toEqual({ locale: 'en', rest: '/note/oud' });
  });

  test('tr oneki ayriliyor', () => {
    expect(stripLocale('/tr')).toEqual({ locale: 'tr', rest: '/' });
    expect(stripLocale('/tr/notes')).toEqual({ locale: 'tr', rest: '/notes' });
    expect(stripLocale('/tr/note/oud')).toEqual({ locale: 'tr', rest: '/note/oud' });
  });

  test('dil adiyla baslayan gercek bir yol onek sanilmiyor', () => {
    // 'note' bir dil degil; kirpilmamali.
    expect(stripLocale('/note/tr')).toEqual({ locale: 'en', rest: '/note/tr' });
  });

  test('proxy ic yolu (/en/...) da ayriliyor', () => {
    /*
      ⚠️ Bu sınama ÖLÇÜLMÜŞ bir 404'ten doğdu (2026-08-11, üretim derlemesinde
      bütün site taranırken).

      `/en/...` "ortada dolaşmayan bir adres" sanılıyordu — proxy onu öneksiz
      hâline yönlendirdiği için. Ama proxy öneksiz yolları da İÇERİDEN
      `/en/...`e yeniden yazıyor ve `usePathname()` statik üretim sırasında
      **o iç yolu** döndürüyor. Önek tanınmayınca `switchPath` üstüne bir de
      `/tr` ekliyordu:

        /notes → usePathname() '/en/notes' → TR bağlantısı '/tr/en/notes' → 404

      Hata gizliydi: `LangSwitch`in tıklama işleyicisi düz sol tıkta araya
      girip doğru adrese gidiyor. Kırılan yalnızca Ctrl/orta tık, "bağlantıyı
      kopyala" ve **arama motorları** — yani her İngilizce sayfa bir 404'e
      bağlanıyordu.
    */
    expect(stripLocale('/en')).toEqual({ locale: 'en', rest: '/' });
    expect(stripLocale('/en/notes')).toEqual({ locale: 'en', rest: '/notes' });
    expect(stripLocale('/en/perfume/dior-oud-ispahan')).toEqual({
      locale: 'en',
      rest: '/perfume/dior-oud-ispahan',
    });
    /* Ve öbür yöne: bu yoldan üretilen bağlantı öneki iki kez almıyor. */
    expect(switchPath('/en/notes', '', 'tr')).toBe('/tr/notes');
    expect(switchPath('/en/notes', '', 'en')).toBe('/notes');
  });
});

describe('withLocale', () => {
  test('varsayilan dil onek almiyor', () => {
    expect(withLocale('en', '/')).toBe('/');
    expect(withLocale('en', '/notes')).toBe('/notes');
  });

  test('tr onek aliyor, kokte de', () => {
    expect(withLocale('tr', '/')).toBe('/tr');
    expect(withLocale('tr', '/notes')).toBe('/tr/notes');
  });
});

describe('switchPath', () => {
  test('ayni sayfanin obur dildeki hali', () => {
    expect(switchPath('/notes', '', 'tr')).toBe('/tr/notes');
    expect(switchPath('/tr/notes', '', 'en')).toBe('/notes');
    expect(switchPath('/', '', 'tr')).toBe('/tr');
    expect(switchPath('/tr', '', 'en')).toBe('/');
  });

  test('cift onek olusmuyor — ayni dile basmak yerinde birakiyor', () => {
    expect(switchPath('/tr/notes', '', 'tr')).toBe('/tr/notes');
    expect(switchPath('/notes', '', 'en')).toBe('/notes');
  });

  test('adres parametreleri korunuyor', () => {
    // Uzayda bir parfum seciliyken ya da kaydiraclar ayarliyken dil degistiren
    // kisi durumunu kaybetmemeli.
    expect(switchPath('/', '?mark=dior-oud-ispahan', 'tr')).toBe('/tr?mark=dior-oud-ispahan');
    expect(switchPath('/tr', 'mark=x&feel=0.75,,0.3,', 'en')).toBe('/?mark=x&feel=0.75,,0.3,');
  });

  test('bos parametre soru isareti birakmiyor', () => {
    expect(switchPath('/notes', '', 'tr')).toBe('/tr/notes');
    expect(switchPath('/notes', '?', 'tr')).toBe('/tr/notes');
  });
});

describe('LOCALES', () => {
  test('varsayilan dil listenin icinde ve ilk sirada', () => {
    expect(LOCALES[0]).toBe(DEFAULT_LOCALE);
    expect(LOCALES).toEqual(['en', 'tr']);
  });
});
