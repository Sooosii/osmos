import type { Perfume } from '../../types';
import { OSMOS_ALL } from '../../osmos-catalog';
import { deriveTenantCatalog } from '../derive';

/**
 * Nischengold'un rafı — ilk GERÇEK işletme demosu.
 *
 * ⚠️ **Dükkân gerçek, çalışma resmi değil.** `nischengold.com` var olan bir
 * işletme ve bu seçki onun rafındaki parfümlerden kuruldu; ama kendisinden
 * onay alınmadı. Kiracı `indexable: false` ve talep edilirse aynı gün
 * kaldırılır. Kurgusal `demo-selva`dan farkı tam olarak bu.
 *
 * ⚠️ **Seçki ölçümle kuruldu ve bir kez ölçüme çarpıp küçüldü.** Boru hattı
 * dükkânın `products.json`unu okuyup 250 ürününü kataloğumuzla eşleştirdi ve
 * 13 parfüm buldu. İlk sayım 15'ti; `naomi-goodsir-bois-dascese` ve
 * `profumum-roma-neroli` **yanlış eşleşmeydi** — eşleştirici yalnız parfüm
 * ADINA bakıyordu ve "Neroli" bizim Profumum Roma kaydımızı dükkânın Matière
 * Première "Neroli Oranger"ıyla eşleştirmişti. İkisi de dükkânda YOK.
 *
 * Bunun önemi teknik değil: "sizin kataloğunuzdan kurdum" diyen bir demo,
 * satmadıkları bir parfümü içeremez. İlk cevapta yakalanırdı.
 */
const SELECTION: readonly string[] = [
  /* Dükkânın rafında bizde de bulunanlar — marka ve ad birlikte doğrulandı. */
  'nasomatto-baraonda',
  'nasomatto-blamage',
  'orto-parisi-viride',
  'orto-parisi-megamare',
  'marc-antoine-barrois-ganymede',
  'maison-crivelli-oud-maracuja',
  'spirit-of-dubai-ajyal',
  'simone-andreoli-malibu-party-in-the-bay',
  'matiere-premiere-santal-austral',
  /* Aile boşluklarını kapatmak için girilenler — dördü de dükkânın rafında. */
  'matiere-premiere-radical-rose',
  'matiere-premiere-encens-suave',
  'matiere-premiere-crystal-saffron',
  'matiere-premiere-metal-lavender',
];

/**
 * Parfümden dükkânın KENDİ ürün sayfasına — dönüşüm yolu.
 *
 * ⚠️ **Elle doğrulandı, otomatik üretilmedi.** Dükkân çoğu parfümün hem
 * temel hem `Extrait` sürümünü satıyor (Radical Rose / Radical Rose Extrait,
 * Santal Austral / Santal Austral Extrait, Ganymede / Ganymede Extrait…).
 * Bizim kayıtlarımız temel sürüm — Radical Rose 2020, Encens Suave 2019,
 * Crystal Saffron 2022 — yani doğru adres her seferinde **`extrait` olmayan**.
 * Otomatik eşleştirici ilk denemede beşinde de Extrait'i seçmişti.
 *
 * Yanlış bir bağlantı bağlantısızlıktan kötü: ziyaretçi başka bir ürüne
 * düşer, sepete onu atar ve kimse fark etmez. Bu yüzden eşleşmeler tek tek
 * gözle doğrulandı ve karar burada, okunabilir hâlde duruyor.
 */
const URUN_ADRESLERI: Readonly<Record<string, string>> = {
  'nasomatto-baraonda': 'https://nischengold.com/products/baraonda',
  'nasomatto-blamage': 'https://nischengold.com/products/blamage',
  'orto-parisi-viride': 'https://nischengold.com/products/viride',
  'orto-parisi-megamare': 'https://nischengold.com/products/megamare',
  'marc-antoine-barrois-ganymede':
    'https://nischengold.com/products/marc-antoine-barrois-ganymede-unisex-parfum',
  'maison-crivelli-oud-maracuja': 'https://nischengold.com/products/oud-maracuja',
  'spirit-of-dubai-ajyal': 'https://nischengold.com/products/spirit-of-dubai-ajyal-unisex-parfum',
  'simone-andreoli-malibu-party-in-the-bay':
    'https://nischengold.com/products/malibu-party-in-the-bay',
  'matiere-premiere-santal-austral': 'https://nischengold.com/products/santal-austral',
  'matiere-premiere-radical-rose': 'https://nischengold.com/products/radical-rose',
  'matiere-premiere-encens-suave': 'https://nischengold.com/products/encens-suave',
  'matiere-premiere-crystal-saffron': 'https://nischengold.com/products/crystal-saffron',
  'matiere-premiere-metal-lavender':
    'https://nischengold.com/products/matiere-premiere-metal-lavender-unisex-parfum',
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
    throw new Error(`Nischengold seçkisi bilinmeyen parfüme işaret ediyor: ${id}`);
  }
  return perfume;
});

export const NISCHENGOLD_CATALOG: readonly Perfume[] = deriveTenantCatalog(
  SELECTED,
  URUN_ADRESLERI,
  'Nischengold',
);
