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
import { URUN_TAVANI } from '../enrich/platform.ts';
import { kanitlar, tumLeadler } from '../db.ts';
import type { Evidence, Lead } from '../types.ts';
import { csvYaz } from './csv.ts';

/*
  ⚠️ **Almanca ÖLÇÜMLE eklendi (2026-08-19).** Uzun süre yalnız `tr` ve `en`
  vardı ve sonucu şuydu: üçüncü partide dört Alman dükkânına Ingilizce taslak
  çıktı, elle çevrildi. Liste sayıldığında iş ölçeği göründü — bilinen en
  büyük grup **Almanya (39 DM hedefi)**, üstüne Avusturya ve Isviçre (8);
  toplam **47**, Türkçenin iki katından fazla. Elle çeviri her partide
  tekrarlanacak bir vergiydi.
*/
export type Dil = 'tr' | 'en' | 'de';
export type Kanal = 'dm' | 'mail' | 'yok';

/**
 * Dile göre metin seçer.
 *
 * ⚠️ **`dil === 'tr' ? … : …` kalıbı üçüncü dilde sessizce bozuluyordu.** Iki
 * dallı ifadede Ingilizce hem "Ingilizce" hem "geri kalan her şey" demekti;
 * Almanca eklenince Alman dükkânı hiçbir hata vermeden Ingilizce dala düşerdi.
 * `Record<Dil, string>` her dili AÇIKÇA yazmaya zorluyor — dördüncü dil
 * eklendiği gün eksik satırları derleyici gösteriyor, ölçüm değil.
 */
function cumleSec(dil: Dil, secenekler: Record<Dil, string>): string {
  return secenekler[dil];
}

/*
  ⚠️ Türkçeye ÖZGÜ işaretler. `ü` ve `ö` bilerek YOK: ikisi de Almancada
  var ve "Parfümproben" gibi bir başlık Türkçe sanılırdı.
*/
const TURKCE_HARF = /[ğşıĞŞİ]/u;
const TURKCE_SOZCUK = /\b(fiyat|fiyatları|fiyatlı|kargo|sepet|ücretsiz|indirim|satın|ürün|ürünler|kokusu|muadil|çeşitleri|uygun|orijinal)\b/iu;

/*
  ⚠️ Almanca kapısı. Türkçe işareti bulunsa bile bu sözcüklerden biri varsa
  karar VERİLMİYOR: Alman bir dükkâna Türkçe yazmak, İngilizce yazmaktan
  kötü. Şüphede kalınca dil seçilmiyor, İngilizceye düşülüyor.
*/
const ALMANCA_SOZCUK = /\b(kaufen|günstig|versand|exklusive|düfte|nischendüfte|parfümproben|parfumproben|entdecken|unsere|bestellen)\b/iu;

/**
 * Sayfa metninden dil izi — ülke uzantısı susunca tek kalan kanıt.
 *
 * ⚠️ Neden var: `country` alan adı uzantısından çıkıyor ve 735 adayın
 * 599'unda BOŞ, çünkü dükkânlar `.com` kullanıyor. Ölçüldü: DM listesindeki
 * 239 hesabın **45'i Türk dükkânı ama İngilizce mesaj alıyordu** — sahibin
 * en kolay kapatacağı pazar.
 *
 * ⚠️ Ülke UYDURULMUYOR: bu fonksiyon `country`ye dokunmuyor, yalnız hangi
 * dilde yazılacağını söylüyor. Kanıt, `ana-sayfa` kanıt satırının metni.
 */
export function dilIzi(metin: string | null): Dil | null {
  if (metin === null || metin.trim() === '') return null;
  /*
    ⚠️ Almanca kapısı artık yalnız ELEMIYOR, KARAR da veriyor. Eskiden buradan
    `null` dönüyordu ve dükkân Ingilizceye düşüyordu — "Almanca yazmaktansa
    Ingilizce yaz" değil, "Türkçe yazma" demek istenmişti; ikisi karıştı.
    Sözcükler Ingilizcede karşılığı olmayacak kadar Almancaya özgü
    (`kaufen`, `günstig`, `bestellen`…), yani olumlu işaret olarak da güvenli.
    Ölçüldü: `allyours.com` tam bu durumdaydı — ülkesi bilinmiyor, başlığı
    Almanca, taslağı Ingilizce çıkıyordu.
  */
  if (ALMANCA_SOZCUK.test(metin)) return 'de';
  return TURKCE_HARF.test(metin) || TURKCE_SOZCUK.test(metin) ? 'tr' : null;
}

/**
 * Ülkesi Türkiye olana Türkçe, kalanına İngilizce.
 *
 * ⚠️ Sayfa metni yalnızca ülke BİLİNMEDİĞİNDE devreye giriyor. Bilinen bir
 * ülkeyi metinle ezmek, Alman bir dükkânın sayfasında Türkçe bir ürün adı
 * geçtiği için ona Türkçe yazmak demekti.
 */
/**
 * Dil izinin bakacağı metin: sayfa başlığı + ana sayfa kanıtının özeti.
 *
 * ⚠️ Başlık da metne giriyor ve çoğu zaman TEK işaret o: "Koku Mutfağı"
 * gibi bir başlıkta dükkânın dili yazılı, ana sayfa özeti ise boş olabiliyor.
 */
export function sayfaMetni(lead: Pick<Lead, 'shop_name'>, kanit: readonly Evidence[]): string {
  const ana = kanit.find((k) => k.kind === 'ana-sayfa');
  return [lead.shop_name ?? '', ana?.snippet ?? ''].join(' ').trim();
}

/*
  ⚠️ Almanca konuşulan ülkeler TEK LISTE: Almanya, Avusturya, Isviçre. Isviçre
  çok dilli ve bu bilerek göze alındı — listedeki Isviçre dükkânları Almanca
  bölgede (Nischengold Konstanz sınırında, CHF ile satıyor) ve yanlış tahminin
  bedeli Ingilizce yazmakla aynı, daha kötü değil.
*/
const ALMANCA_ULKELER = new Set(['DE', 'AT', 'CH']);

export function dilSec(country: string | null, sayfaMetni: string | null = null): Dil {
  if (country === 'TR') return 'tr';
  if (country !== null) return ALMANCA_ULKELER.has(country) ? 'de' : 'en';
  return dilIzi(sayfaMetni) ?? 'en';
}

/**
/**
 * Hangi kanaldan gidilecek.
 *
 * **Instagram varsa DM. Nokta.** Mail yalnızca Instagram YOKKEN.
 *
 * ⚠️ **Burada bir kez bayat bir kural duruyordu ve ölçümle devrildi.** Eski
 * hâli `country === TR` şartı taşıyordu; gerekçesi de yorumunda yazılıydı:
 * *"e-posta TÜRKİYE'de tek başına zayıf kanal."* O cümle hedef pazar Türkiye
 * sanılırken yazılmıştı. 2026-08-16'da liste sayıldı ve tersi çıktı: bilinen
 * en büyük grup **Almanya (57)**, Türkiye 24. Ve Almanya'da **UWG §7 izinsiz
 * ticari e-postayı B2B'de bile yasaklıyor** — yani eski kural, e-postası olan
 * her Alman dükkânını tam da yasak olan kanala yolluyordu.
 *
 * ⚠️ Karar `docs/b2b/sirket-ve-fatura.md` §5'te 16 Ağustos'ta verilmişti
 * ("kanal sırası: Instagram DM → mail → telefon") ama **koda girmemişti**.
 * Ölçüldü (2026-08-18): eski kuralla 253 mail / 233 DM; yenisiyle 446 DM /
 * 40 mail. **213 dükkân yanlış kanaldaydı**, 18'i bilinen Almanya.
 *
 * ⚠️ DM ayrıca sahibin durumuna da uyuyor: markası tanınmıyor, tanınmayan bir
 * alan adından gelen soğuk mail açılmıyor bile.
 */
export function kanalSec(lead: Pick<Lead, 'email' | 'instagram' | 'country'>): Kanal {
  const dmVar = lead.instagram !== null && lead.instagram !== '';
  const mailVar = lead.email !== null && lead.email !== '';

  if (dmVar) return 'dm';
  if (mailVar) return 'mail';
  return 'yok';
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
/*
  Başlığın KENDİSİ ambalaj/şişe satışını ilan ediyor mu.

  ⚠️ Ölçüldü: listeye giren 508 işletmenin 15'i parfüm değil **parfüm şişesi**
  satıyor ve bunu başlıkta kendisi söylüyor ("Parfüm Şişeleri Toptan",
  "Atomizer Sprey Şişesi Üreticisi", "Kozmed Ambalaj", "hammaddeler").

  ⚠️ Bunlar ELENMİYOR — sahibin "kimse elenmiyor" kuralı duruyor ve bu
  fonksiyon hiçbir adayı listeden çıkarmıyor. Değişen tek şey mesajın içeriği.

  ⚠️ Tetikleyici yalnız AMBALAJIN ADI. "Toptan" ve "üretici" ilk sürümde
  listedeydi ve bir YANLIŞ POZİTİF üretti: "Parfüm Dünyası – Orjinal Toptan
  Parfümler" parfüm satıyor, şişe değil — toptancı olması onu hedef
  DIŞINA değil, tam içine koyuyor. Satış beyanı değil, satılan ŞEY belirleyici.
*/
const AMBALAJ_SATISI = new RegExp(
  [
    '(şişeler|şişesi|şişeleri|siseler|sisesi|siseleri)',
    '(atomizer|spray bottle|tester bottle)',
    '(ambalaj|packaging|hammadde|hammadeler)',
  ].join('|'),
  'iu',
);

/**
 * Bu işletme parfüm satmıyor olabilir mi?
 *
 * `true` dönmesi adayı listeden çıkarmıyor; yalnız ona "kataloğunuzda N
 * parfüm saydım" denmesini engelliyor. O cümle bir şişe toptancısına
 * gittiğinde ilk bakışta yanlış — bakılmadığını söyler.
 */
export function parfumSatmiyorOlabilir(shopName: string | null): boolean {
  if (shopName === null) return false;
  return AMBALAJ_SATISI.test(shopName);
}

export function acilisCumlesi(lead: Lead, kanit: readonly Evidence[], dil: Dil): Acilis | null {
  const bul = (kind: string): Evidence | undefined => kanit.find((k) => k.kind === kind);

  const platformKanit = bul('platform');
  /*
    ⚠️ Sayı iddiası yalnız parfüm sattığından emin olduğumuz dükkâna. Şişe
    toptancısına "kataloğunuzda 313 parfüm saydım" demek, bakmadığımızı
    söyler; boru hattının "kanıt yoksa cümle yazılmaz" kuralının aynısı.
  */
  const parfumcu = !parfumSatmiyorOlabilir(lead.shop_name);
  if (parfumcu && lead.product_count !== null && platformKanit !== undefined) {
    const n = lead.product_count;
    /*
      ⚠️ **Tavana dayanan sayı iddia edilmez.** `product_count` 1000 ise gerçek
      sayı değil, taramanın durduğu yer (`URUN_TAVANI`). "1000 parfüm saydım"
      demek uydurma bir iddiadır ve akışın kendi kuralını çiğner: "sayı
      tutmuyorsa mesajı gönderme." Doğrusu zaten elimizde — **1000'den fazla**
      doğru bir cümle ve daha da etkileyici.
    */
    /*
      ⚠️⚠️ **Sayı eşiği TEK BAŞINA yetmiyor ve bu ölçülerek görüldü.** Ilk
      düzeltme yalnız `n >= URUN_TAVANI` (1000) bakıyordu; oysa tarama bir
      sayfa GETIRILEMEDIĞINDE de kırılıyor ve toplam orada kalıyor. Örnek
      ölçüldü (2026-08-19): `scentido.com` kayıtta **250** ürünle duruyordu,
      gerçekte **490**. Mesaj "kataloğunuzdaki 250 parfümü saydım" diyecekti —
      yarısı kadar, ve dükkân sahibi ilk bakışta görürdü.

      Kayıt bunu zaten biliyordu: `enrich` tavana dayanan ölçümü nota
      `urun sayisi N+ (tavan)` diye yazıyor. Eksik olan, metnin o notu
      OKUMAMASIYDI. Ölçüldü: 7 dükkânda işaret var ama sayı 1000'in altında.
    */
    const tavanda = n >= URUN_TAVANI || (lead.notes ?? '').includes('(tavan)');
    /*
      ⚠️ Adres MÜŞTERİYE GİTMİYOR, yalnız `kaynakUrl`de duruyor: sayı
      `products.json` ucundan geliyor ve o adresi mektuba koymak "sizin
      API'nizi taradım" gibi okunuyor.

      ⚠️ Ama LİSTEYİ İŞLEYEN KİŞİ bu adresi açıyor (`dm-listesi.md` "cümlede
      yazan şey o sayfada gerçekten yoksa gönderme" diyor), o yüzden adres
      sayıyı GÖSTERMEK zorunda. WooCommerce'te `platform` kanıtı ana sayfa —
      tespit ana sayfa kaynağındaki "woocommerce" geçişinden yapılıyor — ve
      sayı ayrı bir `urun-sayisi` satırında (`x-wp-total`) duruyor. Eskiden
      hep `platform` alınıyordu ve sonuç sessizce ADAY KAYBETTİRİYORDU:
      dış denetimde 110 sayı iddiasının 23'ünde kanıt adresi ana sayfaydı,
      yani kişi 191'i bulamayıp geçerli adayı atacaktı.

      Shopify'da ayrı satır yok; orada `platform` kanıtı zaten
      `products.json` ucu, yani geri düşüş doğru adresi veriyor.
    */
    const sayiKanit = bul('urun-sayisi') ?? platformKanit;
    return {
      kaynakUrl: sayiKanit.url,
      cumle: cumleSec(dil, {
        tr: tavanda
          ? `Kataloğunuzda ${n}'den fazla parfüm var ve hepsi tek bir listede duruyor.`
          : `Kataloğunuzda ${n} parfüm saydım ve hepsi tek bir listede duruyor.`,
        de: tavanda
          ? `Ihr Katalog umfasst mehr als ${n} Düfte, und alle stehen in einer einzigen Liste.`
          : `Ich habe ${n} Düfte in Ihrem Katalog gezählt, und alle stehen in einer einzigen Liste.`,
        en: tavanda
          ? `Your catalogue runs past ${n} fragrances, all of them in a single list.`
          : `I counted ${n} fragrances in your catalogue, all of them in a single list.`,
      }),
      kisa: cumleSec(dil, {
        tr: tavanda ? `kataloğunuzdaki ${n}'den fazla parfüm` : `kataloğunuzdaki ${n} parfümü saydım`,
        de: tavanda
          ? `Ihr Katalog umfasst mehr als ${n} Düfte`
          : `ich habe die ${n} Düfte in Ihrem Katalog gezählt`,
        en: tavanda ? `your catalogue runs past ${n} fragrances` : `I counted the ${n} fragrances in your catalogue`,
      }),
    };
  }

  const ana = bul('ana-sayfa');
  if (ana !== undefined && ana.snippet.trim() !== '') {
    return {
      kaynakUrl: ana.url,
      cumle: cumleSec(dil, {
        tr: `${ana.url} adresindeki dükkânınızı gezdim ("${ana.snippet}").`,
        de: `Ich habe mich in Ihrem Shop unter ${ana.url} umgesehen ("${ana.snippet}").`,
        en: `I browsed your shop at ${ana.url} ("${ana.snippet}").`,
      }),
      kisa: cumleSec(dil, {
        tr: 'dükkânınızı gezdim',
        de: 'ich habe mich in Ihrem Shop umgesehen',
        en: 'I browsed your shop',
      }),
    };
  }
  return null;
}

const KONU: Record<Dil, string> = {
  tr: 'kataloğunuz için bir koku haritası — ücretsiz örnek',
  de: 'eine Duftkarte für Ihren Katalog — ein kostenloses Beispiel',
  en: 'a scent map for your catalogue — a free sample',
};

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
  return cumleSec(dil, {
    tr: `Bugün ${parfumSayisi} parfüm notalarına göre haritalanmış durumda.`,
    de: `Zurzeit sind ${parfumSayisi} Düfte nach ihren Noten kartiert.`,
    en: `Right now ${parfumSayisi} fragrances are mapped by their notes.`,
  });
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
  /* "Travel & Discovery Sets" — seyahat boyu da bir urun kategorisi. */
  'travel', 'size', 'sizes',
  'catalogue', 'products', 'product', 'sample', 'samples', 'decant',
  'decants', 'sale', 'new', 'gift', 'kit', 'bundle', 'ml', 'box',
  /*
    ⚠️ Yukarıdakilerin BAŞKA DİLLERDEKİ karşılıkları. Liste İngilizce ve
    Türkçe doğduğu için Almanca/Romence başlıklar süzgeçten geçiyordu:
    "Nischendüfte kaufen" (niş kokular satın al) ve "Parfumproben Online
    Kaufen" birer tarif, ad değil. Yeni bir dil eklenirse buraya da bakılacak.
  */
  'kaufen', 'düfte', 'dufte', 'duft', 'nischendüfte', 'nischendufte',
  'proben', 'parfumproben', 'parfumuri', 'parfümeri', 'parfumeri',
  /* Cinsiyet ve "ürünleri" gibi kategori sözcükleri. */
  'kadın', 'kadin', 'erkek', 'unisex', 'women', 'men', 'all',
  'ürünleri', 'urunleri', 'ürünler', 'urunler',
  /*
    ⚠️ Kategori ve tarif sözcükleri. Çıktıya bakınca çıkan örüntü şuydu:
    kalan kötü hitapların hepsi bir SIFAT + jenerik ad kalıbıydı ("Luxury
    Parfum", "Artisanal Perfumes", "Roll-On Perfume Samples", "Niş Parfüm
    Fiyatları"). Sıfat listede olmadığı için "hepsi jenerik" kuralı
    tutmuyordu. Sıfatlar da tarifin parçası; ad değil.
  */
  'luxury', 'artisanal', 'indie', 'independent', 'mini', 'minis',
  'modern', 'discounted', 'discount', 'cheap', 'premium', 'exclusive',
  'exklusive', 'line',
  'rollon', 'brands', 'brand', 'esans', 'essence', 'nis', 'niş',
  'fiyatları', 'fiyatlari', 'fiyat', 'serisi', 'seri', 'nedir', 'şişesi',
  'sisesi', 'parfümproben', 'duftproben', 'düftproben',
  /* Dükkânın adı değil, sitesinin bir sayfası: destek/iletişim/arama. */
  'customer', 'service', 'support', 'contact', 'about', 'faq', 'search', 'for',
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

  /*
    ⚠️ Başlık çekilemeyen dört dükkânda `shop_name` HAM ADRES olmuş. Aşağıdaki
    bölme iki nokta üstünden yapıldığı için `https://x.com/...` → "https"
    kalıyordu: bir kelime, kısa, jenerik listede yok — bütün kapılardan geçip
    "Hi https!" diye bir DM üretiyordu. Adres kılığındaki her şey burada düşer.
  */
  if (/^https?:|^www\.|\/\//i.test(ham.trim())) return null;

  /*
    ⚠️ WordPress arşiv/kategori sayfasının başlığı dükkânın adı değil:
    "PARFÜM ŞİŞELERİ Arşivleri", "Official Samples Archives". Bunlar jenerik
    OLMAYAN bir sözcük taşıyabildiği için "hepsi jenerik" kuralına takılmıyor;
    arşiv/kategori işareti tek başına yeter sebep.
  */
  if (/\b(arşiv|arsiv|archive|kategori|category|etiket|tag)\w*/iu.test(ham)) return null;

  const ilk = ham.split(/[|:·—]| - | – /)[0] ?? '';
  const ad = ilk.replace(/\.\.\.$/, '').replace(/[\s,.\-–—]+$/, '').trim();
  if (ad === '' || ad.length > 28) return null;

  /*
    ⚠️ "Dekant Parfüm Nedir?" bir blog yazısının başlığı. Bir dükkânın adı
    soru sormaz; soru işareti tek başına yeter sebep.
  */
  if (ad.includes('?')) return null;

  /*
    ⚠️ Ayraç yalnız boşluk değil: "Decants/Samples" tek sözcük sayılıyordu ve
    birleşik hâli listede olmadığı için jenerik denetiminden kaçıyordu.
  */
  const kelimeler = ad.split(/[\s/&]+/).filter((k) => k !== '');
  if (kelimeler.length > 3) return null;
  /*
    ⚠️ İyelik eki karşılaştırmayı deliyordu: "Women's Fragrance Decants"in üç
    sözcüğü de listede (women, fragrance, decants) ama harf süzgeci
    "Women's"ten "womens" üretiyor ve listede "women" var, "womens" yok.
    Hitap bu yüzden yazılıyordu. Ek önce atılıyor.

    ⚠️ Tek harfli sözcük de jenerik: "e shop" bir ad değil.
  */
  const sadeKok = (k: string): string => k
    .toLowerCase()
    .replace(/['’´`]s$/u, '')
    .replace(/[^\p{L}]/gu, '');

  if (kelimeler.every((k) => {
    const kok = sadeKok(k);
    return kok.length <= 1 || JENERIK_AD.has(kok);
  })) return null;
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
  const gozlem = acilis === null ? '' : `${basHarfBuyut(acilis.kisa)} — `;

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
  if (dil === 'de') {
    return [
      `Guten Tag${hitap},`,
      '',
      'ich bin Soroush und entwickle die Duftkarte unter osmos.me.',
      '',
      'OSMOS kartiert Düfte nach ihren Noten: statt eine Liste zu durchsuchen,'
      + ' bewegt sich ein Besucher von einem Duft zu denen, die ihm wirklich'
      + ` ähnlich riechen. ${guvenCumlesi(parfumSayisi, dil)}`,
      '',
      /*
        ⚠️ Mektupta gözlem cümlesi PARAGRAF BAŞINDA duruyor, yani orada büyük
        harf doğru. Ama arkasından gelen uzun tireden sonra cümle devam ediyor
        ve Almancada orası küçük harf: *"…gezählt — dasselbe kann ich…"*.
        Gözlem yoksa paragraf bu kelimeyle başlıyor ve büyük harf gerekiyor.
      */
      `${gozlem}${gozlem === '' ? 'Dasselbe' : 'dasselbe'} kann ich aus Ihrem`
      + ' Katalog bauen: Ihre Düfte, Ihre Marke, unter Ihrer eigenen Adresse.'
      + ' Ihre Besucher wandern über eine Karte, statt eine Produktliste zu scrollen.',
      '',
      'Ich kann Ihnen ein kostenloses Beispiel erstellen: ich baue es aus einer'
      + ' Auswahl Ihres Katalogs und schicke Ihnen den Link — und nehme es am'
      + ' selben Tag wieder offline, wenn es Ihnen nicht gefällt.',
      '',
      'Möchten Sie es sich ansehen?',
      '',
      'Soroush · osmos.me',
      'Wenn Sie keine weiteren Nachrichten möchten, antworten Sie mit „Stopp" —'
      + ' dann schreibe ich Ihnen nicht wieder.',
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
/**
 * Gözlem cümlesi hitaptan sonra CÜMLE BAŞI oluyor — ilk harfi büyüyor.
 *
 * ⚠️ Eskiden şans eseri çalışıyordu: tek gözlem *"I counted…"* idi ve büyük
 * harfle başlıyordu. Tavan cümlesi eklenince *"Hi Fragrancelord! your
 * catalogue runs past…"* çıktı — gerçek bir işletmeye giden mesajda küçük
 * harfle başlayan bir cümle özensizlik olarak okunur.
 *
 * ⚠️ `toUpperCase()`, `toLocaleUpperCase('tr')` DEĞİL: Türkçe eşleme küçük
 * `i`yi noktalı `İ`ye çevirir ve sahibin duran kuralı ekranda noktalı İ
 * istemiyor. Aynı karar sitede de yazılı.
 */
function basHarfBuyut(metin: string): string {
  if (metin === '') return metin;
  return metin[0].toUpperCase() + metin.slice(1);
}

export function dmTaslagi(lead: Lead, acilis: Acilis | null, dil: Dil): string {
  const hitap = hitapAdi(lead);
  /*
    ⚠️ **Almancada bas harf BÜYÜTÜLMÜYOR ve bu bir dilbilgisi kuralı.** Gözlem
    cümlesi burada "Hallo Name," virgülünden SONRA geliyor, yani cümle devam
    ediyor. `basHarfBuyut` Ingilizce için doğru ("I" her yerde büyük) ve Türkçe
    için de ("Merhaba!" ünlemden sonra yeni cümle) — ama Almancada
    *"Hallo, Ich habe…"* üretiyordu. Alman bir okur için gözle görülür bir
    özensizlik, üstelik mesajın tamamı o dilde yazıldığı hâlde.
  */
  const gozlem = acilis === null
    ? ''
    : `${dil === 'de' ? acilis.kisa : basHarfBuyut(acilis.kisa)} — `;
  /*
    ⚠️ **"bir kez kaydır" ölçümle kondu, nezaketten değil.** 390 px'te bakıldı:
    `osmos.me`ye telefondan giren kişinin ilk gördüğü şey harita değil **kapı** —
    siyah zemin, birkaç nokta ve "Scroll to awaken the scent". Kapı sahibin
    tasarımı ve dokunulmuyor; ama bu mesajı alan kişi tanımadığı birinin sitesine
    bakıyor, yani sekmeyi kapatması bedava. Nischengold'a giden mesajda aynı satır
    var ve orada risk daha küçüktü — adam KENDI haritasına bakıyordu.

    Satır kısa tutuldu: mesajın işi meraklandırmak, kullanım kılavuzu vermek değil.
  */
  if (dil === 'tr') {
    return `Merhaba${hitap}! ${gozlem}osmos.me'de parfümleri notalarına göre`
      + ' gezilebilir bir haritaya çeviriyorum (açılınca bir kez kaydırın).'
      + ' Aynısını sizin kataloğunuzla, sizin markanızla kurabilirim;'
      + ' ücretsiz bir örnek hazırlayıp adresini göndereyim mi?';
  }
  /*
    ⚠️ Almanca metin Nischengold ve ParfumGroup'a GERÇEKTEN gönderilen iki
    mesajın kaydından geliyor, makine çevirisinden değil. "einmal scrollen"
    kaydırma satırının Almancası ve aynı ölçümden doğdu; Sie hitabı Almanya'da
    iş yazışmasının varsayılanı.
  */
  if (dil === 'de') {
    return `Hallo${hitap}, ${gozlem}ich verwandle Duftkataloge in eine Karte,`
      + ' durch die man sich nach Geruch bewegt: osmos.me (einmal scrollen).'
      + ' Dasselbe kann ich aus Ihrem Katalog unter Ihrer eigenen Marke bauen;'
      + ' soll ich Ihnen ein kostenloses Beispiel erstellen und den Link schicken?';
  }
  return `Hi${hitap}! ${gozlem}I turn fragrance catalogues into a map you can`
    + ' wander by scent — osmos.me (give it one scroll). I can build the same from'
    + ' your catalogue under your own brand; shall I put together a free sample'
    + ' and send you the link?';
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
    Süzgeç bilerek dar: yalnız hiçbir kanalı olmayanlar ve ELENMİŞ olanlar
    dışarıda kalıyor. Ölçek, puan ya da marka büyüklüğü hiçbir satırı
    elemiyor — sahibin açık kararı.

    ⚠️ `durum === 'elendi'` denetimi sonradan eklendi ve gerçek bir kaçağı
    kapattı: eleme listesi genişletilip `score` ile tazelendiğinde beş mecra
    (apkpure.net, threads.com, snapchat.com, gmail.com, faire.com) veri
    tabanında elendi olarak işaretleniyor ama **mektup listesinde kalmaya
    devam ediyordu.** Eleme yalnız toplama anında etkili olsaydı, sonradan
    öğrenilen hiçbir kural mevcut listeyi düzeltemezdi.

    ⚠️ Bu, sahibin "kimse elenmiyor" kuralına dokunmuyor: o kural ÖLÇEK
    içindi (büyük parfüm evleri atılmıyor). Burası satılamayacak yer kapısı.
  */
  const secilenler = tumLeadler(db)
    .filter((l) => l.durum !== 'elendi')
    .filter((l) => kanalSec(l) !== 'yok');

  let kanitsiz = 0;
  let dm = 0;
  let mail = 0;
  const satirlar = secilenler.map((l, i) => {
    const kanit = kanitlar(db, l.id as number);
    const dil = dilSec(l.country, sayfaMetni(l, kanit));
    const kanal = kanalSec(l);
    if (kanal === 'dm') dm += 1;
    else mail += 1;
    const acilis = acilisCumlesi(l, kanit, dil);
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
