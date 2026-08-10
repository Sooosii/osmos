'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import type { IntroPoint } from '@/lib/intro-points';
import { EN } from '@/i18n/en';
import './intro.css';

declare global {
  interface Window {
    OSMOS_INTRO_POINTS?: readonly IntroPoint[];
    OSMOS_INTRO_DISABLE?: boolean;
    OSMOS_INTRO_TEXT?: { readonly word: string; readonly tag: string; readonly hint: string };
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

/**
 * Perdeyi görünür alana oturtur — `AstronotIntro`daki çapanın perde hâli.
 *
 * Sahibin ekranında perde de merkezden kaymış göründü; sebep sayfa düzeni
 * değil, düzen görünümüyle GÖRÜNEN alanın ayrışması (görsel yakınlaştırma ya
 * da dışarıdan basılan `zoom`). Perdenin kendi CSS'i `inset: 0` der; burada
 * satır içi stil onu görünür kutuya çekiyor ve dıştan gelen zoom'a tersiyle
 * karşılık veriyor. Normal ortamda ikisi de birebir aynı sonuç: sıfır etki.
 * `intro.js`e dokunulmuyor — bu iş bağlayıcı katmanın işi.
 */
function fitPerde() {
  const el = document.querySelector<HTMLElement>('.osmos-intro');
  if (!el) return;

  const read = (target: Element) =>
    Number.parseFloat(getComputedStyle(target).getPropertyValue('zoom') || '1') || 1;
  const outside = read(document.documentElement) * read(document.body);
  if (outside === 1) el.style.removeProperty('zoom');
  else el.style.setProperty('zoom', String(1 / outside));

  const vv = window.visualViewport;
  if (!vv) return;
  el.style.inset = 'auto';
  el.style.left = `${vv.offsetLeft}px`;
  el.style.top = `${vv.offsetTop}px`;
  el.style.width = `${vv.width}px`;
  el.style.height = `${vv.height}px`;
}

export function IntroOverlay({ points }: IntroOverlayProps) {
  /*
    Noktalar ve metin aynı etkide yazılıyor: ikisi de betiğin okuduğu tek yönlü
    pencere değişkenleri ve ikisi de `points`e bağlı — tanıtım cümlesindeki sayı
    noktalardan geliyor. Betiğin kendi yorumu "parfüm eklenince perde de sayar"
    diyor; sabit bir sayı yazmak o sözü bozardı.
  */
  useEffect(() => {
    window.OSMOS_INTRO_POINTS = points;
    window.OSMOS_INTRO_TEXT = {
      word: EN.intro.word,
      tag: EN.intro.tag(points.length),
      hint: EN.intro.hint.toUpperCase(),
    };
  }, [points]);

  useEffect(() => {
    window.visualViewport?.addEventListener('resize', fitPerde);
    window.visualViewport?.addEventListener('scroll', fitPerde);
    return () => {
      window.visualViewport?.removeEventListener('resize', fitPerde);
      window.visualViewport?.removeEventListener('scroll', fitPerde);
    };
  }, []);

  return (
    <>
      <Script
        src="/intro.js"
        strategy="afterInteractive"
        onReady={() => {
          window.OsmosIntro?.init(points);
          fitPerde(); // `mount` eşzamanlı: perde bu satırda çoktan DOM'da.
        }}
      />
    </>
  );
}
