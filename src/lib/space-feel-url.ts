import { FEEL_AXES, NO_FEEL, hasFeel, type FeelTarget } from './space-feel';

/**
 * Kaydıraç tarifinin adres çubuğundaki hâli.
 *
 * `?mark=` bir parfümü seçili açıyor; tarif de aynı şeyi yapabilmeli. Kaydıraçları
 * ayarlayıp linki birine yollayan biri, karşı tarafın boş bir uzay görmesini
 * beklemiyor.
 *
 * Biçim dört yuva, virgülle: `?feel=0.4,,0.7,`
 *
 * **Boş yuva `null` demek, 0 değil** — ve bu ayrım biçimin bütün mesele ettiği
 * şey. `space-feel.ts:31`in yazdığı gibi `null` "nötr istiyorum" değil, "bu
 * ekseni sormuyorum" demek. Sıfır yazsaydık paylaşılan her link dört ekseni
 * birden sormuş olurdu ve uzay daha açılırken sönerdi.
 *
 * Sondaki boş yuvalar atılıyor: `0.4,,,` yerine `0.4`. Kısalık için değil,
 * okunurluk için — çoğu tarif ilk iki ekseni kullanıyor ve dört virgüllü bir
 * kuyruk bozuk bir adres gibi görünüyor.
 *
 * Modül saf: `window` da `URLSearchParams` de tanımıyor, string girer string
 * çıkar. Adres çubuğuna yazma işi çağıranın (`SpaceFeelSliders`).
 */

/**
 * Kaydıraç çözünürlüğü — `SpaceFeelSliders`taki `STEPS` ile aynı.
 *
 * Değerler 1/100'ün katları olduğu için iki ondalık **kayıpsız**: adresten dönen
 * sayı, topuğun gerçekten durduğu yer. Ondalık uzarsa yuvarlama kaydıracın
 * gösterdiği yerden farklı bir tarif üretmeye başlar.
 */
const PRECISION = 2;

/** Bozuk yuvayı `null`a düşürür; sayı ise 0…1'e kırpıp adıma oturtur. */
function parseSlot(raw: string): number | null {
  const text = raw.trim();
  if (text === '') return null;

  const value = Number(text);
  if (!Number.isFinite(value)) return null;

  const clamped = Math.min(Math.max(value, 0), 1);
  return Number(clamped.toFixed(PRECISION));
}

/**
 * Adresteki `feel` parametresini tarife çevirir.
 *
 * Bozuk girdi **sessizce yok sayılıyor**, hata fırlatılmıyor: burası kullanıcının
 * eliyle yazabildiği bir alan ve yarısı silinmiş bir link yüzünden uzayın hiç
 * açılmaması, o linkin taşıdığı tarifi kaybetmekten çok daha kötü. Tanınmayan
 * yuva `null` oluyor, yani "sorulmamış" — en zararsız hâli.
 */
export function parseFeel(param: string | null | undefined): FeelTarget {
  if (!param) return NO_FEEL;

  const slots = param.split(',');
  const target: (number | null)[] = [];
  for (let axis = 0; axis < FEEL_AXES; axis += 1) {
    target.push(axis < slots.length ? parseSlot(slots[axis]) : null);
  }
  return target;
}

/**
 * Tarifi adres parametresine çevirir; hiçbir eksen sorulmamışsa `null`.
 *
 * `null` dönüşü "parametreyi tamamen kaldır" demek. Boş bir `?feel=` bırakmak
 * paylaşılan adreste anlamsız bir kuyruk olurdu.
 */
export function formatFeel(target: FeelTarget): string | null {
  if (!hasFeel(target)) return null;

  const slots: string[] = [];
  for (let axis = 0; axis < FEEL_AXES; axis += 1) {
    const value = target[axis];
    slots.push(value === null || value === undefined ? '' : String(Number(value.toFixed(PRECISION))));
  }

  while (slots.length > 0 && slots[slots.length - 1] === '') slots.pop();
  return slots.join(',');
}
