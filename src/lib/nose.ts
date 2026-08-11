import { FAMILY_ORDER } from '@/data/families';
import { PERFUMES, getPerfume, hasPerfume } from '@/data/perfumes';
import type { Perfume, PerfumeNote, ScentFamily } from '@/data/types';
import { asPerfume } from './composition';
import { characterVector, familyVector, similarity } from './similarity';
import { normalizeAxis } from './space-feel';

/**
 * Burun raporu — rafların ve Top 4'ün birlikte söylediği şey.
 *
 * Sahip Patron'a fazla basit bulduğu iki şeyi ücretsiz yapmaya karar verdi;
 * bu ikincisi. Site bugüne kadar kişi hakkında dört şey biliyordu ve
 * söyleyecek bir cümlesi yoktu.
 *
 * ⚠️ **Yeni bir motor YAZILMADI** — `composition.ts`teki numaranın dördüncü
 * tekrarı. Kişinin parfümlerinin notaları tek bir sentetik parfümde
 * birleşince `similarity`, `familyVector`, `characterVector` ve
 * `normalizeAxis` hiç değişmeden çalışıyor. İkinci bir ölçü açmak, kişinin
 * burnunu sitenin 52'sinden **farklı bir cetvelle** ölçmek olurdu; oysa
 * karşılaştırmanın bütün anlamı aynı cetvelde.
 *
 * ⚠️ **"Listemde" rafı bu hesaba GİRMİYOR.** İstek listesi ne kokladığını
 * değil ne istediğini anlatır; portreye karıştırmak raporu yalancı yapardı.
 * Ama öneriden düşüyor — zaten bildiğin şeyi önermek boş. Ayrımı çağıran
 * kuruyor: `read` neyin okunacağını, `exclude` neyin önerilmeyeceğini söylüyor.
 *
 * Modül saf: veritabanı, React ve istek bağlamı tanımıyor.
 */

/**
 * Raporun doğması için gereken en az parfüm.
 *
 * Altında sayfa rapor çizmiyor, davet ediyor. Tek parfümle rapor "sen %100 bu
 * parfümsün" der — bilgi değil papağanlık; ikiyle de "genişlik" ve "yabancı"
 * gibi satırların anlamı yok.
 */
export const MIN_NOSE_PERFUMES = 3;

/**
 * Top 4'ün raf kaydına göre ağırlığı.
 *
 * ⚠️ Top 4 bir **iddia** ("en sevdiğim dört şey"), raf bir **kayıt** ("elimde
 * var"). Yirmi raf kaydı, özenle seçilmiş dördü boğmamalı. İki kat, dördü
 * duyulur kılmaya yetiyor ama koleksiyonu da susturmuyor.
 */
export const TOP_FOUR_WEIGHT = 2;

/** Raporda gösterilen aile satırı sayısı. */
export const FAMILY_LINES = 5;

/** "Sıradaki" önerisi kaç parfüm. */
export const NEXT_COUNT = 5;

/**
 * Tanınan kimlikler — tekilleştirilmiş, veride olmayan atılmış, **sıralanmış**.
 *
 * ⚠️ Sıralama süs değil, doğruluk. Kayan nokta toplaması birleşme özelliği
 * taşımıyor: aynı notaları farklı sırayla toplamak son basamakta farklı bir
 * sayı veriyor. Ölçüldü — rafı ters sırayla okumak eksen değerini
 * 0.6685685291879153 yerine …152 yapıyordu.
 *
 * Görünürde zararsız ama sonucu şu olurdu: kişi bir parfümü raftan çıkarıp
 * geri koyduğunda (raf "yeniden eskiye" okunuyor, yani sıra değişiyor) raporu
 * sessizce başka bir sayı gösterirdi. Kimlik sırası dışarıdan geldiği için
 * burada sabitleniyor; alfabetik olması keyfî, **kararlı** olması değil.
 * Yabancı seçimindeki eşitlik bozumu da bu sayede kararlı.
 */
function knownIds(ids: readonly string[]): readonly string[] {
  return [...new Set(ids)].filter(hasPerfume).sort();
}

export interface FamilyShare {
  readonly family: ScentFamily;
  /** Aile vektöründeki payı, 0–1. Gösterilen beş satırın toplamı 1'i aşmıyor. */
  readonly share: number;
}

export interface NoseReport {
  /** Rapor kaç parfümden okundu — ekranda yazıyor, dürüstlük satırı. */
  readonly count: number;
  readonly families: readonly FamilyShare[];
  /**
   * Dört karakter ekseni — `Character` sırasıyla (sıcaklık, doku, temizlik,
   * yakınlık), her biri 0–1.
   *
   * `SpaceMark.feel` ile **aynı cetvel**: 0.5 "nötr" değil "52'nin ortası"
   * demek. Kaydıraçlarla aynı ölçekte olması şart, yoksa aynı sözcükler
   * ("sıcak") iki ekranda iki ayrı şey anlatırdı.
   */
  readonly feel: readonly [number, number, number, number];
  /** Koleksiyonun dağınıklığı: 0 hepsi akraba … 1 ortak yanları yok. */
  readonly breadth: number;
  /** Kalanlara en az benzeyen parfüm. */
  readonly outlierId: string | null;
  /** Burna en yakın, henüz raflarda olmayan parfümler. */
  readonly nextIds: readonly string[];
}

/**
 * Kişinin parfümlerini tek bir sentetik parfümde birleştirir.
 *
 * Aynı nota birden çok parfümde geçiyorsa ağırlıkları **toplanıyor**:
 * beş parfümünde de vanilya olan birinin burnunda vanilya baskın olmalı.
 * Sonra en büyüğe bölünüyor ki `PerfumeNote.weight`in 0–1 sözleşmesi bozulmasın.
 *
 * ⚠️ `tier` (piramitteki katman) burada **anlamsız ve kullanılmıyor**: iki
 * parfümde farklı katmanlarda duran bir nota birleşince hangi katmanda
 * sayılacağının cevabı yok. Alan tip zorunlu kıldığı için ilk görülen katman
 * yazılıyor; raporu besleyen üç fonksiyonun (`familyVector`,
 * `characterVector`, `noteVector`) hiçbiri `tier` okumuyor. Bir gün burnun
 * evrim eğrisi çizilecekse bu karar yeniden düşünülmeli.
 */
export function noseOf(
  perfumeIds: readonly string[],
  favourites: readonly string[],
): Perfume | null {
  const known = knownIds(perfumeIds);
  if (known.length === 0) return null;

  const favourite = new Set(favourites);
  const totals = new Map<string, { tier: PerfumeNote['tier']; weight: number }>();

  for (const id of known) {
    const scale = favourite.has(id) ? TOP_FOUR_WEIGHT : 1;

    for (const note of getPerfume(id).notes) {
      const current = totals.get(note.noteId);
      totals.set(note.noteId, {
        tier: current?.tier ?? note.tier,
        weight: (current?.weight ?? 0) + note.weight * scale,
      });
    }
  }

  let peak = 0;
  for (const entry of totals.values()) if (entry.weight > peak) peak = entry.weight;
  if (peak === 0) return null;

  const notes: PerfumeNote[] = [...totals].map(([noteId, entry]) => ({
    noteId,
    tier: entry.tier,
    weight: entry.weight / peak,
  }));

  return asPerfume(notes, '');
}

/**
 * Raporu kurar; okunacak parfüm sayısı yetmiyorsa `null`.
 *
 * @param read       Okunanlar — Top 4 + "sahibim" + "denedim".
 * @param favourites Çift ağırlıklı olanlar — Top 4.
 * @param exclude    Öneriden düşecekler — bütün raflar + Top 4.
 */
export function noseReport(
  read: readonly string[],
  favourites: readonly string[],
  exclude: readonly string[],
): NoseReport | null {
  const known = knownIds(read);
  if (known.length < MIN_NOSE_PERFUMES) return null;

  const nose = noseOf(known, favourites);
  if (!nose) return null;

  return {
    count: known.length,
    families: familiesOf(nose),
    feel: feelOf(nose),
    ...spreadOf(known),
    nextIds: nextFor(nose, exclude),
  };
}

/** En güçlü aileler, paya çevrilmiş. Sıfır olanlar hiç yazılmıyor. */
function familiesOf(nose: Perfume): readonly FamilyShare[] {
  const vector = familyVector(nose);
  const total = vector.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return [];

  return FAMILY_ORDER.map((family, index) => ({ family, share: vector[index] / total }))
    .filter((entry) => entry.share > 0)
    .sort((a, b) => b.share - a.share)
    .slice(0, FAMILY_LINES);
}

/**
 * Dört eksen, **52'nin cetveliyle**.
 *
 * Burun 52'nin yanına ekleniyor ve normalize edilen dizinin sonuncusu
 * alınıyor. Bu, uzaydaki noktalarla birebir aynı ölçek demek
 * (`space-marks.ts` de `normalizeAxis` kullanıyor).
 *
 * ⚠️ Burnun eklenmesi 52'nin ölçeğini **kaydırmıyor** ve bu bir tesadüf değil:
 * birleşik burnun karakter vektörü, okunan parfümlerinkinin dışbükey bileşimi
 * (`noseOf`un ağırlıkları sadeleşince görülüyor), dolayısıyla onların
 * aralığının — ve 52'nin aralığının — içinde kalmak zorunda. Sınama tutuyor.
 */
function feelOf(nose: Perfume): readonly [number, number, number, number] {
  const pool = PERFUMES.map((perfume) => characterVector(perfume));
  const mine = characterVector(nose);

  const axes = [0, 1, 2, 3].map((axis) => {
    const spread = normalizeAxis([...pool.map((vector) => vector[axis]), mine[axis]]);
    return spread[spread.length - 1];
  });

  return [axes[0], axes[1], axes[2], axes[3]] as const;
}

/**
 * Genişlik ve yabancı — ikisi de aynı benzerlik matrisinden.
 *
 * Matris bir kez kuruluyor ve yalnız üst üçgeni hesaplanıyor: `similarity`
 * her çağrıda iki profil vektörü kurduğu için tam matris iki katı iş demekti.
 */
function spreadOf(ids: readonly string[]): { breadth: number; outlierId: string | null } {
  const perfumes = ids.map(getPerfume);
  const count = perfumes.length;

  const scores = Array.from({ length: count }, () => new Array<number>(count).fill(1));
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      const score = similarity(perfumes[i], perfumes[j]);
      scores[i][j] = score;
      scores[j][i] = score;
    }
  }

  let distance = 0;
  let pairs = 0;
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      distance += 1 - scores[i][j];
      pairs += 1;
    }
  }

  let outlierId: string | null = null;
  let lowest = Infinity;
  for (let i = 0; i < count; i += 1) {
    let sum = 0;
    for (let j = 0; j < count; j += 1) if (i !== j) sum += scores[i][j];

    const mean = sum / (count - 1);
    if (mean < lowest) {
      lowest = mean;
      outlierId = perfumes[i].id;
    }
  }

  return { breadth: pairs > 0 ? distance / pairs : 0, outlierId };
}

/** Burna en yakın, henüz işaretlenmemiş parfümler. */
function nextFor(nose: Perfume, exclude: readonly string[]): readonly string[] {
  const skip = new Set(exclude);

  return PERFUMES.filter((perfume) => !skip.has(perfume.id))
    .map((perfume) => ({ id: perfume.id, score: similarity(nose, perfume) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, NEXT_COUNT)
    .map((entry) => entry.id);
}
