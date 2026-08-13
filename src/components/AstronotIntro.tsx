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
import {
  type Drop,
  HANDOFF_MS,
  coverAt,
  dropAlpha,
  emitPuff,
  hissTotal,
  mistBudget,
  mistScale,
  sprayAngle,
  nozzleCell,
  stepMist,
} from '@/lib/atomizer-mist';
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
 * Atomizör — tram için tonlandırılmış figür.
 *
 * Sahibin getirdiği referans: siyah zemin üzerinde eski bir parfüm şişesi,
 * puarı sıkılmış, ağzından ince bir sis çıkıyor. Astronot buraya kadar
 * kapının bekçisiydi; artık kapıda sitenin kendi nesnesi duruyor.
 *
 * ⚠️ **Örnekleyicinin dayattığı yazım kuralları** (`sampleCells`, 88×51
 * ızgara, hücre 2.27 × 3.92 SVG birimi):
 *
 *   · Dolgular **beyaz + opaklık**, renk değil — parlaklık `alfa × kırmızı`
 *     okunuyor, renkli bir dolgu bütün tonunu kaybederdi.
 *   · `fill="black"` DELIK açıyor (astronotun vizör hilesi). Şişenin içindeki
 *     sıvı bununla oyuluyor: camın "dolu" görünmesi o boşluktan geliyor.
 *   · Ton aralığı 0.15–0.95; üstü `boostLuma`nın tavanına yapışıp düzleşiyor.
 *   · Yatay öge ≥5 birim, **dikey öge ≥8 birim.** Bağlayıcı olan ikincisi:
 *     boru, kordon ve bilezikler yatay ögeler ve örneklenen şey YÜKSEKLIKLERI.
 *     Bu yüzden hepsinin `stroke-width`i 9'dan küçük değil.
 *   · `filter`/`mask` yok — veri URI'siyle yüklenen bir görselde tutarsız
 *     çalışıyorlar ve 88 sütuna inen bir ızgarada zaten hiçbir şey kazandırmazlardı.
 *   · **Yatay çizgiye gradyan verilmiyor.** Ölçüldü: boru (`M114 68 H166`) düz
 *     bir yatay yol, yani sınırlayıcı kutusunun yüksekliği SIFIR; varsayılan
 *     `objectBoundingBox` gradyanı orada çöküyor ve çizgi hiç çizilmiyordu.
 *     Ekranda uç havada duruyor, şişeyle arasında boşluk kalıyordu.
 *
 * ⚠️ **Ağız, üst yarının en sağındaki şey olmak zorunda.** Sisin çıktığı nokta
 * elle yazılmıyor, ızgaradan türetiliyor (`nozzleCell`); tek şart bu. Uç üçgeni
 * `x > 170`de ve `y ≈ 70`te duruyor, yani başka hiçbir parça oraya girmemeli.
 */
const ATOMIZER_SVG = `<svg width="600" height="600" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="white" stop-opacity="0.30"/>
      <stop offset="0.32" stop-color="white" stop-opacity="0.68"/>
      <stop offset="0.7" stop-color="white" stop-opacity="0.34"/>
      <stop offset="1" stop-color="white" stop-opacity="0.22"/>
    </linearGradient>
    <radialGradient id="puar" cx="0.34" cy="0.3" r="0.82">
      <stop offset="0" stop-color="white" stop-opacity="0.72"/>
      <stop offset="1" stop-color="white" stop-opacity="0.26"/>
    </radialGradient>
    <radialGradient id="parla" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="white" stop-opacity="0.9"/>
      <stop offset="1" stop-color="white" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <g transform="translate(0,-11)">
  <path d="M84 74 C62 82 38 98 29 116" fill="none" stroke="white" stroke-opacity="0.42" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="28" cy="139" rx="21" ry="20" fill="url(#puar)" stroke="white" stroke-opacity="0.62" stroke-width="2.5"/>
  <path d="M20 157 L18 173" stroke="white" stroke-opacity="0.4" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M28 160 L28 177" stroke="white" stroke-opacity="0.4" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M36 157 L38 173" stroke="white" stroke-opacity="0.4" stroke-width="4.5" stroke-linecap="round"/>

  <path d="M88 96 C70 104 62 126 64 148 C66 172 82 187 105 187 C128 187 144 172 146 148 C148 126 140 104 122 96 Z" fill="url(#cam)" stroke="white" stroke-opacity="0.72" stroke-width="2.5"/>
  <path d="M67 140 C69 168 84 181 105 181 C126 181 141 168 143 140 Z" fill="black"/>
  <path d="M84 102 C77 120 75 132 76 142" fill="none" stroke="white" stroke-opacity="0.26" stroke-width="3"/>
  <path d="M105 99 C103 118 103 128 104 140" fill="none" stroke="white" stroke-opacity="0.2" stroke-width="3"/>
  <path d="M126 102 C133 120 135 132 134 142" fill="none" stroke="white" stroke-opacity="0.2" stroke-width="3"/>
  <ellipse cx="82" cy="120" rx="8" ry="18" fill="url(#parla)"/>

  <rect x="93" y="76" width="24" height="22" fill="white" fill-opacity="0.38"/>
  <rect x="86" y="63" width="38" height="14" rx="2" fill="white" fill-opacity="0.72"/>
  <path d="M118 58 H176" stroke="white" stroke-opacity="0.5" stroke-width="9" stroke-linecap="round"/>
  <path d="M170 50 L192 58 L170 66 Z" fill="white" fill-opacity="0.95"/>
  </g>
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
  const mistRef = useRef<HTMLCanvasElement | null>(null);
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
    const mist = mistRef.current;
    if (!overlay || !bg || !fig || !hint || !mist) return;

    const bgCtx = bg.getContext('2d');
    const figCtx = fig.getContext('2d');
    const mistCtx = mist.getContext('2d');
    if (!bgCtx || !figCtx || !mistCtx) return;

    /* Sisin durumu; hiçbiri React'e girmiyor, hepsi bu efektin ömrü kadar. */
    const drops: Drop[] = [];
    let sprayStart: number | null = null;
    let handedOff = false;
    let emitted = 0;
    let nozzle: { readonly col: number; readonly row: number } | null = null;
    let budget = 0;

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
      /*
        ⚠️ 0.74/560'tan büyütüldü. Izgara 88'den 120 sütuna çıkınca hücre
        küçüldü; figür aynı boyda kalsaydı harfler iğneleşir, "yapay" şikâyeti
        çözülecek yerde derinleşirdi.
      */
      const cssW = Math.min(0.82 * Math.min(box.w, box.h), 640);

      /*
        ⚠️ Figür ortada DEĞİL, %45'te duruyor. Ağız figürün sağ ucunda ve
        püskürtme sağa gidiyor; tam ortada dururken sisin yayılacak yeri
        kalmıyordu — dar ekranda zerrelerin yarısı ölçüldüğü gibi görünmeden
        ekranı terk ediyordu. Sahibin getirdiği referans fotoğrafın kadrajı da
        böyle: nesne solda, püskürtme sağdaki boşluğa.
      */
      fig.style.left = `${box.x + box.w * 0.45}px`;
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

    /*
      Sis tuvali arka planla aynı ölçüde ve aynı yere çapalı: zerreler ekranın
      her yerine gidebiliyor, figürün 616×612'lik kutusuna sığmıyorlar.
    */
    const setupMist = () => {
      const dpr = window.devicePixelRatio || 1;
      const box = visibleBox();
      mist.style.left = `${box.x}px`;
      mist.style.top = `${box.y}px`;
      mist.style.width = `${Math.round(box.w)}px`;
      mist.style.height = `${Math.round(box.h)}px`;
      mist.width = Math.round(box.w * dpr);
      mist.height = Math.round(box.h * dpr);
      mistCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      budget = mistBudget(box.w, box.h, !window.matchMedia('(pointer: fine)').matches);
      mistUnit = mistScale(box.w, box.h);
    };

    /**
     * Tek bir zerre lekesi, kurulumda bir kez üretiliyor.
     *
     * ⚠️ Zerre başına `createRadialGradient` kurmak kareyi öldürüyor: 640
     * degrade, saniyede altmış kez. `CursorGlitter` aynı sebeple `lighter`
     * kullanıyor ama orada zerre 420 ve leke yok. Burada tek bir sprite
     * üretilip `drawImage` ile ölçekleniyor.
     */
    const sprite = document.createElement('canvas');
    sprite.width = 64;
    sprite.height = 64;
    const spriteCtx = sprite.getContext('2d');
    if (spriteCtx) {
      const gradient = spriteCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      // Sıcak beyaz. Renk YOK: bu sitede renk aile demek (`glitter.ts`).
      gradient.addColorStop(0, 'rgba(232, 224, 208, 1)');
      gradient.addColorStop(1, 'rgba(232, 224, 208, 0)');
      spriteCtx.fillStyle = gradient;
      spriteCtx.fillRect(0, 0, 64, 64);
    }

    /**
     * Sisin ölçeği — figürün ızgarasından DEĞİL ekrandan geliyor.
     *
     * ⚠️ Burada `figScale()` kullanılıyordu ve ızgara 88'den 120 sütuna çıkınca
     * bölen 616'dan 840'a büyüyüp ölçeği sessizce %27 küçülttü. Sahip telefonda
     * sisi hiç göremedi. Gerekçe `mistScale`de.
     */
    let mistUnit = 1;

    /**
     * Ağzın o karedeki ekran koordinatı.
     *
     * Figür nefes alıyor (`bobOffset`), yani ağız da oynuyor: sis sabit bir
     * noktadan çıksaydı püskürtme şişeden kopuk görünürdü.
     */
    const nozzlePoint = (tMs: number) => {
      /*
        ⚠️ Konum figürün GERÇEK kutusundan okunuyor, yerleşim hesabı burada
        tekrarlanmıyor. Bir kez tekrarlandı ve hemen ısırdı: `placeChrome`
        figürü ortadan %45'e kaydırınca burası hâlâ ortayı varsayıyordu ve sis
        ağzın 60 px sağından çıkıyordu — tarayıcıda çekilip görüldü. Tek kaynak
        `getBoundingClientRect`, iki hesap bir daha ayrılamaz.
      */
      const rect = fig.getBoundingClientRect();
      const box = visibleBox();
      const scale = (rect.width || figW) / figW;
      const fx = ((nozzle?.col ?? COLS - 1) + 0.5) * CELL_W;
      const fy = ((nozzle?.row ?? 0) + 0.5) * CELL_H + (still ? 0 : bobOffset(tMs));
      return {
        x: rect.left - box.x + fx * scale,
        y: rect.top - box.y + fy * scale,
      };
    };

    const drawMist = () => {
      mistCtx.clearRect(0, 0, mist.width, mist.height);
      // Toplamalı harmanlama: üst üste binen zerreler yoğunlaşıyor, kesişmiyor.
      mistCtx.globalCompositeOperation = 'lighter';

      for (const drop of drops) {
        /*
          ⚠️ Zerre başına opaklık ölçülerek kondu ve zerreler küçülünce
          YÜKSELDI. Şişmiş lekeler döneminde bir nokta ~10 zerreyle örtülüyordu
          ve 0.2 bile çekirdeği beyaza doyuruyordu; parçacık boyunda üst üste
          binme 1'in altına indi, yani her zerre kendi başına görünmek zorunda.
          0.11'de tutam neredeyse görünmezdi (tarayıcıda çekilip bakıldı).
        */
        mistCtx.globalAlpha = dropAlpha(drop) * 0.5;
        mistCtx.drawImage(
          sprite,
          drop.x - drop.radius,
          drop.y - drop.radius,
          drop.radius * 2,
          drop.radius * 2,
        );
      }

      mistCtx.globalAlpha = 1;
      mistCtx.globalCompositeOperation = 'source-over';
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
      setupMist();
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
        /*
          Hareket istemeyene tek durağan kare; kapı duvara dönüşmesin diye
          kendiliğinden çekiliyor — perde de aynı tercihte kısa oynuyor.
          Sis yok: 640 zerrelik bir bulut, o tercihin tam olarak istemediği şey.

          ⚠️ Burada `setLeaving` DOĞRUDAN çağrılıyordu ve sessiz bir kusurdu:
          `onLeaving` hiç ateşlenmiyor, dolayısıyla `acilisiIsaretle`
          çalışmıyordu. Hareket azaltılmış bir cihazda kapı **her dönüşte**
          yeniden açılıyordu. `handOff` ikisini birden yapıyor.
        */
        drawBg(0);
        drawFig(0);
        timer = window.setTimeout(handOff, 1600);
        return;
      }

      nozzle = nozzleCell(cells, COLS, rows);

      let last = performance.now();
      const loop = (tMs: number) => {
        const dtMs = Math.min(tMs - last, 50);
        last = tMs;

        drawBg(tMs);

        if (sprayStart === null) {
          drawFig(tMs);
        } else {
          const elapsed = performance.now() - sprayStart;

          // Figür kendi sisinin içinde eriyor — ayrı bir solma yok.
          figCtx.globalAlpha = 1 - coverAt(elapsed);
          drawFig(tMs);
          figCtx.globalAlpha = 1;

          /*
            "Şu ana kadar kaç zerre çıkmış olmalıydı?" — anlık hız değil birikim.
            Kaç kare geçtiğinin önemi yok; tek bir kare bile tıslamanın tamamını
            doğurabiliyor. Gerekçe `hissTotal`da: kare hızı düşük olduğunda
            220 ms'lik pencere iki karenin arasına düşüyordu ve kapı sissiz
            açılıyordu (tarayıcıda ölçüldü).
          */
          const born = Math.floor(hissTotal(elapsed, budget) - emitted);
          if (born > 0) {
            emitted += born;
            const origin = nozzlePoint(tMs);
            emitPuff(drops, {
              origin,
              count: born,
              scale: mistUnit,
              angle: sprayAngle(origin.x, visibleBox().w),
            });
          }

          stepMist(drops, dtMs);
          drawMist();

          if (elapsed >= HANDOFF_MS) handOff();
        }

        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };
    image.src = `data:image/svg+xml,${encodeURIComponent(ATOMIZER_SVG)}`;

    /*
      Katman tıklanamaz olduğu için olaylar window'dan dinleniyor; hepsi tuvale
      de uğruyor, yani uğurlama yaklaşmayı geciktirmiyor.

      Uğurlama artık iki parçalı: hareket **tıslamayı** başlatıyor, perde
      `HANDOFF_MS` sonra devralıyor. `onLeaving` o anda ateşleniyor, yani perde
      hâlâ opak — üstelik eskisinden daha opak, çünkü ekranı sis kaplamış
      oluyor. `Acilis.tsx`in beklediği sözleşme (perde, katman solmaya
      başlamadan ÖNCE altta kurulu olsun) daha da sağlam duruyor.

      ⚠️ `{ once: true }` yalnızca ATEŞLENEN dinleyiciyi söküyor. Tekerlekten
      sonra gelen bir tuş `leave`i ikinci kez çağırıyor; eskiden zararsızdı
      (iki kez `setLeaving`), sisle birlikte püskürtmeyi baştan başlatırdı.
      Kilit bu yüzden.
    */
    const handOff = () => {
      if (handedOff) return;
      handedOff = true;
      setLeaving(true);
      onLeavingRef.current?.();
    };

    const leave = () => {
      if (sprayStart !== null) return;
      sprayStart = performance.now();

      // Kareler hiç başlamadıysa (SVG yüklenmedi ya da hareket azaltılmış)
      // çizecek sis de yok: uğurlama doğrudan.
      if (still || nozzle === null) handOff();
    };
    window.addEventListener('wheel', leave, { once: true, passive: true });
    window.addEventListener('scroll', leave, { once: true, passive: true });
    window.addEventListener('pointerdown', leave, { once: true });

    /*
     * ⚠️ **Kapının klavye anahtarı — ölçülmüş bir hatadan doğdu (2026-08-12).**
     *
     * Uğurlama yalnızca tekerlek, kaydırma ve işaretçiye bağlıydı. Faresiz
     * gezen biri için üçü de yok: uzay `fixed inset-0 overflow-hidden`, yani
     * Tab ile odak gezdirmek sayfayı kaydırmıyor da. Tarayıcıda denendi —
     * Tab, sonra Enter: odak alttaki listeye geçiyor (içerik erişilebilir,
     * katman `pointer-events-none`) ama perde **tam opaklıkta duruyordu**.
     * Yani gören ama fare kullanmayan biri astronotun arkasında kalıyordu.
     *
     * Herhangi bir tuş yetiyor; diğer üçü gibi ayrım yapmıyor. Değiştirici
     * tuşlar da uğurluyor — "buradayım" demenin her hâli kapıyı açmalı.
     */
    window.addEventListener('keydown', leave, { once: true });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
      window.removeEventListener('wheel', leave);
      window.removeEventListener('scroll', leave);
      window.removeEventListener('pointerdown', leave);
      window.removeEventListener('keydown', leave);
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
      {/*
        İki tuval de saf süs: biri dokulu zemin, biri astronot. Adsız bir
        tuval ekran okuyucuda anlamsız bir gürültü — `aria-hidden` ile hiç
        duyurulmuyorlar. Aynı politika uzayın tuvalinde de var
        (`ScentSpaceCanvas`), oradaki gerçek yol `SpaceKeyboardList`.
      */}
      <canvas ref={bgRef} aria-hidden="true" className="absolute" />

      <canvas
        ref={figRef}
        aria-hidden="true"
        className="absolute -translate-x-1/2 -translate-y-1/2"
      />
      {/*
        Perdedeki ipucuyla aynı söz ve aynı ton. "Başka bir şey olmasın"ın
        istisnası — işaretsiz bir tam ekran, kapı değil duvar olurdu.

        Büyütme CSS'te değil JS'te ve bu ölçülmüş bir karar: `lang="tr"`
        altında CSS `text-transform: uppercase` küçük i'yi noktalı İ'ye
        çeviriyor (Chromium'da ölçüldü, 2026-08-10). `toUpperCase()` dilden
        bağımsız. Aynı karar parfüm künyesinde de yazılı; sitede CSS
        `uppercase` artık hiç kullanılmıyor ve bunu bir sınama denetliyor.
      */}
      {/*
        Sis tuvali figürün ÜSTÜNDE: püskürtme atomizörün önünden geçiyor.

        ⚠️ Kendi kapanan yazılmak zorunda. Erişilebilirlik sınaması tuval
        etiketlerini kendi kapanan biçimiyle arıyor; açık-kapalı yazılsaydı
        eşleşme ilgisiz işaretlemeye kadar sürüklenir ve sınama anlaşılmaz bir
        yerde kırılırdı. (Bu yorumda etiketin kendisi örnek olarak bile
        yazılamıyor — sınama onu da gerçek sanıyor, ölçüldü.)
      */}
      <canvas ref={mistRef} aria-hidden="true" className="absolute" />

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
