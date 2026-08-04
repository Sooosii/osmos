/**
 * Komşu takımyıldızının geometrisi — üç boyutlu, sürekli dönen.
 *
 * `space-approach.ts` ve `evolution-loop.ts` ile aynı sözleşme: React, DOM, SVG
 * bilmiyor ve hiçbir şey import etmiyor — tek başına okunup sınanabiliyor. Depoda
 * `vitest.config.*` olmadığı için `@/` takma adı sınamalarda çözülmüyor; bu şart
 * kolaylık değil zorunluluk.
 *
 * ## Üçüncü boyut süs değil, veri
 *
 * İki eksen zaten doluydu: yarıçap benzerlik, açı ayrışma. Dikey eksene
 * `projectToSpace`in ürettiği **`depth`** kondu — haritanın iki boyuta
 * sığdıramadığı üçüncü bileşen, bugüne kadar hiçbir yerde kullanılmıyordu.
 *
 * Bu seçim daha önce ölçtüğümüz gerilimin tam karşılığı: benzerlik sıralamasıyla
 * haritadaki yakınlık 44 parfümde ortalama 3.16/5 örtüşüyordu. Sebebi buydu —
 * kaybolan üçüncü bileşen. Takımyıldız dönerken o kaybı geri veriyor: bir komşu
 * yakın görünüp derinlikte uzak durabiliyor ve dönüş bunu gösteriyor.
 *
 * Yani eğim sahte bir 3B efekti değil; perspektif gerçek, yükseklik gerçek veri.
 *
 * ## Konumlar neden uzaydaki gerçek yerler değil
 *
 * Karar geçmişi uzun ve `docs/superpowers/specs/2026-08-04-uzaydaki-komsular-design.md`
 * içinde. Kısası: "en benzeyen en yakında dursun" garantisi ile gerçek konumlar
 * aynı anda mümkün değildi, sahip garantiyi seçti. Gerçek konumlara döndürmeden
 * önce o dosyayı oku.
 */

/** SVG'nin iç koordinat genişliği; ekranda `width:100%` ile esniyor. */
export const VIEW_WIDTH = 420;
export const VIEW_HEIGHT = 280;

export const CENTER_X = VIEW_WIDTH / 2;
export const CENTER_Y = VIEW_HEIGHT / 2;

/**
 * Etiket için noktanın yanında ayrılan yer.
 *
 * Veri setindeki en uzun ad "Miami Tropical Confessions" (26 karakter) ve yanına
 * bir de yüzde geliyor. Tahminle konmadı: yarıçapları büyütürken asıl taşan şeyin
 * nokta değil ad olduğu sınamayla yakalandı, sabit de o sınamanın ölçüsü.
 */
export const LABEL_RESERVE = 78;

/** En benzeyen komşunun yarıçapı. Merkez çekirdeğine değmeyecek kadar dışarıda. */
const RADIUS_MIN = 52;

/**
 * En uzak komşunun yarıçapı.
 *
 * Sınırı belirleyen şey nokta değil etiket: perspektif öndekini büyütüyor, adın
 * dış kenarı da `LABEL_RESERVE` kadar uzağa düşüyor. Buradan yükseltilirse
 * `projectSeat` sınaması taşmayı yakalar.
 */
const RADIUS_MAX = 96;

/** Bu benzerliğin altındaki komşu en dışarıda; altı artık ayrışmıyor. */
const WEAKEST_SCORE = 0.4;

/**
 * Derinlik farkının dikeydeki karşılığı.
 *
 * `depth` bütün küme boyunca 0–1'e normalleniyor (`similarity.ts:388`), yani iki
 * komşu arasındaki fark çoğu zaman 0.2–0.5 bandında kalıyor. Küçük bir katsayıyla
 * dikey ayrışma birkaç piksele düşüyor ve üçüncü boyut hiç okunmuyordu.
 */
const HEIGHT_SCALE = 62;

/**
 * Kameranın aşağı bakış açısı.
 *
 * Sıfır olsaydı yatay çember ekranda düz bir çizgiye çöker, derinlik hiç
 * okunmazdı. Fazlası tepeden bakışa döner ve dönüş hissi kaybolur.
 */
const PITCH = 0.42;

/** Perspektifin sertliği; büyüdükçe izdüşüm ortogonale yaklaşır. */
const FOCAL = 480;

export interface OrbitNeighbor {
  readonly id: string;
  /** `similarity()` skoru, 0–1. Yarıçap doğrudan bundan geliyor. */
  readonly score: number;
  /** `projectToSpace`ten gelen derinlik katmanı, 0–1. */
  readonly depth: number;
}

/** Komşunun dönmeyen yeri: açı, yarıçap, yükseklik. Parfüm başına bir kez. */
export interface OrbitSeat {
  readonly id: string;
  readonly angle: number;
  readonly radius: number;
  readonly height: number;
}

/** Koltuğun belirli bir dönüş anındaki ekran karşılığı. */
export interface OrbitNode {
  readonly x: number;
  readonly y: number;
  /** Perspektif büyütmesi; öndeki 1'in üstünde, arkadaki altında. */
  readonly scale: number;
  /** Kameraya göre derinlik; büyükse uzakta. Çizim sırası buna göre. */
  readonly z: number;
  /** Öndekini parlatan, arkadakini söndüren katsayı, 0–1. */
  readonly fade: number;
  readonly anchor: 'start' | 'end';
}

/**
 * Benzerlikten yarıçap.
 *
 * Mutlak skor kullanılıyor, kümenin içindeki sıralama değil. Böylece yarıçap
 * parfümler arasında da anlam taşıyor: komşuları zayıf olan bir parfümün
 * takımyıldızı geniş açılıyor, sıkı bir kümenin ortasındakinin dar kalıyor.
 * Sıralamaya göre normalleştirseydik her sayfada en benzeyen aynı mesafede durur,
 * "ne kadar" bilgisi kaybolurdu.
 */
function radiusFor(score: number): number {
  const t = Math.min(Math.max((1 - score) / (1 - WEAKEST_SCORE), 0), 1);
  return RADIUS_MIN + t * (RADIUS_MAX - RADIUS_MIN);
}

/**
 * Komşuları merkezin çevresine oturtur.
 *
 * Açılar eşit bölünüyor: tek yöne dizilselerdi liste olurdu, oysa istenen çember.
 * Yükseklik merkeze göre **fark**, mutlak derinlik değil — merkezle aynı katmanda
 * duran komşu tam düzlemde kalsın diye.
 */
export function orbitSeats(
  neighbors: readonly OrbitNeighbor[],
  centerDepth: number,
): readonly OrbitSeat[] {
  if (neighbors.length === 0) return [];

  const sorted = [...neighbors].sort((a, b) => b.score - a.score);
  const step = (Math.PI * 2) / sorted.length;

  return sorted.map((neighbor, index) => ({
    id: neighbor.id,
    angle: index * step,
    radius: radiusFor(neighbor.score),
    height: (neighbor.depth - centerDepth) * HEIGHT_SCALE,
  }));
}

/** Yatay düzlemdeki bir noktanın ekran karşılığı. */
function project(x: number, y: number, z: number) {
  // Kamera eğimi: düzlem ekranda elips olarak görünsün diye.
  const y1 = y * Math.cos(PITCH) - z * Math.sin(PITCH);
  const z1 = y * Math.sin(PITCH) + z * Math.cos(PITCH);

  const scale = FOCAL / (FOCAL + z1);
  return { x: CENTER_X + x * scale, y: CENTER_Y + y1 * scale, scale, z: z1 };
}

/** Koltuğun `phase` kadar dönmüş hâli. */
export function projectSeat(seat: OrbitSeat, phase: number): OrbitNode {
  const angle = seat.angle + phase;
  const projected = project(
    Math.cos(angle) * seat.radius,
    seat.height,
    Math.sin(angle) * seat.radius,
  );

  // Ölçek 1 civarında salınıyor; onu 0–1 aralığına açıp sönümleme katsayısı yapıyoruz.
  const fade = Math.min(Math.max((projected.scale - 0.78) / 0.5, 0), 1);

  return {
    x: projected.x,
    y: projected.y,
    scale: projected.scale,
    z: projected.z,
    fade,
    // Sağ yarıdaki etiket sola yaslı yazılsa çerçevenin dışına taşardı.
    anchor: projected.x >= CENTER_X ? 'start' : 'end',
  };
}

/**
 * Merkez parfümün derinlik düzlemi — sessiz bir ufuk çizgisi.
 *
 * Tek işi referans olmak: komşunun bu halkanın üstünde mi altında mı durduğu,
 * o parfümün bundan daha derin mi yüzeysel mi olduğunu söylüyor. Halka olmadan
 * dikey kayma yalnızca bir dağınıklık gibi okunuyordu.
 *
 * Dönmüyor: kendi ekseni etrafında dönen bir çember değişmez, o yüzden bir kez
 * hesaplanıp öylece duruyor.
 */
export function horizonPath(samples = 72): string {
  let d = '';
  for (let i = 0; i < samples; i += 1) {
    const angle = (i / samples) * Math.PI * 2;
    const point = project(
      Math.cos(angle) * RADIUS_MAX,
      0,
      Math.sin(angle) * RADIUS_MAX,
    );
    d += `${i === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)} `;
  }
  return `${d}Z`;
}
