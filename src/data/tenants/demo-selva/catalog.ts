import type { Perfume } from '../../types';
import { OSMOS_ALL } from '../../osmos-catalog';
import { deriveTenantCatalog } from '../derive';

/**
 * SELVA'nın rafı — kiracı katmanının doğrulama katalogu.
 *
 * ⚠️ **Dükkan kurgusal, veri değil.** On sekizi de var olan parfümler: gerçek
 * markalar, gerçek notalar, gerçek yıllar, daha önce yazılmış küratör
 * cümleleri. Bu depoda veri uydurulmaz kuralı buraya da geçiyor — kurgusal olan
 * yalnızca "bu dükkan bunları satıyor" cümlesi. Çok markalı bir parfümerinin
 * kiracı hâli zaten tam olarak budur: gerçek evlerden yapılmış bir seçki.
 *
 * Seçki dört koku ailesine ve dört karakter eksenine bilerek yayıldı (soğuk
 * Viride ↔ sıcak Vanille Planifolia, temiz Philosykos ↔ kirli Muscs Koublaï
 * Khân). Sebep süs değil ölçüm: kalibrasyon kiracının **kendi** kataloğuna
 * göre yapılıyor ve dar bir seçki bütün noktaları haritanın bir köşesinde
 * toplardı. Sınama uçların 0 ve 1'e değdiğini tutuyor.
 *
 * ⚠️ **`retailers` KESİLİYOR** (`deriveTenantCatalog`). Ana katalogdaki
 * parfümlerin hepsinde satıcı bağlantısı dolu; kesilmeseydi bu dükkanın
 * haritası künyenin altından başka satıcılara bağlantı verirdi. Gerçek
 * müşteride alan onun kendi ürün linkleriyle dolacak — dönüşüm yolu orası.
 */
const SELECTION: readonly string[] = [
  'diptyque-philosykos',
  'orto-parisi-viride',
  'orto-parisi-megamare',
  'frederic-malle-bigarade-concentree',
  'essential-parfums-velvet-iris',
  'serge-lutens-tubereuse-criminelle',
  'papillon-dryad',
  'marc-antoine-barrois-ganymede',
  'nishane-ege',
  'dior-oud-ispahan',
  'guerlain-vanille-planifolia',
  'serge-lutens-muscs-koublai-khan',
  'penhaligons-sartorial',
  'naomi-goodsir-bois-dascese',
  'zoologist-hummingbird',
  'jo-malone-myrrh-tonka',
  'stora-skuggan-moonmilk',
  'vilhelm-mango-skin',
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
    throw new Error(`SELVA seçkisi bilinmeyen parfüme işaret ediyor: ${id}`);
  }
  return perfume;
});

export const DEMO_SELVA_CATALOG: readonly Perfume[] = deriveTenantCatalog(SELECTED);
