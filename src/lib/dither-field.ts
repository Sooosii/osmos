/**
 * Tram alanı — nota sayfasının arkasında duran hareketli doku.
 *
 * Sahibin getirdiği referansta arka planı başkasına ait bir UnicornStudio
 * sahnesi dolduruyordu; alınmadı (`ScreenFrame.tsx`). Bu modül aynı görüntüyü
 * kendi kodumuzla üretiyor: dış istek yok, sahne kimliği yok, statik üretim
 * bozulmuyor.
 *
 * ⚠️ **Alan süs değil, notanın kendi fiziği.** Dalganın hızını `peakMinutes`,
 * ne kadar yayıldığını `halfLifeMinutes` belirliyor. Bergamot hızlı ve dar
 * çarpıyor, sandal ağır ağır bütün ekrana yayılıyor — 136 nota sayfası 136
 * farklı arka plan demek. Sabit bir doku koysaydık ekranda yalan bir hareket
 * olurdu; şemanın kuralı `types.ts:5`ten beri aynı: her alan bir gösterimi
 * sürüyor.
 *
 * Saf: DOM'a, canvas'a, `@/` yoluna dokunmuyor — sınamalar bu yüzden çalışıyor.
 */

/**
 * Bayer 4×4 sıralı tram matrisi.
 *
 * `NoteOrbit` ile aynı matris ve bu bilinçli: iki yüzey aynı dokuyu paylaşınca
 * arka plan yörüngenin altına giren bir katman gibi okunuyor, ayrı bir efekt
 * gibi değil. Değerler 0–15; eşiğe çevirirken 16'ya bölünüyor.
 */
export const BAYER_4X4: readonly number[] = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

/** Alanın notadan aldığı iki katsayı, ikisi de 0–1. */
export interface FieldTuning {
  /** Dalganın hızı. Uçucu nota hızlı, ağır nota yavaş. */
  readonly speed: number;
  /** Dalganın ne kadar dışarı taşıdığı. Kısa ömür merkeze toplanıyor. */
  readonly reach: number;
}

/*
 * Uçları veriden ölçüldü, tahminle konmadı (136 notanın tamamı):
 *   peakMinutes      1 – 160   ortanca  25
 *   halfLifeMinutes  12 – 900  ortanca 200
 *
 * İki dağılım da uca doğru çok seyrek. Doğrusal normalleştirseydik notaların
 * yarısından fazlası ölçeğin ilk beşte birine sıkışır, ekranda hepsi aynı
 * görünürdü — bu yüzden logaritmik.
 */
const PEAK_MIN = 1;
const PEAK_MAX = 160;
const LIFE_MIN = 12;
const LIFE_MAX = 900;

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/** Logaritmik 0–1 normalleştirme. */
function logNorm(value: number, min: number, max: number): number {
  const t = (Math.log(Math.max(value, min)) - Math.log(min)) / (Math.log(max) - Math.log(min));
  return clamp01(t);
}

/**
 * Notanın uçuculuğundan alanın katsayıları.
 *
 * `speed` ters çevriliyor: tepesi erken gelen nota UÇUCU demek, ekranda da hızlı
 * olmalı. `reach` düz gidiyor: uzun ömür geniş yayılma.
 */
export function tuneField(peakMinutes: number, halfLifeMinutes: number): FieldTuning {
  return {
    speed: 1 - logNorm(peakMinutes, PEAK_MIN, PEAK_MAX),
    reach: logNorm(halfLifeMinutes, LIFE_MIN, LIFE_MAX),
  };
}

/** En yavaş notanın bile durmaması için taban hız. */
const BASE_SPEED = 0.22;
/** Hızın katsayıyla açılan aralığı. */
const SPEED_SPAN = 0.85;

/** Merkezden dışarı giden halkaların sıklığı. */
const RING_DENSITY = 7.4;

/** En dar yayılma ve katsayıyla açılan aralık. */
const FALLOFF_MIN = 0.34;
const FALLOFF_SPAN = 0.62;

/**
 * Alanın bir noktadaki değeri, 0–1.
 *
 * `nx`/`ny` merkezde 0, kenarda ±1 civarı (en boy düzeltilmiş). `t` saniye.
 *
 * Üç şeyin toplamı: merkezden yayılan halkalar, onları bozan yavaş bir sürüklenme
 * ve dışarı doğru sönüm. Sürüklenme olmasa halkalar kusursuz daireler olurdu ve
 * ekranda bir hedef tahtası gibi dururdu; ikisi çarpışınca düzensiz, organik bir
 * yayılma çıkıyor.
 */
export function fieldValue(nx: number, ny: number, t: number, tuning: FieldTuning): number {
  const dist = Math.hypot(nx, ny);

  const rings = Math.sin(dist * RING_DENSITY - t * (BASE_SPEED + tuning.speed * SPEED_SPAN));
  const drift = Math.sin(nx * 3.1 + t * 0.21) * Math.cos(ny * 2.7 - t * 0.17);
  const body = (rings * 0.62 + drift * 0.38 + 1) / 2;

  const falloff = Math.exp(-dist / (FALLOFF_MIN + tuning.reach * FALLOFF_SPAN));

  return clamp01(body * falloff);
}

/**
 * Hücrenin tram eşiği, 0–1.
 *
 * Izgara **ekran pikselinde** sabit — geometriyle birlikte ölçeklenirse doku
 * dağılıyor. Bu ders `NoteOrbit`te ekranda öğrenildi ve bir kez daha
 * yapılmasın diye buraya yazıldı.
 */
export function ditherThreshold(x: number, y: number): number {
  return BAYER_4X4[(y & 3) * 4 + (x & 3)] / 16;
}
