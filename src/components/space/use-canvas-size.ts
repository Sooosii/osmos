import { useEffect, type RefObject } from 'react';
import type { Viewport } from '@/lib/space-camera';

/**
 * Tuvalin ölçüsünü ekranla eşit tutar.
 *
 * Uzay tuvalinden çıkarıldı çünkü tek başına anlaşılıyor: hiçbir durum tutmuyor,
 * yalnızca dört ref'i okuyup yazıyor ve karşılığında bir kare istiyor. Çizimin
 * "ne zaman" ya da "neyin" sorusuyla hiç ilgisi yok — tek işi ölçü.
 *
 * ⚠️ `'use client'` bilerek yok: bu modül yalnızca istemci bileşeninden import
 * ediliyor, dolayısıyla zaten istemci grafiğinde. Sınırı `ScentSpaceCanvas.tsx`
 * çiziyor.
 */

interface CanvasSizeOptions {
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Ölçü değiştikçe güncellenen görüş alanı; çizim buradan okuyor. */
  readonly viewportRef: RefObject<Viewport>;
  /** Nokta bulutunun yarı ölçüleri — görüş alanına her seferinde kopyalanıyor. */
  readonly boundsRef: RefObject<{ halfX: number; halfY: number }>;
  readonly requestDraw: () => void;
}

// Tuval boyutu: mantıksal ölçü CSS pikseli, tampon ise cihaz pikseli.
export function useCanvasSize({
  canvasRef,
  viewportRef,
  boundsRef,
  requestDraw,
}: CanvasSizeOptions): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let pixelRatioQuery: MediaQueryList | null = null;

    function resize() {
      // Gereksiz görünüyor ama değil: `canvas` yukarıda daraltılmış bir `const`
      // olmasına rağmen TypeScript, hoist edilen bir `function` bildirimi içinde
      // daralmayı korumuyor. Kaldırılırsa derleme kırılıyor.
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const ratio = window.devicePixelRatio || 1;
      const width = Math.round(rect.width * ratio);
      const height = Math.round(rect.height * ratio);

      // Tampona yazmak tuvali temizliyor; ölçü değişmediyse dokunma.
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      viewportRef.current = { width: rect.width, height: rect.height, ...boundsRef.current };
      requestDraw();
    }

    /**
     * Cihaz piksel oranı değişimini izler.
     *
     * Pencere başka bir ekrana taşındığında, Windows ölçeklemesi ya da tarayıcı
     * yakınlaştırması değiştiğinde tuvalin CSS kutusu AYNI kalabiliyor — o zaman
     * `ResizeObserver` hiç konuşmuyor — ama gereken cihaz pikseli sayısı değişiyor.
     * Yakalanmazsa tuval eski çözünürlükte donuyor. `matchMedia` her yeni oranda
     * yeniden kuruluyor, çünkü sorgu o anki orana bağlı.
     */
    function watchPixelRatio() {
      pixelRatioQuery?.removeEventListener('change', onPixelRatioChange);
      pixelRatioQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      pixelRatioQuery.addEventListener('change', onPixelRatioChange);
    }

    function onPixelRatioChange() {
      resize();
      watchPixelRatio();
    }

    resize();
    watchPixelRatio();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // Gözlemciye ek olarak pencere olayı: ikisinden biri kaçırsa da tuval
    // ekranla aynı ölçüde kalıyor. Ölçü değişmediğinde `resize` zaten bedava.
    window.addEventListener('resize', resize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      pixelRatioQuery?.removeEventListener('change', onPixelRatioChange);
    };
  }, [canvasRef, viewportRef, boundsRef, requestDraw]);
}
