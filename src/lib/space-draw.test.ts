import { describe, expect, test } from 'vitest';
import type { SpaceMark } from '@/data/types';
import { drawSpace, type SpaceScene } from '@/lib/space-draw';
import { type FeelTarget, NO_FEEL } from '@/lib/space-feel';
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
    /*
      ⚠️ Ray bu sınamalarda hep kapalı ve bu bilerek: dört sınama da `stroke()`
      çağrılarını SAYIYOR, biri `strokes[0]`ı okuyor. Ray açıkken çizilen
      hairline diziyi kaydırırdı. Yani "ray yalnız parmak dururken çiziliyor"
      kuralı burada da tutuluyor — kalıcı bir ray eklenirse bu sınamalar önce
      kırılır, sessizce geçmez.
    */
    rail: null,
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

describe('tarif seçim varken de konuşuyor', () => {
  /*
    ⚠️ Sahibin ekranında bulunan kusur: bir parfüm seçtikten sonra dört kaydıraç
    da hiçbir şey yapmıyordu. Sürüklüyorsun, harita kımıldamıyor.

    Ölçü nokta dolgusundan değil RAF HALKASINDAN okunuyor (`fakeContext` yalnız
    `stroke` kaydediyor): halkanın opaklığı noktanınkinden türüyor, yani sönen
    nokta sönük halka veriyor.

    Fikstür ayrı kuruluyor çünkü yukarıdaki iki nokta AYNI `feel`i taşıyor —
    hiçbir tarif onları birbirinden ayıramaz. Burada 'a' soğuk, 'b' sıcak ve
    'a', 'b'nin komşusu: yani eski kuralda seçim 'b' iken 'a' vurgulanıp tam
    parlaklıkta kalıyordu.
  */
  const cold = { ...mark('a', -0.2), feel: [0, 0.5, 0.5, 0.5] as const };
  const warm = { ...mark('b', 0.2), feel: [1, 0.5, 0.5, 0.5] as const, neighborIds: ['a'] };
  const warmAsked: FeelTarget = [1, null, null, null];

  /*
    ⚠️ SON `stroke` okunuyor, ilki değil. `drawLinks` mark döngüsünden ÖNCE
    çalışıyor; seçim varken `strokes[0]` komşu çizgisi oluyor ve onun opaklığı
    sabit (`LINK_COLOR`). Ilk yazımda tam bu yüzden 0.28 ölçülüp sınama
    yanıltıcı biçimde kırıldı.
  */
  function ringAlpha(selectedId: string | null, feel: FeelTarget) {
    const { ctx, strokes } = fakeContext();
    drawSpace(ctx, {
      ...scene(new Set(['a']), selectedId),
      marks: [cold, warm],
      feel,
    });
    return alphaOf(strokes[strokes.length - 1].style);
  }

  test('KUSURUN KENDISI: seçim varken kaydıraç konuşuyor', () => {
    // 'a' seçilinin komşusu — eski kuralda tarif ne sorarsa sorsun parlaktı.
    expect(ringAlpha('b', warmAsked)).toBeLessThan(ringAlpha('b', NO_FEEL));
  });

  test('seçim yokkenki cevapla aynı', () => {
    // Tarifin cevabı seçimden etkilenmiyor: 'a' iki durumda da aynı sönüklükte.
    expect(ringAlpha('b', warmAsked)).toBeCloseTo(ringAlpha(null, warmAsked), 6);
  });

  test('seçili noktanın kendisi sönmüyor', () => {
    // Halka bu kez seçili noktada; tarif tam tersini sorsa bile parlak kalıyor.
    const son = (feel: FeelTarget) => {
      const { ctx, strokes } = fakeContext();
      drawSpace(ctx, { ...scene(new Set(['b']), 'b'), marks: [cold, warm], feel });
      return alphaOf(strokes[strokes.length - 1].style);
    };

    expect(son([0, null, null, null])).toBeCloseTo(son(NO_FEEL), 6);
  });
});
