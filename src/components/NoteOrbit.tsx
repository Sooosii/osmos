'use client';

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/motion';
import {
  CENTER_X,
  CENTER_Y,
  HORIZON_RADII,
  LABEL_FADE_MIN,
  LABEL_RISE,
  NOTE_RADIUS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  horizonRing,
  noteSeats,
  projectSeat,
} from '@/lib/note-orbit';
import type { NoteMark } from '@/lib/note-marks';

/**
 * Nota takımyıldızı — merkezde nota, çevresinde onu içeren parfümler.
 *
 * Geometrinin tamamı `lib/note-orbit.ts`te ve neden öyle olduğu orada yazılı.
 * Bu bileşen **veriyi kendisi hesaplamıyor**: ağırlık, derinlik ve renk sunucuda
 * çıkarılıp düz veri olarak geliyor (`note-marks.ts`) — `space-marks.ts:11-13`in
 * kuralı.
 *
 * ## Neden canvas, neden tram
 *
 * Komşu takımyıldızı (`NeighborOrbit`) SVG ve pürüzsüz. Bu ikisi aynı kamerayı
 * paylaşıyor ve aynı sayfada olmasalar da aynı sitede yaşıyorlar; **ayrışmaları
 * gerekiyordu.** Ayrım dokudan geliyor: burada her şey bir nokta ızgarasına
 * oturuyor ve yoğunluk **Bayer 4×4** eşiğiyle noktalara çevriliyor.
 *
 * Eşik sıralı, rastgele değil. Rastgele olsaydı desen her karede yeniden
 * dağılır, dönerken titrerdi — istenen şey duran bir tram, kaynayan bir gürültü
 * değil.
 *
 * SVG ile yapılamazdı: 26 parfümlük bir notada tram, kare başına binlerce
 * `<rect>` demek. Canvas'ta aynı iş tek geçişte bitiyor.
 *
 * ## Kare başına setState yok
 *
 * `EvolutionChart.tsx:26`'nın ölçerek koyduğu kural. React tuvali bir kez kuruyor,
 * döngü doğrudan bağlama yazıyor.
 */

/**
 * Bir turun süresi.
 *
 * Komşu takımyıldızının 30 saniyesinden hızlı ve sebebi nokta sayısı: orada üç
 * komşu var, burada 26'ya kadar çıkıyor. Aynı hızda dönerken bir parfümün öne
 * gelme sırası dakikada bir kereye düşüyordu — sahip ekranda gördü: "arkaya
 * gittikten sonra gelene kadar çok vakit geçiyor."
 *
 * Daha da hızlandırmak denenmedi ve denenmemeli: tram noktaları hızlı dönerken
 * kayan bir desene dönüşüyor, dokunun bütün mesele ettiği durgunluk kaybolur.
 */
const ROTATION_MS = 18_000;

/**
 * Tram ızgarasının adımı ve nokta boyu — **ekran pikselinde**, iç koordinatta değil.
 *
 * Doku tuval ne kadar büyürse büyüsün aynı sıklıkta kalıyor. İlk sürüm bunu iç
 * koordinatta tutuyordu ve tuval gerildikçe ızgara da gerilip dokuyu dağıtıyordu.
 */
const CELL = 3;
const DOT = 1.5;

/**
 * Bayer 4×4 sıralı dither eşiği.
 *
 * Değerler 0–15; `(value + 0.5) / 16` ile 0–1 aralığına açılıyor. Matrisin işi
 * yoğunluğu konuma göre farklı eşiklerle kesmek — böylece %40 yoğunluk, her
 * hücrede %40 ihtimalle değil, ızgaranın belirli hücrelerinde kesin olarak nokta
 * bırakıyor.
 */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

function bayer(gx: number, gy: number): number {
  return (BAYER[((gy % 4) + 4) % 4][((gx % 4) + 4) % 4] + 0.5) / 16;
}

interface NoteOrbitProps {
  readonly carriers: readonly NoteMark[];
  /** Merkezdeki notanın rengi ve adı. */
  readonly noteName: string;
  readonly noteColor: string;
}

export function NoteOrbit({ carriers, noteName, noteColor }: NoteOrbitProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const seats = noteSeats(carriers);
    const byId = new Map(carriers.map((carrier) => [carrier.id, carrier]));
    const rings = HORIZON_RADII.map((radius) => horizonRing(radius));
    const still = prefersReducedMotion();

    /*
     * Tram ızgarası EKRAN pikselinde sabit, geometri ölçekli.
     *
     * İlk sürüm tersini yapıyordu: her şey 560 birimlik iç koordinatta
     * çizilip tuval `width:100%` ile ~1000 px'e geriliyordu. Izgara da onunla
     * gerilince noktalar arası boşluk iki katına çıkıyor, doku bir tram olmaktan
     * çıkıp serpiştirilmiş benek hâline geliyordu — tarayıcıda görüldü, sahip
     * "hiçbir şey anlaşılmıyor" dedi ve haklıydı.
     *
     * Artık `k` ile geometri ekran pikseline çevriliyor, `CELL` ise ekranda ne
     * ise o kalıyor. Tuval ne kadar büyürse büyüsün doku aynı sıklıkta.
     */
    let raf = 0;
    let width = 0;

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(rect.width, 1);
      const height = (width / VIEW_WIDTH) * VIEW_HEIGHT;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /** Yoğunluğu ızgaraya oturtulmuş noktalarla boyar. Koordinatlar ekran pikseli. */
    const ditherDisc = (cx: number, cy: number, radius: number, color: string, gain: number) => {
      if (radius <= 0) return;
      const gx0 = Math.floor((cx - radius) / CELL);
      const gx1 = Math.ceil((cx + radius) / CELL);
      const gy0 = Math.floor((cy - radius) / CELL);
      const gy1 = Math.ceil((cy + radius) / CELL);

      ctx.fillStyle = color;
      for (let gy = gy0; gy <= gy1; gy += 1) {
        for (let gx = gx0; gx <= gx1; gx += 1) {
          const px = gx * CELL;
          const py = gy * CELL;
          const distance = Math.hypot(px - cx, py - cy);
          if (distance > radius) continue;
          if ((1 - distance / radius) * gain > bayer(gx, gy)) ctx.fillRect(px, py, DOT, DOT);
        }
      }
    };

    const draw = (time: number) => {
      const k = width / VIEW_WIDTH;
      const phase = still ? 0.9 : (time / ROTATION_MS) * Math.PI * 2;
      ctx.clearRect(0, 0, width, (width / VIEW_WIDTH) * VIEW_HEIGHT);

      // Ufuk halkaları — yörünge düzlemini belli eder, onlar da noktalı.
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      for (const ring of rings) {
        for (const point of ring) {
          ctx.fillRect(
            Math.round((point.x * k) / CELL) * CELL,
            Math.round((point.y * k) / CELL) * CELL,
            DOT,
            DOT,
          );
        }
      }

      /*
       * Arkadan öne çiziliyor: öndeki parfüm merkezdeki notanın önünden geçmeli.
       * Bu örtme, dönüşün gerçekten derinlik taşıdığını anlatan en güçlü işaret.
       */
      const nodes = seats.map((seat) => ({ seat, node: projectSeat(seat, phase) }));
      const behind = nodes.filter((entry) => entry.node.z > 0);
      const front = nodes.filter((entry) => entry.node.z <= 0);
      behind.sort((a, b) => b.node.z - a.node.z);
      front.sort((a, b) => b.node.z - a.node.z);

      const discRadius = (entry: (typeof nodes)[number]) => {
        const carrier = byId.get(entry.seat.id);
        /*
         * Boy ağırlığı İKİNCİ kez anlatıyor ve bu bilerek: yarıçap zaten ağırlıktan
         * geliyor, ama dönen bir sahnede "hangisi merkeze yakın" tek başına zor
         * okunuyor. Baskın nota daha büyük bir disk olunca hiyerarşi ada bakmadan
         * görülüyor.
         */
        return (7 + (carrier?.weight ?? 0) * 9) * entry.node.scale * k;
      };

      const paintDisc = (entry: (typeof nodes)[number]) => {
        const carrier = byId.get(entry.seat.id);
        if (!carrier) return;

        ditherDisc(
          entry.node.x * k,
          entry.node.y * k,
          discRadius(entry),
          withAlpha(carrier.color, 0.34 + entry.node.fade * 0.56),
          0.55 + entry.node.fade * 0.45,
        );
      };

      behind.forEach(paintDisc);
      ditherDisc(
        CENTER_X * k,
        CENTER_Y * k,
        NOTE_RADIUS * k,
        withAlpha(noteColor, 0.95),
        1.05,
      );
      front.forEach(paintDisc);

      /*
       * Adlar AYRI bir geçişte ve çakışma denetimiyle yazılıyor.
       *
       * Sıralama derinlik değil **öne çıkma** sırası: en öndeki adını ilk yazıyor,
       * arkadakiler ancak yer kalırsa. Bir ad daha önce yazılmış birinin kutusuna
       * değiyorsa atlanıyor — böylece hiçbir yazı üst üste binmiyor.
       *
       * Bu, iki başarısız denemenin ardından geldi. Önce eşiği geçen herkes
       * yazıyordu ve sandal gibi 26 parfümlü bir notada on bir ad iç içe geçiyordu.
       * Sonra yalnızca en öndeki konuşturuldu; yığılma bitti ama sahip haklı olarak
       * "diğerinin gelmesini beklemeye gerek yok, hepsi görünsün" dedi. Çakışma
       * denetimi ikisini birden veriyor: yer varsa herkes konuşuyor, yer yoksa
       * öndeki kazanıyor ve dönüş sırayı zaten devrediyor.
       *
       * Ayrı geçiş şart: diskler derinlik sırasına göre çiziliyor ve bir adın
       * arkadaki bir diskin altında kalması gerekmiyor — yazı her zaman en üstte.
       */
      const fontSize = Math.max(10, Math.round(11 * k));
      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = 'center';

      /*
       * Merkezdeki nota diski baştan rezerve: adların üstüne yazılmaması gereken
       * tek şey o. Diğer disklerin üstüne düşmesi sorun değil — arkadakiler zaten
       * sönük ve yazı her zaman en üstte — ama merkez sahnenin öznesi.
       */
      const placed: { x0: number; y0: number; x1: number; y1: number }[] = [
        {
          x0: CENTER_X * k - NOTE_RADIUS * k,
          y0: CENTER_Y * k - NOTE_RADIUS * k,
          x1: CENTER_X * k + NOTE_RADIUS * k,
          y1: CENTER_Y * k + NOTE_RADIUS * k,
        },
      ];
      const spoken = [...nodes].sort((a, b) => b.node.fade - a.node.fade);

      for (const entry of spoken) {
        const carrier = byId.get(entry.seat.id);
        if (!carrier || entry.node.fade < LABEL_FADE_MIN) continue;

        const cx = entry.node.x * k;
        const cy = entry.node.y * k - discRadius(entry) - LABEL_RISE * k;
        const half = ctx.measureText(carrier.name).width / 2;

        // Kutulara nefes payı: harfler değmese de iki ad bitişikken tek kelime
        // gibi okunuyor.
        const box = {
          x0: cx - half - 5,
          y0: cy - fontSize,
          x1: cx + half + 5,
          y1: cy + fontSize * 0.35,
        };

        const collides = placed.some(
          (other) => box.x0 < other.x1 && box.x1 > other.x0 && box.y0 < other.y1 && box.y1 > other.y0,
        );
        if (collides) continue;

        placed.push(box);

        // Arkadaki ad sönük ama okunur; ön-arka ayrımı yazıda da sürüyor.
        const strength = (entry.node.fade - LABEL_FADE_MIN) / (1 - LABEL_FADE_MIN);
        ctx.fillStyle = `rgba(255,255,255,${(0.34 + strength * 0.56).toFixed(3)})`;
        ctx.fillText(carrier.name, cx, cy);
      }

      raf = requestAnimationFrame(draw);
    };

    setup();
    raf = requestAnimationFrame(draw);

    const observer = new ResizeObserver(setup);
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [carriers, noteColor]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={
        carriers.length === 0
          ? `${noteName} henüz hiçbir parfümde geçmiyor.`
          : `${noteName} notasını içeren ${carriers.length} parfüm, üç boyutlu bir yörüngede dönüyor: ${carriers
              .map((carrier) => carrier.name)
              .join(', ')}.`
      }
      className="block w-full"
      style={{ aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}` }}
    />
  );
}

/** `#rrggbb` rengi verilen saydamlıkla `rgba()`ya çevirir. */
function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}
