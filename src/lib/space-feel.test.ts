import { describe, expect, test } from 'vitest';
import { FEEL_REACH, NO_FEEL, feelAnchor, feelMatch, normalizeAxis } from './space-feel';

/**
 * Sinestezi kaydıraçlarının geometrisi.
 *
 * Modül saf olduğu için tuval, React ya da tarayıcı gerekmiyor — `space-approach.test.ts`
 * ile aynı sözleşme. Sınanan şey davranış: dokunulmamış kaydıraç uzayı değiştiriyor mu,
 * eksen gözlenen aralığa gerçekten yayılıyor mu, uzaklaştıkça yakınlık azalıyor mu.
 */

/** Birim karenin ortası — hangi köşeye de olsa eşit uzaklıkta. */
const CENTER = [0.5, 0.5] as const;

describe('normalizeAxis', () => {
  test('gözlenen uçlar 0 ve 1e oturuyor', () => {
    const out = normalizeAxis([-0.3, 0.1, 0.42]);

    expect(out[0]).toBeCloseTo(0);
    expect(out[2]).toBeCloseTo(1);
  });

  test('aradaki değer oranını koruyor', () => {
    // 0.1, −0.3 ile 0.42 arasında tam olarak yolun %55.6'sında.
    const out = normalizeAxis([-0.3, 0.1, 0.42]);

    expect(out[1]).toBeCloseTo(0.4 / 0.72);
  });

  test('teorik aralığa değil GÖZLENENE yayıyor', () => {
    // Asıl mesele bu. characterVector() ağırlıklı ortalama döndürdüğü için
    // değerler −1…+1'in çok içinde kümeleniyor. Teorik aralığa bölseydik
    // kaydıracın yolunun büyük kısmı ölü olurdu: uçlara gidince hiçbir nokta
    // parlamaz, kimse bir şey değiştiğini görmezdi.
    const dar = normalizeAxis([0.10, 0.14, 0.18]);

    expect(dar[0]).toBeCloseTo(0);
    expect(dar[2]).toBeCloseTo(1);
  });

  test('bütün değerler eşitken sıfıra bölmüyor', () => {
    const out = normalizeAxis([0.2, 0.2, 0.2]);

    // Ekseni ayıran bilgi yok; hepsi ortada duruyor. NaN dönmek çizimi
    // sessizce boşaltırdı — nokta çizilmez, sebebi de görünmez.
    expect(out).toEqual([0.5, 0.5, 0.5]);
    for (const value of out) expect(Number.isNaN(value)).toBe(false);
  });

  test('boş liste boş dönüyor', () => {
    expect(normalizeAxis([])).toEqual([]);
  });
});

describe('feelAnchor', () => {
  test('en yakın noktanın uzaklığını veriyor', () => {
    const anchor = feelAnchor([[0.9, 0.9], [0.5, 0.7], [0.1, 0.2]], CENTER);

    expect(anchor).toBeCloseTo(0.2);
  });

  test('sorulmadıysa sıfır', () => {
    expect(feelAnchor([[0.9, 0.9]], NO_FEEL)).toBe(0);
  });

  test('boş havuzda sonsuz değil sıfır dönüyor', () => {
    // Sonsuz dönseydi feelMatch'te `behind` −Infinity olur, üs alma NaN üretir
    // ve bütün nokta sessizce çizilmezdi.
    expect(feelAnchor([], CENTER)).toBe(0);
  });
});

describe('feelMatch', () => {
  test('dokunulmamış kaydıraç hiçbir noktayı söndürmüyor', () => {
    // Bu dosyadaki en önemli sınama. Dokunulmamış kaydıraç "nötr istiyorum"
    // DEĞİL, "sormuyorum" demek. Ortadaki bir kaydıraç nötr sayılsaydı uzay
    // daha varış anında kendiliğinden sönerdi — kimse bir şey sormadan.
    for (const point of [[0, 0], [0.5, 0.5], [1, 1], [0.2, 0.9]] as const) {
      expect(feelMatch(point, NO_FEEL, 0)).toBe(1);
    }
  });

  test('en iyi eşleşme tarif nereye sürülürse sürülsün tam parlak', () => {
    /*
     * Özelliğin çalışıp çalışmamasını belirleyen sınama.
     *
     * Ölçü mutlak uzaklık olsaydı, kaydıraç birim karenin köşesine sürüldüğünde
     * ortada kümelenen parfümlerin HEPSİ erişimin dışında kalır ve ekran tümden
     * sönerdi. Tarayıcıda tam olarak bu görüldü. Çapaya göre ölçünce en yakın
     * olan her zaman parlıyor: uzayın her tarife verecek bir cevabı var.
     */
    const havuz = [[0.55, 0.5], [0.3, 0.4], [0.2, 0.9]] as const;
    const kose = [1, 0] as const;
    const anchor = feelAnchor(havuz, kose);

    expect(feelMatch(havuz[0], kose, anchor)).toBeCloseTo(1);
  });

  test('çapadan geride kalan azalıyor — monoton', () => {
    const yakin = feelMatch([0.5, 0.55], CENTER, 0);
    const orta = feelMatch([0.5, 0.7], CENTER, 0);
    const uzak = feelMatch([0.5, 0.9], CENTER, 0);

    expect(yakin).toBeGreaterThan(orta);
    expect(orta).toBeGreaterThan(uzak);
  });

  test('cevabın dışı sıfır — ama sıfırın altına inmiyor', () => {
    const enUzak = feelMatch([0, 0], [1, 1], 0);

    expect(enUzak).toBe(0);
    expect(enUzak).toBeGreaterThanOrEqual(0);
  });

  test('genişliğin sınırında tam sıfıra iniyor', () => {
    // Çapadan tam FEEL_REACH kadar geride.
    expect(feelMatch([0.5, 0.5 + FEEL_REACH], CENTER, 0)).toBeCloseTo(0);
  });

  test('yakınlık her zaman 0 ile 1 arasında', () => {
    for (let x = 0; x <= 1; x += 0.25) {
      for (let y = 0; y <= 1; y += 0.25) {
        const value = feelMatch([x, y], CENTER, 0);

        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  test('çapa noktanın kendi uzaklığını aşsa da 1i geçmiyor', () => {
    // Çapa havuzdan geliyor; sınanan nokta havuzda olmayabilir ve daha yakın
    // düşebilir. Kırpma olmasaydı yakınlık 1'in üstüne çıkar, opaklık taşardı.
    expect(feelMatch(CENTER, CENTER, 0.3)).toBe(1);
  });

  test('yön değil uzaklık önemli — eşit uzaklıktaki iki nokta eşit', () => {
    const sagda = feelMatch([0.7, 0.5], CENTER, 0);
    const solda = feelMatch([0.3, 0.5], CENTER, 0);
    const yukarida = feelMatch([0.5, 0.3], CENTER, 0);

    expect(sagda).toBeCloseTo(solda);
    expect(sagda).toBeCloseTo(yukarida);
  });
});
