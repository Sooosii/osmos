import type { SpaceMark } from '@/data/types';
import { type Camera, type Viewport, MAX_SCALE, markRadius, worldToScreen } from './space-camera';

/**
 * Kaydırarak parfüme girme — biriken niyet.
 *
 * Uzayda tekerlek zaten yakınlaşmayı sürüyor. Aynı girdiye ikinci bir anlam
 * yüklemek normalde tuzaktır: kullanıcı gezinirken yanlışlıkla sayfaya düşer.
 * Buradaki çözüm, girişi **belirsizliğin bittiği yerden** başlatmak.
 *
 * Ölçek tavana (`MAX_SCALE`) dayandıktan sonra kamera artık yaklaşamıyor;
 * o noktada içeri kaydırmaya devam etmenin gezinme karşılığı yok. Tek anlamı
 * "daha da içeri" — yani parfümün içine.
 *
 * Üç şart birden aranıyor:
 *   1. bir parfüm seçili        (tıklama davranışı değişmiyor)
 *   2. ölçek tavana dayanmış    (yakınlaşacak yer kalmamış)
 *   3. seçili nokta ekranın ortasına yakın  (bakılan şey o)
 *
 * Şartlardan biri bozulduğu an ilerleme **sıfırlanıyor**, yavaşça geri
 * sayılmıyor: kullanıcı uzaklaşmaya başladıysa niyeti değişmiştir.
 *
 * Eşiğe varmadan hiçbir şey kalıcı değil — ters yöne kaydırmak ilerlemeyi geri
 * indiriyor. Yanlışlıkla tetiklenmenin asıl panzehiri bu.
 */

/** Seçili nokta merkeze bu kadar piksel yakınsa "bakılan şey o" sayılıyor. */
const CENTER_TOLERANCE = 110;

/**
 * `progress` 0'dan 1'e çıkarken harcanan toplam tekerlek yolu (deltaY birimi).
 *
 * Tipik bir fare çentiği ~100. Yani giriş için ~9 çentik gerekiyor: kazara
 * geçilemeyecek kadar uzun, sıkıcı olmayacak kadar kısa. Tek sayı; ekranda
 * görülüp ayarlanacak yer burası.
 */
const ENTRY_DISTANCE = 900;

export interface EntryState {
  /** İlerlemenin ait olduğu parfüm; giriş yokken null. */
  readonly markId: string | null;
  /** 0…1. 1'e ulaşınca sayfaya geçiliyor. */
  readonly progress: number;
}

export const NO_ENTRY: EntryState = { markId: null, progress: 0 };

/**
 * Basılı tutarak açma — artık **bütün parfümlerde** açık.
 *
 * Önce tek parfümde (Megamare) denendi; mekanizma canlıda doğrulandıktan sonra
 * hepsine açıldı. Tekrar tek parfüme indirmek gerekirse aşağıdaki sabite o
 * parfümün kimliğini yazmak yeterli — kod yolu olduğu gibi duruyor.
 *
 * Kaydırarak giriş kâğıtta iyi, elde huysuz çıktı: "her seferinde açmıyor".
 * Sebebi `canEnter`'ın merkez şartı — tekerlek imlecin altına yakınlaştığı için
 * (`zoomAt` çapayı imleçte tutuyor) seçili nokta merkezden kayıyor ve şart
 * sessizce düşüyor. Kullanıcı aynı şeyi yaptığını sanırken farklı sonuç alıyor.
 *
 * Basılı tutmanın böyle bir kör noktası yok: nokta nerede olursa olsun parmak
 * onun üstünde, niyet açık. Ölçüt zaman, konum değil.
 *
 * Tek parfümle sınırlı olması kullanıcı kararı — mekanizmayı canlı görüp karar
 * verecek. Hepsine açmak: bu sabiti `null` yapmak yeterli.
 */
export const HOLD_TRIAL_MARK_ID: string | null = null;

/** Basılı tutma süresi. Kazara değil, bekleyip sıkılmayacak kadar. */
export const HOLD_DURATION = 620;

/** Bu parfüm basılı tutmayı kabul ediyor mu? */
export function holdEnabledFor(markId: string): boolean {
  return HOLD_TRIAL_MARK_ID === null || HOLD_TRIAL_MARK_ID === markId;
}

/**
 * Basılı tutmanın kabul ettiği hedef yarıçapı — noktanın çizili yarıçapına eklenen pay.
 *
 * `hitTest`'in payı (8 px) tıklama için doğru: noktalar birbirine yakın, cömert
 * bir pay komşunun tıklamasını yutar. Tutma için ise fazla dar çıktı ve özelliği
 * sessizce bozdu.
 *
 * Sebep, tutmanın ikinci bir basış olması: parfümü seçtiğin an kamera onu ekranın
 * ortasına taşıyor, yani parmağının altındaki nokta oradan gidiyor. Kullanıcı
 * "aynı yere" bastığını sanırken artık boşluğa basıyor ve tutma hiç başlamıyor.
 * Kenardaki bir parfümde kamera çok yol alıyor, merkeze yakın olanda az —
 * "bazen açıyor, bazen açmıyor" şikâyeti tam olarak bu.
 *
 * 26 px, çizili yarıçapla birlikte ~34–46 pikselik bir hedef veriyor: parmak
 * ucu kadar. Yanlış tetikleme riski yok, çünkü hedef **yalnızca zaten seçili
 * olan** parfüm (bkz. `holdTargetHit`) ve komşu bir noktanın üstündeyken tutma
 * hiç başlamıyor.
 */
const HOLD_TOUCH_PADDING = 26;

/**
 * Basış, seçili parfümün tutma hedefine düşüyor mu?
 *
 * `hitTest`'ten farkı: bu bir yarışma değil. Aday tek — seçili parfüm. Kim
 * kazandı sorusu tıklamaya ait; burada soru "kullanıcı seçtiği şeyi mi tutuyor".
 */
export function holdTargetHit(
  selected: SpaceMark,
  sx: number,
  sy: number,
  camera: Camera,
  viewport: Viewport,
): boolean {
  const { sx: mx, sy: my } = worldToScreen(selected, camera, viewport);
  const reach = markRadius(selected.depth, camera.scale) + HOLD_TOUCH_PADDING;

  return Math.hypot(sx - mx, sy - my) <= reach;
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/**
 * Giriş şartları sağlanıyor mu?
 *
 * Aynı işlev ipucunu göstermek için de kullanılıyor: şart sağlandığı anda
 * kullanıcı "buradan devam edilebiliyor" bilgisini görüyor. Görünmeyen bir
 * hareketi kimse bulamaz.
 */
export function canEnter(
  selected: SpaceMark | null,
  camera: Camera,
  viewport: Viewport,
): boolean {
  if (!selected) return false;

  // Kayan nokta karşılaştırması: `zoomAt` tavanda kamerayı hiç değiştirmiyor,
  // ölçek tam MAX_SCALE'e oturuyor. Yine de eşitlik yerine pay bırakılıyor.
  if (camera.scale < MAX_SCALE - 0.001) return false;

  const { sx, sy } = worldToScreen(selected, camera, viewport);
  const dx = sx - viewport.width / 2;
  const dy = sy - viewport.height / 2;

  return Math.hypot(dx, dy) <= CENTER_TOLERANCE;
}

export interface AdvanceInput {
  /** Tekerlek adımı; negatif = içeri (yakınlaşma yönü). */
  readonly deltaY: number;
  readonly selected: SpaceMark | null;
  readonly camera: Camera;
  readonly viewport: Viewport;
}

export function advance(state: EntryState, input: AdvanceInput): EntryState {
  const { deltaY, selected, camera, viewport } = input;
  if (!canEnter(selected, camera, viewport) || !selected) return NO_ENTRY;

  // Başka bir parfüme geçildiyse birikim devredilmiyor: ilerleme o parfümün.
  const base = state.markId === selected.id ? state.progress : 0;
  const progress = clamp01(base - deltaY / ENTRY_DISTANCE);

  return { markId: selected.id, progress };
}
