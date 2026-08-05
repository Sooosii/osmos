import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import type { SpaceMark } from '@/data/types';
import { type Camera, type Viewport, focusOn, hitTest, panBy, zoomAt } from '@/lib/space-camera';
import {
  type EntryState,
  NO_ENTRY,
  advance,
  canEnter,
  holdEnabledFor,
  holdTargetHit,
} from '@/lib/space-entry';
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

/** Bu kadar pikselden fazla kaydırıldıysa parmak kalkışı tıklama sayılmıyor. */
const CLICK_SLOP = 4;

/** Tekerlek hassasiyeti. Üstel çünkü yakınlaşma çarpımsal: her tık aynı oranı ekler. */
const WHEEL_SENSITIVITY = 0.0015;

/** Tekerleği "satır" biriminde bildiren tarayıcılar için piksel karşılığı. */
const LINE_HEIGHT = 16;

/** Ekranda basılı duran tek bir parmak/imleç. */
interface PointerPosition {
  readonly x: number;
  readonly y: number;
}

/** Süren sürükleme. `moved` toplam yol — dokunuş mu sürükleme mi buradan anlaşılıyor. */
interface DragState {
  readonly id: number;
  readonly lastX: number;
  readonly lastY: number;
  readonly moved: number;
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
  const dragRef = useRef<DragState | null>(null);
  const pinchRef = useRef<number | null>(null);


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

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
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

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [
    animationRef,
    approach,
    cameraRef,
    canvasRef,
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
    if (approach.isActive()) return;
    animationRef.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 1) {
      dragRef.current = {
        id: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: 0,
      };

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
      const under = hitTest(marks, sx, sy, cameraRef.current, viewportRef.current);
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
    if (approach.isActive()) return;
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

    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;
    dragRef.current = {
      ...drag,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: drag.moved + Math.hypot(dx, dy),
    };

    // Parmak kaydıysa bu bir sürükleme; tutma niyeti bitti. Eşik tıklamayla
    // aynı (`CLICK_SLOP`) — el titremesi iptal etmesin, gezinme etsin.
    if (holdRef.current && dragRef.current && dragRef.current.moved > CLICK_SLOP) {
      holdRef.current = null;
      entryRef.current = NO_ENTRY;
    }

    cameraRef.current = panBy(cameraRef.current, dx, dy, viewportRef.current);
    requestDraw();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
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
        // `moved` eşiğin üstünde başlıyor: bu bir el hareketinin devamı, dokunuş
        // değil. Sıfırdan başlasaydı parmağı kaldırmak seçim açardı.
        dragRef.current = { id, lastX: position.x, lastY: position.y, moved: CLICK_SLOP + 1 };
      }
      return;
    }
    dragRef.current = null;

    // Sürükleyip bırakmak seçim açmasın: harita gezdirilirken elin altındaki
    // nokta seçilirse kullanıcı istemediği bir şeyi seçmiş olur.
    if (drag.moved > CLICK_SLOP) return;

    const { sx, sy } = localPoint(event.clientX, event.clientY);
    const mark = hitTest(marks, sx, sy, cameraRef.current, viewportRef.current);

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


  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
  };
}
