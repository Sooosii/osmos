/**
 * Komşu çemberinin geometrisi.
 *
 * `space-approach.ts` ve `evolution-loop.ts` ile aynı sözleşme: React, DOM, SVG
 * bilmiyor ve hiçbir şey import etmiyor — tek başına okunup sınanabiliyor. Depoda
 * `vitest.config.*` olmadığı için `@/` takma adı sınamalarda çözülmüyor; bu şart
 * kolaylık değil zorunluluk.
 *
 * ## Konumlar neden uzaydaki gerçek yerleri DEĞİL
 *
 * Önce öyleydi. Parça `projectToSpace` çıktısından kırpılıyordu ve sahip bunu
 * bilerek seçmişti ("B"): konumlar hakiki, komşu tanımı benzerlik. Ölçüm ikisinin
 * ayrıştığını göstermişti — 44 parfümde ortalama örtüşme 3.16/5.
 *
 * Ekranda görülünce karar değişti. Gerçek konumlarla parça okunmuyordu: merkez
 * kenara kaçıyor, noktalar yapısız bir bulut oluyor, "en benzeyen" çoğu zaman en
 * yakın olmuyordu. Sahibin istediği cümle net: **en benzeyen en yakında dursun ve
 * komşular dört bir yana dağılsın, sıra hâlinde değil.** O cümlenin her sayfada
 * tutmasının tek yolu konumları benzerlikten üretmek.
 *
 * Bedeli açık ve kabul edildi: bu çember `/uzay`daki dizilişi göstermiyor. Parça
 * "haritada nerede duruyor"u değil "kime ne kadar benziyor"u anlatıyor. Gerçek
 * konumlara dönmek isteyen biri önce
 * `docs/superpowers/specs/2026-08-04-uzaydaki-komsular-design.md` içindeki karar
 * geçmişini okumalı — orada niye vazgeçildiği yazıyor.
 */

/** SVG'nin iç koordinat genişliği; ekranda `width:100%` ile esniyor. */
export const VIEW_WIDTH = 300;

/** Kare alan: x ve y aynı ölçekte olmazsa uzaklıklar yalan söyler. */
export const VIEW_HEIGHT = 300;

export const CENTER_X = VIEW_WIDTH / 2;
export const CENTER_Y = VIEW_HEIGHT / 2;

/**
 * İki etiket arasındaki en az dikey açıklık.
 *
 * Yazı boyutu 9, üstüne biraz nefes. Tarayıcıda `getBBox()` ile ölçülerek kondu:
 * bunun altında adlar üst üste biniyordu.
 */
export const LABEL_MIN_GAP = 11;

/** En benzeyen komşunun merkeze uzaklığı. Merkez halkasına değmeyecek kadar dışarıda. */
const RADIUS_MIN = 46;

/**
 * En uzak komşunun yarıçapı.
 *
 * Kenar payı etiketlere ayrıldı: yarıçap alanın yarısına kadar çıksaydı ad
 * çerçevenin dışında kalırdı.
 */
const RADIUS_MAX = 108;

/** Bu benzerliğin altındaki komşu en dışarıda duruyor; altı artık ayrışmıyor. */
const WEAKEST_SCORE = 0.4;

/** Çemberin başlangıç açısı — tepe noktası. */
const START_ANGLE = -Math.PI / 2;

/** Dağılma sırasındaki kare gecikmesi; en benzeyen önce ayrışıyor. */
const STAGGER_MS = 90;

export interface Neighbor {
  readonly id: string;
  /** `similarity()` skoru, 0–1. Yarıçap doğrudan bundan geliyor. */
  readonly score: number;
}

export interface PlacedNeighbor {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  /** Etiketin dikey konumu — çakışma yoksa `y` ile aynı. */
  readonly labelY: number;
  readonly anchor: 'start' | 'end';
  /** Efektin başlangıç ötelemesi: nokta merkezde toplanıp buradan ayrışıyor. */
  readonly fromDx: number;
  readonly fromDy: number;
  readonly delayMs: number;
}

/**
 * Benzerlikten yarıçap.
 *
 * Mutlak skor kullanılıyor, kümenin içindeki sıralama değil. Böylece yarıçap
 * parfümler arasında da anlam taşıyor: komşuları zayıf olan bir parfümün çemberi
 * geniş açılıyor, sıkı bir kümenin ortasındaki parfümünki dar kalıyor. Sıralamaya
 * göre normalleştirseydik her sayfada en benzeyen aynı mesafede durur, "ne kadar"
 * bilgisi kaybolurdu.
 */
function radiusFor(score: number): number {
  const t = Math.min(Math.max((1 - score) / (1 - WEAKEST_SCORE), 0), 1);
  return RADIUS_MIN + t * (RADIUS_MAX - RADIUS_MIN);
}

/**
 * Komşuları merkezin dört bir yanına yerleştirir.
 *
 * En benzeyen en yakında — konumlar benzerlikten üretildiği için bu her sayfada
 * tutuyor, tesadüfe bırakılmıyor. Açılar eşit bölünüyor: tek yöne dizilselerdi
 * liste olurdu, oysa istenen çember.
 */
export function radialLayout(neighbors: readonly Neighbor[]): readonly PlacedNeighbor[] {
  if (neighbors.length === 0) return [];

  const sorted = [...neighbors].sort((a, b) => b.score - a.score);
  const step = (Math.PI * 2) / sorted.length;

  const placed = sorted.map((neighbor, index) => {
    const angle = START_ANGLE + index * step;
    const radius = radiusFor(neighbor.score);
    const x = CENTER_X + Math.cos(angle) * radius;
    const y = CENTER_Y + Math.sin(angle) * radius;

    return {
      id: neighbor.id,
      x,
      y,
      labelY: y,
      // Sağ yarıdaki etiket sola yaslı yazılsa çerçevenin dışına taşardı.
      anchor: x >= CENTER_X ? ('start' as const) : ('end' as const),
      fromDx: CENTER_X - x,
      fromDy: CENTER_Y - y,
      delayMs: index * STAGGER_MS,
    };
  });

  return declutter(placed);
}

/**
 * Üst üste binen etiketleri dikeyde ayırır.
 *
 * Yalnızca **yazı** kayıyor; nokta yerinde kalıyor. Nokta oynatılsaydı yarıçap
 * bozulur, "en benzeyen en yakında" iddiası çizimde yalan olurdu.
 *
 * Aynı yana yaslı etiketler kendi aralarında sıralanıp aç gözlü biçimde aşağı
 * itiliyor. Karşılıklı yaslananlar zaten çemberin iki ucunda, çakışmıyorlar.
 */
function declutter(dots: readonly PlacedNeighbor[]): readonly PlacedNeighbor[] {
  const moved = new Map<string, number>();

  for (const anchor of ['start', 'end'] as const) {
    const group = dots.filter((dot) => dot.anchor === anchor).sort((a, b) => a.y - b.y);

    let lowest = Number.NEGATIVE_INFINITY;
    for (const dot of group) {
      const labelY = Math.max(dot.y, lowest + LABEL_MIN_GAP);
      if (labelY !== dot.y) moved.set(dot.id, labelY);
      lowest = labelY;
    }
  }

  if (moved.size === 0) return dots;
  return dots.map((dot) =>
    moved.has(dot.id) ? { ...dot, labelY: moved.get(dot.id)! } : dot,
  );
}
