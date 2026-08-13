/**
 * Açılış astronotunun dokusu ve arka plandaki nokta tarlası — saf modül.
 *
 * Sahibin referansı 21st.dev'deki "hero-ascii-one" (2026-08-10). Bileşen
 * kurcalanınca efektin dışarıdan yüklenen bir **UnicornStudio** sahnesi olduğu
 * görüldü — sahne değiştirilemiyor, site de çalışma anında dışarıya istek
 * atmıyor. Görsel dil bu yüzden elle kuruldu; aynı karar daha önce
 * `dither-field.ts`te verilmişti.
 *
 * Doku dört deneme geçirdi ve KARAKTERLERE geri döndü:
 * karakter merdiveni → tek tip nokta ("beğenmedim") → boyu tonla değişen
 * yarıton noktası ("çok aşırı yapay") → **yine karakter merdiveni**, ama bu
 * kez gradyanlı figürün üstünde. Sahibin sözüyle: "önceki hâli gibi olsun ama
 * tam önceki gibi değil; şekiller durabilir." Yapaylığın kaynağı kusursuz
 * nokta ızgarasıydı; karakterlerin düzensiz biçimleri ve kıpırtısı dokuya
 * organiklik veriyor.
 *
 * Her şey saf ve kararlı: DOM yok, `Math.random` yok. Kıpırtı zamandan ve
 * hücre koordinatından türetiliyor — aynı girdi hep aynı kare, sınanabilir.
 */

/**
 * Karanlıktan aydınlığa karakter rampası. İlk eleman boşluk: "hiç" demek.
 *
 * Klasik on basamak; iki komşu karakter arasındaki fark küçük olduğu için
 * kıpırtı bir basamak oynattığında görüntü titremiyor, nefes alıyor.
 */
export const RAMP = ' .:-=+*#%@';

/**
 * Tek karakterlik hücrenin piksel kutusu.
 *
 * Mono yazıda karakter kutusu yaklaşık 0.6 oranında; 12px yazıya 7px genişlik
 * oradan. İlk denemedeki 13/8'den bir tık ince — "tam önceki gibi olmasın"ın
 * dokudaki karşılığı: aynı dil, biraz daha sık örgü.
 */
export const FONT_SIZE = 12;
export const CELL_W = 7;
export const CELL_H = 12;

/**
 * Izgara genişliği (hücre). 120×7 = 840px — telefonda CSS küçültüyor.
 *
 * ⚠️ 88'den çıkarıldı ve sebebi ölçülmüş bir şikâyet: atomizör "çok yapay
 * duruyor, ilk başta hiç anlaşılmıyor bile". 88 sütunda bir hücre 2.27 × 3.92
 * SVG birimi ediyordu, yani şişenin yuvarlaklığı ve camın yivleri hücrenin
 * altında kalıp düz bir kutuya çöküyordu. 120'de hücre 1.67 × 2.86 — aynı
 * alana %36 daha çok hücre, eğri bir kenar artık eğri okunuyor.
 *
 * Figürün ekrandaki boyu da bununla birlikte büyüdü (`placeChrome`): hücre
 * küçülürken figür büyümeseydi harfler iğneleşirdi.
 */
export const COLS = 120;

/**
 * Kare bir kaynağın oranını koruyan satır sayısı.
 * Hücre karesel değil; kare görüntü, satır sayısı `COLS·CELL_W/CELL_H`
 * olunca karesel görünür.
 */
export function rowsFor(cols: number): number {
  return Math.round((cols * CELL_W) / CELL_H);
}

/** Bu örtünün altı boş hücre: çizilmez. Gradyanların en silik eteğini atar. */
export const LUMA_CUTOFF = 0.03;

/**
 * Örneklenen parlaklığa uygulanan kazanç.
 *
 * Kaynak gradyanlı bir figür (tonlar ~0.15–0.95); 1.7 o yelpazeyi rampanın
 * tamamına yayıyor. İlk denemedeki 2.6 ince çizgiler içindi — gradyanlarda
 * her tonu tavana yapıştırıp gövdeyi tek karakterde düzlüyordu.
 */
export function boostLuma(luma: number): number {
  return Math.min(Math.max(luma * 1.7, 0), 1);
}

/** Hücreye özgü, kararlı sözde-rastgele sayı [0, 1). Klasik sin-hash. */
export function hashCell(col: number, row: number): number {
  const s = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Kıpırtının bir basamak oynatma eşiği ve hızı.
 *
 * Sinüs ±1 arasında salınıyor; |s| eşiği aşan kısa anlarda karakter bir
 * basamak kayıyor — zamanın kabaca dörtte biri. Daha düşük eşik görüntüyü
 * kaynatıyor, daha yükseği kıpırtıyı görünmez yapıyordu.
 */
const SHIMMER_GATE = 0.72;
const SHIMMER_SPEED = 0.0018;

/**
 * Hücrenin o anki karakteri. Boş dize = çizme.
 *
 * Eşik üstündeki hücre kıpırtıyla asla boşluğa düşmez (taban 1): figürün
 * kenarı yanıp sönen delikler değil, yoğunluğu oynayan bir doku.
 */
export function charAt(luma: number, col: number, row: number, tMs: number): string {
  if (luma < LUMA_CUTOFF) return '';
  const top = RAMP.length - 1;
  let index = Math.round(boostLuma(luma) * top);
  if (index < 1) index = 1;

  const wave = Math.sin(tMs * SHIMMER_SPEED + hashCell(col, row) * Math.PI * 2);
  if (wave > SHIMMER_GATE && index < top) index += 1;
  if (wave < -SHIMMER_GATE && index > 1) index -= 1;

  return RAMP[index];
}

/**
 * Hücrenin saydamlığı — parlak hücre daha görünür.
 * Taban 0.25: en silik karakter okunur ama bağırmaz. Üst uç 0.9: saf beyaz
 * yok; figür zeminle aynı dünyadan, üstüne yapıştırılmış değil.
 */
export function alphaAt(luma: number): number {
  return 0.25 + boostLuma(luma) * 0.65;
}

/**
 * Bütün figürün dikey salınımı (piksel) — ağırlıksızlık.
 * ±6 piksel, ~12 saniyelik tur; sıfırdan başlıyor ki figür yerinden fırlamasın.
 */
export function bobOffset(tMs: number): number {
  return Math.sin(tMs / 1900) * 6;
}

/* ── Arka plan: süzülen nokta tarlası ────────────────────────────────────
 *
 * Referansın "matrix" hissi: ekranı kaplayan nokta tarlası, aşağı süzülüyor,
 * tek tek yanıp sönüyor. Ölçek sahibin iki düzeltmesiyle oturdu:
 *
 * · "Çok sönük" → boy çeşidi, geniş parlaklık bandı ve seyrek gerçek
 *   yıldızlar geldi.
 * · "Tak tak tak, ritim olmasın; kusursuz döngü" → İLK KURGU HATAYDI:
 *   bütün tarla tek hızda inip hücre boyunda HEP BİRLİKTE sarıyordu
 *   (`(t·hız) % BG_CELL`) — 1.2 saniyede bir bütün levha yerine oturuyor,
 *   vuruş oradan geliyordu. Yanıp sönme de tek ortak frekanstaydı.
 *
 * Şimdi her noktanın KENDİ hayatı var: kendi düşüş hızı, kendi yatay
 * salınımı, kendi yanıp sönme frekansı. Ortak hiçbir periyot yok; sarma
 * noktaya özgü ve ekran boyunda (altından çıkan tepeden girer, kimse
 * kimseyle aynı anda dönmez) — dikişsiz döngü, sıfır vuruş. Astronotun
 * kıpırtısı gibi: her hücre kendi fazında, bütünün ritmi yok.
 *
 * Tavan yine bilinçli: en parlak tarla noktası bile figürden geride —
 * özne astronot.
 */

/** Tarlanın hücre adımı (piksel) — nokta sıklığını belirler. */
export const BG_CELL = 24;

/** Yıldız eşiği: tohumu bunu aşan nokta parlak yıldız. ~%4'ü. */
const STAR_GATE = 0.96;

/** Düşüş hızı bandı (piksel/saniye) — süzülme, yağmur değil. */
const FALL_MIN = 6;
const FALL_RANGE = 12;

/** Yatay salınım: genlik (piksel) ve frekans bandı (radyan/ms). */
const SWAY_AMP_MAX = 4;
const SWAY_W_MIN = 0.0003;
const SWAY_W_RANGE = 0.0006;

/** Yanıp sönme frekans bandı (radyan/ms) — her nokta kendi temposunda. */
const TWINKLE_W_MIN = 0.0004;
const TWINKLE_W_RANGE = 0.0012;

/** Bir tarla noktasının değişmez kimliği — hepsi tohumdan, hepsi kararlı. */
export interface FieldDot {
  /** Başlangıç konumu (piksel; y sarmayla ekran boyuna taşınır). */
  readonly x0: number;
  readonly y0: number;
  /** Düşüş hızı (piksel/saniye) — iri nokta daha hızlı: yakınlık yanılsaması. */
  readonly speed: number;
  /** Yatay salınım: genlik, frekans, faz. */
  readonly swayAmp: number;
  readonly swayW: number;
  readonly swayPhase: number;
  /** Yanıp sönme: frekans, faz, taban parlaklık. */
  readonly twinkleW: number;
  readonly twinklePhase: number;
  readonly baseAlpha: number;
  readonly radius: number;
  readonly star: boolean;
}

/**
 * Izgara hücresinden nokta kimliği üretir. Aynı hücre hep aynı noktayı verir.
 *
 * Boy 1.1–2.4 (yıldızlar +0.8) ve hız boyla bağlı: iri olan hızlı düşüyor —
 * ucuz ama işleyen bir paralaks. Konum hücresinden bir tutam kayık, yoksa
 * kusursuz ızgara kumaş deseni gibi duruyordu.
 */
export function fieldDot(col: number, row: number): FieldDot {
  const seed = hashCell(col, row);
  const star = seed > STAR_GATE;
  const size = hashCell(col + 3, row + 5);
  const radius = 1.1 + size * 1.3 + (star ? 0.8 : 0);

  return {
    x0: col * BG_CELL + (hashCell(col + 7, row) - 0.5) * BG_CELL * 0.35,
    y0: row * BG_CELL + (hashCell(col, row + 13) - 0.5) * BG_CELL * 0.35,
    speed: FALL_MIN + size * FALL_RANGE,
    swayAmp: hashCell(col + 11, row + 2) * SWAY_AMP_MAX,
    swayW: SWAY_W_MIN + hashCell(col + 5, row + 17) * SWAY_W_RANGE,
    swayPhase: hashCell(col + 19, row + 3) * Math.PI * 2,
    twinkleW: TWINKLE_W_MIN + hashCell(col + 2, row + 23) * TWINKLE_W_RANGE,
    twinklePhase: hashCell(row, col) * Math.PI * 2,
    baseAlpha: star ? 0.65 : 0.08 + seed * 0.2,
    radius,
    star,
  };
}

/**
 * Noktanın o anki dikey konumu — noktaya özgü dikişsiz sarma.
 *
 * `wrapH` ekran boyu + pay: nokta alttan tamamen çıkmadan üstte belirmesin.
 * Sarma anı noktanın kendi hızına ve başlangıcına bağlı, yani herkes başka
 * anda döner — eski kurgudaki "bütün levha aynı anda oturur" vuruşu yok.
 */
export function fieldY(dot: FieldDot, tMs: number, wrapH: number): number {
  const y = dot.y0 + (dot.speed * tMs) / 1000;
  return ((y % wrapH) + wrapH) % wrapH;
}

/** Noktanın o anki yatay konumu — kendi frekansında küçük bir salınım. */
export function fieldX(dot: FieldDot, tMs: number): number {
  return dot.x0 + dot.swayAmp * Math.sin(tMs * dot.swayW + dot.swayPhase);
}

/**
 * Noktanın o anki opaklığı. Sıradan nokta [0.03, 0.42], yıldız [0.45, 0.85].
 * Frekans noktaya özgü — koro yok, herkes kendi nefesinde.
 */
export function fieldAlpha(dot: FieldDot, tMs: number): number {
  const twinkle = Math.sin(tMs * dot.twinkleW + dot.twinklePhase);

  if (dot.star) {
    return dot.baseAlpha + twinkle * 0.2;
  }

  return Math.min(Math.max(dot.baseAlpha + twinkle * 0.12, 0.03), 0.42);
}
