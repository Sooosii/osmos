/**
 * Parmağın niyeti — dokunuş mu, kaydırma mı?
 *
 * Uzayda telefondan tek bir noktaya dokunmak çoğu zaman hiçbir şey yapmıyordu.
 * Sebebi ölçüldü ve tek bir satırdı: sürüklenen mesafe **yol uzunluğu** olarak
 * toplanıyordu (`moved + hypot(dx, dy)`, her `pointermove`de). Duran bir parmak
 * bile 1–2 px'lik olaylar üretiyor; üçüncü titremede toplam 4 px'i geçiyor ve
 * parmak kalkınca seçim "sürükleme" sayılıp düşürülüyordu. Ölçü artık
 * **başlangıca net uzaklık**: parmak nereye gidip nereden döndüyse dönsün, kalktığı
 * yer başladığı yere yakınsa bu bir dokunuştur.
 *
 * Ikinci ölçüm: 4 px bir FARE eşiği. Android'in kendi eşiği ~8dp, iOS'unki ~10pt.
 * Parmak sabit duramaz; eşik işaretçinin cinsine göre veriliyor.
 *
 * `latch` üçüncü bir şeyi çözüyor: bir hareket başladıktan sonra ne olduğuna
 * **bir kez** karar veriliyor ve kararı bir daha değişmiyor. Karar değişebilseydi
 * çapraz bir sürükleme sırasında harita bir kayar bir durur, sonra ray devreye
 * girerdi. `'rail'` seçili noktanın sıcaklık rayı için; onu bağlayan hareket
 * ayrı bir adımda geliyor, eksen kilidi burada çünkü ölçtüğü şey aynı: aynı
 * `pointermove` akışı.
 *
 * Saf: DOM'a, React'e, kameraya dokunmuyor.
 */

/** Fare için 4 px yetiyor. */
export const MOUSE_SLOP = 4;

/** Parmak ve kalem için 10 px — platformların kendi eşikleriyle aynı yerde. */
export const TOUCH_SLOP = 10;

/**
 * Yatay kilit için gereken oran.
 *
 * 1.2 hafif bir çapraz hareketin rayı kazara kapmasını engelliyor; 45°'lik bir
 * sürükleme kaydırma sayılıyor, 15°'lik bir sürükleme ray.
 */
export const AXIS_RATIO = 1.2;

/** Hareketin ne olduğuna verilen karar. Bir kez `'none'`dan çıkınca dönmüyor. */
export type Latch = 'none' | 'pan' | 'rail';

export interface Probe {
  readonly startX: number;
  readonly startY: number;
  /** Bu işaretçi için dokunuş eşiği. */
  readonly slop: number;
  /** Başlangıca **net** uzaklık — yol uzunluğu DEĞİL. */
  readonly moved: number;
  /** Bir kez düştüyse geri kalkmıyor. */
  readonly tap: boolean;
  readonly latch: Latch;
}

/** Işaretçinin cinsine göre dokunuş eşiği. */
export function tapSlop(pointerType: string): number {
  return pointerType === 'mouse' ? MOUSE_SLOP : TOUCH_SLOP;
}

export function beginProbe(x: number, y: number, pointerType: string): Probe {
  return { startX: x, startY: y, slop: tapSlop(pointerType), moved: 0, tap: true, latch: 'none' };
}

/**
 * Sıkıştırmadan devralınan parmak.
 *
 * Iki parmakla yakınlaşıp tek parmakla kaydırmaya devam etmek yaygın bir el
 * hareketi; kalan parmak sürüklemeyi devralıyor. Ama bu bir dokunuş DEĞİL,
 * süren bir hareketin devamı: sıfırdan başlasaydı parmağı kaldırmak seçim
 * açardı.
 */
export function inheritedProbe(x: number, y: number, pointerType: string): Probe {
  return { startX: x, startY: y, slop: tapSlop(pointerType), moved: 0, tap: false, latch: 'pan' };
}

/**
 * Parmak kımıldadı.
 *
 * `railArmed` yalnızca kilidin **ilk** kararında okunuyor: seçili noktanın
 * üstünden başlayan yatay bir sürükleme raydır, geri kalan her şey kaydırma.
 */
export function moveProbe(probe: Probe, x: number, y: number, railArmed: boolean): Probe {
  const dx = x - probe.startX;
  const dy = y - probe.startY;
  const moved = Math.hypot(dx, dy);
  const tap = probe.tap && moved <= probe.slop;

  if (probe.latch !== 'none' || moved <= probe.slop) {
    return { ...probe, moved, tap, latch: probe.latch };
  }

  const horizontal = Math.abs(dx) > AXIS_RATIO * Math.abs(dy);
  return { ...probe, moved, tap, latch: railArmed && horizontal ? 'rail' : 'pan' };
}

export function isTap(probe: Probe): boolean {
  return probe.tap;
}
