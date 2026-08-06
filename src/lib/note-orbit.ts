import {
  fadeFromScale,
  projectPoint,
  type OrbitCamera,
} from './orbit-projection';

/**
 * Nota takımyıldızının geometrisi — merkezde nota, çevresinde onu içeren parfümler.
 *
 * `neighbor-orbit.ts`in kardeşi ve aynı kamerayı kullanıyor (`orbit-projection.ts`),
 * ama başka bir soruyu cevaplıyor. Orada merkezdeki parfüme **benzeyenler** döner;
 * burada notayı **içerenler**.
 *
 * Modül saf: React, DOM, canvas bilmiyor. Depoda `vitest.config.*` olmadığı için
 * `@/` takma adı sınamalarda çözülmüyor; bu şart kolaylık değil zorunluluk.
 *
 * ## Yarıçap ters
 *
 * Komşu takımyıldızında yarıçap benzerlikten geliyor ve **düşük skor dışarı**
 * itiyor. Burada yarıçap ağırlıktan geliyor ve mantık aynı yöne bakıyor: notanın
 * baskın olduğu parfüm merkeze **yakın**, iz hâlinde geçtiği parfüm uzakta.
 * "Yakınlık = o parfümde bu nota ne kadar var" tek cümlede okunabiliyor.
 *
 * ## Sayı değişken ve bu bilgi
 *
 * Komşu takımyıldızında hep üç nokta var. Burada 1 ile 26 arası: `sandalwood`
 * 26 parfümde geçiyor, `dorayaki` bir tanesinde. **Kalabalık kusur değil, o
 * notanın paletteki ağırlığının ta kendisi** — o yüzden hepsi çiziliyor, ilk N
 * değil. Okunurluk etiketlerden çözülüyor (`LABEL_FADE_MIN`): yalnızca öne dönmüş
 * olanların adı yazılıyor, arkadakiler sönerken adları da siliniyor.
 *
 * Bu aynı zamanda iki takımyıldızı birbirinden ayıran ikinci şey; birincisi doku
 * (orası pürüzsüz SVG, burası tram noktaları).
 */

/**
 * Tuvalin iç koordinat ölçüsü; ekranda `width:100%` ile esniyor.
 *
 * Yükseklik içeriğe göre kısıldı. 420'yken yörünge tuvalin ortasında duruyor,
 * üstünde ve altında yüz pikselden fazla boşluk kalıyordu — ekranda başlıkla
 * yörünge arasında bir kopukluk gibi okundu.
 *
 * ⚠️ **Kamera dikeyde ORTADA DEĞİL** ve bu bilinçli. Eğik bir halkanın izdüşümü
 * simetrik değil: yakın yarısı hem aşağı düşüyor hem perspektifle büyüyor, uzak
 * yarısı yukarı çıkarken küçülüyor. Kamerayı kutunun ortasına koyunca üstte 42
 * piksel ölü alan kalıyor, alttan ise taşıyordu — 306'da en alttaki adlar
 * kırpılıyordu (mutlak en kötü hâl ölçüldü: y ∈ 41.6 – 319.6).
 *
 * Bu yüzden `CENTER_Y` yüksekliğin yarısı değil, içeriği kutuya oturtan değer.
 * Kalan pay üstte ve altta ~9 piksel; ikisini de taşma sınaması denetliyor.
 * Kamera açısı, yarıçaplar ve `HEIGHT_SCALE` değişirse bu iki sayı yeniden
 * ölçülmeli — tahminle konmadılar.
 */
export const VIEW_WIDTH = 560;
export const VIEW_HEIGHT = 296;

export const CENTER_X = VIEW_WIDTH / 2;
export const CENTER_Y = 120;

/**
 * Notanın baskın olduğu parfümün yarıçapı.
 *
 * Merkezdeki notanın tram diskine değmeyecek kadar dışarıda: disk yarıçapı
 * `NOTE_RADIUS`, etiketi de altına düşüyor.
 */
const RADIUS_MIN = 84;

/**
 * İz hâlinde geçtiği parfümün yarıçapı.
 *
 * Sınırı belirleyen şey nokta değil etiket: perspektif öndekini büyütüyor ve adın
 * dış kenarı `LABEL_HALF_WIDTH` kadar uzağa düşüyor. Buradan yükseltilirse taşma
 * sınaması yakalar.
 */
const RADIUS_MAX = 196;

/**
 * Bu ağırlığın altındaki parfüm en dışarıda.
 *
 * Veride en düşük ağırlık 0.2 civarında; sınırı 0.15'e koymak en hafif notanın
 * bile tam dışarı yapışmasını engelliyor.
 */
const WEAKEST_WEIGHT = 0.15;

/**
 * Derinlik farkının dikeydeki karşılığı.
 *
 * `depth` bütün küme boyunca 0–1'e normalleniyor (`similarity.ts`), yani iki
 * parfüm arasındaki fark çoğu zaman dar bir bantta kalıyor. Küçük bir katsayıyla
 * dikey ayrışma birkaç piksele düşer ve üçüncü boyut hiç okunmazdı.
 */
const HEIGHT_SCALE = 96;

/**
 * Yüksekliğin ölçüldüğü düzlem.
 *
 * Komşu takımyıldızında referans merkez parfümün kendi derinliğiydi. Burada
 * merkezde bir **nota** var ve notanın `depth`i yok — derinlik parfüm düzeyinde
 * hesaplanan bir büyüklük. Bu yüzden referans kümenin ortası: 0.5.
 */
const DEPTH_MID = 0.5;

/** Yörünge düzleminin dikliği. Komşu takımyıldızıyla aynı dünya. */
const PITCH = 0.42;

/**
 * Perspektifin sertliği.
 *
 * Komşulardaki 480'den büyük, çünkü yarıçap aralığı burada iki kattan geniş
 * (84–196 ↔ 52–96). Aynı odakla en dıştaki nokta öne döndüğünde aşırı büyüyor,
 * arkaya geçtiğinde iğne başına iniyordu; sınama ölçek aralığını denetliyor.
 */
const FOCAL = 620;

const CAMERA: OrbitCamera = {
  pitch: PITCH,
  focal: FOCAL,
  centerX: CENTER_X,
  centerY: CENTER_Y,
};

/** Merkezdeki notanın tram diskinin yarıçapı. */
export const NOTE_RADIUS = 46;

/**
 * Adın yarı genişliği — etiket noktanın üstünde ORTALANIYOR.
 *
 * Komşu takımyıldızının kararı burada da geçerli (`neighbor-orbit.ts`): yana
 * yaslamak, nokta merkezin öbür yanına geçtiği anda adı bir taraftan diğerine
 * sıçratıyor. Ortalamak yanı tamamen ortadan kaldırıyor.
 *
 * Buradaki adlar komşulardakinden uzun: marka değil yalnızca parfüm adı yazılsa
 * bile "Every Storm a Serenade" 23 karakter. Değer tahminle konmadı; taşma
 * sınaması denetliyor.
 */
export const LABEL_HALF_WIDTH = 62;

/** Adın noktanın ne kadar üstüne (ya da altına) yazıldığı. */
export const LABEL_RISE = 13;

/**
 * Parfüm diskinin yarıçapı — boy, ağırlığı İKİNCİ kez anlatıyor.
 *
 * Yarıçap zaten ağırlıktan geliyor (`radiusFor`), ama dönen bir sahnede "hangisi
 * merkeze yakın" tek başına zor okunuyor. Baskın nota daha büyük bir disk olunca
 * hiyerarşi ada bakmadan görülüyor.
 *
 * Burada duruyor çünkü ETİKETİN yeri de buna bağlı: ad diskin üstünden veya
 * altından `LABEL_RISE` kadar uzağa yazılıyor. Bileşende kalsaydı yerleştirme
 * sınaması aynı formülü ikinci kez yazmak zorunda kalır, ikisi sessizce ayrışırdı.
 */
const DISC_BASE = 7;
const DISC_WEIGHT_GAIN = 9;

export function discRadius(weight: number, scale: number): number {
  return (DISC_BASE + weight * DISC_WEIGHT_GAIN) * scale;
}

/**
 * Adın yazılması için gereken en düşük sönümleme.
 *
 * ⚠️ Bu eşik yığılmayı ÖNLEMİYOR — onu çizimdeki **çakışma denetimi** yapıyor
 * (`NoteOrbit.tsx`): adlar öne çıkma sırasına göre yazılıyor ve daha önce
 * yazılmış bir kutuya değen atlanıyor. Buranın tek işi, arkaya tamamen dönmüş
 * bir noktanın adını sönerken kapatmak.
 *
 * Değer üç turda buraya indi. Önce 0.55: eşiğe yığılmayı önletmeye çalışıldı,
 * beceremedi, sandal gibi 26 parfümlü bir notada on bir ad iç içe geçti. Sonra
 * 0.82 + "yalnızca en öndeki konuşur": yığılma bitti ama bu sefer ad yalnızca dar
 * bir yayda göründü ("arkaya gittikten sonra gelene kadar çok vakit geçiyor").
 * Sahip son biçimi söyledi: hepsi görünsün ama dağınık olmasın.
 *
 * Çakışma denetimi ikisini birden veriyor, dolayısıyla eşik artık serbest kalıp
 * yalnızca en arkadakini eleyebiliyor.
 */
export const LABEL_FADE_MIN = 0.12;

/** Notayı içeren bir parfüm — yörüngeye oturacak ham veri. */
export interface NoteCarrier {
  readonly id: string;
  /** Notanın o parfümdeki ağırlığı, 0–1. Yarıçap doğrudan bundan geliyor. */
  readonly weight: number;
  /** `projectToSpace`ten gelen derinlik katmanı, 0–1. */
  readonly depth: number;
}

/** Parfümün dönmeyen yeri: açı, yarıçap, yükseklik. Nota başına bir kez. */
export interface NoteSeat {
  readonly id: string;
  readonly angle: number;
  readonly radius: number;
  readonly height: number;
}

/** Koltuğun belirli bir dönüş anındaki ekran karşılığı. */
export interface NoteNode {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly z: number;
  /** Öndekini parlatan, arkadakini söndüren katsayı, 0–1. */
  readonly fade: number;
}

/**
 * Ağırlıktan yarıçap — ağır olan merkeze yakın.
 *
 * Mutlak ağırlık kullanılıyor, kümenin içindeki sıralama değil. Böylece yarıçap
 * notalar arasında da anlam taşıyor: her yerde iz hâlinde geçen bir notanın
 * takımyıldızı bütünüyle geniş açılıyor, birkaç parfüme omurga olan bir notanınki
 * merkeze toplanıyor. Sıralamaya göre normalleştirseydik her nota sayfasında en
 * ağır parfüm aynı mesafede durur, "ne kadar" bilgisi kaybolurdu.
 */
function radiusFor(weight: number): number {
  const t = Math.min(Math.max((1 - weight) / (1 - WEAKEST_WEIGHT), 0), 1);
  return RADIUS_MIN + t * (RADIUS_MAX - RADIUS_MIN);
}

/**
 * Parfümleri notanın çevresine oturtur.
 *
 * Açılar eşit bölünüyor ve sıralama ağırlığa göre — ikisi birlikte kalabalık
 * notalarda ağır olanların yörüngede kümelenmesini engelliyor, çünkü art arda
 * gelen ağırlıklar art arda gelen açılara düşüyor.
 */
export function noteSeats(carriers: readonly NoteCarrier[]): readonly NoteSeat[] {
  if (carriers.length === 0) return [];

  const sorted = [...carriers].sort((a, b) => b.weight - a.weight);
  const step = (Math.PI * 2) / sorted.length;

  return sorted.map((carrier, index) => ({
    id: carrier.id,
    angle: index * step,
    radius: radiusFor(carrier.weight),
    height: (carrier.depth - DEPTH_MID) * HEIGHT_SCALE,
  }));
}

/** Koltuğun `phase` kadar dönmüş hâli. */
export function projectSeat(seat: NoteSeat, phase: number): NoteNode {
  const angle = seat.angle + phase;
  const projected = projectPoint(
    Math.cos(angle) * seat.radius,
    seat.height,
    Math.sin(angle) * seat.radius,
    CAMERA,
  );

  return {
    x: projected.x,
    y: projected.y,
    scale: projected.scale,
    z: projected.z,
    // Eşik ve genişlik komşulardakinden farklı: yarıçap aralığı geniş olduğu için
    // ölçek salınımı da geniş. Değerler sınamayla sabitlendi.
    fade: fadeFromScale(projected.scale, 0.74, 0.52),
  };
}

/**
 * Yörünge düzlemi — sessiz bir ufuk halkası.
 *
 * Tek işi referans olmak: parfümün bu halkanın üstünde mi altında mı durduğu,
 * o parfümün kümenin ortasından daha derin mi yüzeysel mi olduğunu söylüyor.
 * Halka olmadan dikey kayma yalnızca dağınıklık gibi okunuyor.
 *
 * Dönmüyor — kendi ekseni etrafında dönen bir çember değişmez.
 */
export function horizonRing(radius: number, samples = 96): readonly ProjectedRingPoint[] {
  const points: ProjectedRingPoint[] = [];
  for (let i = 0; i < samples; i += 1) {
    const angle = (i / samples) * Math.PI * 2;
    const point = projectPoint(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius,
      CAMERA,
    );
    points.push({ x: point.x, y: point.y });
  }
  return points;
}

export interface ProjectedRingPoint {
  readonly x: number;
  readonly y: number;
}

/** Ufuk halkalarının yarıçapları — en içteki ve en dıştaki yörüngeyi çerçeveler. */
export const HORIZON_RADII: readonly number[] = [RADIUS_MIN, (RADIUS_MIN + RADIUS_MAX) / 2, RADIUS_MAX];
