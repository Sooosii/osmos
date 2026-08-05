import type { Localized, ScentFamily } from './types';

/**
 * Koku ailesi sözlüğü.
 *
 * `color` görsel imza sisteminin temeli: renk = aile. Sabit ve öğrenilebilir
 * olması şart — kullanıcı 15-20 parfüm gezdikten sonra kodu çözebilmeli.
 * Renkler koyu zemin (yaklaşık #0A0A0C) üzerinde okunacak şekilde seçildi.
 *
 * FAMILY_ORDER benzerlik vektörünün eksen sırası. Bu sıra DEĞİŞMEMELİ —
 * değişirse kayıtlı bütün uzay koordinatları kayar.
 */
export interface Family {
  readonly id: ScentFamily;
  readonly name: Localized;
  readonly color: string;
}

export const FAMILIES: readonly Family[] = [
  { id: 'citrus', name: { en: 'Citrus', tr: 'Narenciye' }, color: '#F2C14E' },
  { id: 'aldehydic', name: { en: 'Aldehydic', tr: 'Aldehitli' }, color: '#D8E4F0' },
  { id: 'green', name: { en: 'Green', tr: 'Yeşil' }, color: '#7FA650' },
  { id: 'aromatic', name: { en: 'Aromatic', tr: 'Aromatik' }, color: '#9FB89A' },
  { id: 'floral', name: { en: 'Floral', tr: 'Çiçeksi' }, color: '#E8A0B8' },
  { id: 'fruity', name: { en: 'Fruity', tr: 'Meyveli' }, color: '#F08A5D' },
  { id: 'gourmand', name: { en: 'Gourmand', tr: 'Gurme' }, color: '#D9A066' },
  { id: 'spicy', name: { en: 'Spicy', tr: 'Baharatlı' }, color: '#C75146' },
  { id: 'woody', name: { en: 'Woody', tr: 'Odunsu' }, color: '#8B6F47' },
  { id: 'resinous', name: { en: 'Resinous', tr: 'Reçineli' }, color: '#C89B3C' },
  { id: 'leather', name: { en: 'Leather', tr: 'Deri' }, color: '#6B4423' },
  { id: 'animalic', name: { en: 'Animalic', tr: 'Hayvansal' }, color: '#7D5A66' },
  { id: 'mossy', name: { en: 'Mossy', tr: 'Yosunlu' }, color: '#5C6E4A' },
  { id: 'mineral', name: { en: 'Mineral', tr: 'Mineral' }, color: '#7FA8B8' },
  { id: 'musk', name: { en: 'Musk', tr: 'Misk' }, color: '#C9BFB4' },
] as const;

/** Benzerlik vektörünün sabit eksen sırası. */
export const FAMILY_ORDER: readonly ScentFamily[] = FAMILIES.map((f) => f.id);

const FAMILY_BY_ID = new Map(FAMILIES.map((f) => [f.id, f]));

export function getFamily(id: ScentFamily): Family {
  const family = FAMILY_BY_ID.get(id);
  if (!family) {
    throw new Error(`Bilinmeyen koku ailesi: ${id}`);
  }
  return family;
}

/**
 * Vektörün en ağır bastığı aile — uzaydaki noktanın da imzadaki notanın da
 * rengi bundan geliyor.
 *
 * Eşitlikte ilk sıradaki kazanıyor; `FAMILY_ORDER` sabit olduğu için bu seçim
 * de her çalıştırmada aynı.
 *
 * Burada duruyor çünkü tek bağımlılığı `FAMILY_ORDER` ve hem sunucudaki uzay
 * hesabı hem tarayıcıdaki imza bileşeni çağırıyor. `space-marks.ts`'te kalsaydı
 * imza, 44×44'lük benzerlik matrisini istemci paketine sürüklerdi.
 */
export function dominantFamily(vector: readonly number[]): ScentFamily {
  let best = 0;
  for (let i = 1; i < vector.length; i += 1) {
    if (vector[i] > vector[best]) best = i;
  }
  return FAMILY_ORDER[best];
}
