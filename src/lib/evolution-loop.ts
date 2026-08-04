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

/** Turun kapsadığı koku ömrü — 12 saat. */
export const MAX_MINUTES = 720;

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
 * Uçlar tam oturuyor: `minutesAt(0) === 0`, `minutesAt(1) === MAX_MINUTES`.
 * Ortası oturmuyor ve oturmamalı: turun yarısı ilk ~26 dakikayı, %62'si ilk saati
 * kaplıyor. Kalan %38'de 11 saat akıp gidiyor — o bölümde zaten pek bir şey olmuyor.
 */
export function minutesAt(progress: number): number {
  return Math.expm1(progress * Math.log1p(MAX_MINUTES));
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
 * bir kez 0 → 12 saate gidiyordu; ikisi senkron değildi. Çubuk anları p = 0.25
 * ve p = 0.75'e denk geliyordu — yani saat 4. dakikayı ve 2 saat 18. dakikayı
 * gösterirken. Saatin 12. saati ise p = 1'e, yani eğri anına denk geliyordu:
 * etiketlerin gizlendiği tam nokta. Sahibi canlı örnekte üç seçeneği yan yana
 * görüp bunu seçti: **tek** gidiş geliş, çubuk anı turun ortasında (~26 dakika),
 * 12. saat yine eğri anına denk geliyor ama etiketler artık turun ~%87'sinde
 * (kabaca 8. saate kadar) okunur kalıyor — kabul edilen ödün. "12. saati çubuk
 * hâlinde de görelim" ayrı, ertelenmiş bir iş; bunu çözmeye çalışmak için
 * katsayıyı tekrar `4π`'ye çevirmeyin.
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
