import { describe, expect, test } from 'vitest';
import { MAX_SPECKS, alphaOf, emit, step, type Speck } from '@/lib/glitter';

/** Sabit "rastgele": sınama tekrarlanabilir olsun. */
const fixed = (value = 0.5) => () => value;

describe('emit', () => {
  test('duran imlec toz uretmiyor', () => {
    /* Aksi hâlde imleç durduğu yerde kalıcı bir leke birikirdi. */
    const specks: Speck[] = [];
    emit(specks, { x: 10, y: 10 }, { x: 10, y: 10 }, fixed());
    expect(specks).toHaveLength(0);
  });

  test('hizli hareket daha cok zerre uretiyor', () => {
    const yavas: Speck[] = [];
    const hizli: Speck[] = [];
    emit(yavas, { x: 0, y: 0 }, { x: 8, y: 0 }, fixed());
    emit(hizli, { x: 0, y: 0 }, { x: 80, y: 0 }, fixed());
    expect(hizli.length).toBeGreaterThan(yavas.length);
  });

  test('zerreler noktaya degil YOLA dagiliyor', () => {
    /*
      ⚠️ Hepsi son konuma bırakılsaydı hızlı imleç ardında boncuk dizisi
      bırakırdı, süreklilik değil.
    */
    const specks: Speck[] = [];
    emit(specks, { x: 0, y: 0 }, { x: 100, y: 0 }, fixed());
    const xs = specks.map((s) => s.x);
    expect(Math.min(...xs)).toBeLessThan(30);
    expect(Math.max(...xs)).toBeGreaterThan(70);
  });

  test('ust sinir asilmiyor', () => {
    const specks: Speck[] = [];
    for (let i = 0; i < 200; i += 1) {
      emit(specks, { x: 0, y: 0 }, { x: 200, y: 0 }, fixed());
    }
    expect(specks.length).toBeLessThanOrEqual(MAX_SPECKS);
  });
});

describe('step', () => {
  test('omru biten zerre atiliyor', () => {
    const specks: Speck[] = [
      { x: 0, y: 0, vx: 0, vy: 0, life: 0.005, decay: 0.01, size: 1, phase: 0 },
      { x: 0, y: 0, vx: 0, vy: 0, life: 1, decay: 0.01, size: 1, phase: 0 },
    ];
    step(specks);
    expect(specks).toHaveLength(1);
  });

  test('zerre hareket ediyor ve yavasliyor', () => {
    const specks: Speck[] = [
      { x: 0, y: 0, vx: 2, vy: 0, life: 1, decay: 0.01, size: 1, phase: 0 },
    ];
    step(specks);
    expect(specks[0].x).toBeCloseTo(2, 5);
    expect(Math.abs(specks[0].vx)).toBeLessThan(2);
  });

  test('yeterince kare sonra hepsi olur', () => {
    const specks: Speck[] = [];
    emit(specks, { x: 0, y: 0 }, { x: 60, y: 0 }, fixed());
    for (let i = 0; i < 200; i += 1) step(specks);
    expect(specks).toHaveLength(0);
  });

  test('dizi YERINDE degisiyor — her karede yeni dizi kurulmuyor', () => {
    const specks: Speck[] = [
      { x: 0, y: 0, vx: 0, vy: 0, life: 1, decay: 0.01, size: 1, phase: 0 },
    ];
    const same = specks;
    step(specks);
    expect(specks).toBe(same);
  });
});

describe('alphaOf', () => {
  test('hep 0 ile 1 arasinda', () => {
    for (const phase of [0, 1, 2, 3, 4, 5, 6]) {
      const a = alphaOf({ x: 0, y: 0, vx: 0, vy: 0, life: 1, decay: 0.01, size: 1, phase });
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(1);
    }
  });

  test('omur azaldikca soner', () => {
    const base = { x: 0, y: 0, vx: 0, vy: 0, decay: 0.01, size: 1, phase: 0 };
    expect(alphaOf({ ...base, life: 0.2 })).toBeLessThan(alphaOf({ ...base, life: 1 }));
  });
});
