import type { Character, Volatility } from '@/data/types';
import { EN, type Dict } from '@/i18n/en';
import { intensityAt } from './evolution';
import { SIGNATURE_MAX_MINUTES } from './evolution-loop';
import { ditherThreshold } from './dither-field';

/**
 * Notanın kendi ölçümleri — ömür şeridi ve dört karakter ekseni.
 *
 * `note-orbit.ts` ve `dither-field.ts` ile aynı sözleşme:
 * React, DOM ve canvas bilmiyor. Sınamalar bu yüzden çalışıyor, çizim
 * `components/NoteMeasures.tsx`te.
 *
 * ⚠️ **Bu modül yazılı bir kararı deviriyor.** Nota ansiklopedisi spec'inin ④.
 * kararı uçuculuğu ve karakteri sayfadan bilerek çıkarmıştı, iki gerekçeyle:
 * çubuk/eğri ③'te reddedilmişti ve karakter eksenleri uzaydaki **arama**
 * kaydıraçlarına benzeyip kullanıcıyı yanıltabilirdi. Karar kapıyı açık
 * bırakmıştı ("istenirse ayrı iş") ve sahip istedi — ama iki gerekçe de hâlâ
 * geçerli, o yüzden ikisi de burada tasarımla aşılıyor, yok sayılarak değil:
 *
 *   · **Şerit çubuk grafiği değil.** Yükseklik hiçbir şeyi kodlamıyor; bilgiyi
 *     taşıyan tek şey **doku yoğunluğu**. Eksen çizgisi, ızgara, okunacak sayı
 *     yok. Bergamotun şeridi solda yoğunlaşıp erken bitiyor, sandalınki sağ uca
 *     kadar dolu — karşılaştırma gözle, ölçüyle değil.
 *   · **Eksenler kaydıraç değil.** Topuz yok, tutulacak yer yok, `cursor`
 *     değişmiyor, odaklanmıyor ve **basamaklı** — kaydıraç sürekli ve
 *     sürüklenebilir. Ayrım gözle görülür olmalı; olmuyorsa tasarım başarısız.
 */

/* ─── Ömür şeridi ─────────────────────────────────────────────────────────── */

/** Şeridin sütun sayısı — zaman ekseni. */
export const STRIP_COLUMNS = 120;

/**
 * Şeridin satır sayısı — yoğunluğun dağıldığı yükseklik, veri taşımıyor.
 *
 * ⚠️ **Dördün katı olmak zorunda.** Bayer matrisi 4 satırda kendini tekrar ediyor;
 * 10 satır denendiğinde ilk iki satır üç, son ikisi iki kez örnekleniyor ve şerit
 * eşiklerin tamamını eşit temsil etmiyordu — yoğunluk sistematik olarak yanlış
 * çıkıyordu. Sütun sayısı da aynı sebeple dördün katı.
 */
export const STRIP_ROWS = 12;

/**
 * Şeridin sol ucu, dakika.
 *
 * Sıfır olamaz: eksen logaritmik. Yarım dakika sıkma anının kendisi sayılıyor —
 * en hızlı nota bile (peak 1 dk) ilk sütunda görünür durumda.
 */
export const STRIP_FIRST_MINUTE = 0.5;

/**
 * Bir noktanın çizilmesi için gereken en az yoğunluk.
 *
 * Bayer matrisinin en düşük eşiği sıfır; taban olmasaydı sıfırdan büyük **her**
 * yoğunluk o hücreleri yakardı ve sekiz saat sonra buharlaşıp bitmiş bergamot
 * şeridin sağ ucunda hâlâ noktalar bırakırdı. Kendi tepesinin %3'ünün altına
 * düşmüş bir nota gitmiştir; onu çizmek yalan olur.
 */
const STRIP_FLOOR = 0.03;

/**
 * Bir sütunun karşılık geldiği dakika — **logaritmik**.
 *
 * Doğrusal olsaydı sekiz saatin ilk beş dakikası 120 sütunun birine sıkışırdı;
 * oysa bir üst notanın bütün hikâyesi orada geçiyor. Logaritmik eksende
 * bergamotun tepesi de sandalın kuyruğu da aynı şeritte görünür kalıyor.
 */
export function columnMinutes(column: number): number {
  const ratio = column / (STRIP_COLUMNS - 1);
  return STRIP_FIRST_MINUTE * (SIGNATURE_MAX_MINUTES / STRIP_FIRST_MINUTE) ** ratio;
}

/**
 * Şeridin tram hücreleri — satır sıralı, `STRIP_COLUMNS × STRIP_ROWS` uzunluğunda.
 *
 * Yoğunluk sütunun tamamında aynı; değişen tek şey Bayer eşiği. Bu yüzden sütun
 * dikeyde bir **çubuk** gibi dolmuyor, dokusu koyulaşıyor.
 *
 * Eşik `dither-field.ts`ten geliyor, kopyalanmıyor: arka plan alanı, nota
 * yörüngesi ve bu şerit aynı matrisi paylaşınca sayfa tek bir madde gibi
 * okunuyor — üç ayrı efekt gibi değil.
 */
export function lifeStripCells(volatility: Volatility): readonly boolean[] {
  const cells: boolean[] = new Array(STRIP_COLUMNS * STRIP_ROWS);

  for (let column = 0; column < STRIP_COLUMNS; column += 1) {
    const density = intensityAt(volatility, columnMinutes(column));

    for (let row = 0; row < STRIP_ROWS; row += 1) {
      cells[row * STRIP_COLUMNS + column] =
        density > STRIP_FLOOR && density > ditherThreshold(column, row);
    }
  }

  return cells;
}

/* ─── Karakter eksenleri ──────────────────────────────────────────────────── */

/** Bir eksenin basamak sayısı — Bayer matrisinin 16 kademesiyle aynı. */
export const AXIS_STEPS = 16;

export interface Axis {
  readonly id: keyof Character;
  /** Sol uç, ekranda büyük harf. */
  readonly low: string;
  /** Sağ uç. */
  readonly high: string;
  /** Sol ucun sıfat hâli — ekran okuyucunun duyduğu metin. */
  readonly lowWord: string;
  /** Sağ ucun sıfat hâli. */
  readonly highWord: string;
}

/**
 * Eksen sırası — `types.ts`teki `Character` alan sırasıyla aynı, DEĞİŞMEMELİ.
 *
 * Sıra ve kimlikler bilerek sözlükte değil: kimlikler `Character`ın anahtarları
 * (çevrilecek bir şey değiller) ve sıra veri şemasına ait. İkisi de sözlüğe
 * verilseydi bir çeviri dosyası şemayı kaydırabilirdi.
 */
const AXIS_ORDER = ['temperature', 'texture', 'cleanliness', 'proximity'] as const;

/**
 * Dört eksen — sözcükler sözlükten, kimlik ve sıra buradan.
 *
 * Uç adları uzaydaki kaydıraçlarla (`EN.space.sliders`) **aynı olmak zorunda**:
 * ikisi aynı veriyi (`Character`) gösteriyor ve tek eksene iki ad takmak
 * kullanıcıya iki ayrı şey varmış gibi geliyor. Türkçede tam olarak bu şikâyet
 * yaşandı ve sözcükler o gün eşitlendi.
 *
 * Sözcük seçimlerinin geçmişi:
 *   · Doku PÜRÜZSÜZ↔TIRTIKLI'ydı, ekranda anlaşılmadı; YUMUŞAK şiddet gibi
 *     okundu, YUVARLAK ve İPEKSİ elendi. KADIFE↔KESKIN sahibin ekrana bakıp
 *     seçtiği çiftti — İngilizcesi VELVET↔SHARP.
 *   · Yakınlık UZAK↔YAKIN'dı ve mesafeden bahsettiği sanılıyordu; oysa eksen
 *     kokunun NEREDE durduğunu söylüyor. HAVADA↔TENDE yeri adlandırıyor —
 *     İngilizcesi AIR↔SKIN.
 *
 * `lowWord`/`highWord` sıfat hâli, isim değil: `axisWord` "faintly velvety"
 * kuruyor, "faintly velvet" değil.
 *
 * ⚠️ Faz 1'de bu bir **sabitti** (`export const AXES`). İki dilde sabit olamaz:
 * aynı eksenin uç adları sayfanın diline göre değişiyor. Çağıran sözlüğü
 * veriyor; kimlik ve sıra yine burada kalıyor.
 */
export function axesFor(dict: Dict): readonly Axis[] {
  return AXIS_ORDER.map((id) => ({ id, ...dict.axes[id] }));
}

/**
 * Eksen değerinin basamağı, 0–`AXIS_STEPS`.
 *
 * Yuvarlama süsleme değil, **kaydıraçtan ayıran şeyin kendisi**: 0.50 ile 0.51
 * aynı basamağa düşüyor. Kaydıraç sürekli, ölçüm kesikli.
 */
export function axisLevel(value: number): number {
  const clamped = Math.min(Math.max(value, -1), 1);
  return Math.round(((clamped + 1) / 2) * AXIS_STEPS);
}

/** Eksenin ortası — tarafsız değerin (0) basamağı. */
export const AXIS_CENTER = AXIS_STEPS / 2;

/**
 * Dolu basamak aralığı, `[from, to)` — **ortadan kutba doğru**.
 *
 * ⚠️ Önce soldan doldurulmuştu ve ekranda görüldüğünde yanlış okunuyordu:
 * bergamot (`temperature −0.6`, yani soğuk) 16 hücrenin 3'ünü doldurup "az bir
 * şey var" diyordu, "soğuğa yakın" demiyordu. Eksen bir **miktar** değil bir
 * **yön** ölçüyor; dolgunun ortadan başlaması bunu söyleyen tek biçim.
 *
 * Yan faydası: kaydıraçlar tek uçtan dolar, bu ortadan iki yana açılır — ayrım
 * bir kat daha görünür oluyor.
 */
export function axisSpan(value: number): { readonly from: number; readonly to: number } {
  const level = axisLevel(value);
  return { from: Math.min(level, AXIS_CENTER), to: Math.max(level, AXIS_CENTER) };
}

/*
 * Sıfat eşikleri — 136 notanın 544 ekseni ölçülerek konuldu, tahminle değil:
 *
 *   |değer| < 0.15   %15   iki ucun arasında
 *   0.15 – 0.40      %29   hafif
 *   0.40 – 0.70      %41   düz
 *   ≥ 0.70           %16   belirgin
 *
 * Dört bandın da veride gerçekten dolu olması sınanıyor. Bir bant boşalırsa
 * eşikler veriye değil tahmine dayanıyor demektir.
 */
const NEUTRAL_BELOW = 0.15;
const FAINT_BELOW = 0.4;
const PLAIN_BELOW = 0.7;

/**
 * Ölçümün sıfatı — ekranda basamakların yanında değil, **yerine** okunan metin.
 *
 * Görünen şey tram basamakları; ekran okuyucuya giden şey bu cümle. Basamağı
 * "12/16" diye okutmak ölçüyü olduğundan kesin gösterirdi.
 *
 * `words` varsayılanlı bir parametre ve bugün hiç geçilmiyor. Faz 2'de aynı
 * ölçüm Türkçe okunacak; o gün bu imza değişmeyecek, maliyeti bugün sıfır.
 */
export function axisWord(
  axis: Axis,
  value: number,
  words: typeof EN.axisWords = EN.axisWords,
): string {
  const size = Math.abs(value);
  if (size < NEUTRAL_BELOW) return words.between(axis.lowWord, axis.highWord);

  const word = value < 0 ? axis.lowWord : axis.highWord;
  if (size < FAINT_BELOW) return words.faint(word);
  if (size < PLAIN_BELOW) return words.plain(word);
  return words.strong(word);
}
