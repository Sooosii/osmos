'use client';

import { useEffect, useRef } from 'react';
import { backdropChannels, ditherThreshold, fieldValue, tuneField } from '@/lib/dither-field';

/**
 * Nota sayfasının arkasındaki hareketli tram alanı.
 *
 * Referanstaki arka planın yerine geçiyor ama kendi kodumuz: dış istek yok,
 * başkasının sahne kimliği yok, rozet silme yok. Alanın matematiği
 * `lib/dither-field.ts`te ve orada sınanıyor; burada yalnızca çizim var.
 *
 * ⚠️ **Izgara ekran pikselinde sabit.** Tampon ekranın CELL'de birine oturuyor
 * ve büyütme `imageSmoothingEnabled = false` ile yapılıyor. Tersini yapıp dokuyu
 * geometriyle birlikte ölçeklemek `NoteOrbit`te dokuyu tamamen dağıtmıştı;
 * ekranda görülüp düzeltilen bir hataydı, tekrarlanmıyor.
 *
 * Maliyet: tam ekran piksel piksel dönmüyor. Tampon ekranın dörtte biri ölçüsünde
 * (CELL = 4) ve toplam hücre sayısı `MAX_CELLS`le sınırlı — 4K bir ekranda bile
 * kare başına sabit iş. İri pikseller kusur değil, aranan görüntünün kendisi.
 */

interface DitherBackdropProps {
  /** Notanın baskın aile rengi — haritadaki, parfüm sayfasındaki renkle aynı. */
  readonly color: string;
  readonly peakMinutes: number;
  readonly halfLifeMinutes: number;
}

/** Bir tram hücresinin ekrandaki kenarı, CSS pikseli. */
const CELL = 4;

/**
 * Tampondaki en çok hücre.
 *
 * Çok geniş ekranlarda hücre kenarı büyüyerek bu tavana uyuyor. Sınır olmasaydı
 * ultra geniş bir ekran kare başına yüz binlerce hücre isterdi.
 */
const MAX_CELLS = 44_000;

/**
 * Yanan hücrenin opaklığı, 0–255.
 *
 * Alanın gücü yoğunlukta: ekranın %12.7'si (bergamot) ile %20.6'sı (sandal)
 * arasında bir oran yanıyor — ölçüldü. Opaklık o dokunun ne kadar öne çıktığını
 * belirliyor ve **ekranda ayarlanacak tek sayı burası**.
 *
 * ⚠️ İki kez ekranda düşürüldü ve **ikisi de okunurluk yüzündendi.** 170'te
 * (255'in %67'si) sayfanın bütün yazısı gidiyordu; 46'da gövde metni okunuyordu
 * ama sitenin ince etiketleri (`text-white/25` gibi) noktaların içinde
 * kayboluyordu. Alan arka plan; ön plana çıktığı anda işini yapmıyor demektir.
 *
 * Yükseltirken gövde metnine değil, **en ince etikete** bakın —
 * `/note/bergamot`ta şeridin altındaki "THE FIRST SECONDS".
 */
const DOT_ALPHA = 30;

/** Tuvalin çözünürlük çarpanı. 2'nin üstünde gözle fark edilmiyor. */
const MAX_DPR = 2;

export function DitherBackdrop({ color, peakMinutes, halfLifeMinutes }: DitherBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const buffer = document.createElement('canvas');
    const bufferCtx = buffer.getContext('2d');
    if (!bufferCtx) return;

    const tuning = tuneField(peakMinutes, halfLifeMinutes);
    // Ham aile rengi değil, solmuş hâli — gerekçe `dither-field.ts`te.
    const [red, green, blue] = backdropChannels(color);

    let image: ImageData | null = null;
    let cellSize = CELL;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      // Hücre kenarı tavanı aşmamak için büyüyor; dar ekranlarda CELL'de kalıyor.
      const cells = (width / CELL) * (height / CELL);
      cellSize = cells > MAX_CELLS ? CELL * Math.sqrt(cells / MAX_CELLS) : CELL;

      const bufferWidth = Math.max(1, Math.ceil(width / cellSize));
      const bufferHeight = Math.max(1, Math.ceil(height / cellSize));

      buffer.width = bufferWidth;
      buffer.height = bufferHeight;
      image = bufferCtx.createImageData(bufferWidth, bufferHeight);

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.imageSmoothingEnabled = false;
    };

    const draw = (seconds: number) => {
      if (!image) return;

      const { width: bufferWidth, height: bufferHeight } = buffer;
      const data = image.data;

      // Kısa kenar ±1'e ölçekleniyor; uzun kenar dışarı taşıyor ve sönümle bitiyor.
      const scale = Math.min(bufferWidth, bufferHeight) / 2;
      const centerX = bufferWidth / 2;
      const centerY = bufferHeight / 2;

      let index = 0;
      for (let y = 0; y < bufferHeight; y += 1) {
        const ny = (y - centerY) / scale;

        for (let x = 0; x < bufferWidth; x += 1) {
          const nx = (x - centerX) / scale;
          const on = fieldValue(nx, ny, seconds, tuning) > ditherThreshold(x, y);

          data[index] = red;
          data[index + 1] = green;
          data[index + 2] = blue;
          data[index + 3] = on ? DOT_ALPHA : 0;
          index += 4;
        }
      }

      bufferCtx.putImageData(image, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(buffer, 0, 0, canvas.width, canvas.height);
    };

    resize();

    const stillPreferred = window.matchMedia('(prefers-reduced-motion: reduce)');

    /*
      Hareketi kapatmış birine dönen bir arka plan göndermek sözü tutmamak olur.
      Alan yine çiziliyor — kompozisyon eksik kalmıyor — ama tek bir karede
      donuyor. Kullanıcı ayarı oturum ortasında değiştirirse de dinleniyor.
    */
    let frame = 0;

    const loop = (now: number) => {
      draw(now / 1000);
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      if (stillPreferred.matches) {
        draw(0);
        return;
      }
      frame = requestAnimationFrame(loop);
    };

    const onResize = () => {
      resize();
      if (stillPreferred.matches) draw(0);
    };

    start();
    window.addEventListener('resize', onResize);
    stillPreferred.addEventListener('change', start);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      stillPreferred.removeEventListener('change', start);
    };
  }, [color, peakMinutes, halfLifeMinutes]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 size-full"
    />
  );
}
