'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
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
import { APPROACH_CUE, START_SCALE } from '@/lib/space-approach';
import { useApproachScene } from '@/components/space/use-approach-scene';
import { useSpaceInput } from '@/components/space/use-space-input';

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
  const approach = useApproachScene({ canvasRef, cameraRef, cueRef, introRef, requestDraw });

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
