import { defineCuratedPerfumes, type CuratedPerfumeSpec } from './curated-factory';

const SPECS = [
  {
    id: 'parle-moi-de-parfum-une-tonne-de-roses-8', name: 'Une Tonne de Roses / 8', brand: 'Parle Moi de Parfum', year: 2016, perfumer: 'Michel Almairac', aliases: ['Une Tonne de Roses 8'],
    line: ['One clear rose is enlarged until its green stem and patchouli shadow fill the room.', 'Tek bir berrak gül, yeşil sapı ve paçuli gölgesi odayı doldurana dek büyütülür.'],
    notes: [['rose', 'heart', 1], ['raspberry', 'heart', 0.45], ['patchouli', 'base', 0.65]],
  },
  {
    id: 'miller-harris-rose-silence', name: 'Rose Silence', brand: 'Miller Harris', year: 2015,
    line: ['A sheer rose rests between tart blackcurrant and a nearly invisible musk.', 'Saydam bir gül mayhoş frenk üzümüyle neredeyse görünmez miskin arasında durur.'],
    notes: [['mandarin', 'top', 0.45], ['blackcurrant', 'top', 0.65], ['turkish-rose', 'heart', 1], ['patchouli', 'base', 0.4], ['white-musk', 'base', 0.55]],
  },
  {
    id: 'kerosene-unknown-pleasures', name: 'Unknown Pleasures', brand: 'Kerosene', year: 2013, perfumer: 'John Pegg',
    line: ['Earl Grey and lemon peel cut into caramel and waffle cone — bright, dark, and edible.', 'Earl Grey ve limon kabuğu karamel ile külahı keser — parlak, koyu ve yenebilir.'],
    notes: [['black-tea', 'top', 0.75], ['lemon', 'top', 0.8], ['bergamot', 'top', 0.65], ['honey', 'heart', 0.5], ['caramel', 'base', 0.9], ['vanilla', 'base', 0.8], ['tonka', 'base', 0.55], ['biscuit', 'base', 0.55]],
  },
  {
    id: 'papillon-spell-125', name: 'Spell 125', brand: 'Papillon Artisan Perfumes', year: 2021, perfumer: 'Liz Moores',
    line: ['Cold pine and frankincense circle a mineral ambergris core like smoke around stone.', 'Soğuk çam ve günlük, mineral ambergris çekirdeğini taşın çevresindeki duman gibi sarar.'],
    notes: [['pine', 'top', 0.8], ['frankincense', 'heart', 1], ['ylang-ylang', 'heart', 0.35], ['ambergris', 'base', 0.9], ['sandalwood', 'base', 0.6]],
  },
  {
    id: 'parfums-dusita-melodie-de-lamour', name: "Mélodie de l'Amour", brand: 'Parfums Dusita', year: 2016, perfumer: 'Pissara Umavijani', aliases: ["Melodie de L'Amour"],
    line: ['Gardenia, jasmine, and tuberose bloom as one soft white mass above honeyed skin.', 'Gardenya, yasemin ve sümbülteber ballı tenin üstünde tek yumuşak beyaz kütle gibi açar.'],
    notes: [['gardenia', 'heart', 1], ['jasmine', 'heart', 0.85], ['tuberose', 'heart', 0.7], ['peach', 'heart', 0.45], ['honey', 'base', 0.55], ['cedar', 'base', 0.4], ['white-musk', 'base', 0.5]],
  },
  {
    id: 'laboratorio-olfattivo-salina', name: 'Salina', brand: 'Laboratorio Olfattivo', year: 2013, perfumer: 'David Maruitte',
    line: ['Salt dries on warm sand while lemon, pine, and myrtle keep the horizon green.', 'Tuz sıcak kumda kururken limon, çam ve mersin ufku yeşil tutar.'],
    notes: [['lemon', 'top', 0.6], ['pine', 'top', 0.55], ['sea-salt', 'heart', 1], ['myrtle', 'heart', 0.5], ['lavender', 'heart', 0.4], ['marine', 'heart', 0.65], ['vanilla', 'base', 0.35], ['white-musk', 'base', 0.45], ['cedar', 'base', 0.45]],
  },
  {
    id: '4160-tuesdays-sexiest-scent-on-the-planet', name: 'The Sexiest Scent on the Planet. Ever. (IMHO)', brand: '4160 Tuesdays', year: 2013, perfumer: 'Sarah McCartney', aliases: ['The Sexiest Scent on the Planet'],
    line: ['Bergamot hovers above warm wood, vanilla, and ambergris — deliberately close to bare skin.', 'Bergamot sıcak odun, vanilya ve ambergrisin üstünde durur — bilerek çıplak tene yakın.'],
    notes: [['bergamot', 'top', 0.6], ['cedar', 'base', 0.65], ['vanilla', 'base', 0.7], ['ambergris', 'base', 0.8]],
  },
  {
    id: 'perris-monte-carlo-cedro-di-diamante', name: 'Cedro di Diamante', brand: 'Perris Monte Carlo', year: 2018, perfumer: 'Luca Maffei',
    line: ['Citron and lime flash against ginger and pepper, then settle onto clean cedar.', 'Ağaç kavunu ve limon zencefil ile bibere çarpar, sonra temiz sedire oturur.'],
    notes: [['lemon', 'top', 1], ['lime', 'top', 0.55], ['ginger', 'top', 0.5], ['cardamom', 'heart', 0.4], ['black-pepper', 'heart', 0.45], ['iris', 'heart', 0.35], ['cedar', 'base', 0.65], ['white-musk', 'base', 0.45]],
  },
  {
    id: 'phlur-missing-person', name: 'Missing Person', brand: 'Phlur', year: 2022, perfumer: 'Constance Georges-Picot',
    line: ['Pale flowers and sandalwood dissolve into skin musk, more memory than projection.', 'Açık çiçekler ve sandal ten miskine çözünür; yayılımdan çok bir anı gibi.'],
    notes: [['bergamot', 'top', 0.35], ['jasmine', 'heart', 0.45], ['orange-blossom', 'heart', 0.4], ['neroli', 'heart', 0.35], ['sandalwood', 'base', 0.65], ['white-musk', 'base', 1]],
  },
  {
    id: 'maison-mataha-escapade-gourmande', name: 'Escapade Gourmande', brand: 'Maison Mataha', year: 2020, perfumer: 'Vincent Ricord',
    line: ['Vanilla and blackened sugar form a dense glaze with only musk beneath it.', 'Vanilya ve kararmış şeker, altında yalnızca misk olan yoğun bir sır oluşturur.'],
    notes: [['brown-sugar', 'top', 0.8], ['vanilla', 'heart', 1], ['tonka', 'base', 0.65], ['benzoin', 'base', 0.45], ['white-musk', 'base', 0.4]],
  },
  {
    id: 'sylvaine-delacourte-osiris', name: 'Osiris', brand: 'Sylvaine Delacourte', year: 2017, perfumer: 'Irène Farmachidi',
    line: ['Orange blossom opens onto toasted seed and dry guaiac — sunlight with a nutty shadow.', 'Portakal çiçeği kavrulmuş tohum ve kuru guaiaca açılır — fındıksı gölgeli güneş ışığı.'],
    notes: [['mandarin', 'top', 0.55], ['pink-pepper', 'top', 0.45], ['orange-blossom', 'heart', 0.9], ['hazelnut', 'heart', 0.4], ['cedar', 'base', 0.55], ['guaiac-wood', 'base', 0.65]],
  },
  {
    id: 'bdk-creme-de-cuir', name: 'Crème de Cuir', brand: 'BDK Parfums', year: 2018, perfumer: 'Violaine Collas', aliases: ['Creme de Cuir'],
    line: ['Pineapple brightens a suede accord until birch and musk pull it back into shade.', 'Ananas süet akorunu aydınlatır; huş ve misk onu yeniden gölgeye çeker.'],
    notes: [['mandarin', 'top', 0.55], ['bergamot', 'top', 0.45], ['pineapple', 'top', 0.75], ['pink-pepper', 'heart', 0.4], ['solar-accord', 'heart', 0.45], ['suede', 'heart', 0.9], ['sandalwood', 'base', 0.6], ['vanilla', 'base', 0.4], ['birch-tar', 'base', 0.45], ['white-musk', 'base', 0.55]],
  },
  {
    id: 'gritti-pomelo-sorrento', name: 'Pomelo Sorrento', brand: 'Gritti', year: 2017,
    line: ['Grapefruit peel, mint, and green tea make a white floral feel almost weightless.', 'Greyfurt kabuğu, nane ve yeşil çay beyaz çiçeği neredeyse ağırlıksız kılar.'],
    notes: [['grapefruit', 'top', 1], ['mint', 'top', 0.55], ['green-tea', 'heart', 0.65], ['rose', 'heart', 0.35], ['iris', 'base', 0.4], ['vetiver', 'base', 0.5], ['amber-accord', 'base', 0.4]],
  },
  {
    id: 'parfums-dusita-oudh-infini', name: 'Oudh Infini', brand: 'Parfums Dusita', year: 2016, perfumer: 'Pissara Umavijani',
    line: ['Oud, civet, and rose build a dark animalic column softened only at the edges.', 'Ud, misk kedisi ve gül koyu hayvansı bir sütun kurar; yalnızca kenarları yumuşar.'],
    notes: [['rose', 'heart', 0.75], ['orange-blossom', 'heart', 0.35], ['oud', 'base', 1], ['sandalwood', 'base', 0.6], ['benzoin', 'base', 0.55], ['civet', 'base', 0.8], ['vanilla', 'base', 0.35], ['white-musk', 'base', 0.45]],
  },
  {
    id: 'ojar-halwa-kiss', name: 'Halwa Kiss', brand: 'Ojar', year: 2021,
    line: ['Cardamom and saffron open a dense halwa of dates, pistachio, honey, and rose.', 'Kakule ve safran hurma, Antep fıstığı, bal ve gülden yoğun bir helvayı açar.'],
    notes: [['cardamom', 'top', 0.65], ['saffron', 'top', 0.5], ['pistachio', 'heart', 0.75], ['date', 'heart', 0.65], ['rose', 'heart', 0.4], ['honey', 'base', 0.6], ['vanilla', 'base', 0.65], ['amber-accord', 'base', 0.5]],
  },
  {
    id: 'le-labo-ambrette-9', name: 'Ambrette 9', brand: 'Le Labo', year: 2006, perfumer: 'Michel Almairac',
    line: ['Ambrette sits in a wash of pale fruit and aldehydes — quiet, clean, and almost private.', 'Ambrette açık meyve ve aldehit yıkamasında durur — sessiz, temiz, neredeyse özel.'],
    notes: [['aldehydes', 'top', 0.45], ['lemon', 'top', 0.35], ['ambrette', 'heart', 1], ['pear', 'heart', 0.35], ['white-musk', 'base', 0.65], ['amber-accord', 'base', 0.4]],
  },
  {
    id: 'laboratorio-olfattivo-mandarino', name: 'Mandarino', brand: 'Laboratorio Olfattivo', year: 2020, perfumer: 'Jean-Claude Ellena',
    line: ['Mandarin is drawn in thin ink with blackcurrant and white musk, peel before juice.', 'Mandalina frenk üzümü ve beyaz miskle ince mürekkeple çizilir; sudan önce kabuk.'],
    notes: [['mandarin', 'top', 1], ['blackcurrant', 'heart', 0.35], ['white-musk', 'base', 0.55]],
  },
  {
    id: 'ds-durga-italian-citrus', name: 'Italian Citrus', brand: 'D.S. & Durga', year: 2011, perfumer: 'David Seth Moltz',
    line: ['Pressed citrus turns bitter, green, and smoky against moss and ambrette.', 'Sıkılmış narenciye yosun ve ambrette karşısında acı, yeşil ve dumanlılaşır.'],
    notes: [['lemon', 'top', 0.85], ['bitter-orange', 'top', 0.8], ['mandarin', 'top', 0.6], ['violet-leaf', 'heart', 0.45], ['frankincense', 'heart', 0.4], ['ambrette', 'base', 0.55], ['oakmoss', 'base', 0.5]],
  },
  {
    id: 'ds-durga-sweet-do-nothing', name: 'Sweet Do Nothing', brand: 'D.S. & Durga', year: 2021, perfumer: 'David Seth Moltz',
    line: ['Cactus water, neroli, and desert dust make orange blossom feel sun-bleached.', 'Kaktüs suyu, neroli ve çöl tozu portakal çiçeğini güneşte solmuş gibi gösterir.'],
    notes: [['neroli', 'top', 0.65], ['cactus', 'heart', 0.8], ['fig', 'heart', 0.5], ['orange-blossom', 'heart', 0.75], ['frankincense', 'heart', 0.4], ['cedar', 'base', 0.6], ['white-musk', 'base', 0.45]],
  },
  {
    id: 'liis-floating', name: 'Floating', brand: 'Liis', year: 2022,
    line: ['Peach and bergamot drift across linen, orchid, and very pale wood.', 'Şeftali ve bergamot keten, orkide ve çok açık renkli odunun üstünde süzülür.'],
    notes: [['peach', 'top', 0.75], ['bergamot', 'top', 0.55], ['orchid', 'heart', 0.6], ['aldehydes', 'heart', 0.45], ['amber-accord', 'base', 0.45], ['cedar', 'base', 0.5]],
  },
  {
    id: 'maison-tahite-cacao2', name: 'Cacao²', brand: 'Maison Tahité', year: 2021, aliases: ['Cacao2'],
    line: ['Cacao powder and cinnamon darken vanilla with resin, vetiver, and dry cedar.', 'Kakao tozu ve tarçın vanilyayı reçine, vetiver ve kuru sedirle karartır.'],
    notes: [['cinnamon', 'top', 0.55], ['cocoa', 'heart', 1], ['labdanum', 'heart', 0.55], ['vanilla', 'base', 0.8], ['vetiver', 'base', 0.45], ['cedar', 'base', 0.55], ['benzoin', 'base', 0.5]],
  },
  {
    id: 'the-different-company-charmes-feuilles', name: 'Charmes & Feuilles', brand: 'The Different Company', year: 2006, perfumer: 'Céline Ellena', aliases: ['Un Parfum de Charme et Feuilles'],
    line: ['Mint, basil, and crushed herbs surround a small jasmine-geranium heart.', 'Nane, fesleğen ve ezilmiş otlar küçük bir yasemin-sardunya kalbini çevreler.'],
    notes: [['basil', 'top', 0.75], ['mint', 'top', 0.7], ['clary-sage', 'top', 0.5], ['rosemary', 'top', 0.45], ['geranium', 'heart', 0.7], ['jasmine', 'heart', 0.45], ['patchouli', 'base', 0.5]],
  },
  {
    id: 'heeley-menthe-fraiche', name: 'Menthe Fraîche', brand: 'Heeley', year: 2006, perfumer: 'James Heeley', aliases: ['Menthe Fraiche'],
    line: ['Fresh mint is held between bitter citrus, black pepper, green tea, and cedar.', 'Taze nane acı narenciye, karabiber, yeşil çay ve sedirin arasında tutulur.'],
    notes: [['mint', 'top', 1], ['bergamot', 'top', 0.55], ['black-pepper', 'heart', 0.45], ['green-tea', 'heart', 0.55], ['cedar', 'base', 0.5]],
  },
] satisfies readonly CuratedPerfumeSpec[];

export const SPACE_3_A = defineCuratedPerfumes(SPECS);
