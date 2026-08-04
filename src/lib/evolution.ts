import type { PerfumeNote, Volatility } from '@/data/types';
import { getNote } from '@/data/notes';

/**
 * Evrim modeli — bir notanın zaman içindeki yoğunluğu.
 *
 * ⚠️ Bu bir TAHMİN, ölçüm değil. Gerçek buharlaşma sıcaklığa, tene, deri pH'ına
 * ve konsantrasyona göre değişir. Site bunu kullanıcıya açıkça söylemek zorunda.
 *
 * Model iki hareketin çarpımı:
 *
 *   yükseliş(t) = 1 − k·e^(−t / a)      a = peakMinutes / RISE_DIVISOR
 *   sönüm(t)    = e^(−λt)               λ = ln2 / halfLifeMinutes
 *
 * `k` neden var: sıkma anında bütün malzemeler tendedir ve ilk saniyeden
 * itibaren buharlaşır. Dip notaları "sonradan ortaya çıkmaz" — üst notalar
 * çekilince üzerlerindeki maske kalkar. Yükseliş göreceli bir olgudur, mutlak
 * değil. k = 1 olsaydı (saf yükseliş) oud ilk dakikada %0 görünürdü; oysa
 * Oud Ispahan'ı sıkan biri oud'u ilk saniyede duyar.
 *
 * Ham eğrinin tepe değeri notadan notaya 0.79–0.87 arası değişiyor. Bu yüzden
 * her eğri kendi tepesine bölünüp normalize ediliyor: her nota kendi en güçlü
 * anında %100 gösteriyor. Böylece çizelge "bu nota şu an kendi zirvesinin
 * neresinde" sorusunu cevaplıyor — notalar arası ses yüksekliği farkı
 * kompozisyondaki `weight` ile veriliyor, eğriyle değil.
 */

/**
 * Yükseliş hızını belirler. Büyütmek = daha keskin açılış.
 * 2.2'de nota, `peakMinutes` anında tepesinin ~%89'una ulaşıyor.
 * Eğri modeli buradan tek noktadan ayarlanır — 120 notaya dokunmadan.
 */
const RISE_DIVISOR = 2.2;

/**
 * Sıkma anındaki taban varlık — her nota buradan başlar, hiçbiri sıfırdan değil.
 *
 * 0.30 referans çizelgeyle örtüşen değer: dip notaları 4. dakikada %17–41
 * bandında görünüyor. Düşürmek açılışı daha dramatik yapar (0.15), yükseltmek
 * kompozisyonun tamamını baştan gösterir (0.45). Tek noktadan ayarlanır.
 */
const INITIAL_PRESENCE = 0.3;

/** Yükseliş katsayısı: eğrinin tabandan 1'e kadar kat edeceği mesafe. */
const RISE_SPAN = 1 - INITIAL_PRESENCE;

/** peakMinutes çok küçükse sıfıra bölmeyi ve sonsuz dikliği önler. */
const MIN_RISE_TAU_MINUTES = 0.25;

const LN2 = Math.LN2;

function riseTau(volatility: Volatility): number {
  return Math.max(volatility.peakMinutes / RISE_DIVISOR, MIN_RISE_TAU_MINUTES);
}

function rawIntensity(volatility: Volatility, minutes: number): number {
  const t = Math.max(0, minutes);
  const a = riseTau(volatility);
  const lambda = LN2 / volatility.halfLifeMinutes;
  return (1 - RISE_SPAN * Math.exp(-t / a)) * Math.exp(-lambda * t);
}

/**
 * Ham eğrinin tepe yaptığı an — kapalı formülle, arama yapmadan.
 *
 * f(t) = (1 − k·e^(−t/a))·e^(−λt) türevi sıfırlandığında
 *   t_max = a · ln( k(1 + λa) / (λa) )
 *
 * Taban yeterince yüksekse eğri hiç yükselmeden düşmeye başlar; o durumda
 * logaritma negatif çıkar ve tepe t = 0 olur.
 */
function peakTimeMinutes(volatility: Volatility): number {
  const a = riseTau(volatility);
  const lambdaA = (LN2 / volatility.halfLifeMinutes) * a;
  return Math.max(0, a * Math.log((RISE_SPAN * (1 + lambdaA)) / lambdaA));
}

/**
 * Notanın kendi tepesine göre normalize edilmiş yoğunluğu, 0–1.
 *
 * Örnek (Oud Ispahan, t = 4 dakika, ağırlık uygulanmadan):
 * safran 0.84 · gül 0.59 · oud 0.41 · sandal 0.42 · paçuli 0.43 · labdanum 0.43
 */
export function intensityAt(volatility: Volatility, minutes: number): number {
  const peak = rawIntensity(volatility, peakTimeMinutes(volatility));
  if (peak <= 0) return 0;
  return Math.min(1, rawIntensity(volatility, minutes) / peak);
}

/** Çizelgede tek bir satır: nota + o andaki yüksekliği. */
export interface EvolutionBar {
  readonly noteId: string;
  readonly tier: PerfumeNote['tier'];
  /** Notanın kendi zirvesine göre oranı, 0–1. */
  readonly intensity: number;
  /** intensity × kompozisyondaki ağırlık — çubuğun çizilen yüksekliği, 0–1. */
  readonly level: number;
}

/**
 * Bir parfümün bütün notalarının belirli bir andaki durumu.
 * Sıralama girdideki sırayı korur — çizelge satırları zamanla yer değiştirmesin diye.
 */
export function evolutionAt(
  notes: readonly PerfumeNote[],
  minutes: number,
): readonly EvolutionBar[] {
  return notes.map((entry) => {
    const intensity = intensityAt(getNote(entry.noteId).volatility, minutes);
    return {
      noteId: entry.noteId,
      tier: entry.tier,
      intensity,
      level: intensity * entry.weight,
    };
  });
}
