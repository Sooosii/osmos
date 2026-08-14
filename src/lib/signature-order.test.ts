import { describe, expect, test } from 'vitest';
import { SETTLE_TAU, rankOf, settleRows } from './signature-order';

describe('rankOf', () => {
  test('en güçlü nota en üstte', () => {
    expect(rankOf([0.2, 0.9, 0.5])).toEqual([2, 0, 1]);
  });

  test('zaten sıralı girdi olduğu gibi kalıyor', () => {
    expect(rankOf([0.9, 0.5, 0.2])).toEqual([0, 1, 2]);
  });

  test('EŞITLIKTE KARARLI — girdi sırası kazanıyor', () => {
    /*
      ⚠️ Parfümün başında ve sonunda birçok nota aynı anda sıfıra iniyor.
      Sıralama kararsız olsaydı satırlar duruyorken bile titrerdi.
    */
    expect(rankOf([0, 0, 0, 0])).toEqual([0, 1, 2, 3]);
    expect(rankOf([0.4, 0.4, 0.9])).toEqual([1, 2, 0]);
  });

  test('her sıra tam bir kez veriliyor', () => {
    const ranks = rankOf([0.3, 0.7, 0.1, 0.7, 0.9, 0.1]);
    expect([...ranks].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  test('tek satır ve boş liste', () => {
    expect(rankOf([0.5])).toEqual([0]);
    expect(rankOf([])).toEqual([]);
  });
});

describe('settleRows', () => {
  test('hedefe yakınsıyor', () => {
    let positions = [0, 1, 2];
    const targets = [2, 0, 1];
    for (let i = 0; i < 200; i += 1) positions = settleRows(positions, targets, 16);

    positions.forEach((value, index) => expect(value).toBeCloseTo(targets[index], 4));
  });

  test('hedefi aşmıyor — satır yerine otururken sekmiyor', () => {
    let positions = [0];
    for (let i = 0; i < 200; i += 1) {
      positions = settleRows(positions, [3], 16);
      expect(positions[0]).toBeGreaterThanOrEqual(0);
      expect(positions[0]).toBeLessThanOrEqual(3);
    }
  });

  test('KARE HIZINDAN BAGIMSIZ — 60 Hz ile 120 Hz aynı yere varıyor', () => {
    // ⚠️ Kare başına sabit adım 120 Hz'de iki kat hızlı olur.
    let slow = [0];
    let fast = [0];
    for (let i = 0; i < 60; i += 1) slow = settleRows(slow, [4], 16);
    for (let i = 0; i < 120; i += 1) fast = settleRows(fast, [4], 8);

    expect(slow[0]).toBeCloseTo(fast[0], 6);
  });

  test('zaman geçmediyse hiçbir şey kımıldamıyor', () => {
    expect(settleRows([0, 1], [1, 0], 0)).toEqual([0, 1]);
  });

  test('bir zaman sabiti kadar sürede yolun ~%63ü alınıyor', () => {
    // Üstel yaklaşmanın tanımı; sabitin gerçekten kullanıldığını da tutuyor.
    expect(settleRows([0], [1], SETTLE_TAU)[0]).toBeCloseTo(1 - Math.exp(-1), 6);
  });

  test('eksik konum hedefe eşit sayılıyor — yeni satır sıçramıyor', () => {
    expect(settleRows([], [2, 3], 16)).toEqual([2, 3]);
  });
});
