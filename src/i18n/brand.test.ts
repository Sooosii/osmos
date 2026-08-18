import { describe, expect, it } from 'vitest';
import { brandStrings } from './brand';
import { EN } from './en';
import { TR } from './tr';

describe('brandStrings', () => {
  it('iç içe dizeleri değiştirir', () => {
    const out = brandStrings({ a: 'OSMOS', b: { c: 'x · OSMOS' } }, 'OSMOS', 'SELVA');
    expect(out).toEqual({ a: 'SELVA', b: { c: 'x · SELVA' } });
  });

  /*
    Başlıkların çoğu fonksiyon; sarılmasalardı düz dize değişimi onları
    atlardı ve marka sekmede kalırdı. Gerçek tarayıcıda yaşanan hata buydu.
  */
  it('fonksiyonları sarar ve dönüşlerini değiştirir', () => {
    const out = brandStrings({ t: (n: string) => `${n} · OSMOS` }, 'OSMOS', 'SELVA');
    expect(out.t('Oud')).toBe('Oud · SELVA');
  });

  it('dize dönmeyen fonksiyona dokunmaz', () => {
    const out = brandStrings({ n: () => 42 }, 'OSMOS', 'SELVA');
    expect(out.n()).toBe(42);
  });

  it('dizileri gezer', () => {
    expect(brandStrings(['OSMOS', 'a'], 'OSMOS', 'SELVA')).toEqual(['SELVA', 'a']);
  });
});

/**
 * Asıl kapı.
 *
 * ⚠️ Bu sınama gerçek bir hatadan doğdu: kiracı derlemesinde parfüm sayfası
 * sekmede "Oud Ispahan — Dior · OSMOS" yazıyordu. Ekranın hiçbir yerinde
 * görünmüyordu — yalnızca sekmede, yer iminde, paylaşılan bağlantıda ve arama
 * sonucunda. Müşteriye teslim edilen bir sitede bunun bulunması tesadüfe
 * kalırdı.
 *
 * Kapı sözlüğün tamamını geziyor ve fonksiyonları da ÇAĞIRIYOR, çünkü marka
 * çoğu yerde çağrı sonucunda beliriyor. Yeni bir başlık markayı elle yazarsa
 * burada düşer.
 */
function brandLeaks(value: unknown, brand: string, path = ''): string[] {
  if (typeof value === 'string') {
    return value.includes(brand) ? [path] : [];
  }

  if (typeof value === 'function') {
    /* Arg şekli sözlükte değişiyor (ad, marka, sayı); üçü de dize geçilebilir. */
    const result = (value as (...args: unknown[]) => unknown)('x', 'y', 'z');
    return typeof result === 'string' && result.includes(brand) ? [`${path}()`] : [];
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      brandLeaks(item, brand, path ? `${path}.${key}` : key),
    );
  }

  return [];
}

describe('kiracı sözlüğünde marka sızıntısı', () => {
  for (const [name, dict] of [
    ['EN', EN],
    ['TR', TR],
  ] as const) {
    it(`${name} markalandıktan sonra hiçbir yerde OSMOS kalmıyor`, () => {
      const swapped = brandStrings(dict, EN.site.name, 'SELVA');
      expect(brandLeaks(swapped, EN.site.name)).toEqual([]);
    });
  }

  /* Kapının gerçekten iş yaptığının kanıtı: değişim yapılmazsa sızıntı VAR. */
  it('değişim yapılmazsa sızıntı yakalanıyor — kapı boş çalışmıyor', () => {
    expect(brandLeaks(EN, EN.site.name).length).toBeGreaterThan(10);
  });
});

/**
 * Kaynak künyesinin cümlesi.
 *
 * ⚠️ **Yukarıdaki sızıntı kapısı bu hatayı YAKALAMAZ, ve incelik burada:**
 * sözlüğe "powered by OSMOS" yazılsaydı `brandStrings` onu "powered by
 * Nischengold"a çevirirdi ve sızıntı sınaması temiz derdi — ortada OSMOS
 * kalmadığı için. Ekranda ise satır kendi kendini yalanlar: müşterinin sitesi,
 * kendisi tarafından kurulduğunu söyler.
 *
 * Kural: cümle marka İÇERMEZ; markayı `KaynakKunyesi`deki `osmos.me`
 * bağlantısı söyler — bağlantı sözlükten geçmiyor.
 */
describe('kaynak künyesi cümlesi', () => {
  for (const [name, dict] of [
    ['EN', EN],
    ['TR', TR],
  ] as const) {
    it(`${name} cümlesi markadan bağımsız — değişim ona dokunmuyor`, () => {
      expect(dict.kaynak.harita).not.toContain(EN.site.name);
      expect(brandStrings(dict, EN.site.name, 'SELVA').kaynak.harita).toBe(dict.kaynak.harita);
    });
  }
});
