import { defineCuratedPerfumes, type CuratedPerfumeSpec } from './curated-factory';

const SPECS = [
  {
    id: 'goldfield-banks-bohemian-lime', name: 'Bohemian Lime', brand: 'Goldfield & Banks', year: 2020,
    line: ['Finger lime flashes over dry woods — a bright opening with sand under its feet.', 'Parmak limonu kuru odunların üstünde çakar — ayağının altında kum taşıyan parlak bir açılış.'],
    notes: [['lime', 'top', 1], ['coriander', 'top', 0.45], ['vetiver', 'base', 0.75], ['cedar', 'base', 0.55], ['sandalwood', 'base', 0.45]],
  },
  {
    id: 'papillon-anubis', name: 'Anubis', brand: 'Papillon Artisan Perfumes', year: 2014, perfumer: 'Liz Moores',
    line: ['Saffron, suede, and incense seal a white flower inside an ancient leather room.', 'Safran, süet ve tütsü beyaz bir çiçeği kadim bir deri odanın içine mühürler.'],
    notes: [['saffron', 'top', 0.65], ['jasmine', 'heart', 0.9], ['immortelle', 'heart', 0.55], ['suede', 'base', 0.9], ['frankincense', 'base', 0.8], ['sandalwood', 'base', 0.6], ['labdanum', 'base', 0.65]],
  },
  {
    id: 'kyse-douceur-brulee', name: 'Douceur Brûlée', brand: 'Kyse Perfumes', year: 2015, perfumer: 'Terri Bozzo', aliases: ['Douceur de Vanille'],
    line: ['Lemon cuts through browned caramel and coconut milk — dessert with a singed edge.', 'Limon, kızarmış karamel ve hindistan cevizi sütünü yarar — kenarı hafif yanmış bir tatlı.'],
    notes: [['lemon', 'top', 0.55], ['caramel', 'heart', 1], ['milk', 'heart', 0.7], ['coconut', 'heart', 0.65], ['beeswax', 'base', 0.45], ['oakmoss', 'base', 0.35], ['ambroxan', 'base', 0.55], ['white-musk', 'base', 0.45]],
  },
  {
    id: 'kyse-serenade-aux-fraises', name: 'Sérénade aux Fraises', brand: 'Kyse Perfumes', year: 2023, perfumer: 'Terri Bozzo', aliases: ['Sérénade'],
    line: ['Strawberry and passionfruit melt into rose cream — vivid fruit held by dark agarwood.', 'Çilek ve çarkıfelek gül kremasına erir — canlı meyveyi koyu öd ağacı tutar.'],
    notes: [['strawberry', 'top', 1], ['passionfruit', 'top', 0.7], ['plum', 'heart', 0.55], ['rose', 'heart', 0.65], ['milk', 'heart', 0.55], ['vanilla', 'base', 0.75], ['sandalwood', 'base', 0.55], ['violet-leaf', 'base', 0.35], ['oud', 'base', 0.55]],
  },
  {
    id: 'zoologist-cow', name: 'Cow', brand: 'Zoologist', year: 2022, perfumer: 'Nathalie Feisthauer',
    line: ['Green apple and meadow flowers float over warm milk — pastoral without becoming innocent.', 'Yeşil elma ve çayır çiçekleri sıcak sütün üstünde yüzer — masumlaşmadan pastoral.'],
    notes: [['apple', 'top', 0.8], ['clary-sage', 'top', 0.45], ['milk', 'heart', 0.85], ['lily-of-the-valley', 'heart', 0.6], ['heliotrope', 'heart', 0.5], ['jasmine', 'heart', 0.4], ['cedar', 'base', 0.5], ['vetiver', 'base', 0.4], ['benzoin', 'base', 0.45], ['white-musk', 'base', 0.65]],
  },
  {
    id: 'affinessence-santal-basmati', name: 'Santal Basmati', brand: 'Affinessence', year: 2015, perfumer: 'Alexandra Carlin',
    line: ['Steamed basmati meets polished sandalwood — pale, nutty warmth with an iris coolness.', 'Buharda basmati cilalı sandalla buluşur — iris serinliği taşıyan açık renkli, fındıksı sıcaklık.'],
    notes: [['rice', 'heart', 0.9], ['iris', 'heart', 0.65], ['sandalwood', 'base', 1], ['cashmeran', 'base', 0.55], ['patchouli', 'base', 0.35]],
  },
  {
    id: 'keiko-mecheri-bois-satin', name: 'Bois Satin', brand: 'Keiko Mecheri', year: 2014, perfumer: 'Keiko Mecheri', aliases: ['Peau de Satin'],
    line: ['Suede, saffron, and vanilla polish a dark wooden surface until it feels almost like skin.', 'Süet, safran ve vanilya koyu ahşap yüzeyi neredeyse ten gibi hissedilene dek cilalar.'],
    notes: [['mandarin', 'top', 0.45], ['saffron', 'top', 0.55], ['rose', 'heart', 0.45], ['jasmine', 'heart', 0.4], ['suede', 'base', 0.75], ['vanilla', 'base', 0.7], ['sandalwood', 'base', 0.65], ['amber-accord', 'base', 0.55]],
  },
  {
    id: 'room-1015-sweet-leaf', name: 'Sweet Leaf', brand: 'Room 1015', year: 2016,
    line: ['Cannabis leaf, eucalyptus, and dusty roots turn a green accord rough at the edges.', 'Kenevir yaprağı, okaliptüs ve tozlu kökler yeşil bir akorun kenarlarını pürüzlendirir.'],
    notes: [['eucalyptus', 'top', 0.7], ['grapefruit', 'top', 0.55], ['hemp', 'heart', 1], ['angelica-root', 'heart', 0.55], ['jasmine', 'heart', 0.35], ['cashmeran', 'base', 0.6], ['patchouli', 'base', 0.65]],
  },
  {
    id: 'bdk-tubereuse-imperiale', name: 'Tubéreuse Impériale', brand: 'BDK Parfums', year: 2016, perfumer: 'Cécile Matton',
    line: ['Tuberose arrives in full dress, then incense and sandalwood darken the white petals.', 'Sümbülteber tam ihtişamıyla gelir; ardından tütsü ve sandal beyaz yaprakları karartır.'],
    notes: [['pink-pepper', 'top', 0.5], ['geranium', 'top', 0.35], ['tuberose', 'heart', 1], ['ylang-ylang', 'heart', 0.6], ['jasmine', 'heart', 0.55], ['iris', 'heart', 0.4], ['cashmeran', 'base', 0.65], ['sandalwood', 'base', 0.7], ['frankincense', 'base', 0.5], ['vanilla', 'base', 0.45]],
  },
  {
    id: 'simone-andreoli-malibu-party-in-the-bay', name: 'Malibu – Party in the Bay', brand: 'Simone Andreoli', year: 2018,
    line: ['Lime, rum, and coconut read like cold spray over a night beach rather than a cocktail.', 'Limon, rom ve hindistan cevizi kokteylden çok gece sahiline vuran soğuk serpinti gibi okunur.'],
    notes: [['lime', 'top', 1], ['rum', 'heart', 0.7], ['coconut', 'heart', 0.9], ['sugar', 'base', 0.55], ['white-musk', 'base', 0.4]],
  },
  {
    id: 'mdci-peche-cardinal', name: 'Pêche Cardinal', brand: 'MDCI Parfums', year: 2008, perfumer: 'Amandine Clerc-Marie', aliases: ['Peche Cardinal'],
    line: ['A ripe peach leans into tuberose — lush fruit held upright by dry cedar.', 'Olgun şeftali sümbültebere yaslanır — gür meyveyi kuru sedir dik tutar.'],
    notes: [['peach', 'top', 1], ['coconut', 'top', 0.45], ['blackcurrant', 'top', 0.5], ['tuberose', 'heart', 0.85], ['plum', 'heart', 0.55], ['lily-of-the-valley', 'heart', 0.35], ['cedar', 'base', 0.55], ['sandalwood', 'base', 0.45], ['white-musk', 'base', 0.5]],
  },
  {
    id: 'lorenzo-pazzaglia-sun-gria', name: 'Sun-Gria', brand: 'Lorenzo Pazzaglia', year: 2024, perfumer: 'Lorenzo Pazzaglia',
    line: ['Red wine, citrus, and dark fruit spill across a warm, spiced wooden table.', 'Kırmızı şarap, narenciye ve koyu meyveler sıcak, baharatlı ahşap masaya dökülür.'],
    notes: [['bitter-orange', 'top', 0.7], ['mandarin', 'top', 0.6], ['ginger', 'top', 0.45], ['blackcurrant', 'heart', 0.65], ['grape', 'heart', 0.8], ['wine', 'heart', 1], ['turkish-rose', 'heart', 0.45], ['brown-sugar', 'base', 0.65], ['vanilla', 'base', 0.55], ['sandalwood', 'base', 0.5]],
  },
  {
    id: 'francesca-bianchi-sex-and-the-sea', name: 'Sex and the Sea', brand: 'Francesca Bianchi', year: 2016, perfumer: 'Francesca Bianchi',
    line: ['Pineapple, skin, and salt blur into a dense amber — beach heat without blue water.', 'Ananas, ten ve tuz yoğun bir ambere karışır — mavi su olmadan sahil sıcağı.'],
    notes: [['pineapple', 'top', 0.65], ['coconut', 'heart', 0.55], ['immortelle', 'heart', 0.7], ['rose', 'heart', 0.35], ['heliotrope', 'heart', 0.45], ['sandalwood', 'base', 0.6], ['civet', 'base', 0.55], ['ambergris', 'base', 0.7], ['vanilla', 'base', 0.5]],
  },
  {
    id: 'hiram-green-slowdive', name: 'Slowdive', brand: 'Hiram Green', year: 2017, perfumer: 'Hiram Green',
    line: ['Honey and tobacco flower hum in late-afternoon light — thick, golden, and alive.', 'Bal ve tütün çiçeği geç öğleden sonra ışığında uğuldar — yoğun, altın ve canlı.'],
    notes: [['neroli', 'top', 0.55], ['orange-blossom', 'heart', 0.65], ['tuberose', 'heart', 0.4], ['tobacco', 'heart', 0.8], ['honey', 'base', 1], ['beeswax', 'base', 0.7]],
  },
  {
    id: 'lubin-grisette', name: 'Grisette', brand: 'Lubin', year: 2015, perfumer: 'Thomas Fontaine',
    line: ['Grapefruit lifts a small red rose above pale incense and clean woods.', 'Greyfurt küçük kırmızı bir gülü açık renkli tütsü ve temiz odunların üstüne kaldırır.'],
    notes: [['grapefruit', 'top', 0.65], ['bergamot', 'top', 0.45], ['rose', 'heart', 0.85], ['iris', 'heart', 0.45], ['frankincense', 'base', 0.45], ['cedar', 'base', 0.5], ['vanilla', 'base', 0.35], ['white-musk', 'base', 0.55]],
  },
  {
    id: 'frapin-caravelle-epicee', name: 'Caravelle Épicée', brand: 'Frapin', year: 2007, perfumer: 'Jeanne-Marie Faugier', aliases: ['Caravelle Epicee'],
    line: ['Pepper, cumin, and tobacco cross a dry wooden hull warmed by amber.', 'Biber, kimyon ve tütün amberle ısınmış kuru bir ahşap gövdeyi geçer.'],
    notes: [['nutmeg', 'top', 0.6], ['coriander', 'top', 0.55], ['cumin', 'heart', 0.6], ['black-pepper', 'heart', 0.65], ['guaiac-wood', 'heart', 0.55], ['tobacco', 'base', 0.7], ['sandalwood', 'base', 0.55], ['amber-accord', 'base', 0.6], ['patchouli', 'base', 0.5]],
  },
  {
    id: 'the-zoo-sailors', name: 'Sailors', brand: 'The Zoo', year: 2018, perfumer: 'Christophe Laudamiel',
    line: ['Juniper, wet air, and worn leather make the deck feel near enough to touch.', 'Ardıç, ıslak hava ve aşınmış deri güverteyi dokunacak kadar yakına getirir.'],
    notes: [['grapefruit', 'top', 0.55], ['coriander', 'top', 0.4], ['violet-leaf', 'top', 0.45], ['juniper', 'heart', 0.8], ['cardamom', 'heart', 0.5], ['seaweed', 'heart', 0.55], ['cashmeran', 'base', 0.5], ['leather', 'base', 0.6], ['oakmoss', 'base', 0.45], ['cedar', 'base', 0.55]],
  },
  {
    id: 'olfactive-studio-flash-back', name: 'Flash Back', brand: 'Olfactive Studio', year: 2013, perfumer: 'Olivier Cresp',
    line: ['Rhubarb snaps through grapefruit and green apple before vetiver dries the frame.', 'Ravent greyfurt ve yeşil elmanın içinden şaklar; ardından vetiver çerçeveyi kurutur.'],
    notes: [['rhubarb', 'top', 1], ['grapefruit', 'top', 0.75], ['bitter-orange', 'top', 0.45], ['apple', 'heart', 0.6], ['pink-pepper', 'heart', 0.4], ['vetiver', 'base', 0.75], ['cedar', 'base', 0.55], ['white-musk', 'base', 0.4]],
  },
  {
    id: 'matiere-premiere-santal-austral', name: 'Santal Austral', brand: 'MATIERE PREMIERE', year: 2019, perfumer: 'Aurélien Guichard',
    line: ['Sandalwood is stripped to a pale block, then softened with iris and tonka.', 'Sandal açık renkli bir bloğa kadar soyulur, sonra iris ve tonkayla yumuşatılır.'],
    notes: [['iris', 'heart', 0.55], ['sandalwood', 'base', 1], ['tonka', 'base', 0.65], ['benzoin', 'base', 0.55]],
  },
  {
    id: 'phaedon-tabac-rouge', name: 'Tabac Rouge', brand: 'Phaedon', year: 2013,
    line: ['Honeyed tobacco and cinnamon glow against a dark wall of resin and musk.', 'Ballı tütün ve tarçın koyu reçine ve misk duvarına karşı parlar.'],
    notes: [['cinnamon', 'top', 0.65], ['ginger', 'top', 0.4], ['tobacco', 'heart', 1], ['honey', 'heart', 0.75], ['frankincense', 'base', 0.55], ['benzoin', 'base', 0.7], ['white-musk', 'base', 0.4]],
  },
  {
    id: 'beaufort-london-lignum-vitae', name: 'Lignum Vitae', brand: 'BeauFort London', year: 2016, perfumer: 'Julie Marlowe',
    line: ['A lemon biscuit breaks over pepper, sea air, and smoke-blackened wood.', 'Limonlu bisküvi biber, deniz havası ve isle kararmış odunun üstünde kırılır.'],
    notes: [['mandarin', 'top', 0.55], ['black-pepper', 'top', 0.5], ['biscuit', 'heart', 0.8], ['juniper', 'heart', 0.5], ['ginger', 'heart', 0.4], ['guaiac-wood', 'base', 0.65], ['frankincense', 'base', 0.7], ['oakmoss', 'base', 0.45], ['amber-accord', 'base', 0.45]],
  },
  {
    id: 'milano-fragranze-naviglio', name: 'Naviglio', brand: 'Milano Fragranze', year: 2021, perfumer: 'Michelle Moellhausen', aliases: ['Naviglio Milano Fragranze'],
    line: ['Soap, neroli, and cool water sharpen a clean shirt against a cedar wardrobe.', 'Sabun, neroli ve serin su temiz bir gömleği sedir dolaba karşı keskinleştirir.'],
    notes: [['bergamot', 'top', 0.6], ['neroli', 'top', 0.7], ['aldehydes', 'top', 0.75], ['lavender', 'heart', 0.5], ['petitgrain', 'heart', 0.55], ['vetiver', 'base', 0.45], ['cedar', 'base', 0.55], ['white-musk', 'base', 0.75], ['marine', 'base', 0.45]],
  },
  {
    id: 'jeroboam-hauto', name: 'Haŭto', brand: 'Jeroboam', year: 2015, perfumer: 'Vanina Muracciole', aliases: ['Hauto'],
    line: ['Pineapple and tuberose flare briefly above an enormous, skin-warm white musk.', 'Ananas ve sümbülteber ten sıcaklığındaki dev beyaz miskin üstünde kısa süre parlar.'],
    notes: [['bergamot', 'top', 0.55], ['pineapple', 'top', 0.75], ['tuberose', 'heart', 0.65], ['rose', 'heart', 0.45], ['white-musk', 'base', 1]],
  },
  {
    id: 'essential-parfums-divine-vanille', name: 'Divine Vanille', brand: 'Essential Parfums', year: 2019, perfumer: 'Olivier Pescheux',
    line: ['Vanilla turns dry and aromatic under sage, pepper, cedar, and incense.', 'Vanilya adaçayı, biber, sedir ve tütsünün altında kuru ve aromatikleşir.'],
    notes: [['cinnamon', 'top', 0.55], ['black-pepper', 'top', 0.45], ['clary-sage', 'top', 0.5], ['osmanthus', 'heart', 0.45], ['frankincense', 'heart', 0.55], ['vanilla', 'base', 1], ['tonka', 'base', 0.65], ['benzoin', 'base', 0.6], ['cedar', 'base', 0.5]],
  },
  {
    id: 'penhaligons-juniper-sling', name: 'Juniper Sling', brand: "Penhaligon's", year: 2011, perfumer: 'Olivier Cresp', aliases: ['Penhaligon’s Juniper Sling'],
    line: ['Juniper snaps like cold gin, then pepper, leather, and a trace of cherry remain.', 'Ardıç soğuk cin gibi şaklar; geride biber, deri ve bir kiraz izi kalır.'],
    notes: [['juniper', 'top', 1], ['orange-blossom', 'top', 0.45], ['cinnamon', 'top', 0.4], ['black-pepper', 'heart', 0.55], ['cardamom', 'heart', 0.5], ['iris', 'heart', 0.45], ['leather', 'base', 0.5], ['vetiver', 'base', 0.45], ['sugar', 'base', 0.35], ['cherry', 'base', 0.3]],
  },
  {
    id: 'pierre-guillaume-17-tubereuse-couture', name: '17 Tubéreuse Couture', brand: 'Pierre Guillaume Paris', year: 2010, perfumer: 'Pierre Guillaume', aliases: ['Tubéreuse Couture'],
    line: ['Green citrus cuts a candied tuberose into a clean, angular silhouette.', 'Yeşil narenciye şekerlenmiş sümbülteberi temiz, köşeli bir siluete keser.'],
    notes: [['lime', 'top', 0.55], ['tuberose', 'heart', 1], ['sugar', 'heart', 0.6], ['rose', 'heart', 0.4], ['sandalwood', 'base', 0.55], ['vanilla', 'base', 0.45]],
  },
  {
    id: 'francesca-bianchi-the-dark-side', name: 'The Dark Side', brand: 'Francesca Bianchi', year: 2016, perfumer: 'Francesca Bianchi',
    line: ['Honeyed iris sinks into incense, styrax, and damp earth — darkness with a velvet surface.', 'Ballı iris tütsü, styrax ve nemli toprağa çöker — kadife yüzeyli bir karanlık.'],
    notes: [['honey', 'heart', 0.65], ['iris', 'heart', 0.75], ['violet', 'heart', 0.45], ['frankincense', 'base', 0.8], ['styrax', 'base', 0.7], ['patchouli', 'base', 0.65], ['vetiver', 'base', 0.45], ['amber-accord', 'base', 0.55]],
  },
] satisfies readonly CuratedPerfumeSpec[];

export const SPACE_2_ADDITIONS = defineCuratedPerfumes(SPECS);
