import { describe, expect, test } from 'vitest';
import type { SpaceMark } from '@/data/types';
import { drawSpace, type SpaceScene } from '@/lib/space-draw';
import { NO_FEEL } from '@/lib/space-feel';
import { NO_ENTRY } from '@/lib/space-entry';

/**
 * Uzayın çizimi — raf halkası.
 *
 * ⚠️ Bu modülün ilk sınaması ve kapsamı bilerek dar: çizimin tamamını
 * doğrulamak (renkler, degradeler, kenar sönümü) piksel karşılaştırması
 * ister. Burada tutulan tek şey **halkanın kararı**: kime çiziliyor ve
 * opaklığını nereden alıyor. İkisi de gözle kolayca kaçırılan, sessizce
 * bozulabilen davranışlar.
 *
 * Sahte bağlam yalnızca `stroke` çağrılarını kaydediyor; gerisi yutuluyor.
 */

interface Stroke {
  readonly style: string;
  readonly radius: number;
}

function fakeContext(): { ctx: CanvasRenderingContext2D; strokes: Stroke[] } {
  const strokes: Stroke[] = [];
  let pending = 0;

  const ctx = {
    strokeStyle: '',
    fillStyle: '' as string | CanvasGradient,
    lineWidth: 0,
    lineCap: 'butt',
    globalCompositeOperation: 'source-over',
    createRadialGradient: () => ({ addColorStop: () => {} }),
    fillRect: () => {},
    beginPath: () => {},
    arc: (_x: number, _y: number, radius: number) => {
      pending = radius;
    },
    fill: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {
      strokes.push({ style: String(ctx.strokeStyle), radius: pending });
    },
  } as unknown as CanvasRenderingContext2D & { strokeStyle: string };

  return { ctx: ctx as CanvasRenderingContext2D, strokes: strokes };
}

function mark(id: string, x: number): SpaceMark {
  return {
    id,
    name: id,
    brand: 'Deneme',
    line: null,
    color: '#ff8800',
    x,
    y: 0,
    depth: 0.5,
    neighborIds: [],
    feel: [0.5, 0.5, 0.5, 0.5],
  };
}

const marks = [mark('a', -0.2), mark('b', 0.2)];

/*
  ⚠️ Dönüş tipi yazılı ve bilerek: vitest **tip denetlemiyor.** İlk hâlinde
  görünüm alanı `minX/maxX` taşıyordu (`Viewport` `halfX/halfY` istiyor),
  sınama sessizce NaN opaklık ölçüyordu. Tip yazılınca `tsc` yakalıyor.
*/
function scene(shelved: ReadonlySet<string>, selectedId: string | null = null): SpaceScene {
  return {
    marks,
    camera: { x: 0, y: 0, scale: 1 },
    viewport: { width: 800, height: 600, halfX: 1, halfY: 1 },
    selectedId,
    hoveredId: null,
    entry: NO_ENTRY,
    feel: NO_FEEL,
    shelved,
  };
}

/** `rgba(r, g, b, a)` dizesinden alfa. */
function alphaOf(style: string): number {
  return Number(style.slice(style.lastIndexOf(',') + 1, -1).trim());
}

describe('raf halkasi', () => {
  test('yalnizca raftaki noktaya ciziliyor', () => {
    const { ctx, strokes } = fakeContext();
    drawSpace(ctx, scene(new Set(['a'])));

    /* İki nokta çizildi, halka bir tane: bağlantı yok (seçim yok). */
    expect(strokes).toHaveLength(1);
  });

  test('bos rafta hic halka yok — uzay bugunku halinde', () => {
    const { ctx, strokes } = fakeContext();
    drawSpace(ctx, scene(new Set()));
    expect(strokes).toHaveLength(0);
  });

  test('SONUK noktanin halkasi da sonuk', () => {
    /*
      ⚠️ Kararın kendisi: halkanın opaklığı noktanınkinden türüyor. Sabit
      olsaydı seçim yapıldığında sönen bir noktanın halkası parlak kalır ve
      harita "şu, şuna benziyor" derken alakasız bir noktayı işaret ederdi.
    */
    const bright = fakeContext();
    drawSpace(bright.ctx, scene(new Set(['a'])));

    const dim = fakeContext();
    /* 'b' seçili → 'a' sönüyor (komşusu değil, `neighborIds` boş). */
    drawSpace(dim.ctx, scene(new Set(['a']), 'b'));

    expect(alphaOf(dim.strokes[0].style)).toBeLessThan(alphaOf(bright.strokes[0].style));
  });

  test('halka noktanin DISINDA duruyor', () => {
    const { ctx, strokes } = fakeContext();
    drawSpace(ctx, scene(new Set(['a'])));
    /* Yarıçap, en büyük nokta yarıçapından da büyük olmalı. */
    expect(strokes[0].radius).toBeGreaterThan(4);
  });
});
