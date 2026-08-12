/**
 * Evrim imzasının saati.
 *
 * `space-approach.ts` ile aynı sözleşme: React, DOM, SVG bilmiyor — tek başına
 * okunup sınanabiliyor. Ekranda hiç durmadan dönen animasyonun tamamı bu
 * dosyadaki üç sayıdan ibaret; bileşenin işi yalnızca çizmek.
 *
 * Tek import sözlük (`i18n/en.ts`) ve sözleşmeyi bozmuyor: kural React/DOM/SVG
 * içindi, saf bir sabit nesnesi için değil.
 *
 * Zaman eşlemesi logaritmik ve bu bir süsleme değil zorunluluk: doğrusal olsaydı
 * kokunun bütün ilginç kısmı (ilk yarım saat) 12 saniyelik turun ilk yarım
 * saniyesinde biter, geri kalan 11.5 saniye neredeyse hiç kıpırdamayan çubukları
 * seyretmekle geçerdi.
 *
 * Eşleme eskiden `EvolutionChart` içindeki kaydıracın eşlemesiydi; buraya taşındı
 * ki imza ile çizelge aynı zamanı göstersin. İki kopya olsaydı biri düzeltilip
 * diğeri unutulduğunda parfüm sayfası ile `/evolution` farklı dakikalar gösterirdi.
 */

import { EN } from '@/i18n/en';

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
 * `/evolution` kaydıracının kapsadığı koku ömrü — 12 saat.
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
 * Bir karede yutulabilecek en uzun süre.
 *
 * Sekme arka plana atılıp geri gelince iki kare arası dakikalar sürebiliyor;
 * sınır olmasaydı imza tek karede turun ortasına sıçrardı. `dt` ile sürmenin
 * ikinci kazancı da burada: eskiden zaman `performance.now() - start` idi ve
 * bu tuzağa hiç kapanamıyordu, çünkü geçen süre hesaplanmıyordu, ölçülüyordu.
 */
export const MAX_STEP_MS = 50;

/**
 * Saati bir kare ilerletir.
 *
 * ⚠️ Geçen süre artık bir SAYI, `start` kapanışında saklı bir an değil.
 * Duraklatmanın mümkün olmasının tek sebebi bu: durdurulan şey yalnızca
 * `requestAnimationFrame` olsaydı, geri başlatınca saat aradaki bütün süreyi
 * bir anda yutar ve imza ileri sıçrardı.
 */
export function advanceCycle(elapsedMs: number, dtMs: number): number {
  return elapsedMs + Math.min(Math.max(dtMs, 0), MAX_STEP_MS);
}

/**
 * Sağ uçtaki kıl payı.
 *
 * `cycleProgress` bir turu MODLA buluyor, yani tam bir tur sonraki turun
 * sıfırı demek. Kaydıraç sonuna kadar sürüklendiğinde 8 saat değil 0 dakika
 * görünürdü — sürüklemenin bütün amacı olan "sonunda ne oluyor" sorusu tam da
 * orada cevapsız kalırdı.
 */
const CYCLE_EDGE = 1e-6;

/**
 * Kaydıracın yerinden saat — 0 turun başı, 1 turun sonu.
 *
 * Aralık dışı değer kırpılıyor: kaydıraç `min`/`max` ile zaten sınırlı ama
 * fonksiyon adresten ya da klavyeden gelen bir değere de dayanmalı.
 */
export function seekCycle(progress: number): number {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return Math.min(clamped, 1 - CYCLE_EDGE) * CYCLE_MS;
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

/**
 * Dakikayı okunur süreye çevirir.
 *
 * `words` varsayılanlı ve bugün hiç geçilmiyor; Faz 2'de aynı saat Türkçe
 * okunacak ve o gün bu imza değişmeyecek. Tekil/çoğul ayrımı sözlüğün içinde,
 * çünkü Türkçede öyle bir ayrım yok.
 */
export function formatDuration(
  minutes: number,
  words: typeof EN.duration = EN.duration,
): string {
  if (minutes < 1) return words.firstSeconds;

  /*
    ⚠️ Önce YUVARLA, sonra böl. Tersi ekranda yakalandı: 479.99 dakikada
    `floor(479.99 / 60)` 7, `round(479.99 % 60)` 60 veriyor ve yazı
    "7 saat 60 dakika" oluyordu. Turun sonu tam oraya düşüyor, yani zaman
    çubuğunun sağ ucu kalıcı olarak o cümleyi gösteriyordu.

    Aynı hata küçük tarafta da vardı: 59.6 dakika "60 dakika" yazıyordu,
    "1 saat" değil.
  */
  const total = Math.round(minutes);
  if (total < 60) return words.minutes(total);

  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? words.hours(hours) : words.hoursMinutes(hours, rest);
}

/** Dakikanın hangi evrede olduğu. */
export function phaseLabel(minutes: number, words: typeof EN.phases = EN.phases): string {
  if (minutes < 15) return words.opening;
  if (minutes < 120) return words.heart;
  return words.base;
}
