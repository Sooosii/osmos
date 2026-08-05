/**
 * Evrim imzasının saati.
 *
 * `space-approach.ts` ile aynı sözleşme: React, DOM, SVG bilmiyor ve hiçbir şey
 * import etmiyor — tek başına okunup sınanabiliyor. Ekranda hiç durmadan dönen
 * animasyonun tamamı bu dosyadaki üç sayıdan ibaret; bileşenin işi yalnızca çizmek.
 *
 * Zaman eşlemesi logaritmik ve bu bir süsleme değil zorunluluk: doğrusal olsaydı
 * kokunun bütün ilginç kısmı (ilk yarım saat) 12 saniyelik turun ilk yarım
 * saniyesinde biter, geri kalan 11.5 saniye neredeyse hiç kıpırdamayan çubukları
 * seyretmekle geçerdi.
 *
 * Eşleme eskiden `EvolutionChart` içindeki kaydıracın eşlemesiydi; buraya taşındı
 * ki imza ile çizelge aynı zamanı göstersin. İki kopya olsaydı biri düzeltilip
 * diğeri unutulduğunda parfüm sayfası ile `/evrim` farklı dakikalar gösterirdi.
 */

/** Tam bir turun süresi. Doğrudan kullanıcı kararı. */
export const CYCLE_MS = 12_000;

/**
 * İmza turunun kapsadığı koku ömrü — 8 saat.
 *
 * Eskiden 12 saatti ve sahip canlı sitede şunu gördü: "8'den 12'ye zaten sabit
 * kalıyor gibi". Haklı — `intensityAt` modeli 8. saatten sonra düzleşiyor, turun
 * son bölümü kıpırdamayan çubukları seyretmekle geçiyordu. Asıl kazanç kuyrukta:
 * etiketlerin söndüğü an 7 sa 52 dk'dan 5 sa 23 dk'ya inince okunamayan ölü kuyruk
 * 4 sa 08 dk'dan 2 sa 37 dk'ya düştü.
 */
export const SIGNATURE_MAX_MINUTES = 480;

/**
 * `/evrim` kaydıracının kapsadığı koku ömrü — 12 saat.
 *
 * İmzayla birlikte 8'e **inmedi** ve inmemeli: o ekranın işi eğri modelini sınamak
 * (`EvolutionTimeline.tsx:8`), yarı ömür hatası ise tam da imzadan attığımız o düz
 * kuyrukta görünür. İki ekranın iki farklı işi var, o yüzden iki sabit.
 */
export const SLIDER_MAX_MINUTES = 720;

/** Kaydıracın adım sayısı; `EvolutionChart` ham adımı buna bölüp ilerleme buluyor. */
export const SLIDER_STEPS = 1000;

/**
 * Geçen süreden döngüsel ilerleme, 0–1.
 *
 * Negatif girdi de sarılıyor: `performance.now()` farkı teoride negatif çıkmaz
 * ama saat kaynağı değişirse fonksiyon aralık dışına çıkmaktansa geriye sarsın.
 */
export function cycleProgress(elapsedMs: number): number {
  const wrapped = elapsedMs % CYCLE_MS;
  return (wrapped < 0 ? wrapped + CYCLE_MS : wrapped) / CYCLE_MS;
}

/**
 * İlerlemeden dakika — logaritmik.
 *
 * Aralık **varsayılansız** bir parametre: çağıran hangi zaman ölçeğinde olduğunu
 * yazmak zorunda. İmza 480, kaydıraç 720 kullanıyor ve bir varsayılan konsaydı biri
 * diğerine sessizce kayardı — ölçek hatası ekranda değil, aylar sonra fark edilir.
 *
 * Uçlar oturuyor: `minutesAt(0, span) === 0`, `minutesAt(1, span)` kayan nokta
 * payıyla `span` (sınama bu yüzden `toBeCloseTo`).
 *
 * Ortası oturmuyor ve oturmamalı: 8 saatlik turda yarısı ilk ~21 dakikayı, %66.6'sı
 * ilk saati kaplıyor. Kokunun bütün ilginç kısmı orada; kalan bölümde zaten pek bir
 * şey olmuyor. Doğrusal olsaydı o ilk yarım saat turun ilk yarım saniyesinde biterdi.
 */
export function minutesAt(progress: number, spanMinutes: number): number {
  return Math.expm1(progress * Math.log1p(spanMinutes));
}

/**
 * İlerlemeden biçim: 0 = eğri, 1 = çizelge.
 *
 * Turda **tek** tam gidiş geliş: eğri → çizelge → eğri. Kosinüs seçildi çünkü
 * uçlarda ve ortada türev sıfır — biçim çizelgeye oturduğunda bir an duraklıyor
 * ve çubuklar okunacak zaman buluyor. Ayrıca `morphAt(0) === morphAt(1)`, yani
 * sonsuz döngüde ek yeri görünmüyor.
 *
 * Neden iki değil bir: ilk sürümde katsayı `4π`'ydi — turda iki gidiş geliş.
 * Sorun şuydu: **biçim** turda iki kez dönerken **zaman** (`minutesAt`) yalnızca
 * bir kez 0 → tur sonuna gidiyordu; ikisi senkron değildi. Aşağıdaki dakikalar o
 * dönemin okumaları — aralık henüz 720 (12 saat) idi, sayılar ona göre: çubuk
 * anları p = 0.25 ve p = 0.75'e denk geliyordu, yani saat 4. dakikayı ve 2 saat
 * 18. dakikayı gösterirken. Saatin 12. saati ise p = 1'e, yani eğri anına denk
 * geliyordu: etiketlerin gizlendiği tam nokta. Sahibi canlı örnekte üç seçeneği
 * yan yana görüp bunu seçti: **tek** gidiş geliş, çubuk anı turun ortasında.
 *
 * Bugünkü aralıkla (`SIGNATURE_MAX_MINUTES` = 480) o an ~21 dakikaya denk geliyor.
 * Turun son saati hâlâ eğri anında kalıyor — kabul edilen ödün — ama etiketler
 * turun ~%87'sinde, kabaca 5.5. saate kadar okunur. O yüzde `morphAt`in şeklinden
 * geliyor, aralıktan değil: span değişse de %87 değişmez.
 *
 * "Son saati çubuk hâlinde de görelim" ayrı, ertelenmiş bir iş; bunu çözmeye
 * çalışmak için katsayıyı tekrar `4π`'ye çevirmeyin.
 */
export function morphAt(progress: number): number {
  return 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);
}

/** Dakikayı okunur süreye çevirir. */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return 'ilk saniyeler';
  if (minutes < 60) return `${Math.round(minutes)} dakika`;

  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest === 0 ? `${hours} saat` : `${hours} saat ${rest} dakika`;
}

/** Dakikanın hangi evrede olduğu. */
export function phaseLabel(minutes: number): string {
  if (minutes < 15) return 'Açılış';
  if (minutes < 120) return 'Kalp';
  return 'Dip';
}
