'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SpaceMark } from '@/data/types';
import {
  INITIAL_CAMERA,
  type Camera,
  type Viewport,
  centerOn,
  focusOn,
  hitTest,
  panBy,
  worldToScreen,
  boundsOf,
  zoomAt,
} from '@/lib/space-camera';
import { drawSpace } from '@/lib/space-draw';
import { prefersReducedMotion } from '@/lib/motion';
import { useCanvasSize } from '@/components/space/use-canvas-size';
import {
  type EntryState,
  HOLD_DURATION,
  NO_ENTRY,
  advance,
  canEnter,
  holdEnabledFor,
  holdTargetHit,
} from '@/lib/space-entry';
import {
  APPROACH_CUE,
  APPROACH_DONE,
  APPROACH_ONCE,
  APPROACH_SEEN_KEY,
  APPROACH_START,
  type ApproachState,
  START_SCALE,
  advance as advanceApproach,
  isComplete,
  scaleAt,
} from '@/lib/space-approach';

/**
 * Koku Uzayı — sitenin ana ekranı.
 *
 * Tuval, çünkü nokta sayısı 44'te durmayacak: 250+ DOM düğümünü her karede
 * yeniden konumlandırmak sürüklemeyi öldürür.
 *
 * Bileşenin işi "ne zaman çizileceği" ve olayları okumak. "Nereye çizileceği"
 * `space-camera.ts`, "neyin çizileceği" `space-draw.ts` içinde — ikisi de saf.
 *
 * ⚠️ Kamera React durumunda DEĞİL, `useRef` içinde. Sürüklerken kare başına bir
 * `setState` demek kare başına bir React ağacı demek; 44 nokta için gereksiz,
 * 250'de görünür yavaşlık. React yalnızca seyrek değişenleri (seçim, üstüne
 * gelinen nokta) tutuyor; kamera doğrudan tuvale gidiyor.
 */

/** Bu kadar pikselden fazla kaydırıldıysa parmak kalkışı tıklama sayılmıyor. */
const CLICK_SLOP = 4;

/** Tekerlek hassasiyeti. Üstel çünkü yakınlaşma çarpımsal: her tık aynı oranı ekler. */
const WHEEL_SENSITIVITY = 0.0015;

/** Tekerleği "satır" biriminde bildiren tarayıcılar için piksel karşılığı. */
const LINE_HEIGHT = 16;

/** Klavyeyle bir noktaya gitme süresi (ms). */
const FOCUS_DURATION = 420;

interface Animation {
  readonly from: Camera;
  readonly to: Camera;
  readonly start: number;
}

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

interface ScentSpaceCanvasProps {
  readonly marks: readonly SpaceMark[];
  /**
   * Varışta yerine yerleşen giriş metni — başlık ve tarif.
   *
   * Prop olarak alınıyor çünkü metin sunucuda üretiliyor: `children` olarak geçen
   * sunucu bileşenleri istemcinin modül grafiğine girmiyor, hazır çıktı olarak
   * geliyor. Böylece `PERFUMES` sunucuda kalıyor — parfüm veritabanı tarayıcıya
   * inmiyor, uzayın en baştaki sözü bozulmuyor.
   */
  readonly children?: ReactNode;
}

function lerpCamera(from: Camera, to: Camera, t: number): Camera {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    scale: from.scale + (to.scale - from.scale) * t,
  };
}

export function ScentSpaceCanvas({ marks, children }: ScentSpaceCanvasProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  /*
   * Kamera yaklaşmanın başladığı yerde doğuyor, `INITIAL_CAMERA`'da değil.
   *
   * Sahnenin çalışmayacağı durumlar (adres `?mark=` taşıyor, hareket azaltılmış,
   * sahne bu oturumda görülmüş) ancak tarayıcıda anlaşılıyor — `sessionStorage`
   * ve `matchMedia` sunucuda yok. O yüzden varsayılan "sahne var"; iptal kararı
   * aşağıdaki etkide veriliyor. İlk boyanma etkilerden sonra olduğu için
   * atlayanlar uzak kareyi hiç görmüyor, sıçrama olmuyor.
   */
  const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: START_SCALE });
  // Bulut sınırları `marks` değişmedikçe sabit; ölçüyü yeniden boyutlandırma
  // geri çağrısı okuyor, o yüzden ref'te — yoksa her ölçüde yeniden kurulurdu.
  const bounds = useMemo(() => boundsOf(marks), [marks]);
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;

  const viewportRef = useRef<Viewport>({ width: 0, height: 0, ...bounds });
  const frameRef = useRef<number | null>(null);
  const animationRef = useRef<Animation | null>(null);

  // Seçim ve üstüne gelme hem durumda hem ref'te: durum metni besliyor (ad,
  // küratör cümlesi), ref çizime gidiyor. Çizim, React render'ını beklemeden
  // en güncel değeri görmek zorunda — sürükleme ortasında bir kare geride kalmasın.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const hoveredRef = useRef<string | null>(null);

  /**
   * Kaydırarak giriş — birikimi ref'te, ipucu için gereken kadarı durumda.
   *
   * Kamerayla aynı gerekçe: birikim kare başına birkaç kez değişiyor ve çizime
   * gidiyor; her adımda `setState` demek her adımda bir React ağacı demek.
   * Durumda tutulan yalnızca "ipucu görünsün mü" ve ilerlemenin kabaca nerede
   * olduğu — ikisi de saniyede birkaç kez değişiyor, kare başına değil.
   */
  /*
   * Yaklaşma — birikim ref'te, ipucu için gereken kadarı durumda.
   *
   * `approachActiveRef` bir bayrak değil kapı: sahne sürerken tekerlek, sürükleme
   * ve tıklama yollarının hepsi buradan erken dönüyor. Ref, çünkü olay
   * işleyicilerinin en güncel değeri React render'ını beklemeden görmesi gerek —
   * sahnenin bittiği kare ile ilk gezinme hareketi aynı ana düşebilir.
   */
  const approachRef = useRef<ApproachState>(APPROACH_START);
  const approachActiveRef = useRef(true);

  /**
   * İpucu ve giriş metni — opaklıkları React'te DEĞİL, doğrudan DOM'da.
   *
   * Etiket katmanıyla aynı gerekçe: ikisi de kaydırma boyunca kare başına
   * değişiyor ve her adımda `setState` demek her adımda bir React ağacı demek.
   *
   * İkinci ve daha sinsi sebep: sahnenin çalışıp çalışmayacağı ancak tarayıcıda
   * belli oluyor (`sessionStorage`, `matchMedia`, adres parametresi), yani
   * sunucuda çizilen çıktıda cevap yok. Durumla yapılsaydı hangi varsayılanı
   * verirsek verelim biri yanardı — sahneyi görecek olan giriş metnini bir kare
   * görüp kaybeder, atlayan ipucunu. İkisi de baştan opaklık 0 doğuyor; karar ilk
   * boyanmadan önceki etkide veriliyor ve doğru olan açılıyor.
   */
  const cueRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);

  const entryRef = useRef<EntryState>(NO_ENTRY);
  /** Süren basılı tutma. Saat çizim döngüsünde okunuyor — ayrı bir zamanlayıcı yok. */
  const holdRef = useRef<{ markId: string; startedAt: number } | null>(null);
  const [entryHint, setEntryHint] = useState(false);
  const [entryProgress, setEntryProgress] = useState(0);
  const navigatingRef = useRef(false);

  const pointersRef = useRef(new Map<number, PointerPosition>());
  const dragRef = useRef<DragState | null>(null);
  const pinchRef = useRef<number | null>(null);

  const markById = useMemo(() => new Map(marks.map((mark) => [mark.id, mark])), [marks]);
  const selected = selectedId ? (markById.get(selectedId) ?? null) : null;
  const hovered = hoveredId ? (markById.get(hoveredId) ?? null) : null;

  // Üstüne gelmek seçimi bastırmıyor: seçim kalıcı, üstüne gelme geçici.
  const labelled = hovered ?? selected;

  /**
   * Kare planlayıcı — tek sahip.
   *
   * `draw` her render'da yeniden doğuyor (marks'a bağlı), planlayıcı ise sabit.
   * İkisini bir ref üzerinden bağlamak döngüsel bağımlılığı kırıyor: planlayıcı
   * kimliği değişmediği için olay dinleyicileri boş yere yeniden kurulmuyor.
   */
  const drawRef = useRef<() => void>(() => {});

  const requestDraw = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      drawRef.current();
    });
  }, []);

  /**
   * Sahnenin ekrandaki izlerini tazeler: ipucu, giriş metni, imleç.
   *
   * Çizim döngüsünden ayrı duruyor çünkü bunlar tuvale değil DOM'a ait ve kare
   * başına değil, kaydırma başına değişiyor. Tek yerde toplanmasının sebebi üç
   * ayrı çağıran olması — açılış kararı, tekerlek ve sahnenin bitişi.
   */
  const paintScene = useCallback(() => {
    const active = approachActiveRef.current;
    const { progress } = approachRef.current;

    if (cueRef.current) {
      // İlerlemenin ilk üçte ikisinde sönüp bitiyor: kullanıcı kaydırmaya
      // başladığı an ipucunun işi bitmiştir, kalan yolda durması gürültü olurdu.
      cueRef.current.style.opacity = active ? String(Math.max(0, 1 - progress * 1.6)) : '0';
    }

    if (introRef.current) {
      introRef.current.style.opacity = active ? '0' : '1';
    }

    // Sahne sürerken tutulacak bir şey yok; "yakala" imleci gösterip sürüklemeye
    // izin vermemek yalan söylemek olurdu.
    if (canvasRef.current) {
      canvasRef.current.style.cursor = active ? 'default' : '';
    }
  }, []);

  /**
   * Parfüm sayfasına geçiş — önce adres, sonra gezinme.
   *
   * `replaceState` şart. `router.push` geçmişe yeni bir kayıt ekliyor ama altta
   * duran kayıt sade `/` olarak kalıyordu; tarayıcının geri tuşu oraya düşünce
   * `?mark=` olmadığı için sahne baştan çalışıyor, dönen göz uzayı yeniden
   * kazanmak zorunda kalıyordu. `parfum/[id]/page.tsx:82`'nin "iki yol tek
   * davranışta buluşuyor" iddiası yalnızca sayfadaki bağlantı için doğruydu.
   * Alttaki kaydı `/?mark=<id>` ile değiştirince geri tuşu da aynı yere düşüyor.
   *
   * `window.history` doğrudan kullanılıyor: Next yönlendiricisi bu çağrıyı
   * tanıyor ve `useSearchParams` ile eşitliyor. Eşitlemenin tetiklediği
   * `centerOn` kamerayı zaten üstünde durduğu parfüme ortalıyor, yani yerinde
   * kalıyor — geçişte görünür bir sıçrama yok.
   */
  const enterPerfume = useCallback(
    (id: string) => {
      window.history.replaceState(null, '', `/?mark=${id}`);
      router.push(`/parfum/${id}`);
    },
    [router],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || viewport.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Kamera yolculuk hâlindeyse önce bir adım ilerlet. Döngü kendi kendini
    // besliyor: animasyon bitene kadar yeni kare istiyor, sonra susuyor.
    const animation = animationRef.current;
    if (animation) {
      const progress = Math.min((performance.now() - animation.start) / FOCUS_DURATION, 1);
      const eased = 1 - (1 - progress) ** 3;
      cameraRef.current = lerpCamera(animation.from, animation.to, eased);
      if (progress >= 1) animationRef.current = null;
    }

    /*
     * Basılı tutma ilerlemesi çizimden ÖNCE ölçülüyor — sıra kritik.
     *
     * Önceden sonra hesaplanıyordu ve sonucu şuydu: ilerleme 1'e ulaştığı kare
     * bir önceki (0.9x) değerle çiziliyor, hemen ardından gezinme başlıyordu.
     * Yani ekranın renge tam kapandığı kare hiçbir zaman ekrana gitmiyordu ve
     * geçiş kesik görünüyordu. Artık kapanan kare önce çiziliyor, gezinme
     * ondan sonra.
     *
     * Ayrı bir zamanlayıcı yok: tek saat `performance.now()`, tek tüketici bu
     * döngü — gördüğün dolgu ile açılma anı aynı sayıdan çıkıyor.
     */
    const hold = holdRef.current;
    const holdComplete =
      hold !== null && performance.now() - hold.startedAt >= HOLD_DURATION;

    if (hold) {
      const held = Math.min((performance.now() - hold.startedAt) / HOLD_DURATION, 1);
      entryRef.current = { markId: hold.markId, progress: held };
    }

    // Tuval tamponu değiştiğinde bağlam dönüşümü sıfırlanıyor; her karede kuruluyor.
    const ratio = canvas.width / viewport.width;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    drawSpace(ctx, {
      marks,
      camera: cameraRef.current,
      viewport,
      selectedId: selectedRef.current,
      hoveredId: hoveredRef.current,
      entry: entryRef.current,
    });

    // Etiket tuvale değil üstüne bindirilmiş HTML'e çiziliyor: punto haritanın
    // ölçeğinden bağımsız kalıyor, yakınlaşınca metin büyümüyor. Konumu burada,
    // metni React'te.
    const label = labelRef.current;
    const target = hoveredRef.current ?? selectedRef.current;
    const mark = target ? markById.get(target) : null;

    if (label) {
      if (mark) {
        const { sx, sy } = worldToScreen(mark, cameraRef.current, viewport);
        label.style.transform = `translate(${sx}px, ${sy}px)`;
        label.style.opacity = '1';
      } else {
        label.style.opacity = '0';
      }
    }

    /*
     * Basılı tutma ilerlemesi burada, çizim döngüsünde ölçülüyor.
     *
     * Ayrı bir `setInterval`/`setTimeout` kurmadım bilerek: iki ayrı saat
     * olsaydı halka bir hızda dolar, geçiş başka anda tetiklenirdi. Tek kaynak
     * `performance.now()`, tek tüketici bu döngü — gördüğün dolgu ile açılma
     * anı aynı sayıdan çıkıyor.
     */
    // Kapanan kare artık çizildi; gezinme burada başlıyor.
    if (hold && holdComplete && !navigatingRef.current) {
      navigatingRef.current = true;
      holdRef.current = null;
      enterPerfume(hold.markId);
    }

    // Tutma sürerken de kare istiyoruz: halka dolmalı.
    if (animationRef.current || holdRef.current) requestDraw();
  }, [marks, markById, requestDraw, enterPerfume]);

  useEffect(() => {
    drawRef.current = draw;
    requestDraw();
  }, [draw, requestDraw]);

  const select = useCallback(
    (id: string | null) => {
      selectedRef.current = id;
      setSelectedId(id);

      // Seçim değişti: biriken giriş niyeti o parfüme aitti, devredilmiyor.
      // Sıfırlamasaydık başka bir noktaya basıp tek çentik çevirmek, önceki
      // parfümde biriktirilmiş yolun üstüne binip sayfayı açardı.
      entryRef.current = NO_ENTRY;
      setEntryHint(false);
      setEntryProgress(0);

      /*
       * Sayfayı şimdiden hazırla.
       *
       * "Tuttum, açılması çok yavaş" şikâyetinin sebebi buydu: `router.push`
       * ancak basıldığı anda sayfayı istemeye başlıyordu, yani bekleme
       * animasyonun değil ağın/derlemenin süresiydi. Seçim, açma niyetinden
       * her zaman önce geliyor — hazırlık için doğru an burası. Kullanıcı
       * tutmaya karar verdiğinde sayfa çoktan gelmiş oluyor.
       */
      if (id) router.prefetch(`/parfum/${id}`);

      requestDraw();
    },
    [requestDraw, router],
  );

  /**
   * Yaklaşmayı bitirir — kamerayı uzayın açılış konumuna oturtur.
   *
   * Tek yerde toplanmasının sebebi iki ayrı yoldan çağrılması: tekerlek ilerlemeyi
   * 1'e taşıdığında, ve klavyeyle bir parfüme odaklanıldığında. İkincisi şart —
   * tekerleği olmayan biri için sahneyi bitirecek başka bir hareket yok, kapı
   * onun yüzüne kapanmış olurdu.
   */
  const finishApproach = useCallback(() => {
    if (!approachActiveRef.current) return;

    approachActiveRef.current = false;
    approachRef.current = APPROACH_DONE;
    cameraRef.current = INITIAL_CAMERA;
    paintScene();

    if (APPROACH_ONCE) sessionStorage.setItem(APPROACH_SEEN_KEY, '1');
    requestDraw();
  }, [paintScene, requestDraw]);

  /*
   * Sahne çalışsın mı?
   *
   * ⚠️ Bu etki `?mark=` etkisinden ÖNCE duruyor ve sırası kritik. İptal kararı
   * kamerayı `INITIAL_CAMERA`'ya (ölçek 1) alıyor; `?mark=` etkisi ise `centerOn`
   * ile ölçeği koruyarak ortalıyor. Ters sırada olsaydı ortalama, yaklaşmanın
   * 0.14'lük ölçeğiyle yapılır ve parfüm sayfasından dönen göz uzayı minicik
   * görürdü.
   *
   * Üç iptal sebebi var, üçü de aynı cümlenin parçası: sahne bir eşik, ama
   * tanıdık bir yere dönen için eşik yoktur.
   */
  useEffect(() => {
    const returning = searchParams.get('mark') !== null;
    const seen = APPROACH_ONCE && sessionStorage.getItem(APPROACH_SEEN_KEY) === '1';

    if (returning || seen || prefersReducedMotion()) {
      approachActiveRef.current = false;
      approachRef.current = APPROACH_DONE;
      cameraRef.current = INITIAL_CAMERA;
    }

    paintScene();
    requestDraw();
  }, [paintScene, requestDraw, searchParams]);

  /**
   * `/?mark=<id>` ile dönüş — parfüm sayfasından geri gelen göz.
   *
   * Kamera animasyonsuz, doğrudan yerine konuyor: bu bir hareket değil, açılış
   * durumu. Yolculuk animasyonu çalıştırmak, kullanıcının hiç görmediği bir
   * yerden tanıdık noktaya doğru anlamsız bir kayma üretirdi.
   *
   * Adres bilerek temizlenmiyor; sayfayı yenilemek ya da bağlantıyı paylaşmak
   * aynı görünüme düşüyor.
   */
  useEffect(() => {
    const id = searchParams.get('mark');
    if (!id) return;

    const mark = markById.get(id);
    if (!mark) return;

    selectedRef.current = id;
    setSelectedId(id);
    cameraRef.current = centerOn(cameraRef.current, mark);
    requestDraw();
  }, [markById, requestDraw, searchParams]);

  const setHovered = useCallback(
    (id: string | null) => {
      if (hoveredRef.current === id) return;
      hoveredRef.current = id;
      setHoveredId(id);
      requestDraw();
    },
    [requestDraw],
  );

  /** Kamerayı hedefe taşır — hareket kısıtlıysa anında, değilse yumuşayarak. */
  const moveTo = useCallback(
    (target: Camera) => {
      if (prefersReducedMotion()) {
        animationRef.current = null;
        cameraRef.current = target;
      } else {
        animationRef.current = { from: cameraRef.current, to: target, start: performance.now() };
      }
      requestDraw();
    },
    [requestDraw],
  );

  /** Tuvalin sol üst köşesine göre imleç konumu. */
  const localPoint = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return rect ? { sx: clientX - rect.left, sy: clientY - rect.top } : { sx: 0, sy: 0 };
  }, []);

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
  }, [localPoint, requestDraw]);

  useCanvasSize({ canvasRef, viewportRef, boundsRef, requestDraw });

  // Tekerlek elle bağlanıyor: React'in onWheel'i pasif, preventDefault çalışmaz
  // ve sayfa haritayla birlikte kayardı.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      animationRef.current = null;

      const delta = event.deltaMode === 1 ? event.deltaY * LINE_HEIGHT : event.deltaY;

      /*
       * Yaklaşma sürerken tekerlek yalnızca sahneye ait — `zoomAt` da giriş
       * `advance`'ı da hiç çalışmıyor.
       *
       * Bu erken dönüş, `space-entry.ts`'in anlattığı tuzağa düşmemenin tek yolu:
       * orada iki anlam AYNI ANDA canlıydı ve kullanıcı hangisini tetiklediğini
       * bilemiyordu. Burada iki anlam arka arkaya — sahne bitene kadar tekerlek
       * sahneyi sürüyor, bittiği andan itibaren uzayı. Belirsiz tek bir kare yok.
       *
       * Çapa yok: sahne boyunca kamera ekranın ortasında duruyor. `zoomAt` imleci
       * çapa alıyor ama uzaktan yaklaşırken imlecin altında henüz bir şey yok;
       * çapalamak bulutu kenara kaydırmaktan başka işe yaramazdı.
       */
      if (approachActiveRef.current) {
        const next = advanceApproach(approachRef.current, delta);
        approachRef.current = next;
        cameraRef.current = { x: 0, y: 0, scale: scaleAt(next.progress) };

        // `finishApproach` kamerayı `INITIAL_CAMERA`'ya alıyor; `scaleAt(1)` zaten
        // tam olarak orası, dolayısıyla devir teslimde tek bir piksel oynamıyor.
        if (isComplete(next)) {
          finishApproach();
        } else {
          paintScene();
          requestDraw();
        }
        return;
      }

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
  }, [enterPerfume, finishApproach, localPoint, markById, paintScene, requestDraw]);

  useEffect(
    () => () => {
      if (frameRef.current === null) return;
      cancelAnimationFrame(frameRef.current);
      // Sıfırlamak şart. `requestDraw` dolu bir `frameRef`'i "kare uçuşta" diye
      // okuyor ve bayrağı yalnızca kare ÇALIŞINCA indiriyor. İptal edilmiş kare
      // hiç çalışmayacağı için bayrak açık kalırsa planlayıcı temelli kilitlenir:
      // bundan sonraki her `requestDraw` erken dönüyor, tuval bir daha çizilmiyor.
      // Etkiler aynı örnek üzerinde yeniden kurulduğunda (Strict Mode, Activity)
      // ref'ler korunduğu için bu gerçek bir yol.
      frameRef.current = null;
    },
    [],
  );

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
  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (approachActiveRef.current) return;
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

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (approachActiveRef.current) return;
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

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (approachActiveRef.current) return;
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

  /** Klavye yolu: odaklanılan parfüm seçiliyor ve kamera üstüne gidiyor. */
  const focusMark = (mark: SpaceMark) => {
    // Klavye sahneyi bitiriyor. Yaklaşma tekerleğe bağlı; tekerleği olmayan biri
    // için sahneyi geçecek bir hareket yok ve kapı yüzüne kapanırdı. Sekme ile
    // bir parfüme uzanmak zaten "içeri girdim" demek.
    finishApproach();

    // Burada hover'a dokunulmuyor. Dokunulsaydı fare olmayan bir yolla ayarlanmış
    // olurdu ve onu temizleyecek bir `pointermove` hiç gelmezdi: etiket, sonraki
    // bütün seçimlerde bu parfümü göstermeye devam ederdi.
    select(mark.id);
    moveTo(centerOn(cameraRef.current, mark));
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/*
        Erişilebilirlik ağacından çıkarılıyor: tuval oraya adsız, boş bir grafik
        olarak düşüyordu. Aynı bilginin gezilebilir karşılığı aşağıdaki liste;
        iki kez sunmak yönlendirmiyor, karıştırıyor.
      */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setHovered(null)}
      />

      {/*
        Giriş metni — sunucuda üretiliyor, görünürlüğü burada.

        Sahne boyunca yok: uzaktayken ekranda "44 parfüm" yazması, henüz 44 nokta
        görünmezken verilmiş bir söz olurdu. Varışta yerine yerleşiyor.
      */}
      <div
        ref={introRef}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700"
      >
        {children}
      </div>

      {/*
        Yaklaşma ipucu.

        Söylediği tek şey "kaydırılabilir" — kimlik değil, hareket. Boşluk
        korkusunun asıl kaynağı "neredeyim" değil "ne yapacağım" sorusuydu; bir
        isim ona zaten cevap vermiyor.

        Fare ikonu bilerek yok: sitenin kendi dili saç teli inceliğinde çizgiler
        (giriş ipucundaki ilerleme şeridi de öyle). Nefes alması, hareketsiz bir
        çizginin süs sanılmasını engelliyor.

        İlerlemenin ilk üçte ikisinde sönüp bitiyor: kullanıcı kaydırmaya
        başladığı an ipucunun işi bitmiştir, geri kalan yolda ekranda durması
        yalnızca gürültü olurdu.
      */}
      <div
        ref={cueRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[18%] flex justify-center opacity-0 transition-opacity duration-300"
      >
        {APPROACH_CUE === 'mark' ? (
          <span className="block h-10 w-px animate-[osmos-breathe_2.8s_ease-in-out_infinite] bg-white/60" />
        ) : (
          <span className="text-[11px] tracking-[0.45em] text-white/35">OSMOS</span>
        )}
      </div>

      {/* Etiket katmanı — konumu her karede çizimle birlikte güncelleniyor. */}
      <div
        ref={labelRef}
        className="pointer-events-none absolute left-0 top-0 opacity-0 transition-opacity duration-150"
      >
        {/* pb, noktanın yarıçapı + halosu kadar boşluk bırakıyor: etiket seçili
            noktanın üstüne binmesin. */}
        <div className="-translate-x-1/2 -translate-y-full pb-5 text-center">
          <p className="whitespace-nowrap text-[13px] leading-tight text-white/90">
            {labelled?.name ?? ''}
          </p>
          <p className="whitespace-nowrap text-[11px] leading-tight text-white/40">
            {labelled?.brand ?? ''}
          </p>
        </div>
      </div>

      {/*
        Ekran okuyucu ve klavye için yol. Tuval onların gözünde boş bir
        dikdörtgen; SVG sürümünde her noktanın kendi odağı vardı, o yetenek
        kaybolmamalı. Tab ile geziliyor, odak parfümü seçip kamerayı üstüne getiriyor.
      */}
      <ul className="sr-only" aria-label="Koku uzayı — parfüme git">
        {marks.map((mark) => (
          <li key={mark.id}>
            <button type="button" onFocus={() => focusMark(mark)} onClick={() => focusMark(mark)}>
              {mark.name}, {mark.brand}
            </button>
            {/*
              Tekerleği olmayanın yolu. Kaydırarak giriş fare ve dokunma için;
              klavyeyle gezen ya da ekran okuyucu kullanan biri için kaydırma
              diye bir şey yok. Gerçek bir bağlantı: yeni sekmede açılabiliyor,
              ekran okuyucu "bağlantı" diye duyuruyor, düğme taklidi değil.
            */}
            <Link href={`/parfum/${mark.id}`}>{mark.name} sayfası</Link>
          </li>
        ))}
      </ul>

      {/* Küratör cümlesi yalnızca seçimde — fare gezdirirken alt metin sürekli
          değişip huzursuz etmesin. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <p
          className={`mx-auto max-w-xl text-center text-sm italic leading-relaxed text-white/50 transition-opacity duration-300 ${
            selected?.line ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {selected?.line ?? ' '}
        </p>

        {/*
          Keşfedilebilirlik. Kaydırarak giriş, denenmediği sürece görünmez bir
          hareket; şartlar sağlandığı an kullanıcıya "buradan devam edilebilir"
          demek zorundayız. İnce çizgi aynı zamanda ilerleme göstergesi: ne
          kadar kaldığı görülüyor, geri çevirince geri gidiyor.
        */}
        <div
          className={`mx-auto mt-5 flex max-w-xs flex-col items-center gap-2 transition-opacity duration-300 ${
            entryHint ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        >
          <span className="text-[11px] tracking-[0.25em] text-white/40">
            KAYDIRMAYA DEVAM ET
          </span>
          <span className="h-px w-full overflow-hidden bg-white/10">
            <span
              className="block h-full w-full origin-left bg-white/60 will-change-transform"
              style={{ transform: `scaleX(${entryProgress})` }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
