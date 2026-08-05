/**
 * OSMOS — çekirdek veri şemaları.
 *
 * Sitenin tamamı tek bir kaynaktan besleniyor: nota veritabanı.
 * Her notanın üç özelliği var ve her biri farklı bir gösterimi sürüyor:
 *
 *   volatility → evrim çizelgesi (zaman içinde yükselip düşen çubuklar)
 *   families   → Koku Uzayı'ndaki konum (benzerlik hesabı)
 *   character  → sinestezi kaydıraçları + görsel imza
 *
 * Bir parfümün notaları girildiği an dördü birden hesaplanıyor.
 */

/** Koku aileleri. Uzayın eksenleri bunlar — sabit ve kapalı bir liste. */
export type ScentFamily =
  | 'citrus'
  | 'aldehydic'
  | 'green'
  | 'aromatic'
  | 'floral'
  | 'fruity'
  | 'gourmand'
  | 'spicy'
  | 'woody'
  | 'resinous'
  | 'leather'
  | 'animalic'
  | 'mossy'
  | 'mineral'
  | 'musk';

/** İki dilli metin. Site EN birincil, TR ikincil. */
export interface Localized {
  readonly en: string;
  readonly tr: string;
}

/**
 * Uçuculuk — evrim eğrisini üreten iki sayı.
 *
 * Eğri: yükseliş × sönüm
 *   yükseliş = 1 − e^(−t / (peakMinutes / RISE_DIVISOR))
 *   sönüm    = 0.5^(t / halfLifeMinutes)
 *
 * Bergamot gibi bir üst nota: peak ~2 dk, yarı ömür ~20 dk.
 * Vanilya gibi bir dip nota:  peak ~90 dk, yarı ömür ~600 dk.
 *
 * Formülün kendisi src/lib/evolution.ts içinde; burada sadece veri var.
 * Böylece eğri modeli değişirse 120 notaya dokunmadan tek yerden ayarlanır.
 */
export interface Volatility {
  /** Notanın en güçlü hissedildiği an (dakika). */
  readonly peakMinutes: number;
  /** Tepe sonrası yarıya düşme süresi (dakika). */
  readonly halfLifeMinutes: number;
}

/**
 * Duyusal karakter — dört eksen, her biri −1…+1.
 *
 * Bu eksenler hem sinestezi kaydıraçlarını hem görsel imzanın dokusunu besliyor.
 * Nota bilmeyen biri "soğuk ve temiz bir şey istiyorum" diyerek arama yapabilsin diye var.
 */
export interface Character {
  /** −1 soğuk (iris, galbanum) … +1 sıcak (vanilya, huş katranı) */
  readonly temperature: number;
  /** −1 pürüzsüz (vanilya, iris) … +1 tırtıklı (oud, galbanum) */
  readonly texture: number;
  /** −1 kirli (oud, indol) … +1 temiz (aldehit, beyaz misk) */
  readonly cleanliness: number;
  /** −1 uzak (havada dağılan, aldehit) … +1 yakın (tene yapışan, vanilya) */
  readonly proximity: number;
}

/**
 * Tek bir koku maddesi.
 *
 * `families` kısmi bir kayıt: bir nota birden fazla aileye ait olabilir.
 * Oud hem odunsu hem hayvansal hem deri; iris hem çiçeksi hem mineral.
 * Yazılmayan aileler 0 sayılır.
 */
export interface Note {
  /** Kalıcı kimlik, kebab-case. Örn. 'birch-tar'. */
  readonly id: string;
  readonly name: Localized;
  /** Aile ağırlıkları, her biri 0–1. Toplamının 1 olması gerekmez. */
  readonly families: Partial<Readonly<Record<ScentFamily, number>>>;
  readonly volatility: Volatility;
  readonly character: Character;
  /** Nota ansiklopedisi için kısa tarif. Aşama 3'te tamamlanacak. */
  readonly description?: Localized;
}

/**
 * Piramitteki konum.
 *
 * Eğriyi `volatility` belirliyor — bu alan değil. Katman sadece
 * evrim çizelgesindeki renk gruplaması için (referans görseldeki
 * turuncu / pembe / mor ayrımı) ve markaların yayımladığı biçime sadık kalmak için.
 */
export type PyramidTier = 'top' | 'heart' | 'base';

/** Bir parfümün bileşimindeki tek bir nota. */
export interface PerfumeNote {
  /** `Note.id` referansı. */
  readonly noteId: string;
  readonly tier: PyramidTier;
  /** Kompozisyondaki ağırlığı, 0–1. Baskın notalar 1'e yakın. */
  readonly weight: number;
}

export interface Perfume {
  /** Kalıcı kimlik, kebab-case. Örn. 'orto-parisi-megamare'. */
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  /**
   * Çıkış yılı — zorunlu, 44'ün 44'ünde dolu.
   *
   * `?` bilerek yok: künye ancak bütün veri tamken yayınlanır kararı verildi ve
   * bunu derleme zamanında garanti eden tek yer burası. Sınamayla da olurdu ama
   * tip, künyede `year ? ... : null` gibi hiç çalışmayacak dalların doğmasını da
   * engelliyor.
   */
  readonly year: number;
  /**
   * Parfümör — isteğe bağlı, ve bu bir veri eksikliği değil.
   *
   * 44'ün 42'sinde dolu. Kalan ikisinde (`comptoir-sud-pacifique-vanille-abricot`,
   * `spirit-of-dubai-ajyal`) marka burnu hiç açıklamadı; aranıp bulunamadığı için
   * değil, açıklanmadığı için boş. Künye o iki sayfada yalnızca yılı yazıyor —
   * uydurma da yok, "bilinmiyor" yazısı da yok.
   */
  readonly perfumer?: string;
  readonly notes: readonly PerfumeNote[];
  /** true = küratörlü "mücevher"; false = uzaya yoğunluk katan katalog noktası. */
  readonly curated: boolean;
  /** Küratör cümlesi — özgün metin, marka tanıtımından kopyalanmaz. */
  readonly line?: Localized;
}

/** Benzerlik hesabının ürettiği, Koku Uzayı'nda çizilen nokta. */
export interface SpacePoint {
  readonly perfumeId: string;
  readonly x: number;
  readonly y: number;
  /** Derinlik katmanı 0–1; parallax hızını ve nokta boyutunu belirler. */
  readonly depth: number;
}

/**
 * Çizilmeye hazır nokta — sunucudan istemciye geçen tek biçim.
 *
 * `SpacePoint`ten farkı: konuma ek olarak ekranda gereken her şeyi taşıyor
 * (ad, renk, komşu kimlikleri), böylece tarayıcının parfüm veritabanına da
 * benzerlik motoruna da ihtiyacı kalmıyor. Bu yüzden burada, saf tip
 * dosyasında duruyor — istemci bileşeni tipi alırken 44×44'lük kosinüs
 * matrisini paketine sürüklemesin.
 */
export interface SpaceMark {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  /** Küratör cümlesi; yazılmamışsa null. */
  readonly line: string | null;
  /** Baskın koku ailesinin rengi. */
  readonly color: string;
  readonly x: number;
  readonly y: number;
  readonly depth: number;
  /** En yakın komşular, benzerlikten güçlüye göre sıralı. */
  readonly neighborIds: readonly string[];
}
