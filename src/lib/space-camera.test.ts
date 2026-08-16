import { describe, expect, test } from 'vitest';
import { PERFUMES } from '../data/perfumes';
import { buildMarks } from './space-marks';
import {
  DEFAULT_INSETS,
  FOCUS_SCALE,
  MAX_SCALE,
  MIN_SCALE,
  type Insets,
  type Placed,
  type Viewport,
  boundsOf,
  fitTo,
  fitToMarks,
  focusOn,
  insetsFromBoxes,
  markRadius,
  pixelsPerUnit,
  worldToScreen,
} from './space-camera';

/**
 * Çerçeveleme — bulutun ekranı ne kadar doldurduğu.
 *
 * Bulutun gerçek sınırları (`space-marks`ten geliyor): x ±1.0, y ±0.84.
 * Sınamalar o ölçüyle yazıldı; izdüşüm değişirse burası da yeniden ölçülür.
 */
const CLOUD = { halfX: 1, halfY: 0.84 };

function view(width: number, height: number): Viewport {
  return { width, height, ...CLOUD };
}

/** Bulutun ekranda kapladığı kutu, yüzde olarak. */
function coverage(viewport: Viewport) {
  const unit = pixelsPerUnit(viewport, 1);
  return {
    w: (CLOUD.halfX * 2 * unit) / viewport.width,
    h: (CLOUD.halfY * 2 * unit) / viewport.height,
  };
}

describe('pixelsPerUnit', () => {
  test('genis ekranda bulut tamamen sigiyor', () => {
    /* Masaüstünde kırpma YOK: iki eksen de ekranın içinde kalmalı. */
    const { w, h } = coverage(view(1280, 800));
    expect(w).toBeLessThanOrEqual(1);
    expect(h).toBeLessThanOrEqual(1);
    /* Ve dolduruyor: uzun kenar %85'in üstünde. */
    expect(Math.max(w, h)).toBeGreaterThan(0.85);
  });

  test('kare-ye yakin ekranda da kirpma yok', () => {
    const { w, h } = coverage(view(900, 800));
    expect(w).toBeLessThanOrEqual(1);
    expect(h).toBeLessThanOrEqual(1);
  });

  test('telefonda bulut ekranin kucuk bir adasi olarak kalmiyor', () => {
    /*
      ⚠️ Ölçüldü (2026-08-11, 390×844): bulut ekranın yalnızca **%36**'sını
      kaplıyordu — masaüstünde %91. Sebep geometri: bulut kareye yakın, telefon
      ise iki kat uzun; genişliğe oturtulunca dikeyde koca boşluk kalıyor.

      Portre ekranlarda ölçek dikeye doğru bir miktar açılıyor. Bedeli bilinçli:
      en kenardaki birkaç parfüm durağan görünümde ekranın dışında kalıyor ve
      sürükleyerek geliyor — harita zaten sürüklenebilir ve giriş metni bunu
      söylüyor ("Drag, zoom, touch a point").
    */
    const { h } = coverage(view(390, 844));
    expect(h).toBeGreaterThan(0.45);
  });

  test('portre acilimi sinirli — harita yarisi ekran disinda kalmiyor', () => {
    const { w } = coverage(view(390, 844));
    expect(w).toBeLessThan(1.5);
  });

  test('olcek carpani dogrudan geciyor', () => {
    const v = view(1280, 800);
    expect(pixelsPerUnit(v, 2)).toBeCloseTo(pixelsPerUnit(v, 1) * 2, 6);
  });
});

/**
 * Sığdırma — seçilen nokta ve komşuları aynı karede.
 *
 * Bulut sınırları yukarıdaki `CLOUD` ile aynı; kamera hep `INITIAL_CAMERA`dan
 * başlıyor, yani sınamalar "kullanıcı elle yakınlaşmamışken" hâlini ölçüyor.
 */
describe('fitTo', () => {
  const START = { x: 0, y: 0, scale: 1 };
  const place = (x: number, y: number, depth = 0.5): Placed => ({ x, y, depth });

  /**
   * Nokta GERÇEKTEN görünüyor mu?
   *
   * ⚠️ Sınama bir zamanlar sabit 40/64 piksellik bir kutuya bakıyordu ve
   * geçiyordu — ama ekranda hâlâ görünmeyen parfümler vardı. Sebep sınamanın
   * neyi ölçtüğüydü: sabit kutu ne kaplayan katmanları tanıyordu (telefonda sol
   * sütun 304×191) ne de noktanın kendi çapını. Merkezi kutunun içinde olan bir
   * nokta panelin altında ya da yarısı kesik olabiliyordu.
   *
   * Artık ölçüt payların kendisi: kadraj hangi payı vaat ediyorsa nokta o payın
   * içinde olmalı, üstelik yarıçapıyla birlikte.
   */
  function inFrame(
    point: Placed,
    camera: ReturnType<typeof fitTo>,
    viewport: Viewport,
    insets: Insets = DEFAULT_INSETS,
  ) {
    const { sx, sy } = worldToScreen(point, camera, viewport);
    const r = markRadius(point.depth, camera.scale);

    return (
      sx - r >= insets.left &&
      sx + r <= viewport.width - insets.right &&
      sy - r >= insets.top &&
      sy + r <= viewport.height - insets.bottom
    );
  }

  const CASES = [
    { ad: 'genis ekran', viewport: view(1440, 900) },
    { ad: 'kare-ye yakin', viewport: view(900, 800) },
    { ad: 'telefon portre', viewport: view(390, 844) },
  ];

  test('secilen nokta tam merkezde', () => {
    for (const { ad, viewport } of CASES) {
      const focus = place(0.4, -0.3);
      const camera = fitTo(START, focus, [place(0.6, -0.1), place(0.2, -0.5)], viewport);
      const { sx, sy } = worldToScreen(focus, camera, viewport);
      expect(sx, ad).toBeCloseTo(viewport.width / 2, 6);
      expect(sy, ad).toBeCloseTo(viewport.height / 2, 6);
    }
  });

  test('uc komsu da kadrajda — dar, genis ve bulut kenarindaki kumede', () => {
    const kumeler = [
      { ad: 'dar', focus: place(0, 0), others: [place(0.05, 0.04), place(-0.03, 0.06), place(0.02, -0.05)] },
      { ad: 'genis', focus: place(0, 0), others: [place(0.5, 0.4), place(-0.45, 0.3), place(0.1, -0.55)] },
      { ad: 'kenar', focus: place(0.98, 0.8), others: [place(0.6, 0.5), place(0.75, 0.82), place(0.9, 0.3)] },
    ];

    for (const { ad, focus, others } of kumeler) {
      for (const { ad: ekran, viewport } of CASES) {
        const camera = fitTo(START, focus, others, viewport);
        for (const point of [focus, ...others]) {
          expect(inFrame(point, camera, viewport), `${ad} / ${ekran}`).toBe(true);
        }
      }
    }
  });

  test('olcek bandin icinde kaliyor', () => {
    for (const { viewport } of CASES) {
      const camera = fitTo(START, place(0.2, 0.1), [place(0.9, -0.8)], viewport);
      expect(camera.scale).toBeGreaterThanOrEqual(MIN_SCALE);
      expect(camera.scale).toBeLessThanOrEqual(MAX_SCALE);
      expect(camera.scale).toBeLessThanOrEqual(FOCUS_SCALE);
    }
  });

  test('dar kume tavana yapisiyor, genis kume uzaklasiyor', () => {
    const viewport = view(1440, 900);
    const dar = fitTo(START, place(0, 0), [place(0.02, 0.01)], viewport);
    const genis = fitTo(START, place(0, 0), [place(0.9, 0.8)], viewport);

    expect(dar.scale).toBe(FOCUS_SCALE);
    expect(genis.scale).toBeLessThan(FOCUS_SCALE);
  });

  /*
    ⚠️ **Gerçekten ölçülmüş kutular** (osmos.me, tarayıcıda, 2026-08-16). Elle
    uydurulmuş sayı yok; sığdırmanın çözmek zorunda olduğu şey bu. Üçü de
    `SpaceOverlays`te `data-space-*` ile işaretli ve çalışma anında aynı
    yerlerden ölçülüyor (`kaplayan-katmanlar.ts`).

    Telefonda sol sütun daha uzun (uzay sayacı akışta), masaüstünde daha kısa
    (sayaç `fixed` olup akıştan çıkıyor) — ikisi ayrı ayrı yazılı.
  */
  const OLCULEN = [
    {
      ad: 'telefon',
      viewport: view(390, 844),
      kutular: [
        { x: 24, y: 24, width: 304, height: 191 }, // sol sütun
        { x: 0, y: 705, width: 390, height: 139 }, // alt şerit
        { x: 193, y: 24, width: 173, height: 32 }, // sağ üst kontroller
      ],
    },
    {
      ad: 'masaustu',
      viewport: view(1440, 900),
      kutular: [
        { x: 40, y: 40, width: 304, height: 169 },
        { x: 0, y: 768, width: 1440, height: 132 },
        { x: 1176, y: 40, width: 224, height: 32 },
      ],
    },
  ] as const;

  describe('insetsFromBoxes', () => {
    const telefon = OLCULEN[0];
    const masaustu = OLCULEN[1];

    /*
      ⚠️ Kuralın kendisi: her kutu EN UCUZA geldiği kenara yazılıyor. Sol sütun
      telefonda 328 piksele kadar uzanıyor — sol pay olarak yazılsaydı
      genişliğin %84'ünü yerdi ve kadraj çökerdi. Üst pay olarak yüksekliğin
      yalnızca %25'i.
    */
    test('telefonda sol sutun UST paya yaziliyor, sola degil', () => {
      const insets = insetsFromBoxes(telefon.kutular, telefon.viewport);
      expect(insets.top).toBe(215);
      expect(insets.left).toBe(DEFAULT_INSETS.left);
    });

    test('alt serit alta yaziliyor', () => {
      const insets = insetsFromBoxes(telefon.kutular, telefon.viewport);
      expect(insets.bottom).toBe(844 - 705);
    });

    /*
      Kural ekran boyuna göre kendi kararını veriyor: masaüstünde aynı sütun bir
      KÖŞE, orada da üst kenar ucuza geliyor ama pay çok daha küçük kalıyor.
      Eşik yazılmadı — `ScreenFrame`in iki kez kırılıp vardığı ilke.
    */
    test('masaustunde ayni sutun cok daha az yer yiyor', () => {
      const insets = insetsFromBoxes(masaustu.kutular, masaustu.viewport);
      expect(insets.top / masaustu.viewport.height).toBeLessThan(0.25);
    });

    test('pay hicbir zaman tabanin altina inmiyor', () => {
      expect(insetsFromBoxes([], view(390, 844))).toEqual(DEFAULT_INSETS);
    });

    test('sifir olculu kutu paya dokunmuyor', () => {
      expect(insetsFromBoxes([{ x: 0, y: 0, width: 0, height: 0 }], view(390, 844))).toEqual(
        DEFAULT_INSETS,
      );
    });
  });

  test('KUSURUN KENDISI: parfumlerin gercek yerlesiminde olculdu', () => {
    /*
      ⚠️ Bu sınama işlevin NEDEN var olduğunu yazıyor ve sayıyı veriden alıyor,
      elle seçilmiş bir örnekten değil: gerçek parfümler, gerçek komşuları,
      gerçek ekran ölçüleri. `focusOn` ile kaç parfümde en az bir komşu kadrajın
      dışında kalıyorsa, `fitTo` ile HIÇBIRINDE kalmamalı.

      ⚠️ Pay artık ölçülmüş kutulardan geliyor. Sabit payla bu sınama bir kez
      YEŞIL GEÇMIŞTI ve ekranda hâlâ görünmeyen parfümler vardı — ölçüt ne sol
      sütunu tanıyordu ne de noktanın çapını. Yeşil bir sınamanın yanlış soruyu
      sorması, kırmızı bir sınamadan tehlikeli.
    */
    const marks = buildMarks(PERFUMES);
    const byId = new Map(marks.map((mark) => [mark.id, mark]));
    const bounds = boundsOf(marks);

    for (const { ad, viewport: olcu, kutular } of OLCULEN) {
      const viewport: Viewport = { ...olcu, ...bounds };
      const insets = insetsFromBoxes(kutular, viewport);

      const disarida = (camera: ReturnType<typeof fitTo>, mark: (typeof marks)[number]) =>
        mark.neighborIds
          .map((id) => byId.get(id))
          .filter((neighbour) => neighbour !== undefined)
          .some((neighbour) => !inFrame(neighbour, camera, viewport, insets));

      const eskisi = marks.filter((mark) => disarida(focusOn(START, mark), mark));
      const yenisi = marks.filter((mark) =>
        disarida(fitToMarks(START, mark, byId, viewport, insets), mark),
      );

      // Kusur gerçek: parfümlerin çoğunda komşular kadraja sığmıyordu.
      expect(eskisi.length, ad).toBeGreaterThan(marks.length / 2);
      expect(yenisi.map((mark) => mark.id), ad).toEqual([]);
    }
  });

  /*
    ⚠️ Taban ölçek SESSIZCE bağlayabiliyor: `clamp` istenen ölçeği yukarı çeker,
    kare artık sığmaz ve hiçbir yerde belirti kalmaz. Ölçüldü — 0.6 tabanıyla
    telefonda iki, masaüstünde bir parfüm tabana dayanıyordu ve o üçünde en
    uçtaki komşu kadrajın dışında kalıyordu. Taban 0.5'e indi.

    Sınama sayıyı değil KURALI tutuyor: hiçbir parfüm tabana dayanmamalı.
    Katalog büyüyüp yayılım genişlerse burası kırmızıya döner ve karar yeniden
    verilir — sessizce bozulmaz.
  */
  test('hicbir parfum sigdirmayi taban olcege dayamiyor', () => {
    const marks = buildMarks(PERFUMES);
    const byId = new Map(marks.map((mark) => [mark.id, mark]));
    const bounds = boundsOf(marks);

    for (const { ad, viewport: olcu, kutular } of OLCULEN) {
      const viewport: Viewport = { ...olcu, ...bounds };
      const insets = insetsFromBoxes(kutular, viewport);
      const dayanan = marks.filter(
        (mark) => fitToMarks(START, mark, byId, viewport, insets).scale <= MIN_SCALE + 1e-9,
      );

      expect(dayanan.map((mark) => mark.id), ad).toEqual([]);
    }
  });

  test('komsu yoksa focusOn gibi davraniyor', () => {
    const viewport = view(1440, 900);
    const focus = place(0.3, -0.2);
    expect(fitTo(START, focus, [], viewport)).toEqual(focusOn(START, focus));
  });

  test('cakisik noktalar NaN uretmiyor', () => {
    const viewport = view(1440, 900);
    const camera = fitTo(START, place(0.3, 0.3), [place(0.3, 0.3), place(0.3, 0.3)], viewport);
    expect(Number.isFinite(camera.x)).toBe(true);
    expect(Number.isFinite(camera.y)).toBe(true);
    expect(camera.scale).toBe(FOCUS_SCALE);
  });
});
