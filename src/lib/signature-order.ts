/**
 * Evrim imzasının satır sırası — güçlü nota hep üstte.
 *
 * Sahip ekranda gördü: notalar piramit sırasında (tepe → kalp → dip) duruyordu,
 * o yüzden yüzdeler 78, 67, 47, 36, 25, 35, 33, 48, 21 diye zıplıyor ve merdiven
 * yerine tırtıklı bir görüntü çıkıyordu. Sıra artık **o anki yüzdeye** göre ve
 * zaman ilerledikçe satırlar yer değiştiriyor: parfümün el değiştirmesi
 * gözle izlenebiliyor.
 *
 * Yer değiştirme sıçrayarak değil süzülerek oluyor — ani takla atan satırlar
 * okunmuyor, göz hangi notanın nereye gittiğini kaybediyor.
 *
 * Saf: DOM'a, SVG'ye, React'e dokunmuyor.
 */

/**
 * Süzülmenin zaman sabiti (ms).
 *
 * 260 ms göz takip edecek kadar yavaş, beklemeyecek kadar hızlı. Turun tamamı
 * 12 saniye, yani bir yer değiştirme turun kırkta biri kadar sürüyor.
 */
export const SETTLE_TAU = 260;

/**
 * Değerlere göre hedef sıra — en büyük değer 0'ıncı satır.
 *
 * ⚠️ Eşitlikte **girdi sırası** kazanıyor (`index` ile bozuluyor). Kararlı
 * olmak zorunda: iki nota aynı yüzdeye düştüğünde sıralama kararsız olsaydı
 * satırlar duruyorken bile birbirleriyle yer değiştirip titrerdi. Parfümün
 * başında ve sonunda birçok nota aynı anda sıfıra iniyor, yani bu istisna
 * değil, kural.
 */
export function rankOf(levels: readonly number[]): number[] {
  const order = levels.map((level, index) => ({ level, index }));
  order.sort((a, b) => (b.level === a.level ? a.index - b.index : b.level - a.level));

  const ranks = new Array<number>(levels.length);
  order.forEach((entry, rank) => {
    ranks[entry.index] = rank;
  });

  return ranks;
}

/**
 * Satırları hedeflerine doğru süzer.
 *
 * ⚠️ Üstel yaklaşma (`1 - exp(-dt / TAU)`), kare başına sabit bir adım DEĞIL:
 * sabit adım 120 Hz'lik ekranda iki kat hızlı süzülürdü. Aynı ders
 * `atomizer-mist.ts`te ölçülmüştü ve orada bir kusura yol açmıştı.
 *
 * Hedefi hiç aşmıyor: `k` her zaman 0…1 arasında, yani yeni yer ikisinin
 * arasında bir yerde. Aşsaydı satırlar yerine oturmadan önce sekerdi.
 */
export function settleRows(
  positions: readonly number[],
  targets: readonly number[],
  dtMs: number,
): number[] {
  const k = 1 - Math.exp(-Math.max(dtMs, 0) / SETTLE_TAU);
  return targets.map((target, index) => {
    const from = positions[index] ?? target;
    return from + (target - from) * k;
  });
}
