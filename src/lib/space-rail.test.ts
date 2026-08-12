import { describe, expect, test } from 'vitest';
import { PERFUMES } from '../data/perfumes';
import { buildMarks } from './space-marks';
import { feelAnchor, feelMatch } from './space-feel';
import {
  RAIL_HALF_MAX,
  RAIL_HALF_MIN,
  RAIL_REACH,
  makeRail,
  railFeel,
  railHalf,
  railOffset,
  railValue,
  railX,
} from './space-rail';

const WIDTHS = [320, 390, 768, 1440, 3840];

describe('railHalf', () => {
  test('her ekranda bantta kalıyor ve daralmıyor', () => {
    let previous = 0;
    for (let width = 240; width <= 5120; width += 40) {
      const half = railHalf(width);
      expect(half).toBeGreaterThanOrEqual(RAIL_HALF_MIN);
      expect(half).toBeLessThanOrEqual(RAIL_HALF_MAX);
      expect(half).toBeGreaterThanOrEqual(previous);
      previous = half;
    }
  });
});

describe('makeRail / railValue', () => {
  test('ILK PIKSELDE SICRAMA YOK — basılan yer noktanın kendi sıcaklığı', () => {
    /*
      ⚠️ Rayın bütün mekaniği bu satırda. Ray sabit bir yere çizilseydi parmak
      dokunduğu anda nokta rayın ortasına zıplar, kullanıcı da haritayı
      "kendiliğinden oynadı" diye okurdu.
    */
    for (const width of WIDTHS) {
      for (let step = 0; step <= 100; step += 1) {
        const feel0 = step / 100;
        const rail = makeRail('a', feel0, 500, 300, width);
        expect(railValue(rail, 500), `${width} / ${feel0}`).toBeCloseTo(feel0, 9);
      }
    }
  });

  test('gidiş dönüş: yazılan yer okunan yer', () => {
    const rail = makeRail('a', 0.3, 400, 200, 1440);
    for (let step = 0; step <= 100; step += 1) {
      const value = step / 100;
      expect(railValue(rail, railX(rail, value))).toBeCloseTo(value, 9);
    }
  });

  test('sağa sürüklemek ısıtıyor, sola soğutuyor — hiç geri dönmeden', () => {
    const rail = makeRail('a', 0.5, 400, 200, 1440);
    let previous = -1;
    for (let sx = -400; sx <= 1200; sx += 7) {
      const value = railValue(rail, sx);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  test('uçlarda kırpılıyor, taşmıyor', () => {
    const rail = makeRail('a', 0.5, 400, 200, 1440);
    expect(railValue(rail, -1e6)).toBe(0);
    expect(railValue(rail, 1e6)).toBe(1);
  });

  test('bırakınca nokta tam yerine dönüyor', () => {
    for (const feel0 of [0, 0.17, 0.5, 0.83, 1]) {
      const rail = makeRail('a', feel0, 250, 120, 390);
      expect(railOffset(rail, rail.origin)).toBeCloseTo(0, 9);
    }
  });
});

describe('railFeel', () => {
  test('yalnız sıcaklık soruluyor', () => {
    expect(railFeel(0.72)).toEqual([0.72, null, null, null]);
    expect(railFeel(-3)).toEqual([0, null, null, null]);
    expect(railFeel(9)).toEqual([1, null, null, null]);
  });
});

describe('RAIL_REACH — 52 parfüm üzerinde ölçüldü', () => {
  test('ray her yerde bir şey yakıyor ve her yerde bir şey eliyor', () => {
    /*
      ⚠️ Sayının gerekçesi burada duruyor, `FEEL_REACH`in tablosu gibi.

      Iki uç da kusur: hiçbir şey yakmayan ray "bozuk" görünür, hiçbir şeyi
      elemeyen ray süs olur. Ölçü, rayın beş ayrı yerinde parlak (>0.5) ve
      dibe inmiş (=0) parfüm sayısı.
    */
    const feels = buildMarks(PERFUMES).map((mark) => mark.feel);

    for (const value of [0, 0.25, 0.5, 0.75, 1]) {
      const asked = railFeel(value);
      const anchor = feelAnchor(feels, asked);
      const scores = feels.map((feel) => feelMatch(feel, asked, anchor, RAIL_REACH));

      const parlak = scores.filter((score) => score > 0.5).length;
      const yanan = scores.filter((score) => score > 0).length;
      const sonuk = scores.filter((score) => score === 0).length;

      // Cevapsız soru yok: çapa en iyi eşleşmeyi hep tam parlaklıkta tutuyor.
      expect(parlak, `parlak @ ${value}`).toBeGreaterThanOrEqual(1);

      // Ray bir şey ELEMELI, yoksa süs olur. 0.6'da bu koşul ortada kayboluyor.
      expect(sonuk, `sonuk @ ${value}`).toBeGreaterThan(0);

      // Ama tümden söndürmemeli: uçlarda bile bir avuç parfüm yanıyor.
      expect(yanan, `yanan @ ${value}`).toBeGreaterThanOrEqual(4);
      expect(yanan, `yanan @ ${value}`).toBeLessThanOrEqual(45);
    }
  });
});
