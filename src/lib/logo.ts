import { getFamily } from '@/data/families';
import type { ScentFamily } from '@/data/types';

/**
 * OSMOS simgesi — kümenin en küçük hâli: farklı ailelerden üç parfüm.
 *
 * Tek kaynak. Sekme simgesi (`app/icon.tsx`) ve telefon ana ekranı simgesi
 * (`app/apple-icon.tsx`) ikisi de buradan üretiliyor; iki dosyaya iki kez
 * daire yazmak, bu depoda bir kez temizlenmiş bir hatanın tekrarı olurdu.
 *
 * ⚠️ Renkler elle yazılmıyor, `families.ts`ten geliyor: sitenin "renk = aile"
 * kuralı simgede de geçerli. Palet değişirse simge kendiliğinden takip eder.
 *
 * ⚠️ Geometri **16 piksele göre** kuruldu, 64'e göre değil. Favicon'un yaşadığı
 * yer sekme ve orada 16 piksel var. Yarıçaplar ve aralar, dörtte bire inince
 * noktalar birbirine değmeyecek şekilde seçildi; ekranda ölçüldü. Hale bilerek
 * yok — küçükte üç lekeyi tek bulanık lekeye çeviriyordu.
 */
export interface LogoDot {
  readonly family: ScentFamily;
  /** 32 birimlik kare içinde. */
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
}

export const LOGO_VIEW = 32;

/** Köşe yuvarlaması — 32 birimlik karede. */
export const LOGO_RADIUS = 7;

export const LOGO_BACKGROUND = '#050507';

export const LOGO_DOTS: readonly LogoDot[] = [
  { family: 'floral', cx: 9.5, cy: 21, r: 4.5 },
  { family: 'citrus', cx: 20, cy: 10, r: 3.5 },
  { family: 'woody', cx: 22, cy: 21.5, r: 5 },
];

/** Bir noktanın rengi — zincir sitenin her yerindekiyle aynı. */
export function logoDotColor(dot: LogoDot): string {
  return getFamily(dot.family).color;
}
