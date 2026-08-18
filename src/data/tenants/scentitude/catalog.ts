import type { Perfume } from '../../types';
import { OSMOS_ALL } from '../../osmos-catalog';
import { deriveTenantCatalog } from '../derive';

/**
 * Scentitude'un rafı — ilk partiden gelen ilk demo.
 *
 * ⚠️ **Dükkân gerçek, çalışma resmi değil.** `scentitude.com` BAE'de faaliyet
 * gösteren bir dükkân ve 19 Ağustos'ta Instagram DM'imize WhatsApp numarası
 * bırakarak cevap verdi. Ama demoyu istediklerini söylemediler; kiracı
 * `indexable: false` ve talep edilirse aynı gün kaldırılır.
 *
 * ⚠️ **Seçki `leadgen kiraci-taslak scentitude.com` ile üretildi**, elle
 * yazılmadı. Adresler dükkânın kendi ürün akışına (`products.json`, 977 ürün)
 * karşı doğrulandı: onunun onu listede var ve `handle`ları birebir tutuyor.
 * Ürün türleri de okundu — dokuzu parfüm şişesi (EDP/Extrait), biri değil.
 */
const SELECTION: readonly string[] = [
  'nasomatto-baraonda',
  'nasomatto-blamage',
  'orto-parisi-viride',
  'orto-parisi-megamare',
  'vilhelm-mango-skin',
  'bdk-tubereuse-imperiale',
  'the-harmonist-moon-glory',
  /*
    ⚠️ **BIÇIM FARKI — sahibin kararı (2026-08-19): kalıyor.**

    Scentitude bu kokunun yalnız **saç parfümü** sürümünü satıyor
    (`product_type: HAIR PERFUME`); EDP'si rafta yok, 977 ürünün tamamı
    tarandı. Bizim kaydımız kokunun kendisi ve haritadaki yeri notalarından
    hesaplanıyor — yani nokta doğru yerde duruyor.

    Karar şu gerekçeyle verildi: koku gerçekten o rafta ve bağlantı dükkânın
    sattığı gerçek bir ürüne gidiyor. Çıkarsaydık harita bir nokta eksilirdi
    ve ziyaretçi o kokuyu dükkânda arayamazdı.

    ⚠️ Bu bir KARAR, kaza değil — ve kaza olarak girmesin diye araca biçim
    işareti eklendi (`leadgen/src/demo/taslak.ts`). Ilk turda hiç
    işaretlenmemişti çünkü tek adaydı; aynı adı taşıyan bir mum ya da sabun
    da böyle sessizce girebilirdi.
  */
  'bdk-creme-de-cuir',
  'ojar-halwa-kiss',
  'bdk-312-saint-honore',
];

/**
 * Parfümden dükkânın KENDİ ürün sayfasına — dönüşüm yolu.
 *
 * ⚠️ Adresler otomatik önerildi ama **doğrulanmadan yazılmadı**: her `handle`
 * dükkânın `products.json`unda arandı ve ürün başlığı okundu. Yanlış bir
 * bağlantı bağlantısızlıktan kötüdür — ziyaretçi başka ürüne düşer, sepete
 * onu atar ve kimse fark etmez.
 *
 * ⚠️ Nasomatto'nun ikisi dükkânda `Extrait De Parfum` diye duruyor ve bu
 * doğru: Nasomatto yalnız ekstre üretiyor, yani sürüm uyuşmazlığı değil.
 */
const URUN_ADRESLERI: Readonly<Record<string, string>> = {
  'nasomatto-baraonda': 'https://scentitude.com/products/baraonda-30ml',
  'nasomatto-blamage': 'https://scentitude.com/products/blamage-30ml',
  'orto-parisi-viride': 'https://scentitude.com/products/viride-50ml',
  'orto-parisi-megamare': 'https://scentitude.com/products/megamare-50ml',
  'vilhelm-mango-skin': 'https://scentitude.com/products/mango-skin-100ml',
  'bdk-tubereuse-imperiale':
    'https://scentitude.com/products/collection-matieres-tubereuse-imperiale-edp-100ml',
  'the-harmonist-moon-glory':
    'https://scentitude.com/products/moon-glory-parfum-eau-de-parfum-the-harmonist',
  /* Saç parfümü — yukarıdaki karar. Dükkânın sattığı tek sürüm bu. */
  'bdk-creme-de-cuir': 'https://scentitude.com/products/creme-de-cuir-hair-perfume-50ml',
  'ojar-halwa-kiss': 'https://scentitude.com/products/halwa-kiss-100ml',
  'bdk-312-saint-honore': 'https://scentitude.com/products/312-saint-honore-edp-100ml',
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
    throw new Error(`Scentitude seçkisi bilinmeyen parfüme işaret ediyor: ${id}`);
  }
  return perfume;
});

export const SCENTITUDE_CATALOG: readonly Perfume[] = deriveTenantCatalog(
  SELECTED,
  URUN_ADRESLERI,
  'Scentitude',
);
