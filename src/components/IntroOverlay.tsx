'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import type { IntroPoint } from '@/lib/intro-points';
import './intro.css';

declare global {
  interface Window {
    OSMOS_INTRO_POINTS?: readonly IntroPoint[];
    OSMOS_INTRO_DISABLE?: boolean;
    OsmosIntro?: { readonly init: (points?: readonly IntroPoint[]) => void };
  }
}

interface IntroOverlayProps {
  readonly points: readonly IntroPoint[];
}

/**
 * Açılış perdesini sayfaya bağlayan ince katman — **deneme**.
 *
 * Perdenin kendisi `public/intro.js`te ve oraya bilerek dokunulmadı: sahibin
 * getirdiği dosya olduğu gibi duruyor, beğenilmezse iki dosya ve bu bileşen
 * silinip iş bitiyor. Buradaki tek iş onu Next'in dünyasına sokmak.
 *
 * ⚠️ Betiği `DOMContentLoaded`a bırakmak **çalışmıyor**. Dosyanın sonundaki
 * dinleyici tek başına yeterli görünüyor ama `next/script`in varsayılanı
 * (`afterInteractive`) betiği o olay çoktan geçtikten sonra yüklüyor: dinleyici
 * hiç tetiklenmiyor, perde hiç açılmıyor. `onReady` bu yüzden var — betiğin
 * kendi dışa verdiği `window.OsmosIntro.init`i doğrudan çağırıyor. İki yol
 * birden çalışırsa sorun değil; `mount` zaten açık perde varsa erken dönüyor.
 *
 * Noktalar sunucuda hesaplanıp aşağı veriliyor (`intro-points.ts`), çünkü
 * betiğin kendi yorumu "gerçek konumları ver, yoksa canlı haritaya geçerken
 * sıçrama olur" diyor.
 *
 * Stil `public/`te değil, yanında ve `import` ile: elle `<link>` bağlamak Next'in
 * `no-css-tags` kuralına takılıyordu. Betik `public/`te kalmak zorunda — kendini
 * `document.body`ye ekleyen, modül olmayan bir dosya.
 */
export function IntroOverlay({ points }: IntroOverlayProps) {
  useEffect(() => {
    window.OSMOS_INTRO_POINTS = points;
  }, [points]);

  return (
    <>
      <Script
        src="/intro.js"
        strategy="afterInteractive"
        onReady={() => window.OsmosIntro?.init(points)}
      />
    </>
  );
}
