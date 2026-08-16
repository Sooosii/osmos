/**
 * `outreach.csv` — iletişim kanalı olan HER aday için taslak.
 *
 * ⚠️ BU DOSYANIN TEK KURALI: cümledeki her somut ayrıntı, veritabanındaki bir
 * kanıt satırından gelir. Kanıt yoksa cümle **yazılmaz**, boş bırakılır.
 * Sahibin "isim uydurulmayacak" kuralının koda çevrilmiş halidir. Uydurulmuş
 * tek bir ayrıntı ilk cevapta yakalanır ve bütün kampanyayı yakar.
 *
 * ⚠️ Artık ilk 50 değil, ULAŞILABİLEN HERKES yazılıyor. Sahibin kararı:
 * *"5000'den 10 tane mesaj alırsın, 1000'den 1; ne kadar çok o kadar iyi."*
 * Kaç kişiye yazılacağı sahibin kararı, listenin sonu değil.
 *
 * ⚠️ Üretilen Türkçe metinde büyük İ harfi geçmez (sahibin kesin kuralı).
 */
import type { DatabaseSync } from 'node:sqlite';
import { kanitlar, tumLeadler } from '../db.ts';
import type { Evidence, Lead } from '../types.ts';
import { csvYaz } from './csv.ts';

export type Dil = 'tr' | 'en';
export type Kanal = 'dm' | 'mail' | 'yok';

/** Ülkesi Türkiye olana Türkçe, kalanına İngilizce yazılıyor. */
export function dilSec(country: string | null): Dil {
  return country === 'TR' ? 'tr' : 'en';
}

/**
 * Hangi kanaldan gidilecek.
 *
 * ⚠️ Sıra hafızadan geliyor ve sahibin durumuna dayanıyor: *"e-posta
 * Türkiye'de tek başına zayıf kanal: Instagram DM, sonra mail, sonra
 * telefon."* Sahip yeni ve markası tanınmıyor; tanınmayan bir alan adından
 * gelen soğuk mail açılmıyor bile, DM açılıyor.
 */
export function kanalSec(lead: Pick<Lead, 'email' | 'instagram' | 'country'>): Kanal {
  const dmVar = lead.instagram !== null && lead.instagram !== '';
  const mailVar = lead.email !== null && lead.email !== '';
  if (dmVar && (lead.country === 'TR' || !mailVar)) return 'dm';
  if (mailVar) return 'mail';
  return dmVar ? 'dm' : 'yok';
}

export interface Acilis {
  readonly cumle: string;
  readonly kaynakUrl: string;
  /** DM'e sığacak kısa hali — adres yerine ne görüldüğü yazılıyor. */
  readonly kisa: string;
}

/**
 * Açılış cümlesi — yalnız kanıta dayanarak.
 *
 * ⚠️ SIRALAMA DEĞİŞTİ. Önceki sürümde en üstteki gözlem "ürün sayfanızda
 * öneri bloğu yok"tu ve o cümle bir WIDGET satıyordu. Sahibin kararıyla
 * satılan şey değişti: müşterinin kendi katalogu, kendi markası ve kendi
 * adresiyle çalışan bir harita sitesi. O ürün için doğru gözlem farklı —
 * kaç parfümün TEK BİR LİSTEDE durduğu.
 *
 * ⚠️ `benzer-urun` kanıtı hâlâ toplanıyor ve veritabanında duruyor ama
 * açılış cümlesine GİRMİYOR: yanlış ürünü ima ederdi.
 */
export function acilisCumlesi(lead: Lead, kanit: readonly Evidence[], dil: Dil): Acilis | null {
  const bul = (kind: string): Evidence | undefined => kanit.find((k) => k.kind === kind);

  const platformKanit = bul('platform');
  if (lead.product_count !== null && platformKanit !== undefined) {
    const n = lead.product_count;
    /*
      ⚠️ Adres MÜŞTERİYE GİTMİYOR, yalnız `kaynakUrl`de duruyor: sayı
      `products.json` ucundan geliyor ve o adresi mektuba koymak "sizin
      API'nizi taradım" gibi okunuyor.
    */
    return {
      kaynakUrl: platformKanit.url,
      cumle: dil === 'tr'
        ? `Kataloğunuzda ${n} parfüm saydım ve hepsi tek bir listede duruyor.`
        : `I counted ${n} fragrances in your catalogue, all of them in a single list.`,
      kisa: dil === 'tr'
        ? `kataloğunuzdaki ${n} parfümü saydım`
        : `I counted the ${n} fragrances in your catalogue`,
    };
  }

  const ana = bul('ana-sayfa');
  if (ana !== undefined && ana.snippet.trim() !== '') {
    return {
      kaynakUrl: ana.url,
      cumle: dil === 'tr'
        ? `${ana.url} adresindeki dükkânınızı gezdim ("${ana.snippet}").`
        : `I browsed your shop at ${ana.url} ("${ana.snippet}").`,
      kisa: dil === 'tr' ? 'dükkânınızı gezdim' : 'I browsed your shop',
    };
  }
  return null;
}

const KONU = {
  tr: 'kataloğunuz için bir koku haritası — ücretsiz örnek',
  en: 'a scent map for your catalogue — a free sample',
} as const;

/**
 * Güven cümlesi — ŞİRKET YERİNE ÜRÜN.
 *
 * ⚠️ Sahibin aile şirketi bu işle ilgisiz bir sektörde; adı anıldığı anda
 * "bunun parfümle ne işi var" sorusunu doğurur ve güveni ZAYIFLATIR. Onun
 * yerine dükkân sahibinin beş saniyede kendi gözüyle doğrulayabileceği bir
 * sayı konuyor. Sayı her koşuda kataloğdan sayılıyor, elle yazılmıyor —
 * eskiyen bir sayı, doğrulanabilir olsun diye konmuş cümleyi yalana çevirir.
 *
 * Şirket yalnız fatura aşamasında konuşulur, açılış cümlesinde değil.
 */
export function guvenCumlesi(parfumSayisi: number, dil: Dil): string {
  return dil === 'tr'
    ? `Bugün ${parfumSayisi} parfüm notalarına göre haritalanmış durumda.`
    : `Right now ${parfumSayisi} fragrances are mapped by their notes.`;
}

/**
 * Yalnız jenerik kelimelerden oluşan bir ad, ad değildir.
 *
 * "Natürliches Parfum" (Almanca "doğal parfüm") bir marka değil bir tarif;
 * onunla selamlamak ("Merhaba Doğal Parfüm!") mektubu robot gibi gösteriyor.
 */
const JENERIK_AD = new Set([
  'parfum', 'parfums', 'parfüm', 'parfümler', 'perfume', 'perfumes', 'perfumery',
  'fragrance', 'fragrances', 'scent', 'scents', 'shop', 'store', 'online',
  'boutique', 'natural', 'naturliches', 'natürliches', 'niche', 'the', 'and',
  'home', 'official', 'welcome', 'buy', 'best',
  /*
    ⚠️ Sayfa başlığı bazen ÜRÜN adı taşıyor: `bibliotheque-de-parfum.ua`
    için "Discovery Set" çıktı ve mektup "Hello Discovery Set," diye
    başlayacaktı. Katalog/ürün sözcükleri de jenerik sayılıyor.
  */
  'discovery', 'set', 'sets', 'collection', 'collections', 'catalog',
  'catalogue', 'products', 'product', 'sample', 'samples', 'decant',
  'decants', 'sale', 'new', 'gift', 'kit', 'bundle', 'ml',
]);

/**
 * Sayfa başlığından kullanılabilir bir hitap çıkarır.
 *
 * ⚠️ Ham başlık DOĞRUDAN kullanılamıyor ve bunu çıktıya bakınca gördüm:
 * "Hi Alkemia Perfumes: Unique Indie Perfumes and Fragrances ...!" diye bir
 * DM gidiyordu. Başlık bir ad değil bir tanıtım cümlesi; üç noktası bile
 * duruyordu.
 *
 * Kural: ilk ayraca kadar al, çok uzunsa ya da hepsi jenerik kelimeyse
 * hitabı TAMAMEN düşür. Adsız "Merhaba," robot gibi bir addan iyidir.
 */
export function temizAd(ham: string | null): string | null {
  if (ham === null) return null;
  const ilk = ham.split(/[|:·—]| - | – /)[0] ?? '';
  const ad = ilk.replace(/\.\.\.$/, '').replace(/[\s,.\-–—]+$/, '').trim();
  if (ad === '' || ad.length > 28) return null;

  const kelimeler = ad.split(/\s+/);
  if (kelimeler.length > 3) return null;
  if (kelimeler.every((k) => JENERIK_AD.has(k.toLowerCase().replace(/[^\p{L}]/gu, '')))) return null;
  return ad;
}

function hitapAdi(lead: Lead): string {
  const ad = temizAd(lead.shop_name);
  return ad === null ? '' : ` ${ad}`;
}

/**
 * Mektup gövdesi — sahibin verdiği iskelet: tanıt, osmos.me tek cümle,
 * fayda, 2 haftalık ücretsiz pilot, tek soru, opt-out. Abartılı pazarlama
 * dili yok.
 */
export function mektupGovdesi(lead: Lead, acilis: Acilis | null, dil: Dil, parfumSayisi: number): string {
  const hitap = hitapAdi(lead);
  const gozlem = acilis === null ? '' : `${acilis.cumle}\n\n`;

  if (dil === 'tr') {
    return [
      `Merhaba${hitap},`,
      '',
      'Ben Soroush, osmos.me adresindeki koku haritasını geliştiriyorum.',
      '',
      'OSMOS parfümleri notalarına göre haritalıyor: ziyaretçi listede arama'
      + ' yapmak yerine bir parfümden kokuca yakın olanlara geçerek geziniyor.'
      + ` ${guvenCumlesi(parfumSayisi, dil)}`,
      '',
      `${gozlem}Aynısını sizin kataloğunuzla kurabiliyorum: sizin parfümleriniz,`
      + ' sizin markanız, kendi adresiniz altında. Ziyaretçiniz bir ürün listesi'
      + ' yerine keşif alanında dolaşıyor.',
      '',
      'Ücretsiz bir örnek hazırlayabilirim: kataloğunuzdan bir seçkiyle kurup'
      + ' adresini gönderirim, beğenmezseniz aynı gün kaldırırım.',
      '',
      'Bakmak ister misiniz?',
      '',
      'Soroush · osmos.me',
      'Bu yazışmayı sürdürmek istemezseniz "listeden çıkar" diye yanıt vermeniz yeterli;'
      + ' bir daha yazmam.',
    ].join('\n');
  }
  return [
    `Hello${hitap},`,
    '',
    'I am Soroush, and I build the scent map at osmos.me.',
    '',
    'OSMOS maps fragrances by their notes: instead of searching a list, a visitor'
    + ' moves from one perfume to the ones that actually smell close to it.'
    + ` ${guvenCumlesi(parfumSayisi, dil)}`,
    '',
    `${gozlem}I can build the same thing from your catalogue: your fragrances,`
    + ' your brand, under your own address. Your visitor wanders a map instead'
    + ' of scrolling a product list.',
    '',
    'I can put together a free sample: I build it from a selection of your'
    + ' catalogue and send you the link, and take it down the same day if you'
    + ' do not like it.',
    '',
    'Would you like to see it?',
    '',
    'Soroush · osmos.me',
    'If you would rather not hear from me, reply "unsubscribe" and I will not write again.',
  ].join('\n');
}

/**
 * Instagram DM taslağı — mektuptan BAMBAŞKA yazılıyor.
 *
 * ⚠️ DM'e mektup yapıştırmak en hızlı engellenme yolu. Üç kısa cümle, tek
 * adres, tek soru. Opt-out cümlesi yok: Instagram'da engelleme ve sessize
 * alma zaten bir tık, mektuptaki cümle burada yer kaplamaktan başka bir işe
 * yaramıyor.
 */
export function dmTaslagi(lead: Lead, acilis: Acilis | null, dil: Dil): string {
  const hitap = hitapAdi(lead);
  const gozlem = acilis === null ? '' : `${acilis.kisa} — `;
  if (dil === 'tr') {
    return `Merhaba${hitap}! ${gozlem}osmos.me'de parfümleri notalarına göre`
      + ' gezilebilir bir haritaya çeviriyorum. Aynısını sizin kataloğunuzla,'
      + ' sizin markanızla kurabilirim; ücretsiz bir örnek hazırlayıp adresini'
      + ' göndereyim mi?';
  }
  return `Hi${hitap}! ${gozlem}I turn fragrance catalogues into a map you can`
    + ' wander by scent — osmos.me. I can build the same from your catalogue under'
    + ' your own brand; shall I put together a free sample and send you the link?';
}

const BASLIKLAR = [
  'sira', 'domain', 'shop_name', 'skor', 'segment', 'olcek', 'platform', 'ulke',
  'kanal', 'email', 'instagram', 'dil', 'konu', 'acilis_cumlesi', 'kanit_url',
  'mektup_govdesi', 'dm_taslagi',
] as const;

export interface OutreachOzeti {
  readonly yazilan: number;
  readonly kanitsiz: number;
  readonly dm: number;
  readonly mail: number;
}

export function yazOutreachCsv(db: DatabaseSync, yol: string, parfumSayisi: number): OutreachOzeti {
  /*
    Süzgeç bilerek dar: yalnız hiçbir kanalı olmayanlar dışarıda kalıyor.
    Ölçek, puan ya da marka büyüklüğü hiçbir satırı elemiyor — sahibin
    açık kararı.
  */
  const secilenler = tumLeadler(db).filter((l) => kanalSec(l) !== 'yok');

  let kanitsiz = 0;
  let dm = 0;
  let mail = 0;
  const satirlar = secilenler.map((l, i) => {
    const dil = dilSec(l.country);
    const kanal = kanalSec(l);
    if (kanal === 'dm') dm += 1;
    else mail += 1;
    const acilis = acilisCumlesi(l, kanitlar(db, l.id as number), dil);
    if (acilis === null) kanitsiz += 1;
    return [
      i + 1, l.domain, l.shop_name, l.score, l.segment, l.olcek, l.platform, l.country,
      kanal, l.email, l.instagram, dil, KONU[dil],
      acilis?.cumle ?? '', acilis?.kaynakUrl ?? '',
      mektupGovdesi(l, acilis, dil, parfumSayisi),
      kanal === 'dm' ? dmTaslagi(l, acilis, dil) : '',
    ];
  });
  csvYaz(yol, BASLIKLAR, satirlar);
  return { yazilan: satirlar.length, kanitsiz, dm, mail };
}
