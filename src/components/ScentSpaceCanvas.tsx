'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SpaceMark } from '@/data/types';
import {
  type Camera,
  type Viewport,
  centerOn,
  worldToScreen,
  boundsOf,
} from '@/lib/space-camera';
import { drawSpace } from '@/lib/space-draw';
import { prefersReducedMotion } from '@/lib/motion';
import { useCanvasSize } from '@/components/space/use-canvas-size';
import { type EntryState, HOLD_DURATION, NO_ENTRY } from '@/lib/space-entry';
import { type FeelTarget, NO_FEEL } from '@/lib/space-feel';
import { START_SCALE } from '@/lib/space-approach';
import { useApproachScene } from '@/components/space/use-approach-scene';
import { useSpaceInput } from '@/components/space/use-space-input';
import { SpaceOverlays } from '@/components/space/SpaceOverlays';
import { SpaceKeyboardList } from '@/components/space/SpaceKeyboardList';

/**
 * Koku Uzayı — sitenin ana ekranı.
 *
 * Tuval, çünkü nokta sayısı 44'te durmayacak: 250+ DOM düğümünü her karede
 * yeniden konumlandırmak sürüklemeyi öldürür.
 *
 * Bileşenin işi "ne zaman çizileceği". "Nereye çizileceği" `space-camera.ts`,
 * "neyin çizileceği" `space-draw.ts` içinde — ikisi de saf.
 *
 * Dosya 971 satıra çıkıp projenin 800 sınırını aşınca sorumluluk dikişlerinden
 * bölündü; `perfumes.ts` / `perfume-sets/` ile aynı desen — ince bir giriş
 * noktası, yanında parçalar:
 *
 *   space/use-canvas-size    ölçü + cihaz piksel oranı
 *   space/use-approach-scene yaklaşma sahnesinin ömrü
 *   space/use-space-input    işaretçi · sürükleme · sıkıştırma · tutma · tekerlek
 *   space/SpaceOverlays      etiket · ipucu · giriş metni · küratör cümlesi · şerit
 *   space/SpaceKeyboardList  klavye ve ekran okuyucu yolu
 *
 * Burada kalan şey merkez: kare döngüsü, seçim, adres eşitleme ve JSX iskeleti.
 * Bölme mekanikti — hiçbir mantık değişmedi, davranış birebir aynı.
 *
 * ⚠️ Kamera React durumunda DEĞİL, `useRef` içinde. Sürüklerken kare başına bir
 * `setState` demek kare başına bir React ağacı demek; 44 nokta için gereksiz,
 * 250'de görünür yavaşlık. React yalnızca seyrek değişenleri (seçim, üstüne
 * gelinen nokta) tutuyor; kamera doğrudan tuvale gidiyor.
 */

/** Klavyeyle bir noktaya gitme süresi (ms). */
const FOCUS_DURATION = 420;

interface Animation {
  readonly from: Camera;
  readonly to: Camera;
  readonly start: number;
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
  // Yaklaşma sahnesinin tutunduğu iki katman. Sahnenin durumu `useApproachScene`
  // içinde, DOM'u burada: opaklıklarını o kanca doğrudan yazıyor.
  const cueRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const feelRef = useRef<HTMLDivElement>(null);

  /**
   * Sinestezi kaydıraçlarının tarifi — kaydıraçlar yazıyor, çizim okuyor.
   *
   * Durumda değil ref'te, kamerayla aynı gerekçeyle: topuz sürülürken saniyede
   * onlarca kez değişiyor ve değiştirdiği tek şey tuval. Bir `setState` demek
   * her çentikte bir React ağacı demek olurdu — üstelik React'in yeniden
   * çizeceği hiçbir metin yok.
   *
   * `NO_FEEL` ile doğuyor: kaydıraçlar ortada duruyor ama ortası bir tarif
   * değil. Ayrımın tamamı `space-feel.ts`te.
   */
  const feelTargetRef = useRef<FeelTarget>(NO_FEEL);

  /*
   * Kamera yaklaşmanın başladığı yerde doğuyor, `INITIAL_CAMERA`'da değil.
   *
   * Sahnenin çalışmayacağı durumlar (adres `?mark=` taşıyor, hareket azaltılmış,
   * sahne bu oturumda görülmüş) ancak tarayıcıda anlaşılıyor — `sessionStorage`
   * ve `matchMedia` sunucuda yok. O yüzden varsayılan "sahne var"; iptal kararı
   * `useApproachScene` içindeki etkide veriliyor. İlk boyanma etkilerden sonra
   * olduğu için atlayanlar uzak kareyi hiç görmüyor, sıçrama olmuyor.
   */
  const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: START_SCALE });
  // Bulut sınırları `marks` değişmedikçe sabit; ölçüyü yeniden boyutlandırma
  // geri çağrısı okuyor, o yüzden ref'te — yoksa her ölçüde yeniden kurulurdu.
  const bounds = useMemo(() => boundsOf(marks), [marks]);
  const boundsRef = useRef(bounds);
  /*
   * Tazeleme render'da DEĞİL, etkide.
   *
   * Render sırasında `boundsRef.current = bounds` yazıyordu. React 19 bunu hata
   * sayıyor ve gerekçesi sağlam: render saf olmak zorunda, yarıda kesilip
   * atılabiliyor — atılan bir render'ın ref'e bıraktığı iz geri alınmıyor.
   *
   * Kaçırılan kare yok. Ref'i yalnızca `useCanvasSize`in `resize`i okuyor; o da
   * ya bağlanma anında çalışıyor (ref `useRef(bounds)` ile zaten doğru değerle
   * doğdu) ya da gözlemci/pencere geri çağrısında, yani her hâlükârda bu
   * etkiden sonra.
   */
  useEffect(() => {
    boundsRef.current = bounds;
  }, [bounds]);

  const viewportRef = useRef<Viewport>({ width: 0, height: 0, ...bounds });
  const frameRef = useRef<number | null>(null);
  const animationRef = useRef<Animation | null>(null);

  const markById = useMemo(() => new Map(marks.map((mark) => [mark.id, mark])), [marks]);

  // Seçim ve üstüne gelme hem durumda hem ref'te: durum metni besliyor (ad,
  // küratör cümlesi), ref çizime gidiyor. Çizim, React render'ını beklemeden
  // en güncel değeri görmek zorunda — sürükleme ortasında bir kare geride kalmasın.
  /**
   * Seçim `?mark=` ile **doğuyor**, sonradan bir etkiyle atanmıyor.
   *
   * Etkiyle yapılıyordu ve bedeli iki render'dı: ilki seçimsiz, hemen ardından
   * `setSelectedId` ile ikincisi. React 19 bunu `set-state-in-effect` ile
   * işaretliyor — adres bir dış sistem ve dış sistemin ilk değerini okumanın
   * yeri etki değil, başlangıcın kendisi.
   *
   * Hidrasyon uyuşmazlığı yok: uzay statik üretiliyor, `?mark=` okuyan ağaç ise
   * Suspense sınırının altında istemcide doğuyor — sunucu HTML'ine yalnızca
   * yedek giriyor (`app/page.tsx`in Suspense yorumu). Yani bu başlangıç değerini
   * hesaplayan ilk render zaten tarayıcıda, adres elinin altında.
   *
   * Ters yön — adresten türetmek — denenemezdi: boşluğa basmak seçimi kapatıyor
   * (`use-space-input.ts`, `select(mark?.id ?? null)`), oysa adres `?mark=`i
   * taşımaya devam ediyor. Türetilmiş bir seçim kapatıldığı anda geri dirilirdi.
   */
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const id = searchParams.get('mark');
    return id && markById.has(id) ? id : null;
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(selectedId);
  const hoveredRef = useRef<string | null>(null);

  /**
   * Kaydırarak giriş — birikimi ref'te, ipucu için gereken kadarı durumda.
   *
   * Kamerayla aynı gerekçe: birikim kare başına birkaç kez değişiyor ve çizime
   * gidiyor; her adımda `setState` demek her adımda bir React ağacı demek.
   * Durumda tutulan yalnızca "ipucu görünsün mü" ve ilerlemenin kabaca nerede
   * olduğu — ikisi de saniyede birkaç kez değişiyor, kare başına değil.
   */
  const entryRef = useRef<EntryState>(NO_ENTRY);
  /**
   * Süren basılı tutma ve "gezinme başladı" bayrağı.
   *
   * Girdi kancası bunları yazıyor ama burada bildiriliyorlar: saati işleten
   * `draw`, yani okuyan taraf burası. Ayrı bir zamanlayıcı yok — tek saat
   * `performance.now()`, tek tüketici çizim döngüsü.
   */
  const holdRef = useRef<{ markId: string; startedAt: number } | null>(null);
  const navigatingRef = useRef(false);
  const [entryHint, setEntryHint] = useState(false);
  const [entryProgress, setEntryProgress] = useState(0);

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

  /*
   * ⚠️ Yaklaşma sahnesi burada, `?mark=` etkisinin ÜSTÜNDE kuruluyor ve sıra
   * kritik. Kancanın "sahne çalışsın mı?" etkisi iptal kararında kamerayı
   * `INITIAL_CAMERA`'ya (ölçek 1) alıyor; hemen aşağıdaki `?mark=` etkisi ise
   * `centerOn` ile ölçeği koruyarak ortalıyor. React etkileri bildirim sırasına
   * göre çalıştığı için ters sırada ortalama, yaklaşmanın 0.14'lük ölçeğiyle
   * yapılır ve parfüm sayfasından dönen göz uzayı minicik görürdü.
   *
   * Yani bu çağrı aşağı kaydırılamaz. Gerekçenin tamamı `use-approach-scene.ts`te.
   */
  const approach = useApproachScene({
    canvasRef,
    cameraRef,
    cueRef,
    introRef,
    feelRef,
    requestDraw,
  });

  /**
   * `/?mark=<id>` ile dönüş — parfüm sayfasından geri gelen göz.
   *
   * Seçimi burası yapmıyor; o yukarıda, durumun başlangıcında doğdu. Burada
   * kalan tek iş kamerayı yerine oturtmak, yani React'in bilmediği bir dış
   * duruma yazmak — etkinin asıl işi bu.
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

  /*
   * Girdi yolları — işaretçi, sürükleme, sıkıştırma, tutma, tekerlek.
   *
   * `draw`'dan ÖNCE kuruluyor çünkü çizim döngüsü tutma saatini bu kancanın
   * ref'lerinden okuyor. Tekerlek dinleyicisinin burada, yaklaşma ile `?mark=`
   * etkilerinin arasında bildirilmesi zararsız: etki yalnızca dinleyici bağlıyor,
   * kameraya dokunmuyor.
   */
  useCanvasSize({ canvasRef, viewportRef, boundsRef, requestDraw });

  const input = useSpaceInput({
    marks,
    markById,
    canvasRef,
    cameraRef,
    viewportRef,
    animationRef,
    selectedRef,
    entryRef,
    holdRef,
    navigatingRef,
    approach,
    select,
    setHovered,
    moveTo,
    enterPerfume,
    setEntryHint,
    setEntryProgress,
    requestDraw,
  });

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
      feel: feelTargetRef.current,
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

  /** Klavye yolu: odaklanılan parfüm seçiliyor ve kamera üstüne gidiyor. */
  const focusMark = (mark: SpaceMark) => {
    // Klavye sahneyi bitiriyor. Yaklaşma tekerleğe bağlı; tekerleği olmayan biri
    // için sahneyi geçecek bir hareket yok ve kapı yüzüne kapanırdı. Sekme ile
    // bir parfüme uzanmak zaten "içeri girdim" demek.
    approach.finish();

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
        onPointerDown={input.onPointerDown}
        onPointerMove={input.onPointerMove}
        onPointerUp={input.onPointerUp}
        onPointerCancel={input.onPointerUp}
        onPointerLeave={() => setHovered(null)}
      />

      <SpaceOverlays
        introRef={introRef}
        cueRef={cueRef}
        labelRef={labelRef}
        feelRef={feelRef}
        feelTargetRef={feelTargetRef}
        requestDraw={requestDraw}
        labelled={labelled}
        selectedLine={selected?.line ?? null}
        entryHint={entryHint}
        entryProgress={entryProgress}
      >
        {children}
      </SpaceOverlays>

      <SpaceKeyboardList marks={marks} onFocusMark={focusMark} />
    </div>
  );
}
