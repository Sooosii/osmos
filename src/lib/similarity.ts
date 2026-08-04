import type { Perfume, ScentFamily, SpacePoint } from '@/data/types';
import { FAMILY_ORDER } from '@/data/families';
import { NOTES, getNote } from '@/data/notes';

/**
 * Benzerlik motoru — parfümlerin Koku Uzayı'ndaki konumu.
 *
 * Her parfüm ÜÇ KANALDAN okunuyor; üçü tek bir vektörde birleşiyor:
 *
 *   1. **Aile** — parfümün notaları `FAMILY_ORDER` sırasında 15 sayıya
 *      indirgeniyor. Her nota kendi aile ağırlıklarını kompozisyondaki
 *      `weight` kadar katıyor. Sorusu: hangi kokusal ailelere ait?
 *   2. **Karakter** — sıcaklık, doku, temizlik, yakınlık. Sorusu: nasıl bir şey?
 *   3. **Nota örtüşmesi** — hangi malzemelerden yapılmış? Sorusu budur ve
 *      diğer ikisinin cevaplayamadığı sorudur: `gourmand` tek bir kova, içinde
 *      vanilya da karamel de hindistan cevizi de var. İlk iki kanal için ananas
 *      ile kayısı "meyveli-tatlı-sıcak"tan ibaret; üçüncü kanal onları ayırıyor.
 *
 * Sonra kosinüs benzerliği — vektörün YÖNÜ karşılaştırılıyor, uzunluğu değil.
 * Bu bilinçli: 13 notalı Dryad ile tek notalı Not a Perfume'ün "hacmi" çok
 * farklı ama soru hacim değil, karakter. Uzunluğa bakılsaydı bütün kalabalık
 * parfümler birbirine yakın çıkardı.
 *
 * En sonda klasik MDS — kosinüs uzaklıkları 2 boyuta indiriliyor.
 *
 * ⚠️ Rastgelelik yok. Güç iterasyonunun başlangıç vektörü bile sabit tohumlu.
 * Aynı veri her zaman aynı koordinatı vermeli; aksi hâlde uzay her yenilemede
 * zıplar ve kullanıcının öğrendiği harita bozulur.
 */

/** Güç iterasyonu adım sayısı. 200 bu ölçekte fazlasıyla yeterli. */
const POWER_ITERATIONS = 200;

/**
 * Karakterin haritadaki ağırlığı — aile bloğu 1'e normalize edildiğinde
 * karakter bloğunun uzunluğu bu oluyor.
 *
 * 0 = yalnız aileler (ilk sürümün davranışı). Yükseltmek soğuk↔sıcak ve
 * temiz↔kirli ayrımını keskinleştirir; aynı aileden ama farklı karakterdeki
 * parfümleri ayırır. Aşırıya kaçarsa aile bilgisi bastırılır ve harita
 * okunmaz olur. Tek noktadan ayarlanır.
 */
const CHARACTER_WEIGHT = 0.7;

/**
 * Nota örtüşmesinin haritadaki ağırlığı — aile bloğu 1'e normalize edildiğinde
 * nota bloğunun uzunluğu bu oluyor.
 *
 * 0 = kanal kapalı. Yükseltmek benzerliği "aynı malzemelerden mi yapılmış"
 * sorusuna yaklaştırır; aşırıya kaçarsa harita bir malzeme listesi eşleştirmesine
 * dönüşür ve *farklı notalarla aynı etkiyi* kuran parfümler birbirini bulamaz —
 * oysa bir koku haritasının asıl işi budur. Denge noktası burada.
 */
const NOTE_WEIGHT = 0.8;

/** Sıfıra bölmeyi ve yönü kalmamış vektörleri elemek için eşik. */
const EPSILON = 1e-10;

/**
 * Nota kimliğinden sabit sütun numarası — nota vektörünün ekseni.
 *
 * `NOTES` sırası veri dosyalarından geliyor ve derleme anında sabit; aynı veri
 * her zaman aynı ekseni verir. (Aile ekseninin aksine bu sıranın *anlamı* yok:
 * komşu iki sütun akraba nota demek değil. Yalnızca kimliği sayıya çeviriyor.)
 */
const NOTE_INDEX = new Map(NOTES.map((note, index) => [note.id, index]));

/**
 * Parfümün 15 boyutlu aile vektörü.
 *
 * Örnek — Not a Perfume tek notalı (ambroksan): yalnızca birkaç hane dolu,
 * kalanı sıfır. Bu yüzden uzayda kimseye tutunamıyor.
 */
export function familyVector(perfume: Perfume): readonly number[] {
  const totals = new Map<ScentFamily, number>();

  for (const entry of perfume.notes) {
    const families = getNote(entry.noteId).families;
    for (const [family, share] of Object.entries(families) as [ScentFamily, number][]) {
      totals.set(family, (totals.get(family) ?? 0) + share * entry.weight);
    }
  }

  return FAMILY_ORDER.map((family) => totals.get(family) ?? 0);
}

/**
 * Parfümün dört karakter ekseni — notaların ağırlıklı ortalaması, her biri −1…+1.
 *
 * Ortalama alınıyor, toplam değil: karakter bir yön, bir miktar değil. On üç
 * notalı Dryad ile tek notalı Not a Perfume aynı ölçekte karşılaştırılabilsin diye.
 */
export function characterVector(perfume: Perfume): readonly number[] {
  let totalWeight = 0;
  const sums = [0, 0, 0, 0];

  for (const entry of perfume.notes) {
    const { temperature, texture, cleanliness, proximity } = getNote(entry.noteId).character;
    sums[0] += temperature * entry.weight;
    sums[1] += texture * entry.weight;
    sums[2] += cleanliness * entry.weight;
    sums[3] += proximity * entry.weight;
    totalWeight += entry.weight;
  }

  return totalWeight < EPSILON ? sums : sums.map((sum) => sum / totalWeight);
}

/**
 * Parfümün nota vektörü — her malzeme için kompozisyondaki ağırlığı, yoksa sıfır.
 *
 * Seyrek bir vektör: 123 hanenin ancak 8–13'ü dolu. Kosinüs tam da bunu istiyor —
 * iki parfümün çarpımı yalnızca ORTAK notalardan katkı alıyor, üstelik her biri
 * kendi ağırlığıyla. Ortak notası olmayan iki parfüm bu kanalda sıfır alır;
 * baskın notası aynı olan ikisi (şeftali 1.0 ↔ şeftali 1.0) yüksek alır.
 */
export function noteVector(perfume: Perfume): readonly number[] {
  const vector = new Array<number>(NOTE_INDEX.size).fill(0);

  for (const entry of perfume.notes) {
    const index = NOTE_INDEX.get(entry.noteId);
    if (index === undefined) {
      throw new Error(`Bilinmeyen nota: ${entry.noteId}`);
    }
    vector[index] = entry.weight;
  }

  return vector;
}

/** Vektörü verilen uzunluğa ölçekler. Bloklar arası dengeyi tek yerden kurar. */
function rescale(vector: readonly number[], target: number): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return norm < EPSILON ? [...vector] : vector.map((value) => (value / norm) * target);
}

/**
 * Karşılaştırmaya giren tam vektör: aileler + karakter + notalar.
 *
 * Karakter eksenleri −1…+1 arasında; kosinüs negatif değerlerle iyi çalışmıyor.
 * Bu yüzden her eksen iki negatif-olmayan yarıya bölünüyor — "soğuk" ve "sıcak"
 * ayrı boyut oluyor. Sonuç: zıt karakterler yalnızca *az benzer* değil, birbirine
 * dik. Gül ile deri artık aynı odunsu zeminde durmuyor.
 *
 * Üç blok ayrı ayrı normalize ediliyor ki aile vektörünün uzunluğu (kalabalık
 * parfümlerde büyük) diğerlerini ezmesin. Her blok sabit uzunlukta olduğu için
 * sonuçta çıkan benzerlik üç kanalın **ağırlıklı ortalaması** oluyor; ağırlıklar
 * 1 : CHARACTER_WEIGHT² : NOTE_WEIGHT². İki sabitten ayarlanır.
 */
function profileVector(perfume: Perfume): readonly number[] {
  const families = rescale(familyVector(perfume), 1);
  const character = characterVector(perfume).flatMap((value) => [
    Math.max(value, 0),
    Math.max(-value, 0),
  ]);

  return [
    ...families,
    ...rescale(character, CHARACTER_WEIGHT),
    ...rescale(noteVector(perfume), NOTE_WEIGHT),
  ];
}

/** İki vektörün kosinüs benzerliği. Bileşenler negatif olmadığı için hep 0–1. */
function cosine(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator < EPSILON ? 0 : dot / denominator;
}

/** İki parfümün benzerliği, 0 (ortak hiçbir şey yok) – 1 (aynı karakter). */
export function similarity(a: Perfume, b: Perfume): number {
  return cosine(profileVector(a), profileVector(b));
}

/** Sabit tohumlu başlangıç vektörü — rastgele görünür, her çalıştırmada aynıdır. */
function seededVector(size: number): number[] {
  let state = 1;
  return Array.from({ length: size }, () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296 - 0.5;
  });
}

interface Eigenpair {
  readonly value: number;
  readonly vector: readonly number[];
}

/** Simetrik matrisin baskın özdeğeri ve özvektörü — güç iterasyonuyla. */
function dominantEigenpair(matrix: readonly (readonly number[])[]): Eigenpair {
  const size = matrix.length;
  let vector = seededVector(size);

  for (let step = 0; step < POWER_ITERATIONS; step += 1) {
    const next = matrix.map((row) => row.reduce((sum, cell, j) => sum + cell * vector[j], 0));
    const norm = Math.sqrt(next.reduce((sum, value) => sum + value * value, 0));
    if (norm < EPSILON) return { value: 0, vector: new Array<number>(size).fill(0) };
    vector = next.map((value) => value / norm);
  }

  // Rayleigh bölümü: v'nin normu 1 olduğu için özdeğer doğrudan vᵀMv.
  const value = vector.reduce(
    (sum, vi, i) => sum + vi * matrix[i].reduce((rowSum, cell, j) => rowSum + cell * vector[j], 0),
    0,
  );

  return { value, vector };
}

/** Bulunan bileşeni matristen çıkarır ki bir sonraki iterasyon onu tekrar bulmasın. */
function deflate(matrix: readonly (readonly number[])[], pair: Eigenpair): number[][] {
  return matrix.map((row, i) =>
    row.map((cell, j) => cell - pair.value * pair.vector[i] * pair.vector[j]),
  );
}

/**
 * Çifte merkezleme — klasik MDS'in kalbi.
 *
 * Uzaklık matrisini, orijini veri bulutunun ağırlık merkezine taşınmış bir
 * iç çarpım matrisine çeviriyor. Özvektörleri doğrudan koordinat oluyor.
 */
function doubleCenter(squared: readonly (readonly number[])[]): number[][] {
  const size = squared.length;
  const rowMeans = squared.map((row) => row.reduce((sum, value) => sum + value, 0) / size);
  const grandMean = rowMeans.reduce((sum, value) => sum + value, 0) / size;

  return squared.map((row, i) =>
    row.map((value, j) => -0.5 * (value - rowMeans[i] - rowMeans[j] + grandMean)),
  );
}

/** Özdeğer × özvektör → eksen koordinatları. Negatif özdeğer = o eksen çökmüş. */
function axisFrom(pair: Eigenpair): number[] {
  const scale = Math.sqrt(Math.max(pair.value, 0));
  return pair.vector.map((value) => value * scale);
}

/** SMACOF yineleme sayısı ve durma eşiği. */
const SMACOF_ITERATIONS = 300;
const SMACOF_TOLERANCE = 1e-9;

/** Haritadaki uzaklıklarla gerçek uzaklıklar arasındaki toplam kare hata. */
function stressOf(
  coords: readonly (readonly number[])[],
  target: readonly (readonly number[])[],
): number {
  let sum = 0;
  for (let i = 0; i < coords.length; i += 1) {
    for (let j = i + 1; j < coords.length; j += 1) {
      const distance = Math.hypot(coords[i][0] - coords[j][0], coords[i][1] - coords[j][1]);
      sum += (distance - target[i][j]) ** 2;
    }
  }
  return sum;
}

/**
 * SMACOF — klasik MDS'in bıraktığı yalanı düzeltir.
 *
 * Klasik MDS doğrusal ve küresel: büyük uzaklıkları iyi korur, yerel yapıyı
 * ezer. Ölçüldü — Sel-Vanille ile Vanille Abricot'nun gerçek uzaklığı 0.29'ken
 * harita onları 0.007'ye yapıştırıyordu (%3), Not a Perfume ise "yapayalnız
 * durmalı" derken hiç benzemediği bir parfümün dibindeydi. İki boyuta sığmayan
 * fark, sığan boyutlardaki konumu da bozuyordu.
 *
 * SMACOF hedefi doğrudan kovalıyor: her adımda noktaları, ekrandaki uzaklıkları
 * gerçek uzaklıklara yaklaşacak şekilde çekiyor (Guttman dönüşümü). Birbirine
 * yapışmış ama aslında uzak olan çiftlerde itme kuvveti büyük olduğu için önce
 * onlar açılıyor.
 *
 * ⚠️ Rastgelelik yok: başlangıç klasik MDS çözümü, o da sabit tohumlu. Aynı veri
 * her zaman aynı haritayı veriyor.
 *
 * Ağırlıklar birim kabul edildiği için adım şu hâle iniyor:
 *   xᵢ ← (1/n) · Σⱼ≠ᵢ (δᵢⱼ / dᵢⱼ) · (xᵢ − xⱼ)
 * Bu dönüşüm ağırlık merkezini koruyor; başlangıç merkezli olduğu için harita
 * merkezli kalıyor.
 */
function refineBySmacof(
  initial: readonly (readonly number[])[],
  target: readonly (readonly number[])[],
): number[][] {
  const count = initial.length;
  let coords = initial.map((point) => [...point]);
  let stress = stressOf(coords, target);

  for (let step = 0; step < SMACOF_ITERATIONS; step += 1) {
    const next: number[][] = [];

    for (let i = 0; i < count; i += 1) {
      let x = 0;
      let y = 0;

      for (let j = 0; j < count; j += 1) {
        if (i === j) continue;
        const dx = coords[i][0] - coords[j][0];
        const dy = coords[i][1] - coords[j][1];
        const distance = Math.hypot(dx, dy);
        // Üst üste düşmüş iki nokta için yön tanımsız; katkısı atlanıyor.
        // Bir sonraki adımda komşularının ittirmesiyle zaten ayrılıyorlar.
        if (distance < EPSILON) continue;

        const ratio = target[i][j] / distance;
        x += ratio * dx;
        y += ratio * dy;
      }

      next.push([x / count, y / count]);
    }

    coords = next;

    const updated = stressOf(coords, target);
    if (stress - updated < SMACOF_TOLERANCE) break;
    stress = updated;
  }

  return coords;
}

/**
 * Parfümleri Koku Uzayı'na yerleştirir.
 *
 * x ve y **aynı** çarpanla ölçekleniyor. Ayrı ayrı normalize edilseydi harita
 * gerilir ve uzaklıklar yalan söylerdi — bütün mesele uzaklık olduğu için bu
 * kabul edilemez. Sonuç [−1, 1] karesine sığar; ekrana uydurmak çizim katmanının işi.
 *
 * `depth` üçüncü bileşenden geliyor: 2 boyuta sığmayan farkın nereye gittiği.
 * Parallax hızını ve nokta boyutunu bu belirleyecek.
 */
export function projectToSpace(perfumes: readonly Perfume[]): readonly SpacePoint[] {
  const count = perfumes.length;
  if (count === 0) return [];
  if (count < 3) {
    // MDS en az üç noktayla anlamlı. Altında düz bir sıra yeterli.
    return perfumes.map((perfume, index) => ({
      perfumeId: perfume.id,
      x: count === 1 ? 0 : index * 2 - 1,
      y: 0,
      depth: 0.5,
    }));
  }

  const vectors = perfumes.map(profileVector);

  // Hedef uzaklıklar: kosinüs uzaklığı. Klasik MDS kareliyle, SMACOF ham hâliyle çalışıyor.
  const distances = vectors.map((a) => vectors.map((b) => 1 - cosine(a, b)));
  const squared = distances.map((row) => row.map((value) => value * value));

  const centered = doubleCenter(squared);
  const first = dominantEigenpair(centered);
  const afterFirst = deflate(centered, first);
  const second = dominantEigenpair(afterFirst);
  const third = dominantEigenpair(deflate(afterFirst, second));

  const xs = axisFrom(first);
  const ys = axisFrom(second);
  const zs = axisFrom(third);

  // Klasik çözüm yalnızca başlangıç; haritayı SMACOF sonlandırıyor.
  const coords = refineBySmacof(
    xs.map((x, index) => [x, ys[index]]),
    distances,
  );

  // x ve y AYNI çarpanla ölçekleniyor. Ayrı ayrı normalize edilseydi harita
  // gerilir ve uzaklıklar yalan söylerdi — bütün mesele uzaklık olduğu için
  // bu kabul edilemez.
  const spread = Math.max(...coords.flatMap(([x, y]) => [Math.abs(x), Math.abs(y)]), EPSILON);
  const depthLow = Math.min(...zs);
  const depthRange = Math.max(...zs) - depthLow;

  return perfumes.map((perfume, index) => ({
    perfumeId: perfume.id,
    x: coords[index][0] / spread,
    y: coords[index][1] / spread,
    depth: depthRange < EPSILON ? 0.5 : (zs[index] - depthLow) / depthRange,
  }));
}

/** Bir parfümün en yakın komşuları — benzerliğe göre sıralı. Doğrulamanın asıl aracı. */
export function nearestNeighbors(
  perfume: Perfume,
  pool: readonly Perfume[],
  count: number,
): readonly { readonly perfume: Perfume; readonly score: number }[] {
  return pool
    .filter((candidate) => candidate.id !== perfume.id)
    .map((candidate) => ({ perfume: candidate, score: similarity(perfume, candidate) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}
