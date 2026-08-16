import type { Perfume } from '../../types';
import { OSMOS_ALL } from '../../osmos-catalog';
import { deriveTenantCatalog } from '../derive';

/**
 * Nischengold'un rafı — ilk GERÇEK işletme demosu.
 *
 * ⚠️ **Dükkân gerçek, çalışma resmi değil.** `nischengold.com` var olan bir
 * işletme ve bu seçki onun rafındaki parfümlerden kuruldu; ama kendisinden
 * onay alınmadı. Bu yüzden kiracı `indexable: false` ve talep edilirse aynı
 * gün kaldırılır. Kurgusal `demo-selva`dan farkı tam olarak bu: orada dükkân
 * uyduruktu, burada dükkân gerçek.
 *
 * ⚠️ **Seçki ölçümle kuruldu, seçimle değil.** `leadgen` boru hattı dükkânın
 * `products.json`unu okuyup 250 ürününü bizim 154 parfümümüzle eşleştirdi;
 * ilk on bir kimlik o eşleşmenin kendisi — yani **dükkânın gerçekten sattığı**
 * parfümler. Uydurma yok, "şunu da satıyordur" yok.
 *
 * ⚠️ **Son dördü sonradan eklendi ve sebebi ölçüm.** O on bir parfüm on beş
 * koku ailesinden yalnız sekizini tutuyordu; floral, resinous, spicy ve
 * aromatic boştu ve harita bir köşede toplanıyordu. Dört Matière Première
 * kaydı (`perfume-sets/space-3-c.ts`) tam o dört boşluk için girildi — ve
 * dördü de dükkânın rafında duruyor, yani seçki hâlâ onun katalogu.
 */
const SELECTION: readonly string[] = [
  /* Dükkânın rafında bizde de bulunanlar — leadgen eşleştirmesinden. */
  'nasomatto-baraonda',
  'nasomatto-blamage',
  'orto-parisi-viride',
  'orto-parisi-megamare',
  'marc-antoine-barrois-ganymede',
  'maison-crivelli-oud-maracuja',
  'spirit-of-dubai-ajyal',
  'naomi-goodsir-bois-dascese',
  'simone-andreoli-malibu-party-in-the-bay',
  'matiere-premiere-santal-austral',
  'profumum-roma-neroli',
  /* Aile boşluklarını kapatmak için girilenler — dördü de dükkânın rafında. */
  'matiere-premiere-radical-rose',
  'matiere-premiere-encens-suave',
  'matiere-premiere-crystal-saffron',
  'matiere-premiere-metal-lavender',
];

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

export const NISCHENGOLD_CATALOG: readonly Perfume[] = deriveTenantCatalog(SELECTED);
