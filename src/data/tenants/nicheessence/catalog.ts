import type { Perfume } from '../../types';
import { OSMOS_ALL } from '../../osmos-catalog';
import { deriveTenantCatalog } from '../derive';

/**
 * Niche Essence'in rafı — ikinci gerçek işletme demosu.
 *
 * ⚠️ **Dükkan gerçek, çalışma resmi değil.** `nicheessence.com` Toronto'da
 * (Bayview Village) mağazası olan bir niş parfüm perakendecisi ve bu seçki
 * onun rafındaki parfümlerden kuruldu; kendisinden onay alınmadı. Kiracı
 * `indexable: false` ve talep edilirse aynı gün kaldırılır. Nischengold ile
 * aynı çerçeve.
 *
 * ⚠️ **Seçki otomatik üretildi, adresler ELLE doğrulandı (2026-08-20).**
 * Taslak `leadgen kiraci-taslak nicheessence.com` ile çıktı; 17 adresin
 * 17'si de dükkanın kendi ürün ucundan (`/products/<handle>.js`) tek tek
 * açılıp marka, ad ve fiyatı görülerek onaylandı. Gördüklerim her satırın
 * yanında yazılı — sonradan biri "bu gerçekten o parfüm mü" diye sorarsa
 * cevabı aramak zorunda kalmasın.
 *
 * ⚠️ **Taslağın ilk hâli KULLANILAMAZDI ve üç ayrı hata taşıyordu** (hepsi
 * ölçülüp düzeltildi, `leadgen/src/demo/`):
 *   1. Adreslerde `www.` yoktu — 7/7 adres 404 dönüyordu.
 *   2. `products.json` tek sayfa okunuyordu; dükkanın gerisi görülmüyordu.
 *      Sayfalama gelince örtüşme **7'den 17'ye** çıktı.
 *   3. "En kısa başlık kazanır" kuralı 3 ml **numuneyi** seçiyordu: demo,
 *      dükkanın $270'lık şişesi yerine $18'lik numunesine bağlanıyordu.
 *
 * ⚠️ **Altı parfüm doğrulama anında TÜKENMIŞTI** ve bağlantıları yine de
 * duruyor: adres dükkanın kendi ürün sayfası, stok onun işi ve yarın dolabilir.
 * Bağlantıyı kaldırmak, kokuyu haritadan çıkarmak demekti — oysa dükkan onu
 * satıyor. Tükenmiş olanlar aşağıda işaretli.
 */
const SELECTION: readonly string[] = [
  'nasomatto-baraonda',
  'nasomatto-blamage',
  'zoologist-hummingbird',
  'zoologist-rabbit',
  'orto-parisi-viride',
  'orto-parisi-megamare',
  'house-of-oud-bonbon-pop',
  'atelier-des-ors-lune-feline',
  'goldfield-banks-bohemian-lime',
  'mdci-peche-cardinal',
  'fragrance-du-bois-voyage-a-paris',
  'xerjoff-mamluk',
  'parfums-dusita-melodie-de-lamour',
  'bdk-creme-de-cuir',
  'parfums-dusita-oudh-infini',
  'goldfield-banks-ingenious-ginger',
  'nishane-nanshe',
];

/**
 * Parfümden dükkanın KENDİ ürün sayfasına — dönüşüm yolu.
 *
 * Her satırın yanında 2026-08-20'de o adreste GÖRÜLEN ürün duruyor:
 * dükkanın yazdığı marka, ürün adı, fiyatı (CAD) ve o anki stok durumu.
 */
const URUN_ADRESLERI: Readonly<Record<string, string>> = {
  /* Nasomatto Baraonda Extrait · $260 · stokta */
  'nasomatto-baraonda': 'https://www.nicheessence.com/products/nasomatto-baraonda-extrait',
  /* Nasomatto Blamage Extrait · $260 · stokta */
  'nasomatto-blamage': 'https://www.nicheessence.com/products/nasomatto-blamage-extrait',
  /* Zoologist Deluxe Bottle Hummingbird · $270 · stokta — numune sürümü DEĞİL */
  'zoologist-hummingbird': 'https://www.nicheessence.com/products/zoologist-deluxe-bottle-hummingbird',
  /* Zoologist Deluxe Bottle Rabbit · $320 · stokta — numune sürümü DEĞİL */
  'zoologist-rabbit': 'https://www.nicheessence.com/products/zoologist-deluxe-bottle-rabbit',
  /* Orto Parisi Viride Parfum · $270 · stokta */
  'orto-parisi-viride': 'https://www.nicheessence.com/products/orto-parisi-viride-parfum',
  /* Orto Parisi Megamare Parfum · $270 · stokta */
  'orto-parisi-megamare': 'https://www.nicheessence.com/products/orto-parisi-megamare-parfum',
  /* The House of Oud, Bonbon Pop, 75ML · $310 · ⚠️ tükenmişti */
  'house-of-oud-bonbon-pop': 'https://www.nicheessence.com/products/the-house-of-oud-bonbon-pop-75ml',
  /* Atelier des Ors Lune Feline EDP · $455 · ⚠️ tükenmişti */
  'atelier-des-ors-lune-feline': 'https://www.nicheessence.com/products/atelier-des-ors-lune-feline-edp-100ml',
  /* Goldfield & Banks Bohemian Lime Perfume · $330 · ⚠️ tükenmişti */
  'goldfield-banks-bohemian-lime': 'https://www.nicheessence.com/products/goldfield-banks-bohemian-lime-perfume',
  /* MDCI Peche Cardinal EDP · $370 · ⚠️ tükenmişti — "without bust" dükkanın kendi sürüm adı, doğru ürün */
  'mdci-peche-cardinal': 'https://www.nicheessence.com/products/mdci-peche-cardinal-edp-75ml-without-bust',
  /* Fragrance Du Bois, Voyage aParis · $520 · stokta */
  'fragrance-du-bois-voyage-a-paris': 'https://www.nicheessence.com/products/fragrance-du-bois-voyage-aparis-_-100ml',
  /* Xerjoff Oud Stars Mamluk Parfum · $370 · ⚠️ tükenmişti */
  'xerjoff-mamluk': 'https://www.nicheessence.com/products/xerjoff-oud-stars-mamluk-extrait',
  /* Dusita Melodie de l'Amour Extrait · $425 · stokta — saç misti ve seyahat seti DEĞİL */
  'parfums-dusita-melodie-de-lamour': 'https://www.nicheessence.com/products/dusita-melodie-de-lamour-extrait',
  /* BDK Creme De Cuir EDP · $390 · stokta */
  'bdk-creme-de-cuir': 'https://www.nicheessence.com/products/bdk-creme-de-cuir-edp',
  /* Dusita Oudh Infini Extrait · $570 · stokta — seyahat seti DEĞİL */
  'parfums-dusita-oudh-infini': 'https://www.nicheessence.com/products/dusita-oudh-infini',
  /* Goldfield & Banks Ingenious Ginger Perfume · $330 · ⚠️ tükenmişti */
  'goldfield-banks-ingenious-ginger': 'https://www.nicheessence.com/products/goldfield-banks-ingenious-ginger-perfume',
  /* Nishane, Nanshe · $360 · stokta */
  'nishane-nanshe': 'https://www.nicheessence.com/products/nishane-nanshe',
};

const BY_ID = new Map(OSMOS_ALL.map((perfume) => [perfume.id, perfume]));

const SELECTED: readonly Perfume[] = SELECTION.map((id) => {
  const perfume = BY_ID.get(id);
  /*
    Seçkideki bir kimlik ana katalogdan kalkarsa kiracının haritasında sessizce
    bir nokta eksilir. Derlemede patlamak, eksik haritayı müşteriye yollamaktan
    iyidir.
  */
  if (!perfume) {
    throw new Error(`nicheessence seçkisi bilinmeyen parfüme işaret ediyor: ${id}`);
  }
  return perfume;
});

export const NICHEESSENCE_CATALOG: readonly Perfume[] = deriveTenantCatalog(
  SELECTED,
  URUN_ADRESLERI,
  'Niche Essence',
);
