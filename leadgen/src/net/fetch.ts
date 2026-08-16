/**
 * Nazik getirici — ağa çıkan tek kapı.
 *
 * Bu dosyanın varlık sebebi hız sınırının **unutulamaz** olması. Her modül
 * kendi `fetch`ini çağırsaydı, bir modülün gecikmeyi atlaması bütün boru
 * hattını kaba bir kazıyıcıya çevirirdi ve bunu kimse fark etmezdi.
 */

/** Ana bilgisayar başına ardışık iki istek arasındaki en az süre. */
const HOST_GECIKME_MS = 2500;
/** Tek isteğin en fazla bekleyeceği süre. */
const ZAMAN_ASIMI_MS = 20_000;
/** Belleğe alınacak en büyük gövde — bir ürün listesi bile bunun altında. */
const EN_BUYUK_GOVDE = 4 * 1024 * 1024;

/**
 * ⚠️ Kimliğini söyleyen ama tarayıcı gibi görünen bir dize.
 *
 * Ölçüldü: çıplak `curl` kimliğiyle bazı parfüm siteleri 403 veriyor —
 * deponun kendi dersi bu ("robota kapalı ≠ yok"). Tarayıcı dizesine
 * kimliğimiz ve iletişim adresimiz **ekli**: engellemek isteyen kim
 * olduğumuzu görebilsin diye.
 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
  + 'Chrome/131.0.0.0 Safari/537.36 osmos-leadgen/0.1 (+https://osmos.me)';

/** Bir 429 sonrası aynı isteğin kaç kez daha deneneceği. */
const YENIDEN_DENEME = 2;
/** Retry-After başlığı yoksa kullanılacak taban bekleme. */
const GERI_CEKILME_MS = 10_000;
/** 429 gören bir ana bilgisayarın gecikmesi bu katsayıyla büyüyor. */
const CEZA_KATSAYISI = 3;
/**
 * Ceza gecikmesinin ÜST SINIRI.
 *
 * ⚠️ Bu sınır yokken boru hattı KİLİTLENDİ. Gecikme her 429'da üçe
 * katlanıyordu: 2,5 sn → 7,5 → 22,5 → 67 → 202 → 607. Bir işçi on dakika
 * uyuyabiliyordu ve dört işçinin hepsi böyle takılınca koşu tamamen durdu
 * (beş dakika boyunca tek satır ilerlemedi, ölçüldü).
 *
 * Üstel geri çekilme üst sınırsız yazılırsa geri çekilme değil kilitlenme
 * olur.
 */
const EN_FAZLA_GECIKME_MS = 20_000;
/** Küresel frenin tek seferde bekleteceği en uzun süre. */
const EN_FAZLA_KURESEL_MS = 25_000;

const sonIstek = new Map<string, number>();
/** Ana bilgisayar başına gecikme — 429 görülünce büyüyor, bir daha küçülmüyor. */
const hostGecikmesi = new Map<string, number>();

/**
 * KÜRESEL fren.
 *
 * ⚠️ Ölçüldü ve şaşırtıcıydı: 137 alan adının 56'sı 429 verdi ve hepsi AYRI
 * ana bilgisayardı. Sebep tek tek siteler değil, ortak altyapı — Shopify
 * kendi barındırdığı bütün dükkânlar için tek bir IP'ye göre hız sınırı
 * uyguluyor. Yani "ana bilgisayar başına nezaket" yetmiyor; sekiz FARKLI
 * dükkâna aynı anda gitmek de sınırı deldiriyor.
 *
 * Bu yüzden bir 429 görüldüğünde bütün boru hattı birlikte yavaşlıyor.
 */
let kureselBeklemeSonu = 0;

const uyu = (ms: number): Promise<void> => new Promise((c) => setTimeout(c, ms));

export interface Cevap {
  readonly ok: boolean;
  readonly status: number | null;
  readonly finalUrl: string;
  readonly body: string;
  readonly contentType: string;
  /** Seçili yanıt başlıkları — WooCommerce ürün sayısı `x-wp-total`da geliyor. */
  readonly headers: Readonly<Record<string, string>>;
  /** Ağ katmanında patladıysa sebebi; HTTP hatası bu değil. */
  readonly hata: string | null;
}

/** Aynı ana bilgisayara çok sık gitmemek için bekler; küresel freni de uygular. */
async function hostSirasiniBekle(host: string): Promise<void> {
  const kureselKalan = Math.min(kureselBeklemeSonu - Date.now(), EN_FAZLA_KURESEL_MS);
  if (kureselKalan > 0) await uyu(kureselKalan);

  const gecikme = hostGecikmesi.get(host) ?? HOST_GECIKME_MS;
  const gecen = Date.now() - (sonIstek.get(host) ?? 0);
  if (gecen < gecikme) await uyu(gecikme - gecen);
  sonIstek.set(host, Date.now());
}

/**
 * 429 sonrası: hem o ana bilgisayarı hem bütün boru hattını yavaşlatır.
 *
 * ⚠️ Her iki gecikme de TAVANLI. Sınırsız üstel büyüme geri çekilme değil
 * kilitlenme üretiyor — bir kez üretti.
 */
export function cezaGecikmesi(mevcutMs: number): number {
  return Math.min(mevcutMs * CEZA_KATSAYISI, EN_FAZLA_GECIKME_MS);
}

export function frenBeklemesi(retryAfterSn: number | null): number {
  return Math.min(
    retryAfterSn !== null && retryAfterSn > 0 ? retryAfterSn * 1000 : GERI_CEKILME_MS,
    EN_FAZLA_KURESEL_MS,
  );
}

function frenYap(host: string, retryAfterSn: number | null): number {
  const bekle = frenBeklemesi(retryAfterSn);
  const yeniGecikme = cezaGecikmesi(hostGecikmesi.get(host) ?? HOST_GECIKME_MS);
  hostGecikmesi.set(host, yeniGecikme);
  kureselBeklemeSonu = Math.max(kureselBeklemeSonu, Date.now() + bekle);
  return bekle;
}

export async function naziceGetir(url: string, deneme = 0): Promise<Cevap> {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return { ok: false, status: null, finalUrl: url, body: '', contentType: '', headers: {}, hata: 'gecersiz adres' };
  }
  await hostSirasiniBekle(host);

  try {
    const y = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(ZAMAN_ASIMI_MS),
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/json,application/xhtml+xml,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9,tr;q=0.8',
      },
    });
    /*
      ⚠️ 429 bir RET değil "yavaşla" demek. Kalıcı hata gibi işlenirse
      ulaşılabilir dükkânlar listeden düşer — ölçümde tam olarak bu oldu,
      56 aday boşuna kaybedilmişti.
    */
    if (y.status === 429 && deneme < YENIDEN_DENEME) {
      const basligi = Number(y.headers.get('retry-after'));
      const bekle = frenYap(host, Number.isFinite(basligi) ? basligi : null);
      await uyu(bekle);
      return naziceGetir(url, deneme + 1);
    }
    if (y.status === 429) frenYap(host, null);

    const ham = await y.text();
    return {
      ok: y.ok,
      status: y.status,
      finalUrl: y.url === '' ? url : y.url,
      body: ham.slice(0, EN_BUYUK_GOVDE),
      contentType: y.headers.get('content-type') ?? '',
      headers: Object.fromEntries([...y.headers].map(([k, v]) => [k.toLowerCase(), v])),
      hata: null,
    };
  } catch (e) {
    /*
      ⚠️ Sessizce yutulmuyor. Sebep `notes` sütununa yazılıyor ki rapordaki
      "ulaşılamadı" satırı "site yok" ile "bizim zaman aşımımız"ı ayırabilsin.
    */
    return {
      ok: false, status: null, finalUrl: url, body: '', contentType: '', headers: {},
      hata: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    };
  }
}

/** JSON bekleyen çağrılar için: ayrıştırılamazsa `null`, patlamaz. */
export function jsonAyristir<T>(c: Cevap): T | null {
  if (!c.ok || !c.contentType.includes('json')) return null;
  try {
    return JSON.parse(c.body) as T;
  } catch {
    return null;
  }
}
