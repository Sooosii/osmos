import type { Perfume } from '../types';

/**
 * Küratörlü seçki — üçüncü grup: haritanın boş bölgeleri.
 *
 * İlk iki grup uzayı iki kütlede topladı: sıcak-odunsu-tatlı tarafta bir yığın,
 * yeşil-yosunlu tarafta bir yığın. Ana planın dağılım analizi hangi bölgelerin
 * boş kaldığını zaten söylüyordu — narenciye, fujer/lavanta, iris/pudra, tütsü,
 * akuatik-otsu, beyaz çiçek. Bu sekiz parfüm o boşlukları dolduruyor.
 *
 * Hiçbiri yeni nota gerektirmedi; sekizi de mevcut 123 notayla kuruluyor. Bu
 * kendi başına bir doğrulama: nota veritabanı gerçekten kapsayıcı çıktı.
 */
export const CURATED_C: readonly Perfume[] = [
  {
    id: 'frederic-malle-bigarade-concentree',
    name: 'Bigarade Concentrée',
    brand: 'Frédéric Malle',
    year: 2001,
    perfumer: 'Jean-Claude Ellena',
    curated: true,
    line: {
      en: 'The bitter side of an orange peel — not the fruit, the rind itself.',
      tr: 'Portakal kabuğunun acı tarafı — meyve değil, kabuğun kendisi.',
    },
    notes: [
      { noteId: 'bitter-orange', tier: 'top', weight: 1.0 },
      { noteId: 'bergamot', tier: 'top', weight: 0.5 },
      { noteId: 'mandarin', tier: 'top', weight: 0.3 },
      { noteId: 'rose', tier: 'heart', weight: 0.3 },
      { noteId: 'hay', tier: 'heart', weight: 0.3 },
      { noteId: 'cedar', tier: 'base', weight: 0.4 },
      { noteId: 'white-musk', tier: 'base', weight: 0.3 },
    ],
  },
  {
    id: 'penhaligons-sartorial',
    name: 'Sartorial',
    brand: "Penhaligon's",
    year: 2010,
    perfumer: 'Bertrand Duchaufour',
    curated: true,
    line: {
      en: 'A tailor’s workroom: wax, cloth, metal, and the man who works there.',
      tr: 'Bir terzi atölyesi: cila, kumaş, metal ve orada çalışan adam.',
    },
    notes: [
      { noteId: 'aldehydes', tier: 'top', weight: 0.8 },
      { noteId: 'lavender', tier: 'top', weight: 0.7 },
      { noteId: 'bergamot', tier: 'top', weight: 0.4 },
      { noteId: 'black-pepper', tier: 'top', weight: 0.3 },
      { noteId: 'neroli', tier: 'heart', weight: 0.4 },
      { noteId: 'violet', tier: 'heart', weight: 0.4 },
      { noteId: 'cumin', tier: 'heart', weight: 0.3 },
      { noteId: 'honey', tier: 'heart', weight: 0.3 },
      { noteId: 'oakmoss', tier: 'base', weight: 0.6 },
      { noteId: 'leather', tier: 'base', weight: 0.5 },
      { noteId: 'beeswax', tier: 'base', weight: 0.5 },
      { noteId: 'tonka', tier: 'base', weight: 0.4 },
      { noteId: 'white-musk', tier: 'base', weight: 0.3 },
    ],
  },
  {
    id: 'essential-parfums-velvet-iris',
    name: 'Velvet Iris',
    brand: 'Essential Parfums',
    curated: true,
    line: {
      en: 'Iris without its cold — a root warmed in the hand.',
      tr: 'Soğuğu alınmış iris — avuçta ısıtılmış bir kök.',
    },
    notes: [
      { noteId: 'cardamom', tier: 'top', weight: 0.4 },
      { noteId: 'bergamot', tier: 'top', weight: 0.3 },
      { noteId: 'iris', tier: 'heart', weight: 1.0 },
      { noteId: 'violet', tier: 'heart', weight: 0.4 },
      { noteId: 'ambrette', tier: 'heart', weight: 0.4 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.6 },
      { noteId: 'cashmeran', tier: 'base', weight: 0.5 },
      { noteId: 'white-musk', tier: 'base', weight: 0.5 },
    ],
  },
  {
    // Haritada tek başına bir bölge kurması bekleniyor: mineral + safran + süet
    // bileşimi listedeki hiçbir şeye benzemiyor. Motor onu bir kümeye
    // yapıştırıyorsa bakılacak yer burası.
    id: 'marc-antoine-barrois-ganymede',
    name: 'Ganymede',
    brand: 'Marc-Antoine Barrois',
    year: 2019,
    perfumer: 'Quentin Bisch',
    curated: true,
    line: {
      en: 'Suede and cold stone — a skin that does not belong to this planet.',
      tr: 'Süet ve soğuk taş — bu gezegene ait olmayan bir ten.',
    },
    notes: [
      { noteId: 'mandarin', tier: 'top', weight: 0.5 },
      { noteId: 'saffron', tier: 'top', weight: 0.4 },
      { noteId: 'elemi', tier: 'top', weight: 0.3 },
      { noteId: 'osmanthus', tier: 'heart', weight: 0.7 },
      { noteId: 'violet', tier: 'heart', weight: 0.5 },
      { noteId: 'flint', tier: 'heart', weight: 0.4 },
      { noteId: 'suede', tier: 'base', weight: 0.8 },
      { noteId: 'ambroxan', tier: 'base', weight: 0.7 },
      { noteId: 'white-musk', tier: 'base', weight: 0.5 },
      { noteId: 'cashmeran', tier: 'base', weight: 0.4 },
    ],
  },
  {
    id: 'filippo-sorcinelli-lavs',
    name: 'Lavs',
    brand: 'Filippo Sorcinelli',
    year: 2014,
    curated: true,
    line: {
      en: 'Cold stone, high ceilings, and smoke that has not left in centuries.',
      tr: 'Soğuk taş, yüksek tavan ve yüzyıllardır çıkmamış duman.',
    },
    notes: [
      { noteId: 'elemi', tier: 'top', weight: 0.4 },
      { noteId: 'bergamot', tier: 'top', weight: 0.3 },
      { noteId: 'frankincense', tier: 'heart', weight: 1.0 },
      { noteId: 'myrrh', tier: 'heart', weight: 0.7 },
      { noteId: 'labdanum', tier: 'base', weight: 0.6 },
      { noteId: 'opoponax', tier: 'base', weight: 0.5 },
      { noteId: 'benzoin', tier: 'base', weight: 0.5 },
      { noteId: 'styrax', tier: 'base', weight: 0.4 },
      { noteId: 'papyrus', tier: 'base', weight: 0.4 },
    ],
  },
  {
    // Denetim noktası: Megamare de deniz, bu da deniz — ama ikisi aynı yere
    // düşmemeli. Megamare ıslak ve mineral, bu kuru ve otsu. Motor ikisini
    // üst üste bindiriyorsa deniz ailesi fazla kaba demektir.
    id: 'nishane-ege',
    name: 'EGE ΑΙΓΑΙΟ',
    brand: 'Nishane',
    year: 2019,
    curated: true,
    line: {
      en: 'Not the sea itself — the dry scrub on the hill above it.',
      tr: 'Denizin kendisi değil — üstündeki tepenin kuru makisi.',
    },
    notes: [
      { noteId: 'mastic', tier: 'top', weight: 0.8 },
      { noteId: 'rosemary', tier: 'top', weight: 0.5 },
      { noteId: 'juniper', tier: 'top', weight: 0.4 },
      { noteId: 'marine', tier: 'top', weight: 0.4 },
      { noteId: 'fig-leaf', tier: 'heart', weight: 0.6 },
      { noteId: 'clary-sage', tier: 'heart', weight: 0.5 },
      { noteId: 'cypress', tier: 'heart', weight: 0.4 },
      { noteId: 'sea-salt', tier: 'heart', weight: 0.4 },
      { noteId: 'moss', tier: 'base', weight: 0.5 },
      { noteId: 'vetiver', tier: 'base', weight: 0.4 },
      { noteId: 'white-musk', tier: 'base', weight: 0.3 },
    ],
  },
  {
    // Evrim çizelgesinin en sert sınavı: kâfur ve nane on beş dakikada çekilip
    // altından bambaşka bir parfüm çıkıyor. Uçuculuk modeli bunu gösteremiyorsa
    // model yanlış — bu parfüm o yüzden burada.
    id: 'serge-lutens-tubereuse-criminelle',
    name: 'Tubéreuse Criminelle',
    brand: 'Serge Lutens',
    year: 1999,
    perfumer: 'Christopher Sheldrake',
    curated: true,
    line: {
      en: 'Fifteen minutes of gasoline and menthol, then the flower arrives.',
      tr: 'On beş dakika benzin ve mentol, sonra çiçek geliyor.',
    },
    notes: [
      { noteId: 'camphor', tier: 'top', weight: 1.0 },
      { noteId: 'mint', tier: 'top', weight: 0.6 },
      { noteId: 'hyacinth', tier: 'top', weight: 0.4 },
      { noteId: 'tuberose', tier: 'heart', weight: 1.0 },
      { noteId: 'orange-blossom', tier: 'heart', weight: 0.5 },
      { noteId: 'jasmine', tier: 'heart', weight: 0.4 },
      { noteId: 'styrax', tier: 'base', weight: 0.5 },
      { noteId: 'white-musk', tier: 'base', weight: 0.4 },
      { noteId: 'vanilla', tier: 'base', weight: 0.3 },
    ],
  },
  {
    id: 'van-cleef-moonlight-patchouli',
    name: 'Moonlight Patchouli',
    brand: 'Van Cleef & Arpels',
    year: 2015,
    curated: true,
    line: {
      en: 'Patchouli with the soil brushed off — polished, and still dark.',
      tr: 'Toprağı silkelenmiş paçuli — cilalanmış ama hâlâ karanlık.',
    },
    notes: [
      { noteId: 'pink-pepper', tier: 'top', weight: 0.5 },
      { noteId: 'bergamot', tier: 'top', weight: 0.4 },
      { noteId: 'rose', tier: 'heart', weight: 0.5 },
      { noteId: 'geranium', tier: 'heart', weight: 0.4 },
      { noteId: 'patchouli', tier: 'base', weight: 1.0 },
      { noteId: 'vetiver', tier: 'base', weight: 0.5 },
      { noteId: 'labdanum', tier: 'base', weight: 0.4 },
      { noteId: 'vanilla', tier: 'base', weight: 0.4 },
      { noteId: 'cedar', tier: 'base', weight: 0.3 },
    ],
  },
] as const;
