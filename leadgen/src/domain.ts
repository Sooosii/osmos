/**
 * Alan adı normalleştirme — tekilleştirmenin tek doğruluk kaynağı.
 *
 * ⚠️ Neden ham ana bilgisayar adı yetmiyor: kataloğun içinde
 * `us.diptyqueparis.com` ve `diptyqueparis.com` ayrı ayrı geçiyor. İkisi de
 * **aynı işletme**; ayrı satır olarak dururlarsa aynı dükkâna iki mektup
 * yazılır. Bu yüzden anahtar kayıtlı alan adına (eTLD+1) indiriliyor.
 *
 * ⚠️ Ama asıl adres ATILMIYOR: `shop.bogue-profumo.com` kırpılınca
 * `bogue-profumo.com` çıkıyor ve o adres çözülmeyebilir. Zenginleştirici
 * bu yüzden hem kırpılmışı hem asıl ana bilgisayarı deniyor.
 */

/**
 * Ülke kodlu TLD'lerin altındaki "ticari" ikinci düzeyler.
 *
 * Tam bir kamu son ek listesi (publicsuffix.org, ~9000 satır) taşımak yerine
 * hedef pazarların (Türkiye + AB + ABD + Körfez) fiilen kullandığı kısa liste
 * tutuluyor. Listede olmayan bir ccTLD'de en fazla bir alt alan adı fazladan
 * satır olarak kalır — sessiz veri kaybı değil, görünür bir tekrar.
 */
const IKINCI_DUZEY = new Set([
  'co.uk', 'org.uk', 'me.uk', 'com.tr', 'net.tr', 'org.tr', 'com.au',
  'com.br', 'co.nz', 'co.jp', 'co.za', 'com.sa', 'com.eg', 'co.il',
  'com.mx', 'com.ar', 'co.in', 'com.sg', 'com.hk',
  /*
    ⚠️ Platform barındırma alan adları da kamu son eki gibi davranıyor:
    `kucukdukkan.myshopify.com` ve `baskadukkan.myshopify.com` AYRI
    işletmeler. Bunlar listeye alınmazsa hepsi `myshopify.com` diye tek
    satıra çöküyor — `com.ng` ile aynı hata, ama bu sefer tam hedef
    kitlemizde: kendi alan adını henüz almamış küçük dükkânlar.
  */
  'myshopify.com', 'bigcartel.com', 'ecwid.com', 'storenvy.com',
  'wixsite.com', 'square.site', 'shoplineapp.com', 'company.site',
  /*
    ⚠️ Özel kayıt registry'leri de aynı sınıf: `uk.com` bir alan adı değil,
    CentralNic'in üçüncü düzey sattığı bir son ek. Listede olmadığı için
    `scentsamples.uk.com` deftere çıplak **`uk.com`** diye yazılmıştı.

    ⚠️ Bunu bulan şey kayıt değil KANIT satırıydı. Hafızada "uk.com dükkan
    değil, alan adı servisi — elle `elendi` işaretlensin" yazılıydı ve
    yanlıştı: `evidence` tablosundaki adres `https://scentsamples.uk.com/`,
    1000+ ürünlü gerçek bir Shopify numune dükkanı. Elenseydi tam hedef
    kitleden bir aday sessizce silinirdi.

    Kardes son ekler (`eu.com`, `us.com`, `de.com`, `com.de`, `za.com`…)
    aynı registry'nin ürünü ama defterde geçmiyorlar — ölçüldü, tahminle
    liste şişirilmedi. Biri çıkarsa buraya bir satır.
  */
  'uk.com',
]);

/**
 * Genel ikinci düzey etiketler — ülke kodlu uzantıların altında kullanılan.
 *
 * ⚠️ Sabit liste YETMEDİ ve bunu ölçüm gösterdi: `jumia.com.ng`,
 * `malak.com.pk`, `pparfums.com.ua`, `shopee.co.th` gibi dokuz adres
 * listede olmayan uzantılar yüzünden `com.ng`, `com.pk`, `co.th` diye
 * KAYDEDİLDİ — yani alan adı değil, kamu son ekinin kendisi. Sonuç iki
 * yönlü zarar: adres çözülmüyor ve birbirinden bağımsız dükkânlar tek
 * satırda birleşiyor.
 *
 * Tam kamu son ek listesi (~9.000 satır) taşımak yerine kalıp kullanılıyor:
 * iki harfli bir ülke uzantısının altındaki genel etiket, alan adının
 * kendisi olamaz.
 */
const GENEL_IKINCI = new Set([
  'com', 'co', 'net', 'org', 'gov', 'edu', 'ac', 'or', 'ne', 'mil',
  'gob', 'gouv', 'biz', 'info', 'web', 'firm', 'gen', 'ind', 'nom',
]);

/** Son iki etiket bir kamu son eki mi (ör. `com.ng`, `co.th`). */
function kamuSonEkiMi(sonIki: string): boolean {
  if (IKINCI_DUZEY.has(sonIki)) return true;
  const [ikinci, uzanti] = sonIki.split('.');
  if (ikinci === undefined || uzanti === undefined) return false;
  return GENEL_IKINCI.has(ikinci) && uzanti.length === 2;
}

/** Adres ya da çıplak ana bilgisayar adından ana bilgisayarı çeker. */
export function hostOf(input: string): string | null {
  const ham = input.trim().toLowerCase();
  if (ham === '') return null;
  const ileAdres = /^[a-z][a-z0-9+.-]*:\/\//.test(ham) ? ham : `https://${ham}`;
  try {
    const host = new URL(ileAdres).hostname.replace(/\.$/, '');
    return host === '' ? null : host;
  } catch {
    return null;
  }
}

/** `www.` kırpar ve kayıtlı alan adına (eTLD+1) indirir. */
export function normalizeDomain(input: string): string | null {
  const host = hostOf(input);
  if (host === null) return null;
  const parcalar = host.replace(/^www\./, '').split('.');
  if (parcalar.length < 2) return null;

  const sonIki = parcalar.slice(-2).join('.');
  const gereken = kamuSonEkiMi(sonIki) ? 3 : 2;
  const sonuc = parcalar.length <= gereken ? parcalar.join('.') : parcalar.slice(-gereken).join('.');
  /*
    Etiket yetmediyse geriye yalnız son ek kalır (ör. `com.ng`). Bu bir alan
    adı değil; uydurmak yerine `null` dönüyor.
  */
  return kamuSonEkiMi(sonuc) || sonuc.split('.').length < 2 ? null : sonuc;
}

/**
 * Denenecek ana bilgisayarlar, en olasıdan en az olasıya.
 *
 * Ölçüldü: `luckyscent.com` çıplak halde 301 veriyor, `www` ile açılıyor.
 * Yönlendirme zaten takip ediliyor ama bazı sunucular çıplak adı hiç
 * çözmüyor — o yüzden `www` ayrı bir aday olarak duruyor.
 */
export function adayHostlar(domain: string, seedUrl: string | null): readonly string[] {
  const adaylar = [domain, `www.${domain}`];
  const seedHost = seedUrl === null ? null : hostOf(seedUrl);
  if (seedHost !== null && !adaylar.includes(seedHost)) adaylar.unshift(seedHost);
  return adaylar;
}
