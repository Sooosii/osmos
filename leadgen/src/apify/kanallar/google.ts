/**
 * Google arama kanalı — gömülebilir site bulmanın en ucuz yolu.
 *
 * Actor: `scraperlink/google-search-results-serp-scraper`
 * $0.0005 / SERP sayfası (10 sonuç) · %99,97 başarı · 29M koşu · 4,84/5.
 * Resmî `apify/google-search-scraper` aynı işi 3,6 kat pahalıya yapıyordu.
 *
 * ⚠️ Sorgu üretici ve sonuç ayrıştırıcı SAF: ağ yok, token yok. Böylece
 * "kaç sorgu üretiliyor, hepsi tekil mi, alan adı doğru çıkıyor mu" soruları
 * tek kuruş harcamadan sınanabiliyor.
 */
import { normalizeDomain } from '../../domain.ts';
import { elemedenGecer } from './eleme.ts';

export interface Sorgu {
  readonly metin: string;
  /** Google ülke kodu (`gl`) — sonuçları o pazara yaklaştırıyor. */
  readonly ulke: string;
  /** Arayüz dili (`hl`). */
  readonly dil: string;
}

interface TerimKumesi {
  readonly dil: string;
  readonly terimler: readonly string[];
  readonly pazarlar: readonly string[];
  readonly niyetler: readonly string[];
}

/**
 * Terimler dile bağlı, pazarlar da dile.
 *
 * ⚠️ Çapraz çarpım körlemesine yapılmıyor: Türkçe sorguyu Suudi Arabistan'da
 * aratmak hem para hem sonuç kalitesi kaybı. Her dil yalnız konuşulduğu
 * pazarlara gidiyor. Körfez'de İngilizce aranıyor — nis parfüm ticareti
 * orada İngilizce yürüyor.
 */
const KUMELER: readonly TerimKumesi[] = [
  {
    dil: 'en',
    terimler: [
      'perfume decants', 'fragrance decants', 'perfume samples', 'niche perfume samples',
      'perfume decant shop', 'fragrance samples store', 'niche fragrance boutique',
      'indie perfume shop', 'perfume discovery set', 'artisanal perfume store',
      'independent perfumery', 'perfume atomizer samples',
    ],
    pazarlar: ['us', 'gb', 'ae', 'sa', 'qa', 'kw', 'nl'],
    niyetler: ['', 'buy online', 'online store'],
  },
  {
    dil: 'tr',
    terimler: [
      'parfüm dekant', 'parfüm numune satış', 'dekant parfüm mağaza',
      'niş parfüm satış', 'parfüm şişeleme satın al', 'butik parfüm dükkanı',
    ],
    pazarlar: ['tr'],
    niyetler: ['', 'online sipariş'],
  },
  {
    dil: 'de',
    terimler: ['parfum abfüllungen', 'parfum proben kaufen', 'nischenparfum shop'],
    pazarlar: ['de', 'at', 'ch'],
    niyetler: ['', 'online kaufen'],
  },
  {
    dil: 'fr',
    terimler: ['décants parfum', 'échantillons parfum boutique', 'parfumerie de niche'],
    pazarlar: ['fr', 'be'],
    niyetler: ['', 'acheter en ligne'],
  },
  {
    dil: 'it',
    terimler: ['decant profumi', 'campioni profumo shop', 'profumeria artigianale'],
    pazarlar: ['it'],
    niyetler: ['', 'acquista online'],
  },
  {
    dil: 'es',
    terimler: ['decants de perfume', 'muestras de perfume tienda', 'perfumería nicho'],
    pazarlar: ['es', 'mx'],
    niyetler: ['', 'comprar online'],
  },
];

/**
 * Altyapıya doğrudan nişan alan sorgular.
 *
 * ⚠️ En verimli sorgular bunlar: `myshopify.com` alan adı zaten Shopify
 * demek, yani gömülebilir olduğu baştan biliniyor ve dükkân-olmayan
 * ayıklayıcısından geçmesi kesin.
 */
const ALTYAPI_SORGULARI: readonly string[] = [
  'site:myshopify.com perfume decant',
  'site:myshopify.com perfume samples',
  'site:myshopify.com niche perfume',
  'site:myshopify.com fragrance decants',
  'site:myshopify.com parfum',
  '"powered by shopify" perfume decants',
  '"powered by shopify" niche fragrance',
  'inurl:products perfume decant 5ml',
  'inurl:collections decants fragrance',
  '"add to cart" perfume decant 10ml',
];

/** Bütün sorgu kümesini üretir — tekilleştirilmiş ve kararlı sırada. */
export function sorgulariUret(): readonly Sorgu[] {
  const gorulen = new Set<string>();
  const sorgular: Sorgu[] = [];

  const ekle = (metin: string, ulke: string, dil: string): void => {
    const duz = metin.replace(/\s+/g, ' ').trim();
    const anahtar = `${duz}|${ulke}`;
    if (duz === '' || gorulen.has(anahtar)) return;
    gorulen.add(anahtar);
    sorgular.push({ metin: duz, ulke, dil });
  };

  for (const kume of KUMELER) {
    for (const terim of kume.terimler) {
      for (const pazar of kume.pazarlar) {
        for (const niyet of kume.niyetler) {
          ekle(`${terim} ${niyet}`, pazar, kume.dil);
        }
      }
    }
  }
  for (const s of ALTYAPI_SORGULARI) ekle(s, 'us', 'en');
  return sorgular;
}

/**
 * Actor girdisi — GERÇEK şemadan türetildi, tahminle değil.
 *
 * ⚠️ İlk sürümde `queries: string[]` gönderilmişti ve actor HTTP 400 verdi.
 * Şema (`/builds/default` ucundan okundu) şunu söylüyor:
 *   keyword → tek bir STRING, "her satıra bir sorgu"
 *   limit   → STRING, sonuç sayısı ya da 'all'
 *   gl/hl   → tek bir ülke ve dil, yani bir koşu = bir pazar
 *
 * Son madde yüzünden sorgular ülkeye göre gruplanıyor: Türkçe sorguyu
 * Almanya sonuçlarıyla karıştırmamanın tek yolu bu.
 */
export function actorGirdisi(sorgular: readonly Sorgu[], sonucSayisi: number): Record<string, unknown> {
  const ilk = sorgular[0];
  /*
    ⚠️ Resmî actor şeması: queries her satıra bir sorgu, ülke kodu KÜÇÜK
    harf (önceki actor BÜYÜK istiyordu — biçim tahminle değil
    `/builds/default` ucundan okunarak yazılıyor).
  */
  return {
    queries: sorgular.map((s) => s.metin).join(String.fromCharCode(10)),
    maxPagesPerQuery: Math.max(1, Math.ceil(sonucSayisi / 10)),
    resultsPerPage: 10,
    countryCode: ilk?.ulke ?? "us",
    languageCode: ilk?.dil ?? "en",
    mobileResults: false,
  };
}

/** Sorguları ülkesine göre gruplar — bir koşu bir pazar. */
export function ulkeyeGoreGrupla(sorgular: readonly Sorgu[]): ReadonlyMap<string, readonly Sorgu[]> {
  const gruplar = new Map<string, Sorgu[]>();
  for (const s of sorgular) {
    const mevcut = gruplar.get(s.ulke);
    if (mevcut === undefined) gruplar.set(s.ulke, [s]);
    else mevcut.push(s);
  }
  return gruplar;
}

/**
 * Actor'ın döndürdüğü kayıt.
 *
 * ⚠️ Düz bir sonuç listesi DEĞİL: her kayıt bir SERP **sayfası** ve asıl
 * sonuçlar `results` dizisinin içinde. İlk sürüm düz liste bekliyordu ve
 * sessizce sıfır aday çıkarıyordu — hata vermiyordu, sadece boş dönüyordu.
 * Biçim gerçek bir koşunun çıktısına bakılarak düzeltildi.
 */
export interface SerpSonucu {
  readonly url?: string;
  readonly title?: string;
  readonly description?: string;
  readonly position?: number;
}

export interface SerpKaydi {
  /** Resmî actor'ın biçimi. */
  readonly searchQuery?: unknown;
  readonly organicResults?: readonly SerpSonucu[];
  /** Önceki actor'ın biçimi — geriye dönük destek. */
  readonly page_number?: number;
  readonly search_term?: string;
  readonly results?: readonly SerpSonucu[];
  /** Düz biçim: actor değişirse sessizce boşalmasın. */
  readonly url?: string;
  readonly link?: string;
  readonly title?: string;
  /** Actor'ın kendi hata satırı — sessizce yutulmamalı. */
  readonly error?: string;
}

/**
 * Actor'ın kendi hata döndürdüğü kayıtları sayar.
 *
 * ⚠️ Bu sayaç olmadan bir tam koşu sessizce boşa gitti. Actor aylık ücretsiz
 * sınırına çarpınca her kayıt yerine
 * `{"error":"Free monthly limit reached…"}` döndürmeye başladı; Apify hata
 * vermedi, koşu "başarılı" göründü, 333 kayıt geldi ve sıfır aday çıktı.
 * Veri içindeki hata SAYILMAZSA boş sonuç başarıya benziyor.
 */
export function hataliKayitlar(kayitlar: readonly SerpKaydi[]): readonly string[] {
  const hatalar: string[] = [];
  for (const k of kayitlar) {
    if (typeof k.error === 'string' && k.error !== '') hatalar.push(k.error);
  }
  return hatalar;
}

/** Sayfa kayıtlarını düz sonuç listesine açar. */
export function sonuclariDuzlestir(kayitlar: readonly SerpKaydi[]): readonly SerpSonucu[] {
  const duz: SerpSonucu[] = [];
  for (const k of kayitlar) {
    if (Array.isArray(k.organicResults)) {
      duz.push(...k.organicResults);
      continue;
    }
    if (Array.isArray(k.results)) {
      duz.push(...k.results);
      continue;
    }
    const url = k.url ?? k.link;
    if (url !== undefined) duz.push({ url, title: k.title });
  }
  return duz;
}

export interface Aday {
  readonly domain: string;
  readonly shopName: string;
  readonly seedUrl: string;
  readonly kaynak: string;
}

export interface HasatSonucu {
  readonly adaylar: readonly Aday[];
  readonly elenen: number;
  readonly tekrar: number;
  /** Elenme sebeplerinin sayımı — raporda hangi çöpün ne kadar geldiği görünsün. */
  readonly sebepler: ReadonlyMap<string, number>;
}

/** SERP kayıtlarını tekil, elenmiş aday listesine çevirir. */
export function serptenAdaylar(kayitlar: readonly SerpKaydi[], kaynak = 'google'): HasatSonucu {
  const adaylar = new Map<string, Aday>();
  const sebepler = new Map<string, number>();
  let elenen = 0;
  let tekrar = 0;

  for (const k of sonuclariDuzlestir(kayitlar)) {
    const url = k.url ?? null;
    if (url === null) continue;
    const domain = normalizeDomain(url);
    if (domain === null) continue;

    const eleme = elemedenGecer(domain, url);
    if (!eleme.gecti) {
      elenen += 1;
      const anahtar = (eleme.sebep ?? 'bilinmiyor').split(':')[0] ?? 'bilinmiyor';
      sebepler.set(anahtar, (sebepler.get(anahtar) ?? 0) + 1);
      continue;
    }
    if (adaylar.has(domain)) {
      tekrar += 1;
      continue;
    }
    adaylar.set(domain, {
      domain,
      shopName: (k.title ?? '').replace(/\s+/g, ' ').trim().slice(0, 120),
      seedUrl: url,
      kaynak,
    });
  }
  return { adaylar: [...adaylar.values()], elenen, tekrar, sebepler };
}
