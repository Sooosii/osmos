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
 * Karakterin dört ekseni, `Character`teki sırayla: sıcaklık, doku, temizlik,
 * yakınlık. İlk ikisi ekranda hep açık, diğer ikisi "…" ile geliyor.
 */
export const FEEL_AXES = 4;

/**
 * Kaydıraçların tarif ettiği yer — eksen başına 0…1, ya da `null`.
 *
 * ⚠️ `null` "nötr istiyorum" DEĞİL, **"bu ekseni sormuyorum"** demek ve ayrım
 * kritik. Topuzlar ortada doğuyor; ortayı bir tarif saysaydık uzay daha varış
 * anında, kimse bir şey sormadan sönerdi.
 *
 * Ayrım eksen BAŞINA tutuluyor, tarif başına değil. Gizli iki eksen açıldığında
 * ama dokunulmadığında hesaba girmemeleri gerekiyor: ortada duran bir "doku"
 * kaydıracı, kullanıcı ona hiç dokunmadan sonucu sessizce daraltırdı.
 */
export type FeelTarget = readonly (number | null)[];

/** Hiçbir eksene dokunulmamış hâli. */
export const NO_FEEL: FeelTarget = [null, null, null, null];

/** Tarifte sorulmuş en az bir eksen var mı? */
export function hasFeel(target: FeelTarget): boolean {
  return target.some((value) => value !== null);
}

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
 * uzay her tarife bir cevap veriyor, hiçbir soruda boş kalmıyor.
 */
export const FEEL_REACH = 0.7;

/**
 * Sönümün eğrisi. 1 doğrusal; büyüdükçe cevap merkeze toplanıyor.
 *
 * ⚠️ `FEEL_REACH` ile birlikte okunmalı; ikisi tek bir gerilimi çözüyor.
 *
 * Gerilim şu: kaydıraç bir UCA sürüldüğünde (örn. "sıcak ve kirli") veri uzakta
 * kalıyor, ORTAYA sürüldüğünde ise herkes yakın. Dar bir erişim ucu bomboş
 * bırakıyor, geniş bir erişim ortayı tümden aydınlatıyordu. Erişimi genişletip
 * eğriyi sertleştirmek ikisini ayırıyor: uçta kimse tümden kaybolmuyor, ortada
 * yalnızca gerçekten merkezdekiler öne çıkıyor.
 *
 * 44 parfümle ölçülen dağılım (parlak = yakınlık > 0.5, dip = tam 0):
 *
 *   tarif                             parlak   kademeli   dip
 *   sıcak + kirli                        3         6       7
 *   soğuk + temiz                        8        11       1
 *   orta                                 8        30       0
 *   sıcak+kirli+tırtıklı+yakın (4 eksen) 8         8       0
 *
 * Son satır `distanceTo`daki ortalamanın işini gösteriyor: "…" ile iki eksen
 * daha açmak cevabı daraltmıyor, dağılım iki eksenlininkiyle aynı ölçekte
 * kalıyor.
 *
 * Denenip elenenler: dar erişim (uçta 36 noktayı dibe indiriyordu, ekran tümden
 * sönüyordu) ve doğrusal eğri (ortada 38 noktayı parlatıyordu, kaydıraç hiçbir
 * şey elemiyordu).
 */
export const FEEL_CURVE = 3.2;

/**
 * Bir ekseni gözlenen aralığına yayar — en küçük 0, en büyük 1.
 *
 * Teorik aralığa (−1…+1) bölmek yanlış olurdu ve sebebi `similarity.ts:88`'de
 * yazılı: `characterVector` ağırlıklı **ortalama** döndürüyor, toplam değil.
 * Ortalama olduğu için 44 parfümün değerleri uçlara hiç yaklaşmıyor, dar bir
 * bantta kümeleniyor. O bandı teorik aralığa oturtsaydık kaydıracın yolunun
 * büyük kısmı ölü olurdu: kullanıcı topuzu uca sürer, hiçbir şey değişmez,
 * kaydıracın bozuk olduğunu düşünürdü.
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

/**
 * Tarif ile nokta arasındaki uzaklık — yalnızca SORULMUŞ eksenler üzerinden.
 *
 * Karekökün içi ortalama alınıyor, toplam değil. Sebebi ölçek: iki eksenle
 * sorulan bir tarifle dört eksenle sorulan tarifin uzaklıkları aynı aralıkta
 * kalmalı, yoksa "…" ile iki eksen daha açmak cevabı bir anda daraltır ve
 * `FEEL_REACH` yeniden ayarlanmak zorunda kalırdı.
 */
function distanceTo(feel: readonly number[], target: FeelTarget): number {
  let total = 0;
  let asked = 0;

  for (let axis = 0; axis < target.length; axis += 1) {
    const wanted = target[axis];
    if (wanted === null) continue;

    const delta = feel[axis] - wanted;
    total += delta * delta;
    asked += 1;
  }

  return asked === 0 ? 0 : Math.sqrt(total / asked);
}

/**
 * Tarife en yakın noktanın uzaklığı — cevabın çapası.
 *
 * Kare başına bir kez, bütün havuz üzerinden hesaplanıyor; `feelMatch` bunu
 * alarak her noktayı en iyi eşleşmeye göre derecelendiriyor. Çapa olmadan
 * kaydıracın uçlarında ekran tümden sönüyordu — gerekçesi `FEEL_REACH`te.
 */
export function feelAnchor(feels: Iterable<readonly number[]>, target: FeelTarget): number {
  if (!hasFeel(target)) return 0;

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
  feel: readonly number[],
  target: FeelTarget,
  anchor: number,
): number {
  // Hiçbir eksen sorulmadıysa cevap yok: her nokta tam yakınlıkta, uzay olduğu gibi.
  if (!hasFeel(target)) return 1;

  const behind = distanceTo(feel, target) - anchor;
  if (behind >= FEEL_REACH) return 0;

  // En yakın nokta için `behind` 0; kayan nokta artığı eksiye düşerse kırpılıyor.
  return (1 - Math.max(behind, 0) / FEEL_REACH) ** FEEL_CURVE;
}
