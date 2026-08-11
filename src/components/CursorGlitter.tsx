'use client';

import { useEffect, useRef } from 'react';
import { alphaOf, emit, step, type Speck } from '@/lib/glitter';

/**
 * İmleç tozu — yalnızca uzayda.
 *
 * Sahibin isteği. Getirdiği örnek three.js ve WebGL shader'larıyla yazılmıştı;
 * **alınmadı.** Site her şeyi elle yazılmış canvas 2D ile çiziyor ve bunu
 * README'de, duyuru metinlerinde ve Show HN kancasında söylüyor. Yeni bir
 * çizim kütüphanesi o cümleleri yalan yapardı. Etkinin *biçimi* alındı,
 * altyapısı değil — dither-field ve astronot kararlarının üçüncü tekrarı.
 *
 * ⚠️ **Yalnızca `/` (uzay) sayfasında.** Belge sayfalarında imlecin ardında
 * parıltı, okumayı bölerdi; uzay ise zaten bir sahne.
 *
 * ⚠️ **Dokunmatikte hiç çalışmıyor.** İmleç yoksa iz de yok; parmakla
 * dokunan kişide etki, dokunduğu yerde beliren rastgele bir parıltıya
 * dönüşürdü. `pointer: fine` denetimi bu yüzden var.
 *
 * ⚠️ **`prefers-reduced-motion` sözü tutuluyor** — sitenin başka yerlerinde
 * verilmiş söz. O durumda hiç çizilmiyor.
 *
 * ⚠️ **Yerli imleç GİZLENMİYOR.** Kaynak örnek gizliyordu; burada
 * gizlenmesi, uzaydaki noktaların tıklanabilir olduğunu söyleyen tek
 * göstergeyi (işaretçinin el hâline dönmesi) yok ederdi.
 */
const COLOR = '232, 220, 200';

export function CursorGlitter() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (still || !fine) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const specks: Speck[] = [];
    let last: { x: number; y: number } | null = null;
    let pending: { x: number; y: number } | null = null;
    let raf = 0;

    /*
      Tampon pencereyle birlikte yeniden kuruluyor; kurulmasaydı CSS eski
      tamponu gerdirir ve zerreler yumurtaya dönerdi (açılış tarlasında
      ölçülmüş hata).
    */
    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /*
      Konum kaydediliyor, zerre ÜRETİLMİYOR: `pointermove` saniyede yüzlerce
      kez gelebiliyor ve her birinde zerre serpmek hem sayıyı hem işi
      patlatırdı. Üretim çizim döngüsünde, kare başına bir kez.
    */
    const onMove = (event: PointerEvent) => {
      pending = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const onLeave = () => {
      last = null;
      pending = null;
    };
    document.addEventListener('pointerleave', onLeave);

    const frame = () => {
      raf = requestAnimationFrame(frame);

      if (pending) {
        if (last) emit(specks, last, pending);
        last = pending;
        pending = null;
      }

      step(specks);

      const width = window.innerWidth;
      const height = window.innerHeight;
      context.clearRect(0, 0, width, height);
      if (specks.length === 0) return;

      /*
        `lighter`: zerreler üst üste geldiğinde birbirini kapatmıyor,
        topluyor — tozun ışığı yakalaması böyle görünüyor. Uzayın kendi
        noktaları da koyu zemin üzerinde, o yüzden toplama güvenli.
      */
      context.globalCompositeOperation = 'lighter';
      for (const speck of specks) {
        context.beginPath();
        context.arc(speck.x, speck.y, speck.size, 0, Math.PI * 2);
        context.fillStyle = `rgba(${COLOR}, ${alphaOf(speck) * 0.5})`;
        context.fill();
      }
      context.globalCompositeOperation = 'source-over';
    };

    setup();
    window.addEventListener('resize', setup);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', setup);
      specks.length = 0;
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      /*
        En üstte ama tıklamayı yutmuyor: uzaydaki noktalar tıklanabilir
        kalmak zorunda. `z-40` — çerçeve ve kontroller (`z-30`) üstünde
        ama açılış perdesinin (`z-70`) altında.
      */
      className="pointer-events-none fixed inset-0 z-40 h-full w-full"
    />
  );
}
