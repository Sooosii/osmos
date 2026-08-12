import type { SpaceMark } from '@/data/types';

/**
 * Koku Uzayı'nın kamerası — dünya koordinatı ↔ ekran pikseli.
 *
 * React'e, canvas'a, DOM'a bağımlılığı yok; hepsi saf fonksiyon. Ayrı durmasının
 * sebebi: çizim bileşeni olay yönetimiyle dolu, koordinat dönüşümü orada
 * kaybolursa bir daha kimse doğrulayamaz. Buradaki her fonksiyon tek başına
 * okunup sınanabilir.
 *
 * **Dünya**: MDS çıktısı, [−1, 1] karesi. y YUKARI artar (matematik yönü).
 * **Ekran**: CSS pikseli, sol üst köşe orijin, y AŞAĞI artar. Dönüşüm y'yi ters çeviriyor.
 */

/**
 * Bulutun etrafında bırakılan kenar payı. 1.12 = %12 nefes alanı.
 *
 * Eskiden burada `VIEW = 1.12` diye tek bir sabit vardı ve ölçek **kısa kenara**
 * göre alınıyordu: harita her ekrana sığıyordu ama 1440×900'de genişliğin
 * yalnızca %49'unu dolduruyordu — solda 424, sağda 315 piksel boş.
 *
 * Sabiti küçültmek görünürde çözümdü, gerçekte değil: bulut x ekseninde tam
 * 1.0'a kadar uzanıyor (ölçüldü: x −0.72…1.00, y −0.83…0.84), dolayısıyla
 * 0.85'e indirmek kare-ye yakın ekranlarda kenardaki parfümleri ekranın dışına
 * atıyordu. Çerçeveyi sıkmak ile haritayı kırpmak aynı sabite bağlıydı.
 *
 * Şimdi ölçek sabit bir kutuya değil **bulutun gerçek sınırlarına** oturuyor
 * (bkz. `pixelsPerUnit`): hangi ekran olursa olsun bulut tam sığıyor ve boşluk
 * yalnızca payın kendisi kadar kalıyor.
 */
const MARGIN = 1.12;

/**
 * Portre ekranlarda çerçeveyi dikeye doğru açan pay.
 *
 * ⚠️ **Ölçülerek kondu** (2026-08-11, 390×844): bulut ekranın yalnızca **%36**
 * 'sını kaplıyordu — masaüstünde %91. Sebep süs değil geometri: bulut kareye
 * yakın (x ±1.0, y ±0.84), telefon ise iki kattan uzun. Ölçek iki eksenin
 * **küçüğüne** oturduğu için telefonda genişlik sınırlıyor ve dikeyde ekranın
 * üçte ikisi boş kalıyordu — noktalar da o oranda küçülüyordu, dokunması zor.
 *
 * `PORTRAIT_RATIO`: bu orandan uzun ekranlar portre sayılıyor. 1.6, tabletin
 * (4:3 ≈ 1.33) dışında, telefonun (≈2.1) içinde kalıyor.
 *
 * `PORTRAIT_FILL`: açılımın tavanı. Bedeli bilinçli ve sınırlı — en kenardaki
 * birkaç parfüm durağan görünümde ekranın dışında kalıyor, sürükleyince
 * geliyor. Harita zaten sürüklenebilir ve giriş metni bunu söylüyor
 * ("Drag, zoom, touch a point"). Tavan olmadan bulut ekranı taşardı;
 * `space-camera.test.ts` iki ucu da tutuyor.
 *
 * ⚠️ Bu yalnızca **oturtma** ölçeğini değiştiriyor, kameranın `scale`ını değil:
 * yakınlaşma, kaydırma ve `FOCUS_SCALE` aynı sayıları görmeye devam ediyor.
 */
const PORTRAIT_RATIO = 1.6;
const PORTRAIT_FILL = 1.45;

/**
 * Kameranın gidebileceği en uzak dünya noktası. **Bilerek `VIEW`'dan bağımsız.**
 *
 * Eskiden ikisi tek sabitti; çerçeveyi sıkmak için `VIEW`'ı düşürmek kaydırma
 * sınırını da daraltıyordu. Sonucu görünmez ama ciddi: bulutun kenarındaki bir
 * parfüm dünya biriminde ±1.0'a kadar çıkıyor ve `centerOn` onu parallax'a
 * bölüyor (±1/0.9 ≈ ±1.11). Sınır 0.85 olsaydı bu değer kırpılır, kenardaki
 * parfümler ekranın ortasına hiç gelemezdi — klavye yolu da sessizce bozulurdu.
 *
 * Bu yüzden sınır, bulut yarıçapı (1.0) + en yavaş parallax'ın payı kadar geniş
 * kalıyor. Çerçeve ayarı artık kaydırmaya dokunmuyor.
 */
const PAN_LIMIT = 1.12;

export const MIN_SCALE = 0.6;
export const MAX_SCALE = 6;

/**
 * Bir parfüm seçilince kameranın ineceği yakınlık.
 *
 * 2.4: komşu çizgileri hâlâ ekranda kalıyor ("şu, şuna benziyor" okuması
 * bozulmuyor) ama seçilen nokta artık uzak bir toz tanesi değil. Daha yükseği
 * komşuları ekran dışına atıyor, daha düşüğü yaklaşma hissi vermiyor.
 */
export const FOCUS_SCALE = 2.4;

/**
 * Derinlik parallax'ı — kaydırırken yakın noktalar hızlı, uzaktakiler yavaş kayar.
 *
 * ⚠️ Bant bilerek dar (0.9–1.1). Uzayın bütün iddiası "mesafe = benzemezlik";
 * agresif parallax noktaları birbirine göre oynatır ve harita yalan söylemeye
 * başlar. Buradaki miktar derinliği *hissettirmeye* yetecek kadar, haritayı
 * bozmayacak kadar az.
 *
 * Parallax yalnızca KAYDIRMA ofsetine uygulanıyor, noktanın kendi konumuna
 * değil: kamera başlangıçtayken (x=y=0) harita tam olarak MDS'in söylediği harita.
 */
const PARALLAX_MIN = 0.9;
const PARALLAX_RANGE = 0.2;

/** Nokta yarıçapı (CSS pikseli) — derinlikle bu aralıkta değişiyor. */
const RADIUS_MIN = 3.4;
const RADIUS_RANGE = 4.6;

/**
 * Yakınlaşmayla yarıçap `scale^RADIUS_ZOOM_EXPONENT` kadar büyüyor.
 *
 * 1 olsaydı 6 kat yakınlaşmada noktalar 6 kat şişip lekeye dönerdi; 0 olsaydı
 * yakınlaşma noktaları yalnızca birbirinden uzaklaştırır, hiç yaklaşmazdı.
 * Karekök ikisinin arası.
 */
const RADIUS_ZOOM_EXPONENT = 0.5;

/** Vuruş alanı çizimden bu kadar geniş — dokunmatikte 7 px'lik nokta ıskalanıyor. */
const HIT_PADDING = 8;

/**
 * Parmağın payı.
 *
 * 8 px imleç için ölçülmüştü; parmağın temas alanı bir imlecin ucu değil.
 * En küçük nokta 3.4 px yarıçapla çiziliyor, yani dokunma hedefi 18 px payla
 * ~43 px çapa çıkıyor — platformların istediği 44 px'in sınırında.
 *
 * ⚠️ Geniş pay hangi noktanın kazandığını DEĞIŞTIRMIYOR: kazanan
 * `distance - radius` ile seçiliyor, yani pay yalnızca aday kümesini büyütüyor.
 * Üst üste binen iki noktada yine yakın olan kazanıyor.
 */
export const TOUCH_HIT_PADDING = 18;

export interface Camera {
  /** Ekranın ortasına denk gelen dünya noktası (parallax'sız taban düzlemde). */
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

export interface Viewport {
  readonly width: number;
  readonly height: number;
  /**
   * Nokta bulutunun yarı genişliği ve yarı yüksekliği (dünya birimi).
   *
   * Ölçek bunlardan hesaplanıyor, sabitten değil: 52 parfümlük bulut 250'ye
   * çıktığında ya da izdüşüm değiştiğinde çerçeveleme kendiliğinden uyuyor.
   * Elle güncellenecek bir sayı bırakmamak için burada duruyor — sınırları
   * zaten elinde tutan tek yer çizim bileşeni.
   */
  readonly halfX: number;
  readonly halfY: number;
}

/**
 * Bulutun sınırlarını nokta listesinden çıkarır.
 *
 * Sıfıra karşı korumalı: tek noktalı (ya da boş) bir listede yarı genişlik 0
 * çıkar ve `pixelsPerUnit` sonsuza giderdi.
 */
export function boundsOf(points: readonly Placed[]): { halfX: number; halfY: number } {
  let halfX = 0;
  let halfY = 0;
  for (const point of points) {
    halfX = Math.max(halfX, Math.abs(point.x));
    halfY = Math.max(halfY, Math.abs(point.y));
  }

  return { halfX: halfX || 1, halfY: halfY || 1 };
}

export interface ScreenPoint {
  readonly sx: number;
  readonly sy: number;
}

/** Konumu ve derinliği olan her şey — `SpaceMark` bunu karşılıyor. */
interface Placed {
  readonly x: number;
  readonly y: number;
  readonly depth: number;
}

export const INITIAL_CAMERA: Camera = { x: 0, y: 0, scale: 1 };

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}

/**
 * Bir dünya biriminin kaç piksel ettiği — bulutu ekrana sığdıran ölçek.
 *
 * İki eksen ayrı ayrı hesaplanıp **küçüğü** alınıyor: dar olan eksen sığdığında
 * diğeri de sığar. Tek bir ölçek kullanılıyor (eksen başına ayrı değil), yoksa
 * harita ekranın oranına göre esner ve "mesafe = benzemezlik" iddiası çöker —
 * uzayın bütün anlamı mesafelerin dürüstlüğünde.
 *
 * Kısa kenara bakan eski hesaptan farkı: bulut y'de x'ten basıksa geniş ekranda
 * o basıklık artık boşluğa değil ölçeğe yansıyor.
 */
export function pixelsPerUnit(viewport: Viewport, scale: number): number {
  const fitX = viewport.width / (viewport.halfX * 2 * MARGIN);
  const fitY = viewport.height / (viewport.halfY * 2 * MARGIN);
  const fit = Math.min(fitX, fitY);

  /*
    Portrede çerçeve dikeye doğru açılıyor; gerekçe `PORTRAIT_FILL`da.
    `Math.min(fitY, …)` tavanın üstüne bir tavan daha: açılım hiçbir durumda
    bulutu dikeyde de kırpacak kadar büyümüyor.
  */
  if (viewport.height / viewport.width >= PORTRAIT_RATIO) {
    return Math.min(fitY, fit * PORTRAIT_FILL) * scale;
  }

  return fit * scale;
}

/** Noktanın kaydırmaya verdiği tepki katsayısı; 1 = kamerayla birebir. */
export function parallaxOf(depth: number): number {
  return PARALLAX_MIN + depth * PARALLAX_RANGE;
}

export function markRadius(depth: number, scale: number): number {
  return (RADIUS_MIN + depth * RADIUS_RANGE) * scale ** RADIUS_ZOOM_EXPONENT;
}

/**
 * Kamerayı harita karesinin içinde tutar.
 *
 * Ekranın ortası her zaman nokta bulutunun sınırları içinde kalıyor; harita
 * tamamen kayıp gidemiyor. Yakınlaşmışken bile bulutun her köşesine ulaşılabilir,
 * çünkü sınır ölçekten bağımsız.
 */
function clampCamera(camera: Camera): Camera {
  return {
    x: clamp(camera.x, -PAN_LIMIT, PAN_LIMIT),
    y: clamp(camera.y, -PAN_LIMIT, PAN_LIMIT),
    scale: clamp(camera.scale, MIN_SCALE, MAX_SCALE),
  };
}

export function worldToScreen(point: Placed, camera: Camera, viewport: Viewport): ScreenPoint {
  const unit = pixelsPerUnit(viewport, camera.scale);
  const parallax = parallaxOf(point.depth);

  return {
    sx: viewport.width / 2 + (point.x - camera.x * parallax) * unit,
    sy: viewport.height / 2 - (point.y - camera.y * parallax) * unit,
  };
}

/**
 * Ekran pikselinden dünya koordinatına — taban düzlemde (parallax 1).
 *
 * Parallax'lı bir dünyada "imlecin altındaki nokta" derinliğe göre değişir,
 * yani tek bir cevabı yok. Yakınlaşma çapası olarak taban düzlem alınıyor:
 * tutarlı, tahmin edilebilir ve dar parallax bandında gözle fark edilmiyor.
 */
export function screenToWorld(
  sx: number,
  sy: number,
  camera: Camera,
  viewport: Viewport,
): { readonly x: number; readonly y: number } {
  const unit = pixelsPerUnit(viewport, camera.scale);

  return {
    x: (sx - viewport.width / 2) / unit + camera.x,
    y: -(sy - viewport.height / 2) / unit + camera.y,
  };
}

/** Sürükleme — ekranda kaydırılan piksel kadar kamerayı ters yönde taşır. */
export function panBy(
  camera: Camera,
  dxPixels: number,
  dyPixels: number,
  viewport: Viewport,
): Camera {
  const unit = pixelsPerUnit(viewport, camera.scale);

  return clampCamera({
    x: camera.x - dxPixels / unit,
    y: camera.y + dyPixels / unit,
    scale: camera.scale,
  });
}

/**
 * İmleci (ya da iki parmağın ortasını) çapa alarak yakınlaşır.
 *
 * Çapanın altındaki dünya noktası yerinde kalıyor — harita imlecin etrafında
 * açılıyor, ekranın ortasına doğru kaymıyor. Ölçek sınıra dayanmışsa kamera
 * hiç oynamıyor; sınırda tekrar tekrar tekerlek çevirmek haritayı kaydırmasın.
 */
export function zoomAt(
  camera: Camera,
  sx: number,
  sy: number,
  factor: number,
  viewport: Viewport,
): Camera {
  const scale = clamp(camera.scale * factor, MIN_SCALE, MAX_SCALE);
  if (scale === camera.scale) return camera;

  const anchor = screenToWorld(sx, sy, camera, viewport);
  const unit = pixelsPerUnit(viewport, scale);

  return clampCamera({
    x: anchor.x - (sx - viewport.width / 2) / unit,
    y: anchor.y + (sy - viewport.height / 2) / unit,
    scale,
  });
}

/** Kamerayı bir noktanın üstüne getirir — ölçeğe dokunmadan. */
export function centerOn(camera: Camera, point: Placed): Camera {
  const parallax = parallaxOf(point.depth);

  return clampCamera({
    x: point.x / parallax,
    y: point.y / parallax,
    scale: camera.scale,
  });
}

/**
 * Bir parfüme "yaklaş" — ortala **ve** yakınlaş.
 *
 * Seçim eskiden kamerayı hiç oynatmıyordu: nokta ekranın kenarında kalıyor,
 * komşu çizgileri ekran dışına taşıyor ve kullanıcı seçtiği şeyi uzaktan
 * seyrediyordu. Seçmek "bunu merak ettim" demek; kameranın karşılığı yaklaşmak.
 *
 * Ölçek düşürülmüyor, yalnızca yükseltiliyor: kullanıcı elle daha da
 * yakınlaşmışsa seçim onu geri çekmiyor.
 */
export function focusOn(camera: Camera, point: Placed): Camera {
  return {
    ...centerOn(camera, point),
    scale: Math.max(camera.scale, FOCUS_SCALE),
  };
}

/**
 * Ekran noktasının altındaki parfüm — yoksa null.
 *
 * Kazananı belirleyen şey merkeze uzaklık DEĞİL, noktanın kenarına uzaklık
 * (`distance − radius`; içerideyken negatif). Fark kalabalık bölgede ortaya
 * çıkıyor: merkeze bakan bir seçim, büyük bir noktanın yanına sokulmuş küçük
 * bir noktayı erişilemez kılıyordu — küçüğün tam üstüne basılsa bile merkezi
 * daha yakın olan büyük komşu kazanıyordu. Ölçüldü: tek bir nokta (Sel-Vanille)
 * üç ayrı parfümün tıklamasını yutuyordu.
 *
 * Kenara bakınca üstüne basılan nokta kazanıyor; hiçbirinin içinde değilsen
 * kenarı en yakın olan.
 */
export function hitTest(
  marks: readonly SpaceMark[],
  sx: number,
  sy: number,
  camera: Camera,
  viewport: Viewport,
  padding: number = HIT_PADDING,
): SpaceMark | null {
  let best: SpaceMark | null = null;
  let bestScore = Infinity;

  for (const mark of marks) {
    const { sx: mx, sy: my } = worldToScreen(mark, camera, viewport);
    const distance = Math.hypot(sx - mx, sy - my);
    const radius = markRadius(mark.depth, camera.scale);
    if (distance > radius + padding) continue;

    const score = distance - radius;
    if (score < bestScore) {
      best = mark;
      bestScore = score;
    }
  }

  return best;
}
