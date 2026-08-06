import { describe, expect, test } from 'vitest';
import { NOTES } from '../data/notes';
import {
  AXES,
  AXIS_CENTER,
  AXIS_STEPS,
  STRIP_COLUMNS,
  STRIP_ROWS,
  axisLevel,
  axisSpan,
  axisWord,
  columnMinutes,
  lifeStripCells,
} from './note-measures';

/** Bir sütunun kaç hücresi yanıyor. */
function columnFill(cells: readonly boolean[], column: number): number {
  let on = 0;
  for (let row = 0; row < STRIP_ROWS; row += 1) {
    if (cells[row * STRIP_COLUMNS + column]) on += 1;
  }
  return on;
}

/** Şeridin tamamının doluluk oranı, 0–1. */
function fillRatio(cells: readonly boolean[]): number {
  return cells.filter(Boolean).length / cells.length;
}

/** Sütun aralığının doluluk oranı, 0–1. */
function rangeFill(cells: readonly boolean[], from: number, to: number): number {
  let on = 0;
  for (let row = 0; row < STRIP_ROWS; row += 1) {
    for (let column = from; column < to; column += 1) {
      if (cells[row * STRIP_COLUMNS + column]) on += 1;
    }
  }
  return on / (STRIP_ROWS * (to - from));
}

const MID_COLUMN = STRIP_COLUMNS / 2;

/**
 * Şeridin eğimi: sol yarı − sağ yarı.
 *
 * Artı = öne yığılmış (uçucu), eksi = arkaya (kalıcı). Gözün şeritte okuduğu
 * şey bu; toplam doluluk değil.
 */
function tilt(cells: readonly boolean[]): number {
  return rangeFill(cells, 0, MID_COLUMN) - rangeFill(cells, MID_COLUMN, STRIP_COLUMNS);
}

const BERGAMOT = { peakMinutes: 2, halfLifeMinutes: 20 };
const SANDALWOOD = { peakMinutes: 120, halfLifeMinutes: 720 };

describe('columnMinutes', () => {
  test('soldan sağa artıyor', () => {
    for (let i = 1; i < STRIP_COLUMNS; i += 1) {
      expect(columnMinutes(i)).toBeGreaterThan(columnMinutes(i - 1));
    }
  });

  test('logaritmik — ilk yarı sekiz saatin çok küçük bir dilimini kaplıyor', () => {
    // Doğrusal olsaydı orta sütun 240 dakika olurdu ve bergamotun bütün
    // hikâyesi ilk iki sütuna sıkışırdı. Gerekçe note-measures.ts'te.
    expect(columnMinutes(Math.floor(STRIP_COLUMNS / 2))).toBeLessThan(60);
  });

  test('sağ uç sekiz saate oturuyor', () => {
    expect(columnMinutes(STRIP_COLUMNS - 1)).toBeCloseTo(480, 5);
  });
});

describe('lifeStripCells', () => {
  test('şerit tam ölçüsünde', () => {
    expect(lifeStripCells(BERGAMOT)).toHaveLength(STRIP_COLUMNS * STRIP_ROWS);
  });

  test('hızlı nota solda yoğun, sağda boş', () => {
    const cells = lifeStripCells(BERGAMOT);
    expect(columnFill(cells, 0)).toBeGreaterThan(columnFill(cells, STRIP_COLUMNS - 1));
    expect(columnFill(cells, STRIP_COLUMNS - 1)).toBe(0);
  });

  test('ağır nota sağ uca kadar dolu', () => {
    const cells = lifeStripCells(SANDALWOOD);
    expect(columnFill(cells, STRIP_COLUMNS - 1)).toBeGreaterThan(0);
  });

  test('hızlı nota öne, ağır nota arkaya yığılıyor — eğim işareti dönüyor', () => {
    // Şeridin tek işi bu ve **toplam doluluk onu ölçmüyor**: 136 notanın tamamı
    // 0.49–0.72 arasına sıkışıyor (ölçüldü), yani toplama bakan biri bergamotla
    // sandalı ayırt edemez. Ayıran şey eğim — bergamot sol 0.90 / sağ 0.19,
    // sandal sol 0.46 / sağ 0.87.
    expect(tilt(lifeStripCells(BERGAMOT))).toBeGreaterThan(0.5);
    expect(tilt(lifeStripCells(SANDALWOOD))).toBeLessThan(-0.3);
  });

  test('136 nota şeridin sağ ucunda geniş bir yelpazeye yayılıyor', () => {
    // Ölçüldü: sağ yarı 0.108 – 0.925. Bu aralık daralırsa 136 sayfa birbirine
    // benzemeye başlar ve şerit süse döner.
    const rights = NOTES.map((note) =>
      rangeFill(lifeStripCells(note.volatility), MID_COLUMN, STRIP_COLUMNS),
    );
    expect(Math.max(...rights) - Math.min(...rights)).toBeGreaterThan(0.5);
  });

  test('136 notanın hiçbiri boş kutu ya da düz blok değil', () => {
    for (const note of NOTES) {
      const ratio = fillRatio(lifeStripCells(note.volatility));
      expect(ratio, `${note.id} şeridi boş`).toBeGreaterThan(0.02);
      expect(ratio, `${note.id} şeridi tamamen dolu`).toBeLessThan(0.98);
    }
  });

  test('aynı girdi aynı şeridi veriyor — sunucuda ve istemcide aynı', () => {
    // Sunucu bileşeni: rastgelelik olsaydı hidrasyon uyuşmazlığı çıkardı.
    expect(lifeStripCells(BERGAMOT)).toEqual(lifeStripCells(BERGAMOT));
  });
});

describe('axisLevel', () => {
  test('0 tam ortaya düşüyor', () => {
    expect(axisLevel(0)).toBe(AXIS_STEPS / 2);
  });

  test('uçlar sıfır ve tam', () => {
    expect(axisLevel(-1)).toBe(0);
    expect(axisLevel(1)).toBe(AXIS_STEPS);
  });

  test('aralık dışı değer taşmıyor', () => {
    expect(axisLevel(-4)).toBe(0);
    expect(axisLevel(4)).toBe(AXIS_STEPS);
  });

  test('basamaklı — kaydıraçtan ayıran şey bu', () => {
    // İki yakın değer aynı basamağa düşüyor: sürekli değil, kesikli.
    expect(axisLevel(0.5)).toBe(axisLevel(0.51));
  });

  test('136 notanın dört ekseni de basamaklara sığıyor', () => {
    for (const note of NOTES) {
      for (const axis of AXES) {
        const level = axisLevel(note.character[axis.id]);
        expect(level, `${note.id}/${axis.id}`).toBeGreaterThanOrEqual(0);
        expect(level, `${note.id}/${axis.id}`).toBeLessThanOrEqual(AXIS_STEPS);
      }
    }
  });
});

describe('axisSpan', () => {
  test('tarafsız değer hiçbir hücreyi doldurmuyor', () => {
    expect(axisSpan(0)).toEqual({ from: AXIS_CENTER, to: AXIS_CENTER });
  });

  test('eksi değer ortadan sola, artı değer ortadan sağa açılıyor', () => {
    const cold = axisSpan(-0.6);
    expect(cold.to).toBe(AXIS_CENTER);
    expect(cold.from).toBeLessThan(AXIS_CENTER);

    const warm = axisSpan(0.6);
    expect(warm.from).toBe(AXIS_CENTER);
    expect(warm.to).toBeGreaterThan(AXIS_CENTER);
  });

  test('uçlar yarım şeridi dolduruyor, taşmıyor', () => {
    expect(axisSpan(-1)).toEqual({ from: 0, to: AXIS_CENTER });
    expect(axisSpan(1)).toEqual({ from: AXIS_CENTER, to: AXIS_STEPS });
  });

  test('güçlü değer zayıf değerden daha çok hücre dolduruyor', () => {
    const strong = axisSpan(-0.9);
    const weak = axisSpan(-0.2);
    expect(strong.to - strong.from).toBeGreaterThan(weak.to - weak.from);
  });

  test('136 notanın hiçbiri şeridin dışına taşmıyor', () => {
    for (const note of NOTES) {
      for (const axis of AXES) {
        const { from, to } = axisSpan(note.character[axis.id]);
        expect(from, `${note.id}/${axis.id}`).toBeGreaterThanOrEqual(0);
        expect(to, `${note.id}/${axis.id}`).toBeLessThanOrEqual(AXIS_STEPS);
      }
    }
  });
});

describe('axisWord', () => {
  const TEMPERATURE = AXES[0];

  test('merkez iki ucu birden söylüyor', () => {
    expect(axisWord(TEMPERATURE, 0)).toBe('soğuk ile sıcak arasında');
    expect(axisWord(TEMPERATURE, 0.1)).toBe('soğuk ile sıcak arasında');
  });

  test('eşiklerin her biri kendi sıfatını veriyor', () => {
    expect(axisWord(TEMPERATURE, 0.2)).toBe('hafif sıcak');
    expect(axisWord(TEMPERATURE, 0.5)).toBe('sıcak');
    expect(axisWord(TEMPERATURE, 0.9)).toBe('belirgin sıcak');
  });

  test('eksi taraf öbür ucun sıfatını veriyor', () => {
    expect(axisWord(TEMPERATURE, -0.2)).toBe('hafif soğuk');
    expect(axisWord(TEMPERATURE, -0.9)).toBe('belirgin soğuk');
  });

  test('dört bant da veride gerçekten kullanılıyor', () => {
    // Ölçüldü: 544 değerin %15/%29/%41/%16'sı. Bir bant boşalırsa eşikler
    // veriye değil tahmine dayanıyor demektir.
    const seen = new Set<string>();
    for (const note of NOTES) {
      for (const axis of AXES) {
        const word = axisWord(axis, note.character[axis.id]);
        seen.add(word.startsWith('hafif') || word.startsWith('belirgin')
          ? word.split(' ')[0]
          : word.includes(' ile ')
            ? 'arada'
            : 'düz');
      }
    }
    expect(seen).toEqual(new Set(['arada', 'hafif', 'düz', 'belirgin']));
  });
});

describe('AXES', () => {
  test('dört eksen, hepsi types.ts ile aynı sırada', () => {
    expect(AXES.map((axis) => axis.id)).toEqual([
      'temperature',
      'texture',
      'cleanliness',
      'proximity',
    ]);
  });
});
