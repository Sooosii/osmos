import { defineCuratedPerfumes, type CuratedPerfumeSpec } from './curated-factory';

const SPECS = [
  {
    id: 'heeley-hippie-rose', name: 'Hippie Rose', brand: 'Heeley', year: 2011, perfumer: 'James Heeley',
    line: ['Rose and patchouli wear a green, mossy jacket lined with incense.', 'Gül ve paçuli tütsü astarlı yeşil, yosunlu bir ceket giyer.'],
    notes: [['bergamot', 'top', 0.45], ['rose', 'heart', 0.9], ['patchouli', 'heart', 0.8], ['oakmoss', 'base', 0.6], ['frankincense', 'base', 0.55], ['vetiver', 'base', 0.45], ['white-musk', 'base', 0.35], ['amber-accord', 'base', 0.4]],
  },
  {
    id: 'nicolai-kiss-me-intense', name: 'Kiss Me Intense', brand: 'Nicolaï Parfumeur-Créateur', year: 2014, perfumer: 'Patricia de Nicolaï', aliases: ['Nicolaï Parfumeur – Kiss Me Intense'],
    line: ['Anise and bitter almond cool a plush vanilla-heliotrope centre.', 'Anason ve acı badem, dolgun vanilya-heliotrop merkezini serinletir.'],
    notes: [['lemon', 'top', 0.4], ['anise', 'top', 0.65], ['almond', 'top', 0.7], ['heliotrope', 'heart', 0.8], ['ylang-ylang', 'heart', 0.45], ['vanilla', 'base', 0.9], ['opoponax', 'base', 0.55]],
  },
  {
    id: 'une-nuit-nomade-click-song', name: 'Click Song', brand: 'Une Nuit Nomade', year: 2019, perfumer: 'Alexandra Monet',
    line: ['Rose and geranium strike a dark patchouli-amber rhythm softened by vanilla.', 'Gül ve sardunya vanilyayla yumuşayan koyu bir paçuli-amber ritmi vurur.'],
    notes: [['bergamot', 'top', 0.45], ['rose', 'heart', 0.85], ['geranium', 'heart', 0.65], ['patchouli', 'base', 0.8], ['amber-accord', 'base', 0.55], ['labdanum', 'base', 0.45], ['vanilla', 'base', 0.45]],
  },
  {
    id: 'musicology-cause-im-happy', name: "'Cause I'm Happy", brand: 'Musicology', year: 2020, perfumer: 'Nathalie Lorson', aliases: ["Cause I'm Happy"],
    line: ['Grapefruit and cypress brighten a clean orange-blossom musk over cedar.', 'Greyfurt ve servi sedirin üstündeki temiz portakal çiçeği miskini aydınlatır.'],
    notes: [['bergamot', 'top', 0.55], ['grapefruit', 'top', 0.65], ['cypress', 'top', 0.5], ['orange-blossom', 'heart', 0.7], ['ambrette', 'heart', 0.55], ['vetiver', 'base', 0.5], ['cedar', 'base', 0.55], ['ambergris', 'base', 0.4]],
  },
  {
    id: 'chabaud-lait-de-biscuit', name: 'Lait de Biscuit', brand: 'Chabaud Maison de Parfum', year: 2014,
    line: ['A warm biscuit dissolves into milk, caramel, and vanilla without leaving the kitchen.', 'Sıcak bisküvi mutfaktan çıkmadan süt, karamel ve vanilyaya çözünür.'],
    notes: [['biscuit', 'heart', 1], ['milk', 'heart', 0.8], ['caramel', 'base', 0.7], ['vanilla', 'base', 0.75]],
  },
  {
    id: 'masque-milano-montecristo', name: 'Montecristo', brand: 'Masque Milano', year: 2013, perfumer: 'Delphine Thierry',
    line: ['Rum and tobacco cross animalic resins and rough wood in a dark, airless room.', 'Rom ve tütün karanlık, havasız bir odada hayvansı reçinelerle pürüzlü odunu geçer.'],
    notes: [['ambrette', 'top', 0.55], ['rum', 'top', 0.65], ['tobacco', 'heart', 0.8], ['labdanum', 'heart', 0.65], ['benzoin', 'heart', 0.55], ['hyraceum', 'base', 0.8], ['styrax', 'base', 0.65], ['guaiac-wood', 'base', 0.55], ['patchouli', 'base', 0.5]],
  },
  {
    id: 'goldfield-banks-ingenious-ginger', name: 'Ingenious Ginger', brand: 'Goldfield & Banks', year: 2023, perfumer: 'Hamid Merati-Kashani',
    line: ['Ginger glows rather than bites, wrapped in citrus, magnolia, vanilla, and sandalwood.', 'Zencefil ısırmak yerine parlar; narenciye, manolya, vanilya ve sandala sarılır.'],
    notes: [['ginger', 'top', 1], ['mandarin', 'top', 0.6], ['bergamot', 'top', 0.5], ['magnolia', 'heart', 0.65], ['neroli', 'heart', 0.45], ['rose', 'heart', 0.35], ['sandalwood', 'base', 0.65], ['vanilla', 'base', 0.6], ['cashmeran', 'base', 0.45]],
  },
  {
    id: 'electimuss-celestial', name: 'Celestial', brand: 'Electimuss', year: 2020,
    line: ['Raspberry and saffron light a smoky rose above oud, guaiac, and amber.', 'Ahududu ve safran ud, guaiac ve amberin üstündeki dumanlı gülü yakar.'],
    notes: [['saffron', 'top', 0.65], ['raspberry', 'top', 0.6], ['black-pepper', 'top', 0.45], ['rose', 'heart', 0.75], ['frankincense', 'heart', 0.6], ['cedar', 'base', 0.5], ['guaiac-wood', 'base', 0.55], ['oud', 'base', 0.7], ['amber-accord', 'base', 0.6]],
  },
  {
    id: 'akro-bake', name: 'Bake', brand: 'Akro', year: 2023, perfumer: 'Olivier Cresp',
    line: ['Lemon zest tears through warm cream, praline, brown sugar, and vanilla.', 'Limon kabuğu sıcak krema, pralin, esmer şeker ve vanilyayı yarar.'],
    notes: [['lemon', 'top', 0.9], ['milk', 'heart', 0.7], ['hazelnut', 'heart', 0.55], ['brown-sugar', 'base', 0.8], ['vanilla', 'base', 0.85]],
  },
  {
    id: 'juliette-has-a-gun-pear-inc', name: 'Pear Inc.', brand: 'Juliette Has a Gun', year: 2021, perfumer: 'Romano Ricci',
    line: ['A crisp pear hangs inside a smooth cloud of ambroxan and clean musk.', 'Gevrek bir armut pürüzsüz ambroxan ve temiz misk bulutunun içinde asılı durur.'],
    notes: [['pear', 'top', 1], ['ambroxan', 'base', 0.85], ['white-musk', 'base', 0.7]],
  },
  {
    id: 'profumum-roma-neroli', name: 'Neroli', brand: 'Profumum Roma', year: 1998,
    line: ['Bitter orange flower is made dense with myrrh and the dry grain of citrus wood.', 'Acı portakal çiçeği mür ve narenciye odununun kuru damarıyla yoğunlaşır.'],
    notes: [['bitter-orange', 'top', 0.55], ['neroli', 'heart', 1], ['myrrh', 'base', 0.65], ['cedar', 'base', 0.45]],
  },
  {
    id: 'bdk-312-saint-honore', name: '312 Saint-Honoré', brand: 'BDK Parfums', year: 2023, perfumer: 'Alexandra Carlin', aliases: ['312 Saint-Honore'],
    line: ['Pepper and angelica frame a cool orange-blossom iris over ambered woods.', 'Biber ve melek otu amberli odunların üstündeki serin portakal çiçeği-irisi çerçeveler.'],
    notes: [['pink-pepper', 'top', 0.55], ['angelica-root', 'top', 0.55], ['orange-blossom', 'heart', 0.7], ['tonka', 'heart', 0.45], ['iris', 'heart', 0.65], ['ambroxan', 'base', 0.65], ['amber-accord', 'base', 0.45], ['oud', 'base', 0.35]],
  },
  {
    id: 'carner-barcelona-palo-santo', name: 'Palo Santo', brand: 'Carner Barcelona', year: 2015, perfumer: 'Shyamala Maisondieu',
    line: ['Rum and warm milk soften smoky guaiac, tonka, vanilla, and sandalwood.', 'Rom ve sıcak süt dumanlı guaiac, tonka, vanilya ve sandal ağacını yumuşatır.'],
    notes: [['rum', 'top', 0.65], ['davana', 'top', 0.45], ['milk', 'heart', 0.65], ['guaiac-wood', 'heart', 0.8], ['tonka', 'base', 0.65], ['vetiver', 'base', 0.4], ['vanilla', 'base', 0.6], ['sandalwood', 'base', 0.55]],
  },
  {
    id: 'nishane-nanshe', name: 'Nanshe', brand: 'Nishane', year: 2020, perfumer: 'Cécile Zarokian',
    line: ['Carrot seed and cool iris temper a bright floral-fruit accord above soft woods.', 'Havuç tohumu ve serin iris yumuşak odunların üstündeki parlak çiçek-meyve akorunu dizginler.'],
    notes: [['bergamot', 'top', 0.55], ['yuzu', 'top', 0.5], ['cardamom', 'top', 0.4], ['carrot', 'top', 0.55], ['rose', 'heart', 0.5], ['jasmine', 'heart', 0.45], ['ylang-ylang', 'heart', 0.4], ['iris', 'base', 0.75], ['white-musk', 'base', 0.55], ['sandalwood', 'base', 0.5]],
  },
  {
    id: 'ormonde-jayne-champaca', name: 'Champaca', brand: 'Ormonde Jayne', year: 2002, perfumer: 'Geza Schoen',
    line: ['Golden champaca floats over steamed rice, green tea, myrrh, and cool musk.', 'Altın şampaka buharda pirinç, yeşil çay, mür ve serin miskin üstünde yüzer.'],
    notes: [['neroli', 'top', 0.5], ['pink-pepper', 'top', 0.4], ['champaca', 'heart', 1], ['freesia', 'heart', 0.45], ['rice', 'heart', 0.65], ['green-tea', 'heart', 0.5], ['myrrh', 'base', 0.5], ['white-musk', 'base', 0.55]],
  },
  {
    id: 'vertus-narcosis', name: "Narcos'is", brand: 'Vertus', year: 2017, aliases: ["Narcos'is", 'Narcosis'],
    line: ['Coffee, mango, rhubarb, and cardamom collide before peach and amber smooth the impact.', 'Kahve, mango, ravent ve kakule çarpışır; şeftali ve amber darbeyi yumuşatır.'],
    notes: [['rhubarb', 'top', 0.6], ['cardamom', 'top', 0.55], ['ginger', 'top', 0.45], ['coffee', 'heart', 0.8], ['mango', 'heart', 0.7], ['peach', 'heart', 0.55], ['vetiver', 'base', 0.45], ['amber-accord', 'base', 0.65]],
  },
  {
    id: 'liquides-imaginaires-sancti', name: 'Sancti', brand: 'Liquides Imaginaires', year: 2011, perfumer: 'Sonia Constant', aliases: ['Les Liquides Imaginaires Sancti'],
    line: ['Citrus and cypress enter a resinous nave of fir, incense, myrrh, and old wood.', 'Narenciye ve servi köknar, tütsü, mür ve eski odundan reçineli bir nefe girer.'],
    notes: [['bergamot', 'top', 0.55], ['mandarin', 'top', 0.5], ['grapefruit', 'top', 0.45], ['cypress', 'top', 0.55], ['fir-balsam', 'heart', 0.65], ['rosemary', 'heart', 0.4], ['frankincense', 'base', 0.8], ['myrrh', 'base', 0.65], ['benzoin', 'base', 0.55], ['cedar', 'base', 0.5]],
  },
  {
    id: 'keiko-mecheri-peau-de-peche', name: 'Peau de Pêche', brand: 'Keiko Mecheri', year: 2003, perfumer: 'Keiko Mecheri', aliases: ['Peau de Peche'],
    line: ['White peach is brushed with iris, sandalwood, amber, and skin-close musk.', 'Beyaz şeftali iris, sandal, amber ve tene yakın miskle fırçalanır.'],
    notes: [['peach', 'top', 1], ['iris', 'heart', 0.6], ['sandalwood', 'base', 0.55], ['amber-accord', 'base', 0.45], ['white-musk', 'base', 0.65]],
  },
  {
    id: 'maison-tahite-vanextasy', name: 'Vanextasy', brand: 'Maison Tahité', year: 2020, perfumer: 'Luca Maffei',
    line: ['Vanilla is pulled between caramel, coconut milk, and two shades of dry wood.', 'Vanilya karamel, hindistan cevizi sütü ve iki kuru odun tonu arasında çekilir.'],
    notes: [['caramel', 'heart', 0.65], ['coconut', 'heart', 0.55], ['milk', 'heart', 0.5], ['vanilla', 'base', 1], ['sandalwood', 'base', 0.6], ['cedar', 'base', 0.5]],
  },
  {
    id: 'bortnikoff-oud-monarch', name: 'Oud Monarch', brand: 'Bortnikoff', year: 2019, perfumer: 'Dmitry Bortnikoff',
    line: ['Magnolia and rose sit above cacao, tobacco, oud, and an unmistakably animalic base.', 'Manolya ve gül kakao, tütün, ud ve açıkça hayvansı bir tabanın üstünde durur.'],
    notes: [['magnolia', 'top', 0.55], ['ylang-ylang', 'top', 0.35], ['rose', 'heart', 0.65], ['cinnamon', 'heart', 0.45], ['tobacco', 'heart', 0.65], ['oud', 'base', 1], ['cocoa', 'base', 0.55], ['civet', 'base', 0.55], ['castoreum', 'base', 0.45], ['labdanum', 'base', 0.5]],
  },
  {
    id: 'olfactive-studio-autoportrait', name: 'Autoportrait', brand: 'Olfactive Studio', year: 2011, perfumer: 'Nathalie Lorson',
    line: ['Elemi and incense reflect through benzoin, cedar, vetiver, and a moss-dark frame.', 'Elemi ve tütsü benzoin, sedir, vetiver ve yosun karanlığındaki çerçeveden yansır.'],
    notes: [['elemi', 'top', 0.65], ['bergamot', 'top', 0.4], ['benzoin', 'heart', 0.7], ['frankincense', 'heart', 0.65], ['cedar', 'base', 0.65], ['vetiver', 'base', 0.5], ['oakmoss', 'base', 0.45], ['white-musk', 'base', 0.4]],
  },
  {
    id: 'liquides-imaginaires-bello-rabelo', name: 'Bello Rabelo', brand: 'Liquides Imaginaires', year: 2013, perfumer: 'Sonia Constant', aliases: ['Bello Rabelo Liquides Imaginaires'],
    line: ['Port wine and dried fruit stain immortelle, incense, vanilla, and old barrel wood.', 'Porto şarabı ve kuru meyve ölmezotu, tütsü, vanilya ve eski fıçı odununu lekeler.'],
    notes: [['wine', 'top', 0.85], ['plum', 'top', 0.55], ['date', 'heart', 0.5], ['immortelle', 'heart', 0.65], ['frankincense', 'heart', 0.55], ['vanilla', 'base', 0.5], ['benzoin', 'base', 0.55], ['amber-accord', 'base', 0.6], ['cedar', 'base', 0.5]],
  },
  {
    id: 'miller-et-bertaux-shanti-shanti', name: 'Shanti Shanti', brand: 'Miller et Bertaux', year: 1997,
    line: ['Rose and iris rest on patchouli, sandalwood, and musk with the calm of worn fabric.', 'Gül ve iris paçuli, sandal ve miskin üstünde eskimiş kumaş sakinliğiyle durur.'],
    notes: [['rose', 'heart', 0.85], ['iris', 'heart', 0.65], ['patchouli', 'base', 0.7], ['sandalwood', 'base', 0.6], ['white-musk', 'base', 0.5]],
  },
] satisfies readonly CuratedPerfumeSpec[];

export const SPACE_3_B = defineCuratedPerfumes(SPECS);
