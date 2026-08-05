/**
 * Sinestezi kaydıraçlarının geometrisi — tarif ile nokta arasındaki yakınlık.
 *
 * Veri şeması (`data/types.ts:5-9`) her alanın hangi gösterimi süreceğini baştan
 * yazmıştı; `character → sinestezi kaydıraçları` satırının karşılığı bu modül.
 * Niyet `types.ts:62`'de duruyor: nota bilmeyen biri "soğuk ve temiz bir şey
 * istiyorum" diyerek arayabilsin.
 *
 * Modül saf: sayı girer, sayı çıkar. Tuvali, React'i, veriyi tanımıyor —
 * `space-approach.ts` ve `neighbor-orbit.ts` ile aynı sözleşme.
 *
 * ⚠️ Burada **yakınlık** hesaplanıyor, opaklık değil. Yakınlığın opaklığa nasıl
 * çevrileceği çizimin işi ve orada kalıyor (`space-draw.ts`, `DIM_ALPHA`).
 * Sebebi hem sınır hem mekanik: dip değeri uzayın "sönük" seviyesi ve o seviye
 * çizimin öbür alfa sabitlerinin yanında tek nüsha duruyor; buraya taşımak
 * `space-draw → space-feel` importunu dairesel yapardı.
 */

/** Sıfıra bölmeyi eleyen eşik. */
const EPSILON = 1e-10;

/**
 * Cevabın genişliği — en yakın noktadan bu kadar geride kalan sönüyor.
 *
 * ⚠️ Ölçü **mutlak uzaklık değil, en iyi eşleşmeye olan fark.** Aradaki ayrım
 * ekranda ölçülerek bulundu ve özelliğin çalışıp çalışmamasını belirliyor.
 *
 * Mutlak uzaklıkla yazılmıştı ve şöyle kırılıyordu: "sıcak ve kirli" birim
 * karenin köşesi, oysa parfümler ortada kümeleniyor (`characterVector` ortalama
 * döndürdüğü için uçlara kimse yaklaşmıyor). Köşeye en yakın parfüm bile
 * erişimin dışında kalıyor, dolayısıyla ekrandaki HER nokta dibe iniyordu —
 * uzay cevap vermek yerine tümden sönüyordu. Tarayıcıda görüldü.
 *
 * Farka göre ölçünce en iyi eşleşme nerede olursa olsun tam parlaklıkta:
 * uzay her tarife bir cevap veriyor, hiçbir soruda boş kalmıyor. Değer artık
 * veriye de kaydıracın konumuna da bağlı değil, yalnızca "cevap ne kadar geniş
 * bir bölge olsun" sorusuna bakıyor.
 *
 * Yükseltmek bölgeyi genişletir; aşırıya kaçarsa kaydıraç hiçbir şey elemez.
 * Düşürmek keskinleştirir; aşırıya kaçarsa ekranda üç nokta kalır ve harita
 * "neredeyim" sorusunu cevaplayamaz olur. Tek noktadan değişir.
 *
 * 1.0, birim karenin bir kenarı kadar: 44 parfümün neredeyse hiçbiri tam dibe
 * inmiyor, uzak olanlar yalnızca sessizleşiyor. Ölçüldü — aşağıdaki tabloya bak.
 */
export const FEEL_REACH = 1.0;

/**
 * Sönümün eğrisi. 1 doğrusal; büyüdükçe cevap merkeze toplanıyor.
 *
 * ⚠️ `FEEL_REACH` ile birlikte okunmalı; ikisi tek bir gerilimi çözüyor.
 *
 * Gerilim şu: kaydıraç bir KÖŞEYE sürüldüğünde (örn. "sıcak ve kirli") veri
 * uzakta kalıyor, ORTAYA sürüldüğünde ise herkes yakın. Dar bir erişim köşeyi
 * bomboş bırakıyor, geniş bir erişim ortayı tümden aydınlatıyordu. Erişimi
 * genişletip eğriyi sertleştirmek ikisini ayırıyor: köşede kimse tümden
 * kaybolmuyor, ortada yalnızca gerçekten merkezdekiler öne çıkıyor.
 *
 * 44 parfümle ölçülen dağılım (parlak = yakınlık > 0.5, dip = tam 0):
 *
 *   tarif          parlak   kademeli   dip
 *   sıcak+kirli       3         6       6
 *   soğuk+temiz       8        11       1
 *   sıcak+temiz      16        17       0
 *   orta              8        30       0
 *
 * Denenip elenenler: 0.42/1.6 köşede 36 noktayı dibe indiriyordu (ekran tümden
 * sönüyordu); 0.90/1.0 ortada 38 noktayı parlatıyordu (kaydıraç hiçbir şey
 * elemiyordu).
 */
export const FEEL_CURVE = 3.2;

/**
 * Kaydıraçların tarif ettiği yer — iki eksen de 0…1.
 *
 * `null` "nötr istiyorum" DEĞİL, **"sormuyorum"** demek ve ayrım kritik.
 * Kaydıraçlar ortada doğuyor; ortayı bir tarif saysaydık uzay daha varış anında,
 * kimse bir şey sormadan sönerdi. Ayrımı yoruma bırakmamak için tipin kendisi
 * taşıyor.
 */
export type FeelTarget = readonly [number, number] | null;

/** Dokunulmamış kaydıraç. */
export const NO_FEEL: FeelTarget = null;

/**
 * Bir ekseni gözlenen aralığına yayar — en küçük 0, en büyük 1.
 *
 * Teorik aralığa (−1…+1) bölmek yanlış olurdu ve sebebi `similarity.ts:88`'de
 * yazılı: `characterVector` ağırlıklı **ortalama** döndürüyor, toplam değil.
 * Ortalama olduğu için 44 parfümün değerleri uçlara hiç yaklaşmıyor, dar bir
 * bantta kümeleniyor. O bandı teorik aralığa oturtsaydık kaydıracın yolunun
 * büyük kısmı ölü olurdu: kullanıcı topuzu uca sürer, hiçbir şey değişmez,
 * kaydıracın bozuk olduğunu düşünürdü.
 *
 * Gözlenene yayınca kaydıracın iki ucu da gerçekten ulaşılabilir oluyor ve her
 * piksellik hareket bir şeyi değiştiriyor.
 */
export function normalizeAxis(values: readonly number[]): number[] {
  if (values.length === 0) return [];

  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }

  const span = max - min;

  // Bütün değerler eşitse bu eksende ayırt edici bilgi yok; hepsi ortada durur.
  // NaN dönmek en kötüsü olurdu: nokta çizilmez, sebebi de ekranda görünmezdi.
  if (span < EPSILON) return values.map(() => 0.5);

  return values.map((value) => (value - min) / span);
}

/** Tarif ile nokta arasındaki düz uzaklık. */
function distanceTo(feel: readonly [number, number], target: readonly [number, number]): number {
  return Math.hypot(feel[0] - target[0], feel[1] - target[1]);
}

/**
 * Tarife en yakın noktanın uzaklığı — cevabın çapası.
 *
 * Kare başına bir kez, bütün havuz üzerinden hesaplanıyor; `feelMatch` bunu
 * alarak her noktayı en iyi eşleşmeye göre derecelendiriyor. Çapa olmadan
 * kaydıracın uçlarında ekran tümden sönüyordu — gerekçesi `FEEL_REACH`te.
 *
 * Sorulmadıysa 0: `feelMatch` zaten erken dönüyor, değerin bir hükmü yok.
 */
export function feelAnchor(
  feels: Iterable<readonly [number, number]>,
  target: FeelTarget,
): number {
  if (target === null) return 0;

  let nearest = Infinity;
  for (const feel of feels) {
    const distance = distanceTo(feel, target);
    if (distance < nearest) nearest = distance;
  }

  // Havuz boşsa çapa yok; her nokta kendi uzaklığından ölçülür.
  return Number.isFinite(nearest) ? nearest : 0;
}

/**
 * Noktanın tarife yakınlığı — 1 en iyi eşleşme, 0 cevabın dışı.
 *
 * Yön değil uzaklık soruluyor: tariften eşit uzaklıktaki iki parfüm eşit
 * karşılık veriyor. Aksi hâlde eksenlerden biri diğerini bastırır ve
 * kaydıraçlardan yalnızca biri çalışıyormuş gibi hissettirirdi.
 *
 * `anchor` en yakın noktanın uzaklığı (`feelAnchor`). Ölçü ondan geriye doğru
 * alınıyor, yani en iyi eşleşme her zaman tam parlaklıkta — kaydıraç nereye
 * sürülürse sürülsün uzayın verecek bir cevabı var.
 */
export function feelMatch(
  feel: readonly [number, number],
  target: FeelTarget,
  anchor: number,
): number {
  // Sorulmadıysa cevap yok: her nokta tam yakınlıkta, yani uzay olduğu gibi kalıyor.
  if (target === null) return 1;

  const behind = distanceTo(feel, target) - anchor;
  if (behind >= FEEL_REACH) return 0;

  // En yakın nokta için `behind` 0; kayan nokta artığı eksiye düşerse kırpılıyor.
  return (1 - Math.max(behind, 0) / FEEL_REACH) ** FEEL_CURVE;
}
