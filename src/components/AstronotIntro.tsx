'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BG_CELL,
  CELL_H,
  CELL_W,
  COLS,
  FONT_SIZE,
  LUMA_CUTOFF,
  alphaAt,
  bobOffset,
  charAt,
  fieldAlpha,
  fieldDot,
  fieldX,
  fieldY,
  rowsFor,
} from '@/lib/astronot-tram';
import { prefersReducedMotion } from '@/lib/motion';
import { useDict } from '@/i18n/LocaleProvider';

/**
 * Açılışın ilk yüzü — karakterlerle taranmış tek astronot, arkasında süzülen
 * nokta tarlası.
 *
 * Sahibin referansı "hero-ascii-one" (21st.dev). Efektin aslı dışarıdan
 * yüklenen bir UnicornStudio sahnesi çıktı; sahne değiştirilemiyor ve site
 * dışarıya istek atmıyor — görsel dil bu yüzden elle kuruldu
 * (`astronot-tram.ts`; aynı karar daha önce `dither-field.ts`te verilmişti).
 * Ekranda özneden başka hiçbir şey yok — sahip "etrafında hiçbir şey
 * olmasın" dedi.
 *
 * Doku karakter merdiveni (` .:-=+*#%@`): yarıton noktaları denendi ve sahip
 * "çok aşırı yapay" dedi — kusursuz nokta ızgarası steril duruyordu.
 * Karakterlerin düzensiz biçimleri ve kıpırtısı dokuyu organikleştiriyor.
 * Figürün BİÇİMİ o denemeden kaldı ("şekiller durabilir, güzel onlar"):
 * gradyanlı gövde, kapkara vizör (örnekleyici parlaklık okuyor, kara boya
 * delik), eldivenler, botlar.
 *
 * Bu katman kapının tamamı değil, İLK yüzü: kaydırma astronotu uğurlarken
 * `onLeaving` ateşleniyor ve `Acilis` perdeyi hemen o anda kuruyor — astronot
 * perdenin ÜSTÜNDE soluyor (z-70 > perdenin 60'ı), yani solmanın altından
 * uzay değil perde çıkıyor. Perde astronot gittikten sonra kurulsaydı 700
 * ms'lik solma boyunca uzay görünüyordu — sahip ekranda yakaladı: "önce uzay
 * açılıyor sonra perde geliyor."
 *
 * `pointer-events: none` süs değil, mekanizmanın kendisi. Uzayın tekerleği
 * tuvalin üzerinde dinleniyor (`use-space-input.ts`); katman tıklanabilir
 * olmayınca ilk çentik hem astronotu uğurluyor hem yaklaşmayı başlatıyor —
 * eski perde ilk çentiği yutuyordu, ölçülmüş şikâyetti.
 */

/**
 * Astronot — tram için tonlandırılmış figür.
 *
 * Duruş sahibin taslağından türedi; siluete astronotu astronot yapan
 * parçalar eklendi (kollar + eldivenler, ayrık çanta kanatları, bacaklar,
 * botlar — "daha çok benzesin"). Dolgular düz beyaz değil gradyan: tram
 * noktalarının boyu bu tonlardan doğuyor. Vizördeki parıltı kara yüzeyin
 * üstünde tek ışık — kaskın "cam" olduğunu o söylüyor.
 */
const ASTRONOT_SVG = `<svg width="600" height="600" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="kask" cx="0.38" cy="0.3" r="0.85">
      <stop offset="0" stop-color="white" stop-opacity="0.95"/>
      <stop offset="0.5" stop-color="white" stop-opacity="0.55"/>
      <stop offset="1" stop-color="white" stop-opacity="0.2"/>
    </radialGradient>
    <linearGradient id="govde" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="white" stop-opacity="0.6"/>
      <stop offset="1" stop-color="white" stop-opacity="0.26"/>
    </linearGradient>
    <linearGradient id="yan" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="white" stop-opacity="0.5"/>
      <stop offset="1" stop-color="white" stop-opacity="0.18"/>
    </linearGradient>
    <radialGradient id="parla" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="white" stop-opacity="0.85"/>
      <stop offset="1" stop-color="white" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="54" y="100" width="14" height="52" rx="4" fill="url(#yan)"/>
  <rect x="132" y="100" width="14" height="52" rx="4" fill="url(#yan)"/>
  <path d="M70 100 Q48 118 46 142" fill="none" stroke="url(#govde)" stroke-width="8" stroke-linecap="round"/>
  <path d="M130 100 Q152 118 154 142" fill="none" stroke="url(#govde)" stroke-width="8" stroke-linecap="round"/>
  <circle cx="46" cy="146" r="6" fill="white" fill-opacity="0.6"/>
  <circle cx="154" cy="146" r="6" fill="white" fill-opacity="0.6"/>
  <path d="M70 102 Q70 94 78 94 L122 94 Q130 94 130 102 L132 144 Q132 152 124 152 L76 152 Q68 152 68 144 Z" fill="url(#govde)" stroke="white" stroke-opacity="0.75" stroke-width="3"/>
  <rect x="88" y="106" width="24" height="18" rx="3" fill="black" fill-opacity="0.45"/>
  <line x1="92" y1="112" x2="108" y2="112" stroke="white" stroke-width="2" stroke-opacity="0.9"/>
  <line x1="92" y1="117" x2="108" y2="117" stroke="white" stroke-width="2" stroke-opacity="0.9"/>
  <rect x="78" y="152" width="17" height="34" rx="6" fill="url(#govde)" stroke="white" stroke-opacity="0.7" stroke-width="3"/>
  <rect x="105" y="152" width="17" height="34" rx="6" fill="url(#govde)" stroke="white" stroke-opacity="0.7" stroke-width="3"/>
  <rect x="76" y="182" width="21" height="12" rx="5" fill="white" fill-opacity="0.55"/>
  <rect x="103" y="182" width="21" height="12" rx="5" fill="white" fill-opacity="0.55"/>
  <circle cx="100" cy="58" r="38" fill="url(#kask)" stroke="white" stroke-opacity="0.9" stroke-width="4"/>
  <path d="M74 62 Q74 40 100 40 Q126 40 126 62 Q126 82 100 82 Q74 82 74 62" fill="black"/>
  <ellipse cx="88" cy="52" rx="14" ry="9" fill="url(#parla)"/>
</svg>`;

interface Cell {
  readonly col: number;
  readonly row: number;
  readonly luma: number;
}

/**
 * Görseli bir kez ızgaraya indirger; kare kare değişen şey bu liste değil,
 * yalnızca noktaların yarıçapı. Boş hücreler burada eleniyor.
 *
 * Parlaklık = örtme × renk: kara vizör (r=0) delik gibi davranıyor,
 * gradyanların tonları olduğu gibi geçiyor.
 */
function sampleCells(image: HTMLImageElement, cols: number, rows: number): Cell[] {
  const grid = document.createElement('canvas');
  grid.width = cols;
  grid.height = rows;
  const ctx = grid.getContext('2d');
  if (!ctx) return [];

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(image, 0, 0, cols, rows);
  const data = ctx.getImageData(0, 0, cols, rows).data;

  const cells: Cell[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const at = (row * cols + col) * 4;
      const luma = (data[at + 3] / 255) * (data[at] / 255);
      if (luma >= LUMA_CUTOFF) cells.push({ col, row, luma });
    }
  }
  return cells;
}

interface AstronotIntroProps {
  /**
   * Uğurlama BAŞLARKEN çağrılır (gidince değil) — perde bu anda kuruluyor ki
   * astronot onun üstünde erisin, solmanın altından uzay sızmasın.
   */
  readonly onLeaving?: () => void;
}

export function AstronotIntro({ onLeaving }: AstronotIntroProps) {
  /*
    Büyütme burada, CSS'te değil: `lang="tr"` altında `text-transform:
    uppercase` küçük i'yi noktalı İ'ye çeviriyor (Chromium'da ölçüldü).
  */
  const t = useDict();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<HTMLCanvasElement | null>(null);
  const figRef = useRef<HTMLCanvasElement | null>(null);
  const hintRef = useRef<HTMLParagraphElement | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  /*
   * Geri çağrı ref'te taşınıyor: ana efekt `gone`a bağlı ve öyle kalmalı —
   * `onLeaving` bağımlılığa girseydi ebeveynin her render'ı dinleyicileri
   * söküp yeniden kurar, solmanın ortasında animasyonu baştan başlatırdı.
   */
  const onLeavingRef = useRef(onLeaving);
  useEffect(() => {
    onLeavingRef.current = onLeaving;
  }, [onLeaving]);

  useEffect(() => {
    if (gone) return;
    const overlay = overlayRef.current;
    const bg = bgRef.current;
    const fig = figRef.current;
    const hint = hintRef.current;
    if (!overlay || !bg || !fig || !hint) return;

    const bgCtx = bg.getContext('2d');
    const figCtx = fig.getContext('2d');
    if (!bgCtx || !figCtx) return;

    const rows = rowsFor(COLS);
    const figW = COLS * CELL_W;
    const figH = rows * CELL_H;

    /*
     * Kapı, düzen kutusuna değil GÖRÜNÜR alana çapalanıyor.
     *
     * Sahibin ekranında astronot ve perde merkezden aynı oranda sağ-alta
     * kaymış göründü; temiz profilde aynı pencere ve piksel oranlarında ise
     * her şey piksel piksel merkezdeydi (1×/1.5×/2× ölçüldü). Yani düzen
     * görünümü (layout viewport) ile pencerede gerçekten görünen alan bazı
     * ortamlarda ayrışıyor — görsel yakınlaştırma (Ctrl+tekerlek, iki parmak)
     * ya da sayfaya dışarıdan basılan `zoom` bunu yapar; bu sitede her şey
     * tekerlek olduğu için Ctrl+tekerlek an meselesi. İki savunma:
     *
     * · `visualViewport`: görünen bölgenin gerçek ölçüsü ve düzen içindeki
     *   ofseti. Tarla, figür ve ipucu ona yerleşiyor — göz nereye bakıyorsa
     *   merkez orası. Normalde pencereyle birebir aynı: sıfır etki.
     * · `zoom` panzehiri: html/body'ye dışarıdan zoom basılmışsa kapının
     *   köküne tersi basılıyor; kapı 1:1'e döner. Normalde çarpan 1.
     */
    const visibleBox = () => {
      const vv = window.visualViewport;
      if (!vv) return { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
      return { x: vv.offsetLeft, y: vv.offsetTop, w: vv.width, h: vv.height };
    };

    const counterZoom = () => {
      const read = (el: Element) =>
        Number.parseFloat(getComputedStyle(el).getPropertyValue('zoom') || '1') || 1;
      const outside = read(document.documentElement) * read(document.body);
      if (outside === 1) overlay.style.removeProperty('zoom');
      else overlay.style.setProperty('zoom', String(1 / outside));
    };

    const placeChrome = () => {
      const box = visibleBox();
      const cssW = Math.min(0.74 * Math.min(box.w, box.h), 560);
      fig.style.left = `${box.x + box.w / 2}px`;
      fig.style.top = `${box.y + box.h / 2}px`;
      fig.style.width = `${cssW}px`;
      hint.style.left = `${box.x + box.w / 2}px`;
      hint.style.top = `${box.y + box.h - 56}px`;
    };

    /*
     * Figür tamponu, tuvalin EKRANDA kapladığı gerçek alana ve tam piksel
     * oranına kuruluyor — "4K/Full HD" isteğinin karşılığı iki düzeltme:
     *
     * · İlk hâl tamponu 616 piksele çizip CSS'e 560'a küçülttürüyordu; o
     *   yeniden örnekleme karakterleri yumuşatıyordu ("çok kalitesiz").
     *   Şimdi çizim doğrudan hedef boyutta: CSS hiçbir şeyi ölçeklemiyor.
     * · Piksel oranı artık kırpılmıyor (eskiden 2'de kesiliyordu) — uzayın
     *   ana tuvaliyle aynı politika (`use-canvas-size.ts`).
     *
     * Mantıksal koordinatlar (figW×figH) değişmiyor; dönüşüm hepsini hedef
     * çözünürlüğe taşıyor, yazı da hedef boyda çiziliyor — keskin.
     */
    const setupFig = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = fig.getBoundingClientRect().width || figW;
      const scale = (cssW / figW) * dpr;
      fig.width = Math.round(figW * scale);
      fig.height = Math.round(figH * scale);
      figCtx.setTransform(scale, 0, 0, scale, 0, 0);
      figCtx.font = `${FONT_SIZE}px ui-monospace, 'Cascadia Mono', Consolas, monospace`;
      figCtx.textBaseline = 'top';
    };

    /*
     * Tarla tuvali pencereyle birlikte YENİDEN kuruluyor. İlk sürüm açılış
     * anındaki boyuta çakılıydı ("kapı saniyelik, kimse boyutlandırmaz"
     * varsayımıyla) — sahip tam da bunu yaptı ve yakaladı: küçük pencerede
     * açıp ekranı büyütünce CSS eski tamponu gerdiriyor, yuvarlak noktalar
     * yumurtaya dönüyordu. Astronotun tuvali etkilenmiyor: oranı sabit,
     * CSS onu tekdüze ölçekliyor.
     *
     * Yeniden kurulum görüntüyü bozmaz: noktanın kimliği hücresinden gelir
     * (`fieldDot(col, row)`), var olan noktalar aynı kalır, büyüyen alana
     * yalnızca yeni hücreler eklenir.
     */
    let bgW = 0;
    let bgH = 0;
    let wrapH = 0;
    let dots: ReturnType<typeof fieldDot>[] = [];

    const setupBg = () => {
      const dpr = window.devicePixelRatio || 1;
      const box = visibleBox();
      bgW = Math.round(box.w);
      bgH = Math.round(box.h);
      bg.style.left = `${box.x}px`;
      bg.style.top = `${box.y}px`;
      bg.style.width = `${bgW}px`;
      bg.style.height = `${bgH}px`;
      bg.width = bgW * dpr;
      bg.height = bgH * dpr;
      // Tampon ataması bağlamı sıfırlar; ölçek her kurulumda baştan.
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Sarma payı: nokta alttan tamamen çıkmadan üstte belirmesin.
      wrapH = bgH + 8;
      dots = [];
      const colCount = Math.ceil(bgW / BG_CELL) + 1;
      const rowCount = Math.ceil(wrapH / BG_CELL) + 1;
      for (let row = 0; row < rowCount; row += 1) {
        for (let col = 0; col < colCount; col += 1) {
          dots.push(fieldDot(col, row));
        }
      }
    };

    const still = prefersReducedMotion();
    let raf = 0;
    let timer = 0;

    const drawBg = (tMs: number) => {
      bgCtx.clearRect(0, 0, bgW, bgH);
      for (const dot of dots) {
        bgCtx.fillStyle = `rgba(255, 255, 255, ${fieldAlpha(dot, still ? 0 : tMs)})`;
        bgCtx.beginPath();
        bgCtx.arc(
          fieldX(dot, still ? 0 : tMs),
          fieldY(dot, still ? 0 : tMs, wrapH) - 4,
          dot.radius,
          0,
          Math.PI * 2,
        );
        bgCtx.fill();
      }
    };

    let cells: Cell[] = [];

    const drawFig = (tMs: number) => {
      figCtx.clearRect(0, 0, figW, figH);
      const bob = still ? 0 : bobOffset(tMs);
      for (const cell of cells) {
        const ch = charAt(cell.luma, cell.col, cell.row, still ? 0 : tMs);
        if (!ch) continue;
        figCtx.fillStyle = `rgba(255, 255, 255, ${alphaAt(cell.luma)})`;
        figCtx.fillText(ch, cell.col * CELL_W, cell.row * CELL_H + bob);
      }
    };

    const setupAll = () => {
      counterZoom();
      placeChrome(); // figürün CSS boyu burada belirleniyor — setupFig ondan okuyor
      setupBg();
      setupFig();
    };

    setupAll();
    const onResize = () => {
      setupAll();
      // Döngü yoksa (hareket azaltılmış) yeni boyuta bir durağan kare basılmalı;
      // döngü varken bir sonraki kare zaten yeni tamponlara çizer.
      if (still) {
        drawBg(0);
        drawFig(0);
      }
    };
    window.addEventListener('resize', onResize);
    // Görsel yakınlaştırma/pan pencere olayı DEĞİL — kendi kanalından dinlenir.
    window.visualViewport?.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('scroll', onResize);

    const image = new Image();
    image.onload = () => {
      cells = sampleCells(image, COLS, rows);

      if (still) {
        // Hareket istemeyene tek durağan kare; kapı duvara dönüşmesin diye
        // kendiliğinden çekiliyor — perde de aynı tercihte kısa oynuyor.
        drawBg(0);
        drawFig(0);
        timer = window.setTimeout(() => setLeaving(true), 1600);
        return;
      }

      const loop = (tMs: number) => {
        drawBg(tMs);
        drawFig(tMs);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };
    image.src = `data:image/svg+xml,${encodeURIComponent(ASTRONOT_SVG)}`;

    // Katman tıklanamaz olduğu için olaylar window'dan dinleniyor; hepsi
    // tuvale de uğruyor, yani uğurlama yaklaşmayı geciktirmiyor. `onLeaving`
    // burada ateşleniyor: perde, astronot daha solarken alta kurulsun.
    const leave = () => {
      setLeaving(true);
      onLeavingRef.current?.();
    };
    window.addEventListener('wheel', leave, { once: true, passive: true });
    window.addEventListener('scroll', leave, { once: true, passive: true });
    window.addEventListener('pointerdown', leave, { once: true });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
      window.removeEventListener('wheel', leave);
      window.removeEventListener('scroll', leave);
      window.removeEventListener('pointerdown', leave);
    };
  }, [gone]);

  if (gone) return null;

  return (
    <div
      ref={overlayRef}
      aria-hidden
      onTransitionEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        setGone(true);
      }}
      /*
       * z-70, perdenin 60'ının ÜSTÜ: astronot perdenin üzerinde eriyor,
       * solmanın altından uzay değil çoktan oynayan perde çıkıyor.
       *
       * İçeride flex/vmin YOK: her parçanın yeri `placeChrome`/`setupBg`
       * tarafından görünür alana göre kuruluyor (yukarıdaki çapa notu).
       */
      className="pointer-events-none fixed inset-0 z-70 bg-black transition-opacity duration-700 ease-out"
      style={{ opacity: leaving ? 0 : 1 }}
    >
      <canvas ref={bgRef} className="absolute" />
      <canvas ref={figRef} className="absolute -translate-x-1/2 -translate-y-1/2" />
      {/*
        Perdedeki ipucuyla aynı söz ve aynı ton. "Başka bir şey olmasın"ın
        istisnası — işaretsiz bir tam ekran, kapı değil duvar olurdu.

        Büyütme CSS'te değil JS'te ve bu ölçülmüş bir karar: `lang="tr"`
        altında CSS `text-transform: uppercase` küçük i'yi noktalı İ'ye
        çeviriyor (Chromium'da ölçüldü, 2026-08-10). `toUpperCase()` dilden
        bağımsız. Aynı karar parfüm künyesinde de yazılı; sitede CSS
        `uppercase` artık hiç kullanılmıyor ve bunu bir sınama denetliyor.
      */}
      <p
        ref={hintRef}
        className="absolute -translate-x-1/2 text-[0.6875rem] tracking-[0.3em] whitespace-nowrap text-white/20 [text-indent:0.3em]"
      >
        {/*
          Cihaza göre iki kelime, seçimi CSS yapıyor.

          ⚠️ JavaScript'le seçilseydi sunucu hangisini çizeceğini bilemezdi:
          `pointer: coarse` ancak tarayıcıda belli oluyor. Bir varsayılan
          çizip etkide düzeltmek, telefonda ilk kare "SCROLL" yazıp sonra
          "SWIPE"a atlaması demekti — ipucu ekranda tek satır, o sıçrama
          görülürdü. İki dizeyi de basıp birini gizlemek hem sıçramasız hem
          hidrasyon uyuşmazlığı üretmiyor.
        */}
        <span className="pointer-coarse:hidden">{t.intro.hint.toUpperCase()}</span>
        <span className="hidden pointer-coarse:inline">
          {t.intro.hintTouch.toUpperCase()}
        </span>
      </p>
    </div>
  );
}
