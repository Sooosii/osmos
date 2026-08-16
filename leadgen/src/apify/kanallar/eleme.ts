/**
 * Dükkân-olmayan ayıklayıcı — Apify sonuçlarının önündeki ilk kapı.
 *
 * ⚠️ Bu modül olmadan bütçe çöpe gider. Ham Google sonuçlarının büyük kısmı
 * dükkân değil: Fragrantica, Reddit, YouTube, Wikipedia, haber siteleri.
 * Bunlar veritabanına girerse zenginleştirici her birini tek tek gezer —
 * 3.000 alan adının yarısı çöpse **saatler** boşa gider ve rapor şişer.
 *
 * ⚠️ ELENENLE ELENMEYEN ARASINDAKİ ÇİZGİ, sahibin kararına göre çizildi:
 *
 *   ELENIR  → satılamayacak yerler. Ya işletme değil (Wikipedia, Reddit),
 *             ya da işletme ama widget gömülemez (Amazon, eBay, Trendyol —
 *             pazar yerinin ürün sayfası bizim değil).
 *   KALIR   → **büyük parfüm evleri.** Sahip elemeyi açıkça reddetti:
 *             *"ne kadar daha çok markayla evle iletişime geçersek daha iyi."*
 *             Dior da Amouage da listede kalıyor; ölçek yalnız bir sütun.
 */

/** Satılamayacak alan adları — kayıtlı alan adı (eTLD+1) üstünden eşleşir. */
const ELENEN_ALANLAR: ReadonlySet<string> = new Set([
  // topluluk ve bilgi siteleri — işletme değil
  'fragrantica.com', 'basenotes.com', 'parfumo.com', 'parfumo.net', 'wikiparfum.com',
  'fragrantica.net', 'nstperfume.com', 'cafleurebon.com', 'fragrancex.com.au',
  // sosyal ağlar
  'reddit.com', 'youtube.com', 'youtu.be', 'instagram.com', 'facebook.com',
  'twitter.com', 'x.com', 'tiktok.com', 'pinterest.com', 'linkedin.com',
  'tumblr.com', 'quora.com', 'medium.com', 'threads.net', 'vk.com', 'telegram.me',
  /*
    ⚠️ Üretilen listeye bakınca çıkan kaçaklar. `threads.net` listedeydi ama
    Meta alan adını `threads.com`a taşıdı — bir mecranın alan adı değişince
    kural sessizce delinir.
  */
  'threads.com', 'snapchat.com', 'whatsapp.com', 'discord.com', 'twitch.tv',
  /*
    ⚠️ Yazılım/uygulama platformları. `apkpure.net` listeye Google'dan girdi:
    "Kiss of Aroma" adında bir UYGULAMA var ve arama onu parfüm sandı.
  */
  'apkpure.net', 'apkpure.com', 'apkmirror.com', 'softonic.com',
  /*
    ⚠️ Posta sağlayıcıları. Kimsenin dükkânı değil; listeye bir yerden
    `gmail.com` alan adı olarak sızdı.
  */
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'gmx.de',
  // pazar yerleri — işletme ama widget gömülemez
  'faire.com', 'ankorstore.com',
  'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it', 'amazon.es',
  'amazon.ae', 'amazon.sa', 'amazon.ca', 'amazon.com.tr', 'amazon.nl',
  'ebay.com', 'ebay.co.uk', 'ebay.de', 'aliexpress.com', 'alibaba.com',
  'etsy.com', 'walmart.com', 'target.com', 'costco.com', 'noon.com', 'jumia.com',
  'trendyol.com', 'hepsiburada.com', 'n11.com', 'gittigidiyor.com', 'sahibinden.com',
  'ciceksepeti.com', 'mercadolibre.com', 'rakuten.com', 'temu.com', 'shein.com',
  'poshmark.com', 'mercari.com', 'depop.com', 'vinted.com', 'shopee.com',
  // arama, karşılaştırma, değerlendirme
  'google.com', 'bing.com', 'duckduckgo.com', 'yandex.com', 'pricerunner.com',
  'idealo.de', 'trustpilot.com', 'sitejabber.com', 'yelp.com', 'glassdoor.com',
  // basın ve dergiler
  'nytimes.com', 'vogue.com', 'gq.com', 'harpersbazaar.com', 'allure.com',
  'byrdie.com', 'refinery29.com', 'cosmopolitan.com', 'elle.com', 'esquire.com',
  'forbes.com', 'businessinsider.com', 'theguardian.com', 'wwd.com', 'bbc.com',
  // altyapı ve geliştirici
  'wikipedia.org', 'wikimedia.org', 'github.com', 'stackoverflow.com',
  'shopify.com', 'myshopify.com', 'wordpress.com', 'wix.com', 'squarespace.com',
  'bigcommerce.com', 'bigcartel.com', 'ecwid.com', 'storenvy.com', 'wixsite.com',
  'linktr.ee', 'beacons.ai', 'bit.ly', 'goo.gl', 'archive.org', 'issuu.com',
  // mesajlasma ve kisayol adresleri — dukkan degil, gecis noktasi
  'wa.me', 'whatsapp.com', 'api.whatsapp.com', 't.me', 'm.me', 'messenger.com',
  'youtu.be', 'lnkd.in', 'g.page', 'maps.app.goo.gl', 'wa.link',
]);

/** Alan adı gövdesinde geçince eleyen parçalar. */
const ELENEN_PARCALAR: readonly string[] = [
  'wikipedia', 'blogspot', 'wordpress.com', 'weebly', 'webnode',
  'pinterest.', 'facebook.', 'google.', 'amazon.',
  /*
    ⚠️ Pazar yerleri her ülkede ayrı uzantıyla çıkıyor: `ubuy` tek bir
    koşuda `ubuy.co.tz`, `ubuy.com.bo`, `ubuy.com.jm` diye üç kez aday
    oldu. Tam alan adı listesi yetmiyor, marka adı üstünden eleniyor.
  */
  'ubuy.', 'shopee.', 'jumia.', 'lazada.', 'daraz.', 'noon.',
  'alibaba.', 'aliexpress.', 'ebay.', 'walmart.', 'etsy.', 'temu.',
  'trendyol.', 'hepsiburada.', 'n11.', 'gittigidiyor.', 'dolap.',
  /*
    ⚠️ Altyapı sağlayıcıları da dükkân değil. `shopier.com` listeye girdi:
    Türkiye'de binlerce küçük satıcının üstünde durduğu bir platform, yani
    müşteri değil MECRA. Aynı sebeple Wix, Ecwid, BigCartel de dışarıda.
    Bunlara mektup yazmak, ev sahibine "kiracınıza bir şey satabilir miyim"
    diye sormak gibi olurdu.
  */
  'shopier.', 'ideasoft.', 'ticimax.', 'tsoft.', 'weebly.',
  'squarespace.', 'gumroad.', 'payhip.', 'sellfy.',
  'woocommerce.', 'prestashop.', 'magento.', 'opencart.',
];

/*
  ⚠️ Platform ADI kalıp olarak elenmiyor, çünkü hedef kitlemizin bir kısmı
  tam da orada oturuyor: `kucukdukkan.myshopify.com` gerçek bir dükkân,
  `myshopify.com` ise platformun kendisi. Çıplak hali `ELENEN_ALANLAR`da,
  alt alan adları serbest. Bir sınama bunu tutuyor — kalıp olarak elemek
  en küçük müşterileri listeden silerdi.
*/

/** Sayfa yolunda geçince eleyen kalıplar — makale, forum, video. */
const ELENEN_YOLLAR: readonly RegExp[] = [
  /\/wiki\//i, /\/r\//i, /\/watch/i, /\/questions\//i, /\/forum/i,
  /\/blog\//i, /\/news\//i, /\/article/i, /\/topic\//i, /\/thread/i,
];

/** Dükkân olmadığı kesin olan üst düzey alan adları. */
const ELENEN_UZANTILAR: readonly string[] = ['.gov', '.edu', '.mil', '.int'];

export interface ElemeSonucu {
  readonly gecti: boolean;
  /** Elendiyse sebebi — rapora ve `notes`a yazılıyor, sessiz atılmıyor. */
  readonly sebep: string | null;
}

const GECTI: ElemeSonucu = { gecti: true, sebep: null };

/**
 * Aday alan adı zenginleştirmeye girmeli mi.
 *
 * @param domain kayıtlı alan adı (eTLD+1), küçük harf
 * @param url sonucun tam adresi — yol kalıpları buradan bakılıyor
 */
export function elemedenGecer(domain: string, url: string | null): ElemeSonucu {
  if (ELENEN_ALANLAR.has(domain)) {
    return { gecti: false, sebep: `satilamaz alan adi: ${domain}` };
  }
  for (const uzanti of ELENEN_UZANTILAR) {
    if (domain.endsWith(uzanti)) return { gecti: false, sebep: `kurum uzantisi: ${uzanti}` };
  }
  for (const parca of ELENEN_PARCALAR) {
    if (domain.includes(parca)) return { gecti: false, sebep: `elenen parca: ${parca}` };
  }
  if (url !== null) {
    for (const kalip of ELENEN_YOLLAR) {
      if (kalip.test(url)) return { gecti: false, sebep: `dukkan olmayan yol: ${String(kalip)}` };
    }
  }
  return GECTI;
}
