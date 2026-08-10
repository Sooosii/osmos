import type { SpaceMark } from '@/data/types';

/**
 * Açılış perdesinin nokta listesi — **deneme**.
 *
 * `public/intro.js` kendi noktalarını rastgele üretebiliyor, ama kendi yorumunda
 * "gerçek konumları ver, yoksa canlı haritaya geçerken sıçrama olur" diyor. Bu
 * modül o köprü: uzayın gerçek noktalarını perdenin beklediği biçime çeviriyor.
 *
 * Dönüşüm bilerek aptal: tek bir çarpan, iki eksene de aynı. `projectToSpace`
 * zaten x ile y'yi **ortak** çarpanla ölçekliyor (`similarity.ts:377`) — orada
 * gerekçe "ayrı normalize edilirse harita gerilir ve uzaklıklar yalan söyler".
 * Burada eksenleri ayrı ayrı yaymak aynı yalanı perdede söylerdi.
 */

export interface IntroPoint {
  /** Perdenin kutusunun yüzdesi (`intro.js` `left`/`top` olarak koyuyor). */
  readonly x: number;
  readonly y: number;
  /** Ailenin rengi — canlı haritadakiyle aynı. */
  readonly color: string;
  /** Piksel. `intro.js`in kendi rastgele aralığıyla (4–14) aynı bantta. */
  readonly size: number;
}

/**
 * Kutunun merkezinden kenara doğru kullanılan yüzde.
 *
 * 50 kutuyu tam doldururdu; en dıştaki noktalar kenara yapışır, parlamaları
 * (`box-shadow`) kırpılırdı. 42 kenarda bir tutam boşluk bırakıyor.
 */
const SPREAD = 42;

/** Derinliği çapa çeviren bant — `intro.js`in `4 + Math.random() * 10`u. */
const SIZE_MIN = 4;
const SIZE_RANGE = 10;

export function introPoints(marks: readonly SpaceMark[]): readonly IntroPoint[] {
  return marks.map((mark) => ({
    x: 50 + mark.x * SPREAD,
    y: 50 + mark.y * SPREAD,
    color: mark.color,
    size: SIZE_MIN + mark.depth * SIZE_RANGE,
  }));
}
