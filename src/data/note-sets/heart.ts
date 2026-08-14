import type { Note } from '../types';

/**
 * Kalp bandı — tepe noktası 15 ile 90 dakika arası.
 *
 * Kompozisyonun gövdesi: çiçekler, olgun meyveler, sıcak baharatlar,
 * gurme malzemeler, reçineler ve orta ağırlıklı odunlar.
 *
 * Dosya adı piramitteki katmanı değil, uçuculuk bandını anlatıyor.
 * Bir parfüm aynı notayı dip olarak da listeleyebilir; katman bilgisi
 * parfüm kaydında (`PerfumeNote.tier`) tutuluyor.
 */
export const HEART_NOTES: readonly Note[] = [
  // ——— Mineral ———
  {
    id: 'sea-salt',
    name: { en: 'Sea Salt', tr: 'Deniz tuzu' },
    families: { mineral: 1.0, musk: 0.2 },
    volatility: { peakMinutes: 15, halfLifeMinutes: 240 },
    character: { temperature: -0.4, texture: 0.4, cleanliness: 0.5, proximity: -0.2 },
    description: {
      en: 'Wet stone and dried salt on skin — the mineral edge of the sea, not the water.',
      tr: 'Islak taş ve tende kurumuş tuz — denizin suyu değil, mineral kenarı.',
    },
  },
  {
    id: 'seaweed',
    name: { en: 'Seaweed', tr: 'Deniz yosunu' },
    families: { mineral: 0.9, green: 0.4, animalic: 0.2 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 240 },
    character: { temperature: -0.3, texture: 0.5, cleanliness: -0.2, proximity: -0.1 },
    description: {
      en: 'Iodine and low tide — the sea at its least romantic.',
      tr: 'Iyot ve cezir — denizin en romantik olmayan hâli.',
    },
  },
  {
    id: 'flint',
    name: { en: 'Flint', tr: 'Çakmaktaşı' },
    families: { mineral: 1.0 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 180 },
    character: { temperature: -0.8, texture: 0.7, cleanliness: 0.7, proximity: -0.2 },
    description: {
      en: 'Two stones struck together — smoke without fire, and no organic matter at all.',
      tr: 'Birbirine vurulmuş iki taş — ateşsiz duman, içinde hiç organik madde yok.',
    },
  },

  // ——— Çiçekler ———
  {
    id: 'neroli',
    name: { en: 'Neroli', tr: 'Neroli' },
    families: { floral: 0.8, citrus: 0.5 },
    volatility: { peakMinutes: 15, halfLifeMinutes: 120 },
    character: { temperature: 0.0, texture: -0.2, cleanliness: 0.7, proximity: -0.4 },
    description: {
      en: 'Orange blossom put through water — cleaner, greener and colder than the flower itself.',
      tr: 'Sudan geçirilmiş portakal çiçeği — çiçeğin kendisinden daha temiz, daha yeşil, daha soğuk.',
    },
  },
  {
    id: 'magnolia',
    name: { en: 'Magnolia', tr: 'Manolya' },
    families: { floral: 1.0, citrus: 0.3, green: 0.2 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 150 },
    character: { temperature: 0.1, texture: -0.3, cleanliness: 0.6, proximity: -0.4 },
    description: {
      en: 'A flower with lemon inside it — creamy and sharp in the same breath.',
      tr: 'Içinde limon olan bir çiçek — aynı nefeste kremsi ve keskin.',
    },
  },
  {
    id: 'honeysuckle',
    name: { en: 'Honeysuckle', tr: 'Hanımeli' },
    families: { floral: 1.0, fruity: 0.3, gourmand: 0.2 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 150 },
    character: { temperature: 0.3, texture: -0.3, cleanliness: 0.4, proximity: -0.4 },
    description: {
      en: 'Nectar on a warm evening — sweet, but with the green stem still attached.',
      tr: 'Sıcak bir akşamda nektar — tatlı, ama yeşil sapı hâlâ üstünde.',
    },
  },
  {
    id: 'lily-of-the-valley',
    name: { en: 'Lily of the Valley', tr: 'Müge' },
    families: { floral: 1.0, green: 0.4 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 150 },
    character: { temperature: -0.4, texture: 0.2, cleanliness: 0.8, proximity: -0.5 },
    description: {
      en: 'A flower nobody can extract: green, dewy, and rebuilt from scratch every time.',
      tr: 'Kimsenin özütleyemediği çiçek: yeşil, çiyli ve her seferinde sıfırdan kurulan.',
    },
  },
  {
    id: 'cherry-blossom',
    name: { en: 'Cherry Blossom', tr: 'Kiraz çiçeği' },
    families: { floral: 0.9, fruity: 0.3, gourmand: 0.2 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 160 },
    character: { temperature: 0.2, texture: -0.4, cleanliness: 0.5, proximity: -0.2 },
    description: {
      en: 'Almost nothing, and that is the point: a flower better known for how it looks than how it smells.',
      tr: 'Neredeyse hiçbir şey ve mesele de bu: koktuğundan çok göründüğüyle bilinen bir çiçek.',
    },
  },
  {
    id: 'geranium',
    name: { en: 'Geranium', tr: 'Sardunya' },
    families: { floral: 0.7, green: 0.5, aromatic: 0.3 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 150 },
    character: { temperature: -0.2, texture: 0.3, cleanliness: 0.5, proximity: -0.3 },
    description: {
      en: 'Rose with the sweetness taken out and mint put in — the most masculine flower.',
      tr: 'Tatlısı alınıp yerine nane konmuş gül — çiçeklerin en erkeksi olanı.',
    },
  },
  {
    id: 'rose',
    name: { en: 'Rose', tr: 'Gül' },
    families: { floral: 1.0, fruity: 0.2, spicy: 0.1 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 180 },
    character: { temperature: 0.1, texture: -0.1, cleanliness: 0.3, proximity: -0.2 },
    description: {
      en: 'Never one smell: honeyed, metallic, green and spiced at once, depending on the source.',
      tr: 'Asla tek bir koku değil: kaynağına göre ballı, metalik, yeşil ve baharatlı — hepsi bir arada.',
    },
  },
  {
    // `rose` genel gülü temsil ediyor; bu ondan ayrı bir malzeme. Isparta'nın
    // Rosa damascena'sı Taif ya da May gülünden belirgin şekilde başka: daha
    // ballı, reçelimsi, meyveli. Ayrı kimlik olması nota kanalının işine de
    // yarıyor — Türk gülü kullanan iki parfüm birbirini buluyor, genel gül
    // kullananlarla karışmıyor.
    id: 'turkish-rose',
    name: { en: 'Turkish Rose', tr: 'Türk gülü' },
    families: { floral: 1.0, fruity: 0.4, gourmand: 0.2, spicy: 0.1 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 200 },
    character: { temperature: 0.3, texture: -0.2, cleanliness: 0.2, proximity: -0.1 },
    description: {
      en: 'Isparta’s damask rose: jammier and more honeyed than the rose you expect — closer to the fruit than the flower.',
      tr: 'Isparta’nın yağ gülü: beklediğin gülden daha reçelimsi, daha ballı — çiçekten çok meyveye yakın.',
    },
  },
  {
    id: 'orange-blossom',
    name: { en: 'Orange Blossom', tr: 'Portakal çiçeği' },
    families: { floral: 1.0, citrus: 0.3, animalic: 0.2 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 180 },
    character: { temperature: 0.4, texture: -0.2, cleanliness: 0.1, proximity: -0.3 },
    description: {
      en: 'Honeyed, with something animal underneath — neroli after it warms up.',
      tr: 'Ballı ve altında hayvansı bir şey olan — ısındıktan sonraki neroli.',
    },
  },
  {
    id: 'ylang-ylang',
    name: { en: 'Ylang-Ylang', tr: 'Ilang ilang' },
    families: { floral: 1.0, gourmand: 0.2, spicy: 0.2 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 210 },
    character: { temperature: 0.6, texture: -0.3, cleanliness: 0.0, proximity: -0.3 },
    description: {
      en: 'Banana, custard and rubber — a flower that smells as if it has been cooked.',
      tr: 'Muz, muhallebi ve kauçuk — pişirilmiş gibi kokan bir çiçek.',
    },
  },
  {
    id: 'mimosa',
    name: { en: 'Mimosa', tr: 'Mimoza' },
    families: { floral: 0.9, gourmand: 0.2, green: 0.2 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 180 },
    character: { temperature: 0.2, texture: -0.5, cleanliness: 0.6, proximity: -0.1 },
    description: {
      en: 'Powder and honey with dust in it — the softest yellow there is.',
      tr: 'Içinde toz olan pudra ve bal — var olan en yumuşak sarı.',
    },
  },
  {
    id: 'tuberose',
    name: { en: 'Tuberose', tr: 'Tuberoz' },
    families: { floral: 1.0, gourmand: 0.2, animalic: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 300 },
    character: { temperature: 0.6, texture: 0.1, cleanliness: -0.3, proximity: -0.6 },
    description: {
      en: 'The loudest flower — creamy, hot, faintly rubbery, and impossible to wear quietly.',
      tr: 'En yüksek sesli çiçek — kremsi, sıcak, hafif kauçuklu ve sessizce taşınması imkânsız.',
    },
  },
  {
    id: 'jasmine',
    name: { en: 'Jasmine', tr: 'Yasemin' },
    families: { floral: 1.0, animalic: 0.3, fruity: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 240 },
    character: { temperature: 0.5, texture: -0.1, cleanliness: -0.2, proximity: -0.4 },
    description: {
      en: 'Hot, dirty and impossible to ignore — the flower that behaves like skin.',
      tr: 'Sıcak, kirli ve görmezden gelinmesi imkânsız — tene benzeyen çiçek.',
    },
  },
  {
    id: 'gardenia',
    name: { en: 'Gardenia', tr: 'Gardenya' },
    families: { floral: 1.0, gourmand: 0.3, green: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 240 },
    character: { temperature: 0.4, texture: -0.4, cleanliness: 0.1, proximity: -0.3 },
    description: {
      en: 'Cream with a mushroom underneath — a white flower that never smells quite fresh.',
      tr: 'Altında mantar olan bir krema — asla tam taze kokmayan beyaz bir çiçek.',
    },
  },
  {
    id: 'osmanthus',
    name: { en: 'Osmanthus', tr: 'Osmantus' },
    families: { floral: 0.9, fruity: 0.6, leather: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 220 },
    character: { temperature: 0.3, texture: -0.2, cleanliness: 0.3, proximity: -0.2 },
    description: {
      en: 'Apricot skin and old leather — a flower pretending to be fruit.',
      tr: 'Kayısı kabuğu ve eski deri — meyve taklidi yapan bir çiçek.',
    },
  },
  {
    id: 'violet',
    name: { en: 'Violet', tr: 'Menekşe' },
    families: { floral: 0.9, gourmand: 0.2, woody: 0.2 },
    volatility: { peakMinutes: 35, halfLifeMinutes: 240 },
    character: { temperature: -0.4, texture: -0.6, cleanliness: 0.5, proximity: 0.1 },
    description: {
      en: 'Powder that keeps vanishing — the molecule numbs your nose while you smell it.',
      tr: 'Sürekli kaybolan bir pudra — molekülü, sen koklarken burnunu uyuşturuyor.',
    },
  },
  {
    id: 'narcissus',
    name: { en: 'Narcissus', tr: 'Nergis' },
    families: { floral: 0.9, green: 0.5, animalic: 0.3, mossy: 0.2 },
    volatility: { peakMinutes: 40, halfLifeMinutes: 300 },
    character: { temperature: 0.1, texture: 0.4, cleanliness: -0.3, proximity: -0.1 },
    description: {
      en: 'Hay, manure, and a flower somewhere in the middle — beautiful and slightly farmyard.',
      tr: 'Kuru ot, gübre ve ortalarda bir yerde bir çiçek — güzel ve hafifçe ahır.',
    },
  },
  {
    id: 'iris',
    name: { en: 'Iris', tr: 'Iris' },
    families: { floral: 0.7, woody: 0.3, mineral: 0.3 },
    volatility: { peakMinutes: 60, halfLifeMinutes: 360 },
    character: { temperature: -0.7, texture: -0.6, cleanliness: 0.5, proximity: 0.4 },
    description: {
      en: 'Not a flower but a root, aged for years. Cold, powdery, faintly like damp earth and skin.',
      tr: 'Çiçek değil, yıllarca dinlendirilmiş bir kök. Soğuk, pudralı, nemli toprağı ve teni andırır.',
    },
  },

  // ——— Meyveler ———
  {
    id: 'peach',
    name: { en: 'Peach', tr: 'Şeftali' },
    families: { fruity: 1.0, gourmand: 0.3 },
    volatility: { peakMinutes: 15, halfLifeMinutes: 120 },
    character: { temperature: 0.4, texture: -0.4, cleanliness: 0.3, proximity: -0.2 },
    description: {
      en: 'The fuzz more than the flesh — warm, milky, and faintly like skin.',
      tr: 'Etinden çok tüyü — sıcak, sütsü ve hafifçe ten gibi.',
    },
  },
  {
    id: 'apricot',
    name: { en: 'Apricot', tr: 'Kayısı' },
    families: { fruity: 1.0, gourmand: 0.3 },
    volatility: { peakMinutes: 15, halfLifeMinutes: 130 },
    character: { temperature: 0.5, texture: -0.4, cleanliness: 0.3, proximity: -0.1 },
    description: {
      en: 'Jam left out in the sun — denser and drier than peach.',
      tr: 'Güneşte unutulmuş reçel — şeftaliden daha yoğun ve daha kuru.',
    },
  },
  {
    id: 'mango',
    name: { en: 'Mango', tr: 'Mango' },
    families: { fruity: 1.0, gourmand: 0.2 },
    volatility: { peakMinutes: 18, halfLifeMinutes: 140 },
    character: { temperature: 0.5, texture: -0.2, cleanliness: 0.1, proximity: -0.3 },
    description: {
      en: 'Sweet resin and turpentine — the tropical fruit with a solvent inside it.',
      tr: 'Tatlı reçine ve terebentin — içinde çözücü olan tropik meyve.',
    },
  },
  {
    id: 'fig',
    name: { en: 'Fig', tr: 'Incir' },
    families: { fruity: 0.8, green: 0.4, gourmand: 0.3 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 150 },
    character: { temperature: 0.1, texture: -0.2, cleanliness: 0.2, proximity: 0.0 },
    description: {
      en: 'Green at the edges, jammy in the middle — a fruit that never smells fully sweet.',
      tr: 'Kenarları yeşil, ortası reçelli — asla tam anlamıyla tatlı kokmayan bir meyve.',
    },
  },
  {
    id: 'cherry',
    name: { en: 'Cherry', tr: 'Kiraz' },
    families: { fruity: 1.0, gourmand: 0.4 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 160 },
    character: { temperature: 0.4, texture: -0.4, cleanliness: 0.1, proximity: -0.1 },
    description: {
      en: 'Almond and cough syrup — a fruit that always smells slightly medicinal.',
      tr: 'Badem ve öksürük şurubu — hep biraz tıbbi kokan bir meyve.',
    },
  },
  {
    id: 'plum',
    name: { en: 'Plum', tr: 'Erik' },
    families: { fruity: 1.0, gourmand: 0.3, animalic: 0.2 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 200 },
    character: { temperature: 0.5, texture: -0.3, cleanliness: -0.1, proximity: 0.0 },
    description: {
      en: 'Dark, wine-soaked fruit — sweetness on the edge of fermenting.',
      tr: 'Koyu, şaraba batmış meyve — mayalanmanın eşiğindeki tatlılık.',
    },
  },
  {
    id: 'wine',
    name: { en: 'Wine Accord', tr: 'Şarap akoru' },
    families: { fruity: 0.8, gourmand: 0.3, animalic: 0.2 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 150 },
    character: { temperature: 0.4, texture: 0.2, cleanliness: -0.2, proximity: -0.2 },
    description: {
      en: 'Fruit that has turned — sour, tannic, and warmer than the grape ever was.',
      tr: 'Dönmüş meyve — ekşi, tanenli ve üzümün hiç olmadığı kadar sıcak.',
    },
  },

  // ——— Gurme ———
  {
    id: 'rum',
    name: { en: 'Rum', tr: 'Rom' },
    families: { gourmand: 0.7, fruity: 0.3, resinous: 0.2 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 180 },
    character: { temperature: 0.8, texture: 0.1, cleanliness: -0.1, proximity: 0.0 },
    description: {
      en: 'Molasses and alcohol — sugar with a burn behind it.',
      tr: 'Pekmez ve alkol — arkasında bir yanma olan şeker.',
    },
  },
  {
    id: 'whiskey',
    name: { en: 'Whiskey', tr: 'Viski' },
    families: { gourmand: 0.6, woody: 0.4, leather: 0.3 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 210 },
    character: { temperature: 0.8, texture: 0.4, cleanliness: -0.3, proximity: 0.1 },
    description: {
      en: 'Smoke, oak and grain — the barrel more than the drink.',
      tr: 'Duman, meşe ve tahıl — içkiden çok fıçısı.',
    },
  },
  {
    id: 'sugar',
    name: { en: 'Sugar', tr: 'Şeker' },
    families: { gourmand: 1.0, fruity: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 240 },
    character: { temperature: 0.4, texture: -0.2, cleanliness: 0.3, proximity: 0.1 },
    description: {
      en: 'Cotton candy and nothing else — the most literal sweetness in the palette.',
      tr: 'Pamuk şeker ve başka hiçbir şey — paletteki en birebir tatlılık.',
    },
  },
  {
    id: 'dorayaki',
    name: { en: 'Dorayaki', tr: 'Dorayaki' },
    families: { gourmand: 1.0, spicy: 0.1 },
    volatility: { peakMinutes: 35, halfLifeMinutes: 260 },
    character: { temperature: 0.5, texture: -0.4, cleanliness: 0.2, proximity: 0.3 },
    description: {
      en: 'Two warm pancakes around sweet bean paste — sugar with flour in it, not sugar alone.',
      tr: 'Tatlı fasulye ezmesini saran iki sıcak krep — yalnız şeker değil, içinde un olan şeker.',
    },
  },
  {
    id: 'solar-accord',
    name: { en: 'Solar Accord', tr: 'Güneş akordu' },
    families: { gourmand: 0.5, floral: 0.3, musk: 0.2 },
    volatility: { peakMinutes: 40, halfLifeMinutes: 300 },
    character: { temperature: 0.7, texture: -0.6, cleanliness: 0.3, proximity: 0.6 },
    description: {
      en: 'Suntan lotion on hot skin — not a material but a memory, built from coconut and salicylates.',
      tr: 'Sıcak tende güneş kremi — bir malzeme değil bir hatıra; hindistan cevizi ve salisilatlardan kurulmuş.',
    },
  },
  {
    id: 'coffee',
    name: { en: 'Coffee', tr: 'Kahve' },
    families: { gourmand: 0.8, woody: 0.3, spicy: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 240 },
    character: { temperature: 0.7, texture: 0.6, cleanliness: -0.2, proximity: 0.2 },
    description: {
      en: 'Bitter roast, never the drink — closer to burnt earth than to a morning.',
      tr: 'Acı kavrulmuşluk, asla içeceğin kendisi — sabahtan çok yanmış toprağa yakın.',
    },
  },
  {
    id: 'coconut',
    name: { en: 'Coconut', tr: 'Hindistan cevizi' },
    families: { gourmand: 0.8, fruity: 0.3, musk: 0.2 },
    volatility: { peakMinutes: 40, halfLifeMinutes: 300 },
    character: { temperature: 0.5, texture: -0.7, cleanliness: 0.3, proximity: 0.4 },
    description: {
      en: 'Creamy and lactonic — closer to warm skin and sunscreen than to the fruit itself.',
      tr: 'Kremsi ve laktonik — meyvenin kendisinden çok, sıcak tene ve güneş kremine yakın.',
    },
  },
  {
    id: 'almond',
    name: { en: 'Almond', tr: 'Badem' },
    families: { gourmand: 0.9, resinous: 0.2 },
    volatility: { peakMinutes: 40, halfLifeMinutes: 300 },
    character: { temperature: 0.5, texture: -0.6, cleanliness: 0.4, proximity: 0.3 },
    description: {
      en: 'Marzipan with a bitter core — the same molecule that makes cherries smell medicinal.',
      tr: 'Acı çekirdekli badem ezmesi — kirazı tıbbi kokutan molekülün aynısı.',
    },
  },
  {
    id: 'milk',
    name: { en: 'Milk', tr: 'Süt' },
    families: { gourmand: 0.8, musk: 0.3 },
    volatility: { peakMinutes: 40, halfLifeMinutes: 300 },
    character: { temperature: 0.4, texture: -0.9, cleanliness: 0.5, proximity: 0.5 },
    description: {
      en: 'Warm and slightly sour — a comfort that turns uneasy if you stay with it.',
      tr: 'Sıcak ve hafif ekşi — uzun kalınca huzursuzlaşan bir rahatlık.',
    },
  },
  {
    id: 'hazelnut',
    name: { en: 'Hazelnut', tr: 'Fındık' },
    families: { gourmand: 0.9, woody: 0.2 },
    volatility: { peakMinutes: 45, halfLifeMinutes: 330 },
    character: { temperature: 0.6, texture: -0.3, cleanliness: 0.1, proximity: 0.3 },
    description: {
      en: 'Roasted and oily — nuttiness with no sweetness of its own.',
      tr: 'Kavrulmuş ve yağlı — kendine ait hiç tatlısı olmayan bir fındıklık.',
    },
  },
  {
    id: 'cocoa',
    name: { en: 'Cocoa', tr: 'Kakao' },
    families: { gourmand: 0.9, woody: 0.3, mossy: 0.2 },
    volatility: { peakMinutes: 45, halfLifeMinutes: 330 },
    character: { temperature: 0.5, texture: 0.3, cleanliness: -0.2, proximity: 0.3 },
    description: {
      en: 'Bitter powder, not chocolate — dusty, dry, and faintly like earth.',
      tr: 'Çikolata değil acı toz — tozlu, kuru ve hafifçe toprak gibi.',
    },
  },
  {
    id: 'caramel',
    name: { en: 'Caramel', tr: 'Karamel' },
    families: { gourmand: 1.0 },
    volatility: { peakMinutes: 50, halfLifeMinutes: 360 },
    character: { temperature: 0.8, texture: -0.5, cleanliness: 0.1, proximity: 0.4 },
    description: {
      en: 'Sugar taken one second past done — sweetness with a burnt edge.',
      tr: 'Bir saniye fazla pişmiş şeker — yanık kenarı olan bir tatlılık.',
    },
  },
  {
    id: 'honey',
    name: { en: 'Honey', tr: 'Bal' },
    families: { gourmand: 0.7, animalic: 0.5, floral: 0.3 },
    volatility: { peakMinutes: 50, halfLifeMinutes: 400 },
    character: { temperature: 0.8, texture: -0.2, cleanliness: -0.4, proximity: 0.4 },
    description: {
      en: 'Sweet, waxy and unmistakably animal — the point where gourmand turns feral.',
      tr: 'Tatlı, mumsu ve apaçık hayvansı — gurmenin vahşileştiği yer.',
    },
  },
  {
    id: 'immortelle',
    name: { en: 'Immortelle', tr: 'Ölmez çiçek' },
    families: { gourmand: 0.6, aromatic: 0.4, floral: 0.3 },
    volatility: { peakMinutes: 60, halfLifeMinutes: 450 },
    character: { temperature: 0.7, texture: 0.1, cleanliness: -0.1, proximity: 0.3 },
    description: {
      en: 'Maple syrup and curry powder in the same breath — sweet, dry and faintly savoury.',
      tr: 'Aynı nefeste akçaağaç şurubu ve köri — tatlı, kuru ve hafifçe yemeksi.',
    },
  },

  // ——— Aromatik ve baharat ———
  {
    id: 'black-tea',
    name: { en: 'Black Tea', tr: 'Siyah çay' },
    families: { aromatic: 0.5, woody: 0.4, mossy: 0.2 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 180 },
    character: { temperature: 0.2, texture: 0.5, cleanliness: 0.4, proximity: -0.2 },
    description: {
      en: 'Dry tannin and smoke — a leaf that smells more of paper and wood than of a drink.',
      tr: 'Kuru tanen ve duman — içecekten çok kâğıt ve odun kokan bir yaprak.',
    },
  },
  {
    id: 'lavender',
    name: { en: 'Lavender', tr: 'Lavanta' },
    families: { aromatic: 1.0, floral: 0.3, green: 0.2 },
    volatility: { peakMinutes: 15, halfLifeMinutes: 110 },
    character: { temperature: -0.3, texture: 0.2, cleanliness: 0.7, proximity: -0.4 },
    description: {
      en: 'Clean and camphorous — the smell of a barbershop, and of trying to fall asleep.',
      tr: 'Temiz ve kâfurlu — berber dükkânının ve uyumaya çalışmanın kokusu.',
    },
  },
  {
    id: 'camphor',
    name: { en: 'Camphor', tr: 'Kâfur' },
    families: { aromatic: 1.0, mineral: 0.3 },
    volatility: { peakMinutes: 15, halfLifeMinutes: 90 },
    character: { temperature: -1.0, texture: 0.7, cleanliness: 0.6, proximity: -0.6 },
    description: {
      en: 'Cold enough to sting — a medicine cabinet, not a perfume, until it settles.',
      tr: 'Yakacak kadar soğuk — yatışana dek parfüm değil ilaç dolabı.',
    },
  },
  {
    id: 'nutmeg',
    name: { en: 'Nutmeg', tr: 'Muskat' },
    families: { spicy: 0.9, woody: 0.3 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 170 },
    character: { temperature: 0.6, texture: 0.4, cleanliness: 0.2, proximity: -0.1 },
    description: {
      en: 'Dusty warmth with a narcotic edge — the quietest of the warm spices.',
      tr: 'Uyuşturucu bir kenarı olan tozlu sıcaklık — sıcak baharatların en sessizi.',
    },
  },
  {
    id: 'cinnamon',
    name: { en: 'Cinnamon', tr: 'Tarçın' },
    families: { spicy: 1.0, gourmand: 0.3 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 170 },
    character: { temperature: 0.9, texture: 0.5, cleanliness: 0.1, proximity: 0.0 },
    description: {
      en: 'Dry heat that bites — sweet only because we expect it to be.',
      tr: 'Isıran kuru bir sıcaklık — tatlı, yalnızca öyle beklediğimiz için.',
    },
  },
  {
    id: 'clove',
    name: { en: 'Clove', tr: 'Karanfil' },
    families: { spicy: 1.0, woody: 0.2 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 180 },
    character: { temperature: 0.8, texture: 0.6, cleanliness: 0.0, proximity: 0.0 },
    description: {
      en: 'The dentist and the kitchen at once — hot, numbing, and hard to hide.',
      tr: 'Aynı anda dişçi ve mutfak — sıcak, uyuşturucu ve saklanması zor.',
    },
  },
  {
    id: 'cumin',
    name: { en: 'Cumin', tr: 'Kimyon' },
    families: { spicy: 0.9, animalic: 0.6 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 180 },
    character: { temperature: 0.6, texture: 0.5, cleanliness: -0.8, proximity: 0.4 },
    description: {
      en: 'Sweat, plainly — the spice people either forgive or never do.',
      tr: 'Açıkça ter — insanların ya affettiği ya da hiç affetmediği baharat.',
    },
  },
  {
    id: 'hay',
    name: { en: 'Hay', tr: 'Kuru ot' },
    families: { aromatic: 0.6, gourmand: 0.3, green: 0.3, mossy: 0.2 },
    volatility: { peakMinutes: 40, halfLifeMinutes: 300 },
    character: { temperature: 0.4, texture: 0.5, cleanliness: 0.0, proximity: 0.1 },
    description: {
      en: 'Cut grass after it dries — sweet, dusty, and already halfway to tobacco.',
      tr: 'Kuruduktan sonraki biçilmiş ot — tatlı, tozlu ve yarı yolu tütüne varmış.',
    },
  },
  {
    id: 'clover',
    name: { en: 'Clover', tr: 'Yonca' },
    families: { green: 0.8, floral: 0.3, gourmand: 0.2 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 190 },
    character: { temperature: -0.1, texture: 0.2, cleanliness: 0.5, proximity: -0.2 },
    description: {
      en: 'Hay while it is still green — softer, wetter, and not yet nostalgic.',
      tr: 'Henüz yeşilken kuru ot — daha yumuşak, daha ıslak ve henüz nostaljik değil.',
    },
  },
  {
    id: 'carrot',
    name: { en: 'Carrot Seed', tr: 'Havuç tohumu' },
    families: { green: 0.6, gourmand: 0.4, floral: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 220 },
    character: { temperature: 0.0, texture: -0.3, cleanliness: 0.3, proximity: 0.1 },
    description: {
      en: 'Sweet dirt and something almost floral — iris without the money.',
      tr: 'Tatlı toprak ve neredeyse çiçeksi bir şey — parası olmayan iris.',
    },
  },

  // ——— Reçineler ———
  {
    id: 'elemi',
    name: { en: 'Elemi', tr: 'Elemi' },
    families: { resinous: 0.8, citrus: 0.4, aromatic: 0.3 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 200 },
    character: { temperature: 0.0, texture: 0.3, cleanliness: 0.6, proximity: -0.3 },
    description: {
      en: 'Lemon peel fused with pine resin — incense that has not gone dark yet.',
      tr: 'Çam reçinesiyle kaynaşmış limon kabuğu — henüz kararmamış bir tütsü.',
    },
  },
  {
    id: 'frankincense',
    name: { en: 'Frankincense', tr: 'Günlük' },
    families: { resinous: 1.0, aromatic: 0.3, citrus: 0.2 },
    volatility: { peakMinutes: 45, halfLifeMinutes: 360 },
    character: { temperature: 0.1, texture: 0.3, cleanliness: 0.6, proximity: -0.1 },
    description: {
      en: 'Cold smoke and old stone — the smell of a room built for silence.',
      tr: 'Soğuk duman ve eski taş — sessizlik için yapılmış bir odanın kokusu.',
    },
  },
  {
    id: 'myrrh',
    name: { en: 'Myrrh', tr: 'Mür' },
    families: { resinous: 1.0, gourmand: 0.2, animalic: 0.2 },
    volatility: { peakMinutes: 60, halfLifeMinutes: 420 },
    character: { temperature: 0.5, texture: 0.2, cleanliness: 0.0, proximity: 0.3 },
    description: {
      en: 'Bitter resin with a mushroom underneath — frankincense that has aged badly.',
      tr: 'Altında mantar olan acı reçine — kötü yaşlanmış tütsü.',
    },
  },

  // ——— Odun, deri, hayvansal ———
  {
    id: 'pine',
    name: { en: 'Pine', tr: 'Çam' },
    families: { woody: 0.7, aromatic: 0.6, resinous: 0.3 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 160 },
    character: { temperature: -0.4, texture: 0.6, cleanliness: 0.6, proximity: -0.4 },
    description: {
      en: 'Needles crushed underfoot — resin, and the cold air that comes with it.',
      tr: 'Ayak altında ezilmiş iğneler — reçine ve beraberinde gelen soğuk hava.',
    },
  },
  {
    id: 'cypress',
    name: { en: 'Cypress', tr: 'Servi' },
    families: { woody: 0.7, aromatic: 0.5, green: 0.3 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 240 },
    character: { temperature: -0.4, texture: 0.5, cleanliness: 0.6, proximity: -0.2 },
    description: {
      en: 'Drier and more upright than pine — a conifer with no sweetness left in it.',
      tr: 'Çamdan daha kuru ve daha dik — içinde hiç tatlı kalmamış bir kozalaklı.',
    },
  },
  {
    id: 'rubber',
    name: { en: 'Rubber', tr: 'Kauçuk' },
    families: { leather: 0.6, mineral: 0.3, animalic: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 200 },
    character: { temperature: 0.2, texture: 0.7, cleanliness: -0.4, proximity: 0.1 },
    description: {
      en: 'A new tyre in a hot garage — the least edible note in the palette.',
      tr: 'Sıcak bir garajda yeni lastik — paletteki en yenmez nota.',
    },
  },
  {
    id: 'indole',
    name: { en: 'Indole', tr: 'Indol' },
    families: { animalic: 0.9, floral: 0.4 },
    volatility: { peakMinutes: 35, halfLifeMinutes: 280 },
    character: { temperature: 0.4, texture: 0.1, cleanliness: -0.9, proximity: 0.3 },
    description: {
      en: 'The molecule white flowers share with rotting things — lovely in traces, unbearable neat.',
      tr: 'Beyaz çiçeklerin çürümeyle paylaştığı molekül — eser hâlinde güzel, saf hâlde dayanılmaz.',
    },
  },
  {
    id: 'ambroxan',
    name: { en: 'Ambroxan', tr: 'Ambroksan' },
    families: { mineral: 0.6, musk: 0.6, woody: 0.3, resinous: 0.2 },
    volatility: { peakMinutes: 45, halfLifeMinutes: 720 },
    character: { temperature: 0.3, texture: -0.4, cleanliness: 0.6, proximity: 0.5 },
    description: {
      en: 'Abstract warmth with no clear source — reads as clean skin rather than as a smell.',
      tr: 'Kaynağı belirsiz soyut bir sıcaklık — koku gibi değil, temiz ten gibi okunur.',
    },
  },
  {
    id: 'cedar',
    name: { en: 'Cedar', tr: 'Sedir' },
    families: { woody: 1.0, aromatic: 0.2 },
    volatility: { peakMinutes: 60, halfLifeMinutes: 420 },
    character: { temperature: -0.1, texture: 0.6, cleanliness: 0.5, proximity: 0.1 },
    description: {
      en: 'Dry, splintered, faintly like pencil shavings. The cleanest of the woods.',
      tr: 'Kuru, kıymıklı, hafifçe kalemtıraş talaşını andırır. Odunların en temizi.',
    },
  },
  {
    id: 'suede',
    name: { en: 'Suede', tr: 'Süet' },
    families: { leather: 0.9, musk: 0.3, woody: 0.2 },
    volatility: { peakMinutes: 60, halfLifeMinutes: 420 },
    character: { temperature: 0.3, texture: -0.5, cleanliness: 0.4, proximity: 0.5 },
    description: {
      en: 'Leather with the smoke taken out — powdery, matte, and close to the skin.',
      tr: 'Dumanı alınmış deri — pudralı, mat ve tene yakın.',
    },
  },
  {
    id: 'vetiver',
    name: { en: 'Vetiver', tr: 'Vetiver' },
    families: { woody: 0.8, mossy: 0.5, green: 0.3 },
    volatility: { peakMinutes: 60, halfLifeMinutes: 480 },
    character: { temperature: -0.2, texture: 0.7, cleanliness: 0.2, proximity: 0.2 },
    description: {
      en: 'Roots pulled from wet ground — smoky, bitter, and never quite clean.',
      tr: 'Islak topraktan çekilmiş kökler — dumanlı, acı ve asla tam temiz değil.',
    },
  },
  {
    id: 'birch-tar',
    name: { en: 'Birch Tar', tr: 'Huş katranı' },
    families: { leather: 1.0, woody: 0.4, resinous: 0.3 },
    volatility: { peakMinutes: 60, halfLifeMinutes: 480 },
    character: { temperature: 0.8, texture: 1.0, cleanliness: -0.7, proximity: 0.3 },
    description: {
      en: 'Burnt wood and old leather. The harshest texture in the palette — smoke you can taste.',
      tr: 'Yanmış odun ve eski deri. Paletin en sert dokusu — tadılabilen bir duman.',
    },
  },
  {
    id: 'heliotrope',
    name: { en: 'Heliotrope', tr: 'Heliotrop' },
    families: { floral: 0.8, gourmand: 0.5 },
    volatility: { peakMinutes: 35, halfLifeMinutes: 260 },
    character: { temperature: 0.4, texture: -0.7, cleanliness: 0.4, proximity: 0.4 },
    description: {
      en: 'Powdered almond and pale petals — sweetness blurred into a soft violet haze.',
      tr: 'Pudralı badem ve soluk taç yapraklar — yumuşak mor bir sise karışan tatlılık.',
    },
  },
  {
    id: 'date',
    name: { en: 'Date', tr: 'Hurma' },
    families: { fruity: 0.7, gourmand: 0.8 },
    volatility: { peakMinutes: 35, halfLifeMinutes: 260 },
    character: { temperature: 0.7, texture: -0.2, cleanliness: -0.3, proximity: 0.6 },
    description: {
      en: 'Dark, sticky fruit with a caramel edge — sweetness already halfway to resin.',
      tr: 'Karamel kenarlı, koyu ve yapışkan meyve — reçineye yarı yolda varmış bir tatlılık.',
    },
  },
  {
    id: 'night-blooming-cereus',
    name: { en: 'Queen of the Night', tr: 'Gecenin kraliçesi' },
    families: { floral: 1.0, green: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 210 },
    character: { temperature: 0.3, texture: -0.4, cleanliness: 0.2, proximity: 0.2 },
    description: {
      en: 'A nocturnal cactus flower — creamy white petals opening into cool air.',
      tr: 'Gece açan bir kaktüs çiçeği — serin havaya açılan krem beyazı yapraklar.',
    },
  },
  {
    id: 'passionflower',
    name: { en: 'Passionflower', tr: 'Çarkıfelek çiçeği' },
    families: { floral: 0.8, fruity: 0.3, green: 0.2 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 190 },
    character: { temperature: 0.2, texture: -0.2, cleanliness: 0.4, proximity: -0.1 },
    description: {
      en: 'Transparent tropical petals — floral first, with fruit flickering at the edge.',
      tr: 'Şeffaf tropik taç yapraklar — önce çiçek, kenarında bir an görünen meyve.',
    },
  },
  {
    id: 'orchid',
    name: { en: 'Orchid', tr: 'Orkide' },
    families: { floral: 0.9, gourmand: 0.2 },
    volatility: { peakMinutes: 35, halfLifeMinutes: 240 },
    character: { temperature: 0.4, texture: -0.5, cleanliness: 0.5, proximity: 0.2 },
    description: {
      en: 'An abstract velvet flower — creamy, polished, and more imagined than botanical.',
      tr: 'Soyut bir kadife çiçek — kremamsı, cilalı ve botanikten çok hayal edilmiş.',
    },
  },
  {
    id: 'myrtle',
    name: { en: 'Myrtle', tr: 'Mersin' },
    families: { aromatic: 0.7, green: 0.6, floral: 0.2 },
    volatility: { peakMinutes: 22, halfLifeMinutes: 170 },
    character: { temperature: -0.3, texture: 0.4, cleanliness: 0.6, proximity: -0.3 },
    description: {
      en: 'Cool Mediterranean leaves — eucalyptus brightness without the medicinal chill.',
      tr: 'Serin Akdeniz yaprakları — tıbbi soğukluğu olmayan okaliptüs parlaklığı.',
    },
  },
  {
    id: 'hemp',
    name: { en: 'Hemp Leaf', tr: 'Kenevir yaprağı' },
    families: { green: 0.8, aromatic: 0.7, mossy: 0.3 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 240 },
    character: { temperature: 0.0, texture: 0.7, cleanliness: -0.4, proximity: 0.0 },
    description: {
      en: 'Dry green leaves with a bitter, resinous shadow — herbal without smelling tidy.',
      tr: 'Acı, reçineli gölgeli kuru yeşil yapraklar — düzenli kokmayan bir otsuluk.',
    },
  },
  {
    id: 'pistachio',
    name: { en: 'Pistachio', tr: 'Antep fıstığı' },
    families: { gourmand: 0.9, green: 0.2, woody: 0.2 },
    volatility: { peakMinutes: 35, halfLifeMinutes: 300 },
    character: { temperature: 0.5, texture: -0.5, cleanliness: 0.1, proximity: 0.5 },
    description: {
      en: 'Green nut and warm cream — savoury at the edge, confectionery at the centre.',
      tr: 'Yeşil yemiş ve sıcak krema — kenarda tuzlu, merkezde şekerlemeye yakın.',
    },
  },
  {
    id: 'freesia',
    name: { en: 'Freesia', tr: 'Frezya' },
    families: { floral: 0.9, green: 0.3 },
    volatility: { peakMinutes: 24, halfLifeMinutes: 170 },
    character: { temperature: -0.2, texture: -0.3, cleanliness: 0.8, proximity: -0.4 },
    description: {
      en: 'Peppered clean petals — a bright floral that leaves almost no weight behind.',
      tr: 'Biberli temiz taç yapraklar — ardında neredeyse hiç ağırlık bırakmayan parlak çiçek.',
    },
  },
] as const;
