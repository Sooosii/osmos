import { describe, expect, test } from 'vitest';
import {
  CONE_SPREAD,
  FIGURE_GONE_MS,
  HANDOFF_MS,
  HISS_MS,
  HISS_PEAK_MS,
  MAX_DROPS,
  SPRAY_ANGLE,
  SPRAY_MS,
  type Drop,
  type SampledCell,
  coverAt,
  dropAlpha,
  emitPuff,
  hissTotal,
  mistBudget,
  nozzleCell,
  stepMist,
} from './atomizer-mist';

/** Belirlenir rastgelelik — `glitter.test.ts`in deseni. */
function sequence(): () => number {
  let i = 0;
  return () => {
    i += 1;
    return (Math.sin(i * 12.9898) * 43758.5453) % 1 < 0
      ? -((Math.sin(i * 12.9898) * 43758.5453) % 1)
      : (Math.sin(i * 12.9898) * 43758.5453) % 1;
  };
}

const ORIGIN = { x: 100, y: 60 };

function puff(count: number, random = sequence()): Drop[] {
  const drops: Drop[] = [];
  emitPuff(drops, { origin: ORIGIN, count, random });
  return drops;
}

describe('emitPuff', () => {
  test('hepsi ağızdan çıkıyor', () => {
    for (const drop of puff(200)) {
      expect(drop.x).toBe(ORIGIN.x);
      expect(drop.y).toBe(ORIGIN.y);
    }
  });

  test('hepsi koninin içinde', () => {
    for (const drop of puff(400)) {
      const angle = Math.atan2(drop.vy, drop.vx);
      expect(Math.abs(angle - SPRAY_ANGLE)).toBeLessThanOrEqual(CONE_SPREAD + 1e-9);
    }
  });

  test('aynı rastgelelik aynı sisi veriyor', () => {
    expect(puff(50, sequence())).toEqual(puff(50, sequence()));
  });

  test('ORTAK RITIM YOK — hiçbir iki zerre aynı üçlüyü taşımıyor', () => {
    /*
      ⚠️ Arka plandaki nokta alanının sözleşmesi, sis için yeniden yazıldı.
      Paylaşılan tek bir sayı bile gözün yakaladığı yapay bir tekrar üretiyor;
      sahibin "sabit duragan yapay olmasın" dediği şeyin ta kendisi.
    */
    const drops = puff(300);
    const triples = new Set(drops.map((d) => `${d.vx}|${d.swirlW}|${d.life}`));
    expect(triples.size).toBe(drops.length);

    for (const field of ['drag', 'growth', 'life'] as const) {
      const values = new Set(drops.map((drop) => drop[field]));
      expect(values.size / drops.length).toBeGreaterThan(0.95);
    }
  });

  test('bütçe aşılmıyor', () => {
    const drops: Drop[] = [];
    const random = sequence();
    for (let i = 0; i < 200; i += 1) emitPuff(drops, { origin: ORIGIN, count: 50, random });
    expect(drops.length).toBeLessThanOrEqual(MAX_DROPS);
  });
});

describe('stepMist', () => {
  test('KARE HIZINDAN BAGIMSIZ — 60 Hz ile 120 Hz aynı yere varıyor', () => {
    /*
      ⚠️ `glitter.ts`ten ayrıldığı tek yer ve sebebi bu sınama. Orada `step`
      kare başına sabit ilerliyor, yani 120 Hz'lik ekranda her şey iki kat hızlı
      akıyor. İmleç izinde görünmez; süresi kapının açılmasını tetikleyen sis
      için "bazı cihazlarda yarı sürede geçiliyor" demek olurdu.
    */
    const slow = puff(40, sequence());
    const fast = puff(40, sequence());

    for (let i = 0; i < 60; i += 1) stepMist(slow, 16);
    for (let i = 0; i < 120; i += 1) stepMist(fast, 8);

    expect(slow.length).toBe(fast.length);
    for (let i = 0; i < slow.length; i += 1) {
      const span = Math.max(Math.abs(slow[i].x), 1);
      expect(Math.abs(slow[i].x - fast[i].x) / span).toBeLessThan(0.02);
    }
  });

  test('sürüklenme hızı kesiyor', () => {
    const drops = puff(30);
    for (const drop of drops) drop.swirl = 0;

    let previous = Infinity;
    for (let i = 0; i < 30; i += 1) {
      stepMist(drops, 16);
      const speed = Math.hypot(drops[0].vx, drops[0].vy);
      expect(speed).toBeLessThan(previous);
      previous = speed;
    }
  });

  test('zerreler büyüyor, hiç küçülmüyor', () => {
    const drops = puff(20);
    let previous = drops.map((drop) => drop.radius);
    for (let i = 0; i < 40; i += 1) {
      stepMist(drops, 16);
      drops.forEach((drop, index) => expect(drop.radius).toBeGreaterThanOrEqual(previous[index]));
      previous = drops.map((drop) => drop.radius);
    }
  });

  test('sonunda hepsi ölüyor', () => {
    const drops = puff(120);
    for (let t = 0; t < SPRAY_MS; t += 16) stepMist(drops, 16);
    expect(drops).toHaveLength(0);
  });

  test('dizi yerinde değişiyor — kare başına yeni dizi yok', () => {
    const drops = puff(10);
    const same = drops;
    stepMist(drops, 16);
    expect(drops).toBe(same);
  });
});

describe('dropAlpha', () => {
  test('ömür boyunca 0–1 arasında ve sonunda sıfıra iniyor', () => {
    const drops = puff(12);
    for (const drop of drops) {
      for (let age = 0; age <= drop.life; age += drop.life / 40) {
        drop.age = age;
        const alpha = dropAlpha(drop);
        expect(alpha).toBeGreaterThanOrEqual(0);
        expect(alpha).toBeLessThanOrEqual(1);
      }
      drop.age = drop.life;
      expect(dropAlpha(drop)).toBe(0);
    }
  });
});

describe('hissTotal', () => {
  test('pencere dışında sabit: önce sıfır, sonra tam bütçe', () => {
    expect(hissTotal(-1, 400)).toBe(0);
    expect(hissTotal(0, 400)).toBe(0);
    expect(hissTotal(HISS_MS, 400)).toBe(400);
    expect(hissTotal(HISS_MS + 500, 400)).toBe(400);
  });

  test('artıyor ve hiç geri gitmiyor', () => {
    let previous = 0;
    for (let t = 0; t <= HISS_MS + 20; t += 1) {
      const value = hissTotal(t, 400);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  test('KARE HIZI TISLAMAYI ATLAYAMIYOR — tek kare bile tamamını doğuruyor', () => {
    /*
      ⚠️ Ölçülen kusur. Eskiden "o anda saniyede kaç zerre" soruluyordu ve
      bileşen bunu kare başına örnekliyordu; kare hızı düşünce 220 ms'lik
      pencere iki karenin arasına düşüyor, hiç zerre çıkmıyordu. Tarayıcıda
      görüldü: perde devralındı ama sis yoktu.
    */
    const budget = 400;
    for (const frame of [8, 16, 50, 400, 1000]) {
      let emitted = 0;
      for (let t = 0; t <= HISS_MS + frame * 2; t += frame) {
        const born = Math.floor(hissTotal(t, budget) - emitted);
        if (born > 0) emitted += born;
      }
      expect(emitted, `${frame} ms'lik kare`).toBe(budget);
    }
  });

  test('tepe noktası ortadan önce — tıslama sonda değil başta patlıyor', () => {
    expect(hissTotal(HISS_PEAK_MS, 400)).toBeGreaterThan(400 * 0.25);
    expect(hissTotal(HISS_MS / 2, 400)).toBeGreaterThan(400 * 0.6);
  });
});

describe('coverAt', () => {
  test('sıfırdan başlıyor, geri dönmüyor, zamanında doluyor', () => {
    expect(coverAt(0)).toBe(0);

    let previous = 0;
    for (let t = 0; t <= 5000; t += 10) {
      const value = coverAt(t);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }

    expect(coverAt(FIGURE_GONE_MS)).toBe(1);
    // Figür, perde devralınmadan ÖNCE bitmiş olmalı.
    expect(coverAt(HANDOFF_MS)).toBe(1);
  });
});

describe('mistBudget', () => {
  test('her ekranda bantta, telefonda daha az', () => {
    for (const [w, h] of [
      [320, 568],
      [390, 844],
      [1440, 900],
      [3840, 2160],
    ]) {
      const fine = mistBudget(w, h, false);
      const coarse = mistBudget(w, h, true);
      expect(fine).toBeGreaterThanOrEqual(160);
      expect(fine).toBeLessThanOrEqual(MAX_DROPS);
      expect(coarse).toBeLessThanOrEqual(fine);
    }
  });
});

describe('nozzleCell', () => {
  const cell = (col: number, row: number): SampledCell => ({ col, row, luma: 0.5 });

  test('üst bandın en sağındaki hücre', () => {
    const cells = [cell(10, 5), cell(40, 6), cell(22, 3)];
    expect(nozzleCell(cells, 88, 51).col).toBe(40);
  });

  test('bandın ALTINDAKI daha sağ hücre ağız sayılmıyor', () => {
    // Puarın kordonu aşağıda ve sağa taşabiliyor; ağız üst yarıda.
    const cells = [cell(40, 6), cell(70, 45)];
    expect(nozzleCell(cells, 88, 51).col).toBe(40);
  });

  test('aynı sütundaki hücrelerin ortancası — ucun kenarı değil kendisi', () => {
    const cells = [cell(40, 4), cell(40, 6), cell(40, 8)];
    expect(nozzleCell(cells, 88, 51).row).toBe(6);
  });

  test('boş girdide bile ızgaranın içinde bir yer veriyor', () => {
    const fallback = nozzleCell([], 88, 51);
    expect(fallback.col).toBeGreaterThanOrEqual(0);
    expect(fallback.col).toBeLessThan(88);
    expect(fallback.row).toBeGreaterThanOrEqual(0);
    expect(fallback.row).toBeLessThan(51);
  });
});
