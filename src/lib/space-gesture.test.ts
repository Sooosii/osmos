import { describe, expect, test } from 'vitest';
import {
  AXIS_RATIO,
  MOUSE_SLOP,
  TOUCH_SLOP,
  beginProbe,
  inheritedProbe,
  isTap,
  moveProbe,
  tapSlop,
} from './space-gesture';

describe('tapSlop', () => {
  test('parmak farenin eşiğiyle ölçülmüyor', () => {
    expect(tapSlop('mouse')).toBe(MOUSE_SLOP);
    expect(tapSlop('touch')).toBe(TOUCH_SLOP);
    expect(tapSlop('pen')).toBe(TOUCH_SLOP);
    expect(tapSlop('')).toBe(TOUCH_SLOP);
    expect(tapSlop('mouse')).toBeLessThan(tapSlop('touch'));
  });
});

describe('moveProbe — dokunuş', () => {
  test('titreyen parmak hâlâ dokunuş — ölçülen kusurun kendisi', () => {
    /*
      ⚠️ Eski ölçü yol uzunluğuydu: aşağıdaki 60 titremenin toplamı 60 px eder
      ve dokunuş düşerdi. Telefonda "bastım, hiçbir şey olmadı"nın sebebi buydu.
    */
    let probe = beginProbe(200, 300, 'touch');
    for (let i = 0; i < 60; i += 1) {
      probe = moveProbe(probe, 200 + (i % 2 === 0 ? 1 : -1), 300 + (i % 3 === 0 ? 1 : -1), false);
    }
    expect(isTap(probe)).toBe(true);
    expect(probe.latch).toBe('none');
  });

  test('gerçek sürükleme dokunuşu düşürüyor ve geri getirmiyor', () => {
    let probe = beginProbe(100, 100, 'touch');
    probe = moveProbe(probe, 160, 100, false);
    expect(isTap(probe)).toBe(false);

    // Başladığı yere geri dönmek dokunuşu diriltmiyor.
    probe = moveProbe(probe, 100, 100, false);
    expect(isTap(probe)).toBe(false);
    expect(probe.moved).toBe(0);
  });

  test('eşiğin tam üstü sürükleme, tam altı dokunuş', () => {
    const touch = beginProbe(0, 0, 'touch');
    expect(isTap(moveProbe(touch, TOUCH_SLOP, 0, false))).toBe(true);
    expect(isTap(moveProbe(touch, TOUCH_SLOP + 1, 0, false))).toBe(false);

    const mouse = beginProbe(0, 0, 'mouse');
    expect(isTap(moveProbe(mouse, MOUSE_SLOP + 1, 0, false))).toBe(false);
  });
});

describe('moveProbe — kilit', () => {
  const armed = (dx: number, dy: number, railArmed = true) =>
    moveProbe(beginProbe(0, 0, 'touch'), dx, dy, railArmed).latch;

  test('eşiğin altında karar verilmiyor', () => {
    expect(armed(3, 1)).toBe('none');
  });

  test('yatay sürükleme ray, çapraz ve dikey kaydırma', () => {
    expect(armed(60, 8)).toBe('rail'); // ~8°
    expect(armed(60, 60)).toBe('pan'); // 45°
    expect(armed(8, 60)).toBe('pan'); // ~82°
  });

  test('oranın tam sınırı kaydırma sayılıyor', () => {
    expect(armed(AXIS_RATIO * 40, 40)).toBe('pan');
    expect(armed(AXIS_RATIO * 40 + 1, 40)).toBe('rail');
  });

  test('ray kollanmamışsa yatay sürükleme de kaydırma', () => {
    expect(armed(60, 8, false)).toBe('pan');
  });

  test('karar bir kez veriliyor — sonradan yön değişse de dönmüyor', () => {
    let probe = moveProbe(beginProbe(0, 0, 'touch'), 60, 2, true);
    expect(probe.latch).toBe('rail');
    probe = moveProbe(probe, 60, 400, true);
    expect(probe.latch).toBe('rail');

    let panning = moveProbe(beginProbe(0, 0, 'touch'), 2, 60, true);
    expect(panning.latch).toBe('pan');
    panning = moveProbe(panning, 400, 60, true);
    expect(panning.latch).toBe('pan');
  });
});

describe('inheritedProbe', () => {
  test('sıkıştırmadan kalan parmak dokunuş değil, süren kaydırma', () => {
    const probe = inheritedProbe(50, 50, 'touch');
    expect(isTap(probe)).toBe(false);
    expect(probe.latch).toBe('pan');
    expect(isTap(moveProbe(probe, 50, 50, true))).toBe(false);
  });
});
