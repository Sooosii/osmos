import type { FeelTarget } from './space-feel';

/**
 * Sıcaklık rayı — "bunun gibi, ama daha sıcak".
 *
 * Sahip gördü ve söyledi: "bir parfüme basınca warm'a doğru veya cool'a doğru
 * sürüklemek istiyorum, yapamıyorum, hiçbir şey belli olmuyor; aynı yerde sabit
 * kalmasın, anlamı kalmıyor."
 *
 * Sürüklemenin bir karşılığı olması gerekiyordu, çünkü noktaların yeri
 * **veriden** geliyor: `projectToSpace` MDS ile hesaplıyor ve bir noktayı
 * gerçekten başka bir yere taşımak haritayı yalan söyletirdi (mesafe =
 * benzemezlik). Karşılık şu: nokta parmağın altında bir RAY üzerinde kayıyor
 * ve harita "bu parfüme benzeyen ama o kadar sıcak" olanları yakıyor. Bırakınca
 * nokta gerçek yerine dönüyor, tarif ekranda kalıyor.
 *
 * Yalnız sıcaklık; sahibin kararı. Tek ray, tek anlam — dikey sürükleme
 * kamerayı kaydırmaya devam ediyor.
 *
 * Saf: DOM'a, kameraya, React'e dokunmuyor.
 */

/** Rayın ekrandaki yarı uzunluğu (CSS px) — dar ekranda kısalıyor. */
export const RAIL_HALF_MIN = 90;
export const RAIL_HALF_MAX = 220;

/** Rayın kapladığı ekran payı. Üçte birlik bir yol parmakla rahat sürülüyor. */
export const RAIL_VIEWPORT_SHARE = 0.34;

/**
 * Tek eksenli tarifin genişliği.
 *
 * ⚠️ `FEEL_REACH` (0.7) IKI ve DÖRT eksene göre ölçülmüştü. Tek eksende
 * `distanceTo` doğrudan `|Δsıcaklık|`a düşüyor ve 0.7 haritanın tamamını
 * yakıyor — yani ray hiçbir şeyi elemiyor, dolayısıyla hiçbir şey söylemiyor.
 * Değer 52 parfüm üzerinde ölçülerek konuldu — parlak (>0.5) / yanan (>0) /
 * sönük (=0), rayın beş yerinde:
 *
 *   genişlik   ray 0        ray 0.5       ray 1
 *   0.15       1/2/50       3/11/41       1/7/45      ← neredeyse her şey sönük
 *   **0.28**   1/5/47       6/37/15       1/22/30
 *   0.45       1/15/37      8/50/2        3/31/21
 *   0.60       1/21/31      9/52/0        5/40/12     ← ortada HIÇBIR ŞEY elenmiyor
 *
 * Alt sınırı "uçlarda bile bir avuç parfüm yansın", üst sınırı "her yerde bir
 * şey elensin" veriyor; 0.28 ikisinin arasında. Uçlarda tek bir parfümün
 * parlak olması genişlikle ilgili değil: `feel` 52'ye normalleştiği için 0 ve
 * 1'de tam olarak bir parfüm duruyor.
 */
export const RAIL_REACH = 0.28;

export interface Rail {
  readonly markId: string;
  /** Rayın ekrandaki ortası — sıcaklık 0.5'in düştüğü yer. */
  readonly centerX: number;
  readonly centerY: number;
  readonly half: number;
  /** Noktanın gerçek sıcaklığı; bırakınca buraya dönüyor. */
  readonly origin: number;
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export function railHalf(viewportWidth: number): number {
  const wanted = (viewportWidth * RAIL_VIEWPORT_SHARE) / 2;
  return Math.min(Math.max(wanted, RAIL_HALF_MIN), RAIL_HALF_MAX);
}

/**
 * Parmağın indiği yerden ray.
 *
 * ⚠️ Rayın ortası, noktanın KENDI sıcaklığı basılan noktaya denk gelecek
 * şekilde çözülüyor (`centerX = sx + (0.5 - feel0) · 2 · half`). Sonucu şu:
 * `railValue(rail, sx)` tam olarak `feel0` veriyor, yani ilk pikselde sıçrama
 * yok — nokta parmağı bire bir izliyor. Ray sabit bir yere çizilseydi parmak
 * dokunduğu anda nokta rayın ortasına zıplardı.
 */
export function makeRail(
  markId: string,
  feel0: number,
  sx: number,
  sy: number,
  viewportWidth: number,
): Rail {
  const half = railHalf(viewportWidth);
  const origin = clamp01(feel0);

  return { markId, centerX: sx + (0.5 - origin) * 2 * half, centerY: sy, half, origin };
}

/** Rayın üstündeki bir sıcaklığın ekran x'i. */
export function railX(rail: Rail, value: number): number {
  return rail.centerX + (clamp01(value) - 0.5) * 2 * rail.half;
}

/**
 * Ekran x'inden sıcaklık.
 *
 * Uçlarda kırpılıyor ve ray yeniden ölçeklenmiyor: uca yakın bir parfümde rayın
 * bir ucu ekran dışına taşabiliyor ama düzeltmek her parfümde piksel-başına-derece
 * oranını değiştirirdi — aynı sürükleme farklı parfümlerde farklı anlama gelirdi.
 */
export function railValue(rail: Rail, sx: number): number {
  return clamp01((sx - rail.centerX) / (2 * rail.half) + 0.5);
}

/** Noktanın gerçek yerinden ekran kayması; bırakınca sıfıra dönüyor. */
export function railOffset(rail: Rail, value: number): number {
  return railX(rail, value) - railX(rail, rail.origin);
}

/** Raydan tarif — yalnız sıcaklık soruluyor, öbür üç eksen sessiz. */
export function railFeel(value: number): FeelTarget {
  return [clamp01(value), null, null, null];
}
