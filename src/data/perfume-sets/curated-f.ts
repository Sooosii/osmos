import type { Perfume } from '../types';

/**
 * Sahibin rafı — altıncı grup.
 *
 * Öncekilerden farkı seçim ölçütü: bu sekizi harita için seçilmedi, sahibin
 * elinde oldukları için buradalar. Veri ve ekran düzeyinde bu hiçbir yerde
 * görünmüyor ve görünmemesi karar — `Perfume`'a "bende var" diye bir alan
 * eklenmedi. Site bir koku haritası, koleksiyon vitrini değil; ziyaretçi
 * "kimde var" sorusunu sormuyor.
 *
 * Künyeler sahipten geldi, nota listeleri yayınlanan kaynaklardan çıkarıldı.
 * `curated-a.ts:19`'un ayrımı burada da geçerli: liste olgusal veri, `weight`
 * bizim kompozisyon okumamız.
 *
 * Üç yerde sahibin verdiği yıl kaynakla çelişti (Mandarina Corsica, Every Storm,
 * Moonmilk) ve kaynak esas alındı — satın alma yılı çıkış yılı değil. Long
 * Board'ın parfümörü hiçbir yerde açıklanmamış; `types.ts:126`'nın kararı gereği
 * uydurulmadı, alan boş bırakıldı ve künye tek başına yıla iniyor.
 *
 * ⚠️ Gong'da ud yok. Sahip "alttan gelen ud" diye okumuştu; yayınlanan listede
 * guaiac odunu var ve guaiac udun dumanlı-tıbbi tarafını verdiği için his
 * açıklanıyor. Düşük ağırlıklı bir `oud` eklemek tartışıldı ve elendi: olgusal
 * veriye bizim yorumumuz karışırdı. Küratör cümlesi bunu doğrudan söylüyor.
 *
 * Molekül ve akort adları karışık ele alındı — ayırt edici olan kendi notasını
 * aldı, var olan bir malzemenin ticari adı olan ona eşlendi:
 * hedione→jasmine, maltol→sugar, calone→marine, gin→juniper,
 * mahonial→lily-of-the-valley, tonic water→bitter-orange (kinin acılığı).
 */
export const CURATED_F: readonly Perfume[] = [
  {
    // `perfumer` YOK, ama Vanille Abricot ile Ajyal'dan BAŞKA sebeple: onlarda
    // markanın burnu açıklamadığı araştırılıp doğrulandı, burada öyle bir
    // araştırma yapılmadı — ad bu turda kaydedilmeden kaldı. Yani "açıklanmamış"
    // değil, "bakılmamış". Kaynak çıkarsa doldurulsun; tahminle değil.
    id: 'min-new-york-long-board',
    name: 'Long Board',
    brand: 'MiN New York',
    year: 2014,
    curated: true,
    line: {
      en: 'Coconut with the sweetness taken out — salt, hot skin, and a vanilla that never quite arrives.',
      tr: 'Tatlısı alınmış hindistan cevizi — tuz, sıcak ten ve bir türlü gelmeyen bir vanilya.',
    },
    notes: [
      { noteId: 'marine', tier: 'top', weight: 0.7 },
      { noteId: 'cardamom', tier: 'top', weight: 0.5 },
      { noteId: 'coconut', tier: 'heart', weight: 1.0 },
      { noteId: 'solar-accord', tier: 'heart', weight: 0.85 },
      { noteId: 'orange-blossom', tier: 'heart', weight: 0.5 },
      { noteId: 'amber-accord', tier: 'base', weight: 0.5 },
      { noteId: 'vanilla', tier: 'base', weight: 0.6 },
      { noteId: 'vetiver', tier: 'base', weight: 0.4 },
    ],
    retailers: [
      { name: 'MiN New York', url: 'https://min.com/product/long-board/' },
    ],
  },
  {
    id: 'floraiku-gong',
    name: 'Gong',
    brand: 'Floraïku',
    year: 2025,
    perfumer: 'Alienor Massenet',
    curated: true,
    line: {
      en: 'Citrus laid over smoked wood — the darkness reads as oud, but there is no oud in it.',
      tr: 'Tütsülü odunun üstüne serilmiş narenciye — karanlığı ud gibi okunur ama içinde ud yok.',
    },
    notes: [
      { noteId: 'yuzu', tier: 'top', weight: 0.8 },
      { noteId: 'mandarin', tier: 'top', weight: 0.7 },
      { noteId: 'pink-pepper', tier: 'top', weight: 0.5 },
      { noteId: 'dorayaki', tier: 'heart', weight: 0.9 },
      { noteId: 'black-pepper', tier: 'heart', weight: 0.4 },
      { noteId: 'benzoin', tier: 'heart', weight: 0.6 },
      { noteId: 'guaiac-wood', tier: 'base', weight: 0.8 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.7 },
      { noteId: 'amber-accord', tier: 'base', weight: 0.5 },
      { noteId: 'vetiver', tier: 'base', weight: 0.5 },
    ],
    retailers: [
      { name: 'Floraiku', url: 'https://us.floraiku.com/products/gong-eau-de-parfum' },
    ],
  },
  {
    id: 'les-liquides-imaginaires-blanche-bete',
    name: 'Blanche Bête',
    brand: 'Les Liquides Imaginaires',
    year: 2021,
    perfumer: 'Louise Turner',
    curated: true,
    line: {
      en: 'Milk at the top, skin underneath — a scent that divides the room and knows it.',
      tr: 'Üstte süt, altta ten — odayı ikiye bölen ve bunu bilen bir koku.',
    },
    notes: [
      { noteId: 'milk', tier: 'top', weight: 1.0 },
      { noteId: 'ambrette', tier: 'top', weight: 0.6 },
      { noteId: 'mystikal', tier: 'top', weight: 0.5 },
      { noteId: 'tuberose', tier: 'heart', weight: 0.7 },
      { noteId: 'jasmine', tier: 'heart', weight: 0.6 },
      { noteId: 'frankincense', tier: 'heart', weight: 0.5 },
      { noteId: 'lily-of-the-valley', tier: 'heart', weight: 0.4 },
      { noteId: 'white-musk', tier: 'base', weight: 0.8 },
      { noteId: 'vanilla', tier: 'base', weight: 0.7 },
      { noteId: 'tonka', tier: 'base', weight: 0.6 },
      { noteId: 'cocoa', tier: 'base', weight: 0.4 },
    ],
    retailers: [
      { name: 'Luckyscent', url: 'https://www.luckyscent.com/products/blanche-bete-by-liquides-imaginaires' },
    ],
  },
  {
    id: 'lartisan-parfumeur-mandarina-corsica',
    name: 'Mandarina Corsica',
    brand: "L'Artisan Parfumeur",
    year: 2018,
    perfumer: 'Quentin Bisch',
    curated: true,
    line: {
      en: 'Candied mandarin that refuses to fade — the rare citrus still there by evening.',
      tr: 'Solmayı reddeden şekerlenmiş mandalina — akşama kadar duran ender narenciye.',
    },
    notes: [
      { noteId: 'mandarin', tier: 'top', weight: 1.0 },
      { noteId: 'bitter-orange', tier: 'top', weight: 0.6 },
      { noteId: 'immortelle', tier: 'heart', weight: 0.6 },
      { noteId: 'orange-blossom', tier: 'heart', weight: 0.5 },
      { noteId: 'sugar', tier: 'heart', weight: 0.7 },
      { noteId: 'jasmine', tier: 'heart', weight: 0.4 },
      { noteId: 'caramel', tier: 'base', weight: 0.8 },
      { noteId: 'vanilla', tier: 'base', weight: 0.6 },
      { noteId: 'tonka', tier: 'base', weight: 0.5 },
      { noteId: 'cinnamon', tier: 'base', weight: 0.3 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.4 },
    ],
    retailers: [
      { name: "L'Artisan Parfumeur", url: 'https://www.artisanparfumeur.com/us/en_US/p/mandarina-corsica-eau-de-parfum-100ml--000000000065173424' },
    ],
  },
  {
    id: 'm-micallef-gntonic',
    name: 'GNTONIC',
    brand: 'M. Micallef',
    year: 2023,
    perfumer: 'Sidonie Grandperret',
    curated: true,
    line: {
      en: 'Gin and tonic in a glass you keep close — bright, bitter, and gone before you are.',
      tr: 'Yakınında tuttuğun bir bardak cin tonik — parlak, acı ve senden önce gidiyor.',
    },
    notes: [
      { noteId: 'juniper', tier: 'top', weight: 0.9 },
      { noteId: 'lime', tier: 'top', weight: 0.8 },
      { noteId: 'bitter-orange', tier: 'top', weight: 0.7 },
      { noteId: 'mint', tier: 'top', weight: 0.5 },
      { noteId: 'ginger', tier: 'top', weight: 0.4 },
      { noteId: 'pink-pepper', tier: 'top', weight: 0.4 },
      { noteId: 'cedar', tier: 'heart', weight: 0.6 },
      { noteId: 'lily-of-the-valley', tier: 'heart', weight: 0.5 },
      { noteId: 'cypriol', tier: 'heart', weight: 0.5 },
      { noteId: 'orange-blossom', tier: 'heart', weight: 0.3 },
      { noteId: 'nutmeg', tier: 'heart', weight: 0.3 },
      { noteId: 'white-musk', tier: 'base', weight: 0.6 },
      { noteId: 'moss', tier: 'base', weight: 0.5 },
      { noteId: 'vetiver', tier: 'base', weight: 0.5 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.5 },
      { noteId: 'amber-accord', tier: 'base', weight: 0.4 },
    ],
    /*
      ⚠️ **Dekant, tam şişe değil** — ve satıcı adında bu yüzden yazıyor.
      Bu parfüm hiçbir normal satıcıda yok (gerekçeler
      `docs/superpowers/specs/2026-08-12-satici-bosluklari-design.md`te);
      Scent Split gerçek şişeyi küçük şişelere aktarıp satıyor. Sahip
      "yeri boş kalmasın" dedi, ama okur tam şişe beklemesin diye ad
      "(decant)" taşıyor. Adı sadeleştirmek bu satırı yanıltıcı yapar.
    */
    retailers: [
      { name: 'Scent Split (decant)', url: 'https://www.scentsplit.com/products/m-micallef-gntonic-sample-decants' },
    ],
  },
  {
    id: 'imaginary-authors-every-storm-a-serenade',
    name: 'Every Storm a Serenade',
    brand: 'Imaginary Authors',
    year: 2015,
    perfumer: 'Josh Meyer',
    curated: true,
    line: {
      en: 'The Baltic in winter: spruce, cold air and salt, with no one left on the beach.',
      tr: 'Kışın Baltık: ladin, soğuk hava ve tuz — sahilde kimse kalmamış.',
    },
    notes: [
      { noteId: 'spruce', tier: 'top', weight: 0.9 },
      { noteId: 'marine', tier: 'top', weight: 0.8 },
      { noteId: 'eucalyptus', tier: 'top', weight: 0.6 },
      { noteId: 'sea-salt', tier: 'heart', weight: 0.7 },
      { noteId: 'ambergris', tier: 'base', weight: 0.7 },
      { noteId: 'vetiver', tier: 'base', weight: 0.6 },
    ],
    retailers: [
      { name: 'Luckyscent', url: 'https://www.luckyscent.com/products/every-storm-a-serenade-by-imaginary-authors' },
    ],
  },
  {
    id: 'serge-lutens-santal-majuscule',
    name: 'Santal Majuscule',
    brand: 'Serge Lutens',
    year: 2012,
    perfumer: 'Christopher Sheldrake',
    curated: true,
    line: {
      en: 'Sandalwood, rose and cocoa powder — warmth built entirely out of bitterness.',
      tr: 'Sandal, gül ve kakao tozu — bütünüyle acılıktan kurulmuş bir sıcaklık.',
    },
    notes: [
      { noteId: 'rose', tier: 'heart', weight: 0.8 },
      { noteId: 'cocoa', tier: 'heart', weight: 0.6 },
      { noteId: 'sandalwood', tier: 'base', weight: 1.0 },
    ],
    retailers: [
      { name: 'Serge Lutens', url: 'https://sergelutens.com/products/santal-majuscule-eau-de-parfum-spray' },
    ],
  },
  {
    id: 'stora-skuggan-moonmilk',
    name: 'Moonmilk',
    brand: 'Stora Skuggan',
    year: 2017,
    perfumer: 'Tomas Hempel',
    curated: true,
    line: {
      en: 'Cool cave air and cardamom laid over a wall of sandalwood — dry, and quietly masculine.',
      tr: 'Bir sandal duvarının üstüne serilmiş serin mağara havası ve kakule — kuru ve sessizce erkeksi.',
    },
    notes: [
      { noteId: 'black-tea', tier: 'top', weight: 0.6 },
      { noteId: 'lime', tier: 'top', weight: 0.5 },
      { noteId: 'cardamom', tier: 'heart', weight: 0.8 },
      { noteId: 'lily-of-the-valley', tier: 'heart', weight: 0.4 },
      { noteId: 'black-pepper', tier: 'heart', weight: 0.4 },
      { noteId: 'mandarin', tier: 'heart', weight: 0.4 },
      { noteId: 'sandalwood', tier: 'base', weight: 1.0 },
      { noteId: 'leather', tier: 'base', weight: 0.5 },
    ],
    retailers: [
      { name: 'Luckyscent', url: 'https://www.luckyscent.com/products/moonmilk-by-stora-skuggan' },
    ],
  },
];
