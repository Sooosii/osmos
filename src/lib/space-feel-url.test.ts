import { describe, expect, test } from 'vitest';
import { NO_FEEL } from './space-feel';
import { formatFeel, parseFeel } from './space-feel-url';

/**
 * Adres çubuğundaki tarif.
 *
 * Sınamaların çoğu bozuk girdiyle ilgili ve bu bilinçli: burası kullanıcının
 * eliyle yazabildiği tek alan. Yarısı silinmiş bir link uzayı açmamazlık
 * edemez — en kötü ihtimalle tarifi kaybeder.
 */

describe('parseFeel', () => {
  test('parametre yoksa hiçbir eksen sorulmamış sayılıyor', () => {
    expect(parseFeel(null)).toEqual(NO_FEEL);
    expect(parseFeel(undefined)).toEqual(NO_FEEL);
    expect(parseFeel('')).toEqual(NO_FEEL);
  });

  test('dolu ve boş yuvalar ayrı ayrı okunuyor', () => {
    expect(parseFeel('0.4,,0.7,')).toEqual([0.4, null, 0.7, null]);
  });

  /* Boş yuva 0 DEĞİL — biçimin bütün mesele ettiği ayrım. */
  test('boş yuva sıfırdan farklı', () => {
    expect(parseFeel(',,,')).toEqual(NO_FEEL);
    expect(parseFeel('0,0,0,0')).toEqual([0, 0, 0, 0]);
  });

  test('eksik kuyruk null ile tamamlanıyor', () => {
    expect(parseFeel('0.4')).toEqual([0.4, null, null, null]);
  });

  test('fazla yuva atılıyor', () => {
    expect(parseFeel('0.1,0.2,0.3,0.4,0.5,0.6')).toEqual([0.1, 0.2, 0.3, 0.4]);
  });

  test('aralık dışı değer kırpılıyor', () => {
    expect(parseFeel('9,-4,,')).toEqual([1, 0, null, null]);
  });

  test('sayı olmayan yuva sorulmamış sayılıyor, hata fırlatılmıyor', () => {
    expect(parseFeel('abc,0.5,,')).toEqual([null, 0.5, null, null]);
  });

  /*
    Sonsuz bir uca kırpılıp 1 yazılabilirdi; yazılmıyor. `Infinity` kullanıcının
    ayarlayabileceği bir yer değil, dolayısıyla onu bir tarif saymak kimsenin
    sormadığı bir koşulu uydurmak olurdu.
  */
  test('sonsuz değer uca kırpılmıyor, sorulmamış sayılıyor', () => {
    expect(parseFeel('Infinity,-Infinity,NaN,')).toEqual(NO_FEEL);
  });

  test('uzun ondalık kaydıraç adımına oturuyor', () => {
    expect(parseFeel('0.123456,,,')).toEqual([0.12, null, null, null]);
  });
});

describe('formatFeel', () => {
  test('hiçbir eksen sorulmamışsa parametre yazılmıyor', () => {
    expect(formatFeel(NO_FEEL)).toBeNull();
  });

  test('sondaki boş yuvalar atılıyor', () => {
    expect(formatFeel([0.4, null, null, null])).toBe('0.4');
    expect(formatFeel([0.4, null, 0.7, null])).toBe('0.4,,0.7');
  });

  test('sıfır yazılıyor, boş bırakılmıyor', () => {
    expect(formatFeel([0, null, null, null])).toBe('0');
  });

  test('gereksiz sıfır kuyruğu yok', () => {
    expect(formatFeel([0.5, 1, null, null])).toBe('0.5,1');
  });
});

describe('gidiş dönüş', () => {
  test('yazılan tarif aynen geri okunuyor', () => {
    const targets = [
      [0.4, null, 0.7, null],
      [0, 0.25, 0.5, 1],
      [null, null, null, 0.33],
      [0.12, null, null, null],
    ];

    for (const target of targets) {
      const param = formatFeel(target);
      expect(parseFeel(param)).toEqual(target);
    }
  });

  test('sorulmamış tarif gidip dönünce hâlâ sorulmamış', () => {
    expect(parseFeel(formatFeel(NO_FEEL))).toEqual(NO_FEEL);
  });
});
