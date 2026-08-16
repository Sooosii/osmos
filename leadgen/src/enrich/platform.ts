/**
 * Altyapı tespiti, ürün sayısı ve ölçülecek ürün sayfalarının seçimi.
 * Apify'sız, bedava.
 *
 * Yöntem canlı sitelerde ölçüldü:
 *   scentsplit.com        → /products.json 200, _shopify_y çerezi → Shopify
 *   zoologistperfumes.com → /products.json 129 ürün                → Shopify
 *   nishane.com           → /products.json 404, ana sayfada 183 × "woocommerce"
 *   luckyscent.com        → çıplak alan adı 301, ikisi de tutmuyor → diger
 */
import { jsonAyristir, naziceGetir, type Cevap } from '../net/fetch.ts';
import type { Platform } from '../types.ts';

/** Shopify tek sayfada en çok bu kadar ürün veriyor. */
const SAYFA_BOYU = 250;
/**
 * En fazla kaç sayfa gezilecek.
 *
 * ⚠️ Puanlama yalnız "30-500 arasında mı" diye soruyor. 1000'i geçtikten
 * sonra kesin sayıyı öğrenmenin puana katkısı yok, ama büyük bir katalogda
 * onlarca istek daha demek. Dördüncü sayfada duruluyor ve sayı tavana
 * dayandı diye işaretleniyor.
 */
const EN_FAZLA_SAYFA = 4;

/** Benzer-ürün ölçümü için en çok kaç ürün sayfası denenecek. */
export const EN_FAZLA_URUN_ADAYI = 3;

/** Parfüm olduğunu söyleyen izler — ürün adında ya da türünde. */
const PARFUM_IZI = /(parfum|perfume|fragrance|cologne|eau de|edp|edt|extrait|elixir|attar|oud|scent|koku)/i;

/**
 * Kalıp kurucu — BİLEREK ters bölü içermiyor.
 *
 * Bu dosya iki kez ters bölü kaçışı yüzünden bozuldu: önce dosyaya gerçek
 * bir backspace baytı yazıldı, sonra JS dizesi içindeki ters-bölü-b kelime
 * sınırı değil backspace KARAKTERİ olduğu için kalıp hiç eşleşmedi. İkinci
 * seferinde hata sessizdi: kalıp vardı, çalışıyor görünüyordu, yalnız
 * hiçbir şeyi tutmuyordu ve mum sayfaları parfüm sanılmaya devam etti.
 *
 * Kelime sınırı ileri/geri bakışla, boşluk da karakter kümesiyle yazılıyor;
 * ikisi de yalnız köşeli parantez kullanıyor, tek bir kaçış yok.
 */
function kelimeKalibi(kelimeler: readonly string[]): RegExp {
  const parcalar = kelimeler.map((k) => {
    const govde = k.split(' ').join('[ _-]*');
    /*
      ⚠️ Çoğul eki isteğe bağlı. Kalıp bunsuz yazıldığında
      "Coffret Savons Parfumés" eşleşmedi — "savon"dan sonra gelen "s"
      kelime sınırını deliyordu — ve bir sabun koffresi sayfası parfüm
      sanılıp mektuba kanıt olarak girdi.
    */
    return '(?<![a-zA-Z])' + govde + '(?:s|es|ler|lar)?(?![a-zA-Z])';
  });
  return new RegExp(parcalar.join('|'), 'i');
}

/**
 * Parfüm OLMADIĞI belli olan ürünler.
 *
 * ⚠️ Bu liste iki ayrı ölçülmüş hatanın karşılığı. Ürün listesinin ilk
 * sırasını körlemesine almak önce xerjoff için bir hediye çantası,
 * marcantoinebarrois için bir kartpostal seti sayfasına bakmak demekti.
 * Liste genişletilince bu kez "Bougie Elixir d'Ambre" (bir MUM) ve
 * "Savon Parfumé Tilia" (bir SABUN) parfüm sanıldı: adlarında "elixir" ve
 * "parfumé" geçiyordu.
 *
 * Aksesuar kontrolü parfüm izinden ÖNCE bakıyor, çünkü bir mumun adında da
 * parfüm kelimesi geçebiliyor. Aksesuar sayfasında öneri bloğu bulunmaması
 * dükkânda bulunmadığı anlamına gelmiyor — üstelik o cümle mektuba girseydi
 * parfüm evine "mumunuza baktım" diye yazılmış olacaktı.
 */
const AKSESUAR_KELIMELERI: readonly string[] = [
  // mum ve ev kokusu
  'candle', 'candles', 'bougie', 'candela', 'kerze', 'mum', 'diffuser',
  'diffuseur', 'difuzor', 'room spray', 'oda spreyi', 'incense', 'tutsu',
  'potpourri', 'home fragrance', 'home',
  // banyo ve vücut
  'savon', 'sabun', 'soap', 'sapone', 'shower', 'douche', 'bath', 'banyo',
  'lotion', 'cream', 'creme', 'krem', 'balm', 'scrub', 'deodorant',
  'shampoo', 'sampuan', 'body',
  // eşya ve hediyelik
  'gift', 'hediye', 'pouch', 'pochette', 'canta', 'tote', 'bag', 'postcard',
  'kartpostal', 'sticker', 'kit', 'set', 't-shirt', 'cap', 'book',
  'coffret', 'cofanetto', 'estuche', 'discovery', 'miniature', 'refill', 'recharge',
  'accessory', 'accessories', 'aksesuar', 'merch',
];
const AKSESUAR_IZI = kelimeKalibi(AKSESUAR_KELIMELERI);


interface ShopifyUrun {
  readonly title?: string;
  readonly handle?: string;
  readonly id?: number;
  readonly product_type?: string;
}
interface ShopifyListe { readonly products?: readonly ShopifyUrun[] }

export interface PlatformOlcumu {
  readonly platform: Platform;
  readonly productCount: number | null;
  /** Sayı tavana dayandıysa gerçek sayı daha büyük. */
  readonly sayiTavanda: boolean;
  /** Segment çıkarımı için ürün adları. */
  readonly urunAdlari: readonly string[];
  /** Benzer-ürün ölçümünün gideceği sayfalar — parfüm olanlar önce. */
  readonly urunAdaylari: readonly string[];
  readonly kanit: readonly { kind: string; url: string; snippet: string; status: number | null }[];
}

const BOS: PlatformOlcumu = {
  platform: 'bilinmiyor', productCount: null, sayiTavanda: false,
  urunAdlari: [], urunAdaylari: [], kanit: [],
};

/**
 * Ölçülecek ürünleri sıralar: önce parfüm olduğu belli olanlar, sonra
 * türü belirsizler; aksesuarlar en sona düşüyor ve başkası varsa hiç
 * seçilmiyor.
 */
export function urunleriSirala(urunler: readonly ShopifyUrun[]): readonly string[] {
  const puan = (u: ShopifyUrun): number => {
    const metin = `${u.title ?? ''} ${u.product_type ?? ''}`;
    if (AKSESUAR_IZI.test(metin)) return 2;
    if (PARFUM_IZI.test(metin)) return 0;
    return 1;
  };
  return urunler
    .filter((u): u is ShopifyUrun & { handle: string } => typeof u.handle === 'string' && u.handle !== '')
    .map((u) => ({ handle: u.handle, p: puan(u) }))
    .sort((a, b) => a.p - b.p)
    .slice(0, EN_FAZLA_URUN_ADAYI)
    .map((u) => u.handle);
}

/** Shopify imzası: /products.json gerçek ürün döndürüyor mu. */
async function shopifyDene(origin: string): Promise<PlatformOlcumu | null> {
  const adlar: string[] = [];
  const kanit: { kind: string; url: string; snippet: string; status: number | null }[] = [];
  const hepsi: ShopifyUrun[] = [];
  let toplam = 0;

  for (let sayfa = 1; sayfa <= EN_FAZLA_SAYFA; sayfa += 1) {
    const url = `${origin}/products.json?limit=${SAYFA_BOYU}&page=${sayfa}`;
    const c = await naziceGetir(url);
    const veri = jsonAyristir<ShopifyListe>(c);
    const urunler = veri?.products;
    if (urunler === undefined) {
      if (sayfa === 1) return null;
      break;
    }
    if (sayfa === 1) {
      kanit.push({
        kind: 'platform',
        url,
        snippet: `products.json HTTP ${c.status}, ilk sayfada ${urunler.length} urun`
          + (urunler[0]?.title === undefined ? '' : `, ornek: ${urunler[0].title}`),
        status: c.status,
      });
    }
    toplam += urunler.length;
    hepsi.push(...urunler);
    for (const u of urunler) if (u.title !== undefined && adlar.length < 200) adlar.push(u.title);
    if (urunler.length < SAYFA_BOYU) {
      return {
        platform: 'shopify', productCount: toplam, sayiTavanda: false,
        urunAdlari: adlar, urunAdaylari: urunleriSirala(hepsi), kanit,
      };
    }
  }
  return {
    platform: 'shopify', productCount: toplam, sayiTavanda: true,
    urunAdlari: adlar, urunAdaylari: urunleriSirala(hepsi), kanit,
  };
}

interface WooUrun { readonly name?: string }

/** WooCommerce imzası: sayfa kaynağındaki eklenti izleri. */
async function wooDene(origin: string, anaSayfa: Cevap): Promise<PlatformOlcumu | null> {
  const izler = anaSayfa.body.match(/woocommerce/gi)?.length ?? 0;
  if (izler < 3) return null;

  const kanit: { kind: string; url: string; snippet: string; status: number | null }[] = [{
    kind: 'platform',
    url: anaSayfa.finalUrl,
    snippet: `ana sayfa kaynaginda ${izler} kez "woocommerce" gecti`,
    status: anaSayfa.status,
  }];

  /*
    Woo'nun mağaza ucu ürün sayısını x-wp-total başlığında veriyor —
    bütün kataloğu indirmeye gerek kalmıyor.
  */
  const url = `${origin}/wp-json/wc/store/v1/products?per_page=1`;
  const c = await naziceGetir(url);
  const toplamBaslik = Number.parseInt(c.headers['x-wp-total'] ?? '', 10);
  const liste = jsonAyristir<readonly WooUrun[]>(c);
  const adlar = Array.isArray(liste) ? liste.flatMap((u) => (u.name === undefined ? [] : [u.name])) : [];
  const sayi = Number.isFinite(toplamBaslik) ? toplamBaslik : null;
  if (sayi !== null) {
    kanit.push({ kind: 'urun-sayisi', url, snippet: `x-wp-total: ${sayi}`, status: c.status });
  }
  return {
    platform: 'woocommerce', productCount: sayi, sayiTavanda: false,
    urunAdlari: adlar, urunAdaylari: [], kanit,
  };
}

export async function olcPlatform(origin: string, anaSayfa: Cevap): Promise<PlatformOlcumu> {
  const shopify = await shopifyDene(origin);
  if (shopify !== null) return shopify;
  const woo = await wooDene(origin, anaSayfa);
  if (woo !== null) return woo;
  if (!anaSayfa.ok) return BOS;
  return { ...BOS, platform: 'diger' };
}
