import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import type { SpaceMark } from '@/data/types';
import {
  type Camera,
  type Viewport,
  TOUCH_HIT_PADDING,
  focusOn,
  hitTest,
  panBy,
  zoomAt,
} from '@/lib/space-camera';
import {
  type Probe,
  beginProbe,
  inheritedProbe,
  isTap,
  moveProbe,
} from '@/lib/space-gesture';
import {
  type EntryState,
  NO_ENTRY,
  advance,
  canEnter,
  holdEnabledFor,
  holdTargetHit,
} from '@/lib/space-entry';
import { dragDelta } from '@/lib/space-approach';
import type { ApproachScene } from './use-approach-scene';

/**
 * Uzayın girdi yolları — işaretçi, sürükleme, sıkıştırma, basılı tutma, tekerlek.
 *
 * Uzay tuvalinden çıkarıldı çünkü beş ref'i tamamen kendi sahipleniyor
 * (`pointersRef`, `dragRef`, `pinchRef`, `holdRef`, `navigatingRef`) ve hiçbiri
 * dışarıda başka bir anlam taşımıyor. Çizim döngüsünün girdiyi bilmesine,
 * girdinin de çizimin nasıl yapıldığını bilmesine gerek yok.
 *
 * ⚠️ Yaklaşma sürerken bütün yollar `approach.isActive()` kapısından erken
 * dönüyor. Zevk meselesi değil, ölçünün getirdiği zorunluluk — gerekçe
 * `onPointerDown`'un üstünde yazılı.
 *
 * ⚠️ `'use client'` bilerek yok — modül yalnızca istemci bileşeninden import
 * ediliyor, sınırı `ScentSpaceCanvas.tsx` çiziyor.
 */

export interface SpaceInput {
  readonly onPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  readonly onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  readonly onPointerUp: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  /** ⚠️ `onPointerUp` ile aynı şey DEĞİL; gerekçe `handlePointerCancel`da. */
  readonly onPointerCancel: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
}

/**
 * Girdi yolları kameranın, seçimin ve girişin kesiştiği yerde duruyor; bu yüzden
 * seçenek listesi geniş. Mekanik bölme o kesişmeyi taşıdı, çözmedi — daraltmanın
 * yolu hareket kararlarını saf bir modüle çıkarmaktı ve o seçenek bilerek
 * alınmadı. Listeyi kısaltmak için burada mantık birleştirilmemeli.
 */
interface SpaceInputOptions {
  readonly marks: readonly SpaceMark[];
  readonly markById: ReadonlyMap<string, SpaceMark>;
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly cameraRef: RefObject<Camera>;
  readonly viewportRef: RefObject<Viewport>;
  readonly animationRef: RefObject<{ readonly start: number } | null>;
  readonly selectedRef: RefObject<string | null>;
  readonly entryRef: RefObject<EntryState>;
  /**
   * Süren basılı tutma ve "gezinme başladı" bayrağı — kanca **kurmuyor, alıyor.**
   *
   * Sebebi tutma saatinin çizim döngüsünde işlemesi: tek saat `performance.now()`,
   * tek tüketici o döngü. Ayrı bir zamanlayıcı kurulsaydı halka bir hızda dolar,
   * geçiş başka anda tetiklenirdi. Saati okuyan `draw` olduğu için ref'i de o
   * bildiriyor — `cueRef`/`introRef` ile aynı sözleşme.
   */
  readonly holdRef: RefObject<{ markId: string; startedAt: number } | null>;
  readonly navigatingRef: RefObject<boolean>;
  readonly approach: ApproachScene;
  readonly select: (id: string | null) => void;
  readonly setHovered: (id: string | null) => void;
  readonly moveTo: (target: Camera) => void;
  readonly enterPerfume: (id: string) => void;
  readonly setEntryHint: (value: boolean) => void;
  readonly setEntryProgress: (value: number) => void;
  readonly requestDraw: () => void;
}

/** Tekerlek hassasiyeti. Üstel çünkü yakınlaşma çarpımsal: her tık aynı oranı ekler. */
const WHEEL_SENSITIVITY = 0.0015;

/** Tekerleği "satır" biriminde bildiren tarayıcılar için piksel karşılığı. */
const LINE_HEIGHT = 16;

/** Ekranda basılı duran tek bir parmak/imleç. */
interface PointerPosition {
  readonly x: number;
  readonly y: number;
}

/**
 * Süren sürükleme.
 *
 * Dokunuş mu sürükleme mi kararını `probe` taşıyor (`space-gesture.ts`);
 * `lastX/lastY` kaydırmanın kare farkı için duruyor.
 */
interface DragState {
  readonly id: number;
  readonly lastX: number;
  readonly lastY: number;
  readonly probe: Probe;
  /**
   * Parmağın **indiği** anda altındaki nokta.
   *
   * ⚠️ Seçim artık kalkış anında yeniden aranmıyor. Sebebi ölçüldü: eşik
   * altındaki hareket bile kamerayı kaydırıyordu, yani parmak kalktığında
   * altındaki nokta artık basılan nokta değildi. Kaydırma eşiğe kadar
   * ertelendi ama karar yine de basma anına ait olmalı — dokunulan şey odur.
   */
  readonly downHit: SpaceMark | null;
}

export function useSpaceInput({
  marks,
  markById,
  canvasRef,
  cameraRef,
  viewportRef,
  animationRef,
  selectedRef,
  entryRef,
  approach,
  select,
  setHovered,
  moveTo,
  enterPerfume,
  setEntryHint,
  setEntryProgress,
  holdRef,
  navigatingRef,
  requestDraw,
}: SpaceInputOptions): SpaceInput {
  const pointersRef = useRef(new Map<number, PointerPosition>());

  /**
   * Yaklaşma sahnesini süren parmak.
   *
   * Sahne sürerken uzayın öbür bütün işaretçi yolları kapalı, o yüzden bu ref
   * onlarla karışmıyor ve ayrı duruyor. `pointersRef` gibi burada doğuyor:
   * dışarıdan kimse okumuyor.
   */
  const approachDragRef = useRef<{ id: number; lastY: number } | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const pinchRef = useRef<number | null>(null);

  /**
   * Dokunma olaylarından okunan sıkıştırma — iki parmağın önceki mesafesi.
   *
   * ⚠️ **İşaretçi olayları iOS'ta iki parmağı bize vermiyor.** `pinchRef` ile
   * yürüyen işaretçi yolu Chromium'da gerçek çift dokunuşla ölçüldü ve
   * çalışıyor; iPhone'da ise sahip "büyütmeye çalışıyorum, sağ sol oluyor"
   * dedi. Safari ikinci parmak inince kendi hareket tanıyıcısını devreye
   * sokuyor ve işaretçi akışı bölünüyor — `touch-action: none` da,
   * `gesture*` olaylarının varsayılanını kesmek de bunu düzeltmedi (ikisi de
   * denendi, ikincisi telefonda sınandı).
   *
   * Bu yüzden iki parmak **dokunma olaylarından** okunuyor: `touchmove` bütün
   * parmakları tek olayda veriyor, yakalama ve iptal karmaşası hiç yok. Harita
   * kütüphanelerinin iOS için yaptığı da bu.
   *
   * Doluyken işaretçi yolu tamamen susuyor (`handlePointerMove`in başındaki
   * erken dönüş), yoksa aynı hareket iki kez yakınlaştırırdı.
   */
  const touchPinchRef = useRef<{ gap: number; mx: number; my: number } | null>(null);

  /**
   * Ekranda duran parmak sayısı ve son kalkış anı.
   *
   * ⚠️ **Tekerlek olaylarını susturmak için.** Sahip telefonda ölçtü: iki
   * parmağı birlikte aşağı çekince harita **büyüyordu**, yukarı çekince
   * küçülüyordu — yani kaydırma hareketi yakınlaşma sanılıyordu. Safari iki
   * parmaklı kaydırmayı tekerlek olayına çeviriyor ve `onWheel` masaüstündeki
   * gibi yakınlaştırıyordu. Parmak ekrandayken (ve kalktıktan hemen sonra,
   * savrulma olayları için) tekerleğe bakılmıyor; dokunuşun karşılığını
   * yalnızca dokunma yolu veriyor.
   */
  const touchCountRef = useRef(0);
  const lastTouchEndRef = useRef(0);


  /**
   * Vuruş payı — parmak için geniş, imleç için dar.
   *
   * `pointerType` boş gelirse (bazı tarayıcılarda oluyor) parmak varsayılıyor:
   * geniş pay imleçte de zarar vermiyor, dar pay parmakta ıskalatıyor.
   */
  const hitPadding = (event: ReactPointerEvent<HTMLCanvasElement>) =>
    event.pointerType === 'mouse' ? undefined : TOUCH_HIT_PADDING;

  /** Tuvalin sol üst köşesine göre imleç konumu. */
  const localPoint = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return rect ? { sx: clientX - rect.left, sy: clientY - rect.top } : { sx: 0, sy: 0 };
  }, [canvasRef]);

  /** İki parmağın mesafe oranı → yakınlaşma; çapa parmakların ortası. */
  const applyPinch = useCallback(() => {
    const [a, b] = [...pointersRef.current.values()];
    if (!a || !b) return;

    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    const previous = pinchRef.current;
    pinchRef.current = distance;
    if (previous === null || previous === 0) return;

    const { sx, sy } = localPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
    cameraRef.current = zoomAt(cameraRef.current, sx, sy, distance / previous, viewportRef.current);
    requestDraw();
  }, [cameraRef, localPoint, requestDraw, viewportRef]);

  // Tekerlek elle bağlanıyor: React'in onWheel'i pasif, preventDefault çalışmaz
  // ve sayfa haritayla birlikte kayardı.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* Savrulma tekerlekleri parmak kalktıktan sonra da geliyor. */
    const TOUCH_WHEEL_QUIET = 400;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();

      // Parmakla gelen hareketin karşılığını dokunma yolu veriyor; gerekçe
      // `touchCountRef`in üstünde.
      if (touchCountRef.current > 0 || performance.now() - lastTouchEndRef.current < TOUCH_WHEEL_QUIET) {
        return;
      }

      animationRef.current = null;

      const delta = event.deltaMode === 1 ? event.deltaY * LINE_HEIGHT : event.deltaY;

      // Yaklaşma sürerken tekerlek yalnızca sahneye ait — `zoomAt` da giriş
      // `advance`'ı da hiç çalışmıyor. Gerekçesi `consumeWheel`'in üstünde.
      if (approach.consumeWheel(delta)) return;

      const { sx, sy } = localPoint(event.clientX, event.clientY);
      cameraRef.current = zoomAt(
        cameraRef.current,
        sx,
        sy,
        Math.exp(-delta * WHEEL_SENSITIVITY),
        viewportRef.current,
      );

      /*
       * Yakınlaşma ÖNCE, giriş SONRA — sıra önemli.
       *
       * `advance` şartları yeni kameraya göre okuyor. Tersi olsaydı tavana
       * değdiren tekerlek adımı girişe sayılmaz, kullanıcı bir çentik boşa
       * çevirirdi. Tavanda `zoomAt` kamerayı hiç değiştirmiyor, dolayısıyla
       * ikisini arka arkaya çağırmak çakışmıyor.
       */
      const selected = selectedRef.current ? (markById.get(selectedRef.current) ?? null) : null;
      entryRef.current = advance(entryRef.current, {
        deltaY: delta,
        selected,
        camera: cameraRef.current,
        viewport: viewportRef.current,
      });

      setEntryHint(canEnter(selected, cameraRef.current, viewportRef.current));
      setEntryProgress(entryRef.current.progress);

      // Eşik: bir kez geçiliyor. Bayrak olmasaydı yolculuk sırasında gelen
      // sonraki tekerlek olayları aynı gezinmeyi tekrar tekrar iterdi.
      if (entryRef.current.progress >= 1 && entryRef.current.markId && !navigatingRef.current) {
        navigatingRef.current = true;
        enterPerfume(entryRef.current.markId);
      }

      requestDraw();
    };

    /*
     * ⚠️ **iOS'ta iki parmak haritaya değil SAYFAYA gidiyordu** — sahip
     * telefonda yakaladı: "büyütmeye çalışıyorum, sağ sol oluyor".
     *
     * Sebebi `touch-action: none` DEĞİL; o zaten tuvalde duruyor ve kaydırmayı
     * durduruyor. Safari'nin sayfa yakınlaştırması ondan bağımsız çalışıyor ve
     * `touch-action` ile durdurulamıyor: WebKit iki parmağı kendi standart dışı
     * `gesture*` olaylarına veriyor ve varsayılanı sayfayı yakınlaştırmak. Ekranda
     * görünen "sağa sola kayma" haritanın değil, yakınlaşmış sayfanın kaymasıydı.
     *
     * Bu yüzden yalnızca **tuval üstünde** varsayılan iptal ediliyor. Sayfanın
     * geri kalanında parmakla yakınlaştırma çalışmaya devam ediyor — bir
     * erişilebilirlik aracı, tamamen kapatmak (`user-scalable=no`) doğru olmazdı.
     *
     * İşaretçi olayları zaten kendi sıkıştırmasını çiziyor (`applyPinch`);
     * buradaki tek iş Safari'nin araya girmesini engellemek.
     */
    const stopSafariGesture = (event: Event) => event.preventDefault();
    const SAFARI_GESTURES = ['gesturestart', 'gesturechange', 'gestureend'];

    /* İki parmağın arasındaki mesafe — sıkıştırmanın tek ölçüsü. */
    const touchGap = (touches: TouchList) =>
      Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY,
      );

    /* İki parmağın ortası — hem yakınlaşmanın çapası hem kaydırmanın tutamağı. */
    const touchMid = (touches: TouchList) => ({
      mx: (touches[0].clientX + touches[1].clientX) / 2,
      my: (touches[0].clientY + touches[1].clientY) / 2,
    });

    const onTouchStart = (event: TouchEvent) => {
      touchCountRef.current = event.touches.length;
      if (approach.isActive() || event.touches.length < 2) return;

      touchPinchRef.current = { gap: touchGap(event.touches), ...touchMid(event.touches) };
      animationRef.current = null;

      /*
        İki parmak "gezinme" değil "yakınlaş" demek: hem sürükleme hem de basılı
        tutma niyeti burada bitiyor. Bitmeseydi sıkıştırmadan sonra parmak
        kalkışı bir seçim ya da parfüm girişi açardı.
      */
      dragRef.current = null;
      if (holdRef.current) {
        holdRef.current = null;
        entryRef.current = NO_ENTRY;
      }
      event.preventDefault();
    };

    /*
     * İki parmak **hem yakınlaştırıyor hem kaydırıyor** — telefonda doğru olan
     * bu ve ölçülerek öğrenildi.
     *
     * ⚠️ Önce yalnızca yakınlaşma yazılmıştı ve sahip telefonda "iki parmağı
     * aşağı çekince büyüyor, yukarı çekince küçülüyor" dedi: iki parmakla
     * kaydırmanın karşılığı yoktu, hareket bütünüyle yakınlaşmaya sayılıyordu.
     * Şimdi mesafedeki değişim yakınlaşmayı, **ortanın yer değiştirmesi**
     * kaydırmayı veriyor; ikisi aynı harekette birlikte olabiliyor.
     *
     * Sıra önemli: yakınlaşma ortaya çapalı, o yüzden önce o uygulanıyor;
     * kaydırma sonra, yeni ölçekte.
     */
    const onTouchMove = (event: TouchEvent) => {
      const previous = touchPinchRef.current;
      if (previous === null || event.touches.length < 2) return;

      event.preventDefault();

      const gap = touchGap(event.touches);
      const { mx, my } = touchMid(event.touches);
      touchPinchRef.current = { gap, mx, my };

      if (previous.gap > 0 && gap !== previous.gap) {
        const { sx, sy } = localPoint(mx, my);
        cameraRef.current = zoomAt(cameraRef.current, sx, sy, gap / previous.gap, viewportRef.current);
      }

      const dx = mx - previous.mx;
      const dy = my - previous.my;
      if (dx !== 0 || dy !== 0) {
        cameraRef.current = panBy(cameraRef.current, dx, dy, viewportRef.current);
      }

      requestDraw();
    };

    /*
      Parmak sayısı ikinin altına düşünce sıkıştırma biter. Kalan parmağın
      sürüklemeyi devralması `handlePointerUp`ta zaten yazılı — orası işaretçi
      olaylarıyla çalışıyor ve dokunuşlar onları da üretiyor.
    */
    const onTouchEnd = (event: TouchEvent) => {
      touchCountRef.current = event.touches.length;
      lastTouchEndRef.current = performance.now();
      if (event.touches.length < 2) touchPinchRef.current = null;
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    for (const name of SAFARI_GESTURES) {
      canvas.addEventListener(name, stopSafariGesture, { passive: false });
    }
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('touchcancel', onTouchEnd);

    return () => {
      canvas.removeEventListener('wheel', onWheel);
      for (const name of SAFARI_GESTURES) {
        canvas.removeEventListener(name, stopSafariGesture);
      }
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [
    animationRef,
    approach,
    cameraRef,
    canvasRef,
    holdRef,
    enterPerfume,
    entryRef,
    localPoint,
    markById,
    navigatingRef,
    requestDraw,
    selectedRef,
    setEntryHint,
    setEntryProgress,
    viewportRef,
  ]);
  /*
   * Yaklaşma sürerken işaretçi yolları kapalı — sürükleme, tıklama, üstüne gelme.
   *
   * Zevk meselesi değil, ölçünün getirdiği bir zorunluluk: ölçek 0.14'te nokta
   * yarıçapı `(3.4 + depth·4.6) · 0.14^0.5` ≈ 1.3–3 piksel. `hitTest`'in payı 8
   * piksel, yani o mesafede "isabetli tıklama" diye bir şey yok — olabilecek tek
   * şey, kullanıcının hangisi olduğunu göremediği bir parfüme yanlışlıkla düşmesi.
   *
   * Eşiğin eşik olmasının da tek yolu bu: sahnede yalnızca ileri gidilebiliyor.
   */
  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (approach.isActive()) {
      /*
        Sahne sürerken parmağın tek işi var: yaklaştırmak. Seçim, sürükleme ve
        tutma başlamıyor — eşiğin eşik olmasının yolu bu.

        Öncesinde burada yalnızca `return` vardı ve sonucu ölçüldü: telefondan
        gelen kimse kapıyı geçemiyordu, çünkü sahneyi ilerleten tek işaret
        tekerlekti.
      */
      event.currentTarget.setPointerCapture(event.pointerId);
      approachDragRef.current = { id: event.pointerId, lastY: event.clientY };
      return;
    }
    animationRef.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 1) {

      /*
       * Basılı tutma yalnızca ZATEN SEÇİLİ noktada başlıyor.
       *
       * Seçim şartı olmasaydı uzayda gezinirken parmağını bir noktada unutmak
       * sayfayı açardı. İki aşama — önce seç, sonra tut — niyeti ikiye bölüyor:
       * ilk dokunuş "bunu merak ettim", ikincisi "içine gir".
       *
       * Hedef testi `hitTest` değil `holdTargetHit`: seçimden sonra kamera
       * noktayı ekranın ortasına taşıdığı için kullanıcının bastığı yerde artık
       * nokta olmayabiliyor ve tıklama payı (8 px) tutmayı sessizce düşürüyordu.
       *
       * Komşu bir noktanın üstündeysek tutma yine de başlamıyor: orada niyet
       * "şuna geç", "buna gir" değil. Seçimi `handlePointerUp` yapıyor.
       */
      const { sx, sy } = localPoint(event.clientX, event.clientY);
      const under = hitTest(marks, sx, sy, cameraRef.current, viewportRef.current, hitPadding(event));

      dragRef.current = {
        id: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
        probe: beginProbe(event.clientX, event.clientY, event.pointerType),
        downHit: under,
      };

      const selectedMark = selectedRef.current
        ? (markById.get(selectedRef.current) ?? null)
        : null;
      const overNeighbour = under !== null && under.id !== selectedMark?.id;

      if (
        selectedMark &&
        !overNeighbour &&
        holdEnabledFor(selectedMark.id) &&
        holdTargetHit(selectedMark, sx, sy, cameraRef.current, viewportRef.current)
      ) {
        holdRef.current = { markId: selectedMark.id, startedAt: performance.now() };
        requestDraw();
      }
      return;
    }

    // İkinci parmak indi: artık sıkıştırma. Başlamış tutma iptal.
    holdRef.current = null;

    // İkinci parmak indi: bu artık sürükleme değil, sıkıştırma.
    dragRef.current = null;
    pinchRef.current = null;
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (approach.isActive()) {
      const drag = approachDragRef.current;
      if (!drag || drag.id !== event.pointerId) return;

      // Fark adım adım okunuyor, başlangıçtan değil: tekerlek de her olayda
      // kendi adımını veriyor ve `consumeWheel` birikimi kendisi tutuyor.
      const dy = event.clientY - drag.lastY;
      drag.lastY = event.clientY;
      approach.consumeWheel(dragDelta(dy));
      return;
    }

    // Dokunma yolu sıkıştırmayı yürütüyorsa işaretçi yolu hiç karışmıyor.
    if (touchPinchRef.current !== null) return;

    const pointers = pointersRef.current;
    const { sx, sy } = localPoint(event.clientX, event.clientY);

    if (!pointers.has(event.pointerId)) {
      // Basılı değil: fare geziniyor.
      setHovered(hitTest(marks, sx, sy, cameraRef.current, viewportRef.current)?.id ?? null);
      return;
    }

    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      applyPinch();
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;

    const wasIdle = drag.probe.latch === 'none';
    const probe = moveProbe(drag.probe, event.clientX, event.clientY, false);

    dragRef.current = { ...drag, lastX: event.clientX, lastY: event.clientY, probe };

    // Parmak gerçekten kaydıysa bu bir sürükleme; tutma niyeti bitti.
    if (holdRef.current && probe.latch !== 'none') {
      holdRef.current = null;
      entryRef.current = NO_ENTRY;
    }

    /*
      ⚠️ Eşiğin altında harita KIMILDAMIYOR. Eskiden her `pointermove` kamerayı
      kaydırıyordu; dokunmak isteyen parmağın titremesi haritayı birkaç piksel
      oynatıyor ve basılan noktanın altından kaydırıyordu. Sessiz bir kusurdu:
      seçim tutuyorsa bile yanlış noktayı seçiyordu.
    */
    if (probe.latch === 'none') {
      requestDraw();
      return;
    }

    /*
      Kilidin düştüğü kare: eşiğe kadar biriken hareket bir defada uygulanıyor,
      yoksa sürükleme o kadar geriden başlar ve harita parmağın altında kayar.
    */
    const dx = wasIdle ? event.clientX - probe.startX : event.clientX - drag.lastX;
    const dy = wasIdle ? event.clientY - probe.startY : event.clientY - drag.lastY;

    cameraRef.current = panBy(cameraRef.current, dx, dy, viewportRef.current);
    requestDraw();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    /*
      Yaklaşma sürüklemesi elde kaldıysa parmak kalkınca biter — sahne o
      sürüklemeyle tamamlanmış olsa bile. Yalnızca `isActive()`e bakmak yetmez:
      sürükleme sahneyi bitirdiği anda bayrak düşüyor ve bu olay uzayın normal
      yollarına, yarım kalmış bir işaretçi durumuyla düşerdi.
    */
    if (approachDragRef.current) {
      approachDragRef.current = null;
      return;
    }
    if (approach.isActive()) return;

    const pointers = pointersRef.current;
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchRef.current = null;

    // Parmak kalktı: süre dolmadıysa açılma yok, halka söner.
    // `navigatingRef` doluysa geçiş zaten başlamış, dokunmuyoruz.
    if (holdRef.current) {
      holdRef.current = null;
      entryRef.current = NO_ENTRY;
      requestDraw();
    }

    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) {
      // Sıkıştırmadan tek parmağa düşüş. İkinci parmak inerken sürükleme
      // bırakılmıştı; kalan parmak devralmazsa harita, kullanıcı elini tamamen
      // kaldırana kadar donuyor — oysa iki parmakla yakınlaşıp tek parmakla
      // kaydırmaya devam etmek en yaygın el hareketlerinden biri.
      if (pointers.size === 1) {
        const [[id, position]] = [...pointers.entries()];
        dragRef.current = {
          id,
          lastX: position.x,
          lastY: position.y,
          probe: inheritedProbe(position.x, position.y, event.pointerType),
          downHit: null,
        };
      }
      return;
    }
    dragRef.current = null;

    // Sürükleyip bırakmak seçim açmasın: harita gezdirilirken elin altındaki
    // nokta seçilirse kullanıcı istemediği bir şeyi seçmiş olur.
    if (!isTap(drag.probe)) return;

    // Basma anındaki nokta — kalkış anında yeniden aranmıyor, gerekçe
    // `DragState.downHit`te.
    const mark = drag.downHit;

    // Yeni bir parfüme basmak kamerayı ona getiriyor: seçmek "bunu merak
    // ettim" demek, kameranın karşılığı yaklaşmak. Zaten seçili olana tekrar
    // basınca kamera oynamıyor — kullanıcı o sırada tutmaya hazırlanıyor
    // olabilir, ayağının altından harita kaymasın.
    if (mark && mark.id !== selectedRef.current) moveTo(focusOn(cameraRef.current, mark));

    // Bir noktaya basmak onu HER ZAMAN seçiyor; seçiliye tekrar basmak kapatmıyor.
    // Kapatma açıkken kalabalık bölgede şöyle oluyordu: kullanıcı yandaki noktayı
    // hedefliyor, vuruş seçili olana denk geliyor ve ekrandaki her şey kayboluyordu
    // — "bastım, hiçbir şey çıkmadı". Seçim yalnızca boşluğa basınca kalkıyor.
    select(mark?.id ?? null);
  };


  /**
   * Işaretçi iptal edildi.
   *
   * ⚠️ Bu eskiden doğrudan `handlePointerUp`a bağlıydı ve gizli bir kusurdu:
   * iOS kendi basılı-tutma davranışını başlattığında `pointercancel` atıyor,
   * parmak da kımıldamamış oluyor — yani olay dokunuş yolundan geçip
   * **seçim yapıyordu.** Kullanıcının niyeti dokunmak değildi ve sistem
   * hareketi zaten elinden almıştı.
   *
   * Iptal edilen hareket bir karar değil: her şey temizleniyor, hiçbir şey
   * seçilmiyor.
   */
  const handlePointerCancel = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    approachDragRef.current = null;
    pointersRef.current.delete(event.pointerId);
    pinchRef.current = null;
    dragRef.current = null;

    if (holdRef.current) {
      holdRef.current = null;
      entryRef.current = NO_ENTRY;
    }

    requestDraw();
  };

  return {
    onPointerCancel: handlePointerCancel,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
  };
}
