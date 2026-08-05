import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useSearchParams } from 'next/navigation';
import { INITIAL_CAMERA, type Camera } from '@/lib/space-camera';
import { prefersReducedMotion } from '@/lib/motion';
import {
  APPROACH_DONE,
  APPROACH_ONCE,
  APPROACH_SEEN_KEY,
  APPROACH_START,
  type ApproachState,
  advance as advanceApproach,
  isComplete,
  scaleAt,
} from '@/lib/space-approach';

/**
 * Yaklaşma sahnesinin ömrü — uzaya uzaktan gelme eşiği.
 *
 * Uzay tuvalinden çıkarıldı çünkü sahnenin bütün durumu iki ref'ten ibaret
 * (`approachRef`, `approachActiveRef`) ve ikisi de yalnızca burada okunuyor.
 * Dışarıya üç soruyla konuşuyor: sürüyor mu, tekerleği ister misin, biter misin.
 * Bileşenin sahnenin iç durumunu bilmesine gerek kalmıyor.
 *
 * Çizdiği DOM katmanlarını (`cueRef`, `introRef`) kurmuyor, parametre olarak
 * alıyor — `useCanvasSize` ile aynı sözleşme. Sebebi ilkesel: ref'i kim
 * render ediyorsa o bildirir; kanca yalnızca yazar.
 *
 * Sahne sürerken **kameranın sahibi bu kanca.** `cameraRef`'e yazıyor ve bu
 * doğru: o sırada kamerayı başka hiçbir yol süremiyor, hepsi `isActive()`
 * kapısından erken dönüyor.
 *
 * ⚠️ `'use client'` bilerek yok — modül yalnızca istemci bileşeninden import
 * ediliyor, sınırı `ScentSpaceCanvas.tsx` çiziyor.
 */

export interface ApproachScene {
  /**
   * Sahne sürüyor mu — işaretçi yollarının erken dönüş kapısı.
   *
   * Bir bayrak değil kapı: sahne sürerken tekerlek, sürükleme ve tıklama
   * yollarının hepsi buradan erken dönüyor. Ref üzerinden okunuyor, çünkü olay
   * işleyicilerinin en güncel değeri React render'ını beklemeden görmesi gerek —
   * sahnenin bittiği kare ile ilk gezinme hareketi aynı ana düşebilir.
   */
  readonly isActive: () => boolean;
  /**
   * Tekerleği sahneye harcamayı dener.
   *
   * `true` = sahne tüketti, çağıran erken dönmeli.
   * `false` = sahne bitmiş, tekerlek uzaya ait.
   *
   * Bu ayrım, `space-entry.ts`'in anlattığı tuzağa düşmemenin tek yolu: orada iki
   * anlam AYNI ANDA canlıydı ve kullanıcı hangisini tetiklediğini bilemiyordu.
   * Burada iki anlam arka arkaya — sahne bitene kadar tekerlek sahneyi sürüyor,
   * bittiği andan itibaren uzayı. Belirsiz tek bir kare yok.
   *
   * Çapa yok: sahne boyunca kamera ekranın ortasında duruyor. `zoomAt` imleci
   * çapa alıyor ama uzaktan yaklaşırken imlecin altında henüz bir şey yok;
   * çapalamak bulutu kenara kaydırmaktan başka işe yaramazdı.
   */
  readonly consumeWheel: (delta: number) => boolean;
  /**
   * Sahneyi bitirir — kamerayı uzayın açılış konumuna oturtur.
   *
   * Dışarıya açılmasının sebebi klavye yolu: yaklaşma tekerleğe bağlı, tekerleği
   * olmayan biri için sahneyi bitirecek başka bir hareket yok ve kapı onun
   * yüzüne kapanmış olurdu. Sekme ile bir parfüme uzanmak zaten "içeri girdim"
   * demek.
   */
  readonly finish: () => void;
}

interface ApproachSceneOptions {
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly cameraRef: RefObject<Camera>;
  /**
   * İpucu ve giriş metni katmanları. Kanca **kurmuyor, alıyor** — `useCanvasSize`
   * ile aynı sözleşme: sahne kendi durumunu sahipleniyor, DOM'u ise onu çizen.
   *
   * Opaklıkları React'te DEĞİL, doğrudan burada. Kare başına değişiyorlar ve her
   * adımda `setState` demek her adımda bir React ağacı demek.
   *
   * İkinci ve daha sinsi sebep: sahnenin çalışıp çalışmayacağı ancak tarayıcıda
   * belli oluyor (`sessionStorage`, `matchMedia`, adres parametresi), yani
   * sunucuda çizilen çıktıda cevap yok. Durumla yapılsaydı hangi varsayılanı
   * verirsek verelim biri yanardı — sahneyi görecek olan giriş metnini bir kare
   * görüp kaybeder, atlayan ipucunu. İkisi de baştan opaklık 0 doğuyor; karar ilk
   * boyanmadan önceki etkide veriliyor ve doğru olan açılıyor.
   */
  readonly cueRef: RefObject<HTMLDivElement | null>;
  readonly introRef: RefObject<HTMLDivElement | null>;
  /**
   * Sinestezi kaydıraçlarının katmanı — giriş metniyle aynı anda geliyor.
   *
   * Uzaktayken sorulacak bir şey ortada yok; kaydıraçlar da eşiğin öbür
   * tarafında. Giriş metniyle aynı ömrü paylaştıkları için aynı yerden
   * boyanıyorlar.
   */
  readonly feelRef: RefObject<HTMLDivElement | null>;
  readonly requestDraw: () => void;
}

export function useApproachScene({
  canvasRef,
  cameraRef,
  cueRef,
  introRef,
  feelRef,
  requestDraw,
}: ApproachSceneOptions): ApproachScene {
  const searchParams = useSearchParams();

  const approachRef = useRef<ApproachState>(APPROACH_START);
  const approachActiveRef = useRef(true);

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

    if (feelRef.current) {
      feelRef.current.style.opacity = active ? '0' : '1';
      // Opaklık tek başına yetmiyor: görünmez bir `<input>` hâlâ sekmeyle
      // odaklanılabilir olurdu ve klavyeyle gelen biri, sahne sürerken ekranda
      // hiç görünmeyen bir kaydıraca düşerdi. `inert` hem işaretçiyi hem
      // klavyeyi birlikte kesiyor.
      feelRef.current.toggleAttribute('inert', active);
    }

    // Sahne sürerken tutulacak bir şey yok; "yakala" imleci gösterip sürüklemeye
    // izin vermemek yalan söylemek olurdu.
    if (canvasRef.current) {
      canvasRef.current.style.cursor = active ? 'default' : '';
    }
  }, [canvasRef, cueRef, introRef, feelRef]);

  const finish = useCallback(() => {
    if (!approachActiveRef.current) return;

    approachActiveRef.current = false;
    approachRef.current = APPROACH_DONE;
    cameraRef.current = INITIAL_CAMERA;
    paintScene();

    if (APPROACH_ONCE) sessionStorage.setItem(APPROACH_SEEN_KEY, '1');
    requestDraw();
  }, [cameraRef, paintScene, requestDraw]);

  /*
   * Sahne çalışsın mı?
   *
   * ⚠️ Bu etki `?mark=` etkisinden ÖNCE çalışmak zorunda ve sırası kritik. İptal
   * kararı kamerayı `INITIAL_CAMERA`'ya (ölçek 1) alıyor; `?mark=` etkisi ise
   * `centerOn` ile ölçeği koruyarak ortalıyor. Ters sırada olsaydı ortalama,
   * yaklaşmanın 0.14'lük ölçeğiyle yapılır ve parfüm sayfasından dönen göz uzayı
   * minicik görürdü.
   *
   * React etkileri bildirim sırasına göre çalıştığı için sırayı koruyan şey
   * `useApproachScene(...)` çağrısının bileşen gövdesinde `?mark=` etkisinden
   * yukarıda durması. Aşağı kaydırma.
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
  }, [cameraRef, paintScene, requestDraw, searchParams]);

  const isActive = useCallback(() => approachActiveRef.current, []);

  const consumeWheel = useCallback(
    (delta: number) => {
      if (!approachActiveRef.current) return false;

      const next = advanceApproach(approachRef.current, delta);
      approachRef.current = next;
      cameraRef.current = { x: 0, y: 0, scale: scaleAt(next.progress) };

      // `finish` kamerayı `INITIAL_CAMERA`'ya alıyor; `scaleAt(1)` zaten tam
      // olarak orası, dolayısıyla devir teslimde tek bir piksel oynamıyor.
      if (isComplete(next)) {
        finish();
      } else {
        paintScene();
        requestDraw();
      }
      return true;
    },
    [cameraRef, finish, paintScene, requestDraw],
  );

  return { isActive, consumeWheel, finish };
}
