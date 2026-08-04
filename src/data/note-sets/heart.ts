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
  },
  {
    id: 'flint',
    name: { en: 'Flint', tr: 'Çakmaktaşı' },
    families: { mineral: 1.0 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 180 },
    character: { temperature: -0.8, texture: 0.7, cleanliness: 0.7, proximity: -0.2 },
  },

  // ——— Çiçekler ———
  {
    id: 'neroli',
    name: { en: 'Neroli', tr: 'Neroli' },
    families: { floral: 0.8, citrus: 0.5 },
    volatility: { peakMinutes: 15, halfLifeMinutes: 120 },
    character: { temperature: 0.0, texture: -0.2, cleanliness: 0.7, proximity: -0.4 },
  },
  {
    id: 'magnolia',
    name: { en: 'Magnolia', tr: 'Manolya' },
    families: { floral: 1.0, citrus: 0.3, green: 0.2 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 150 },
    character: { temperature: 0.1, texture: -0.3, cleanliness: 0.6, proximity: -0.4 },
  },
  {
    id: 'honeysuckle',
    name: { en: 'Honeysuckle', tr: 'Hanımeli' },
    families: { floral: 1.0, fruity: 0.3, gourmand: 0.2 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 150 },
    character: { temperature: 0.3, texture: -0.3, cleanliness: 0.4, proximity: -0.4 },
  },
  {
    id: 'cherry-blossom',
    name: { en: 'Cherry Blossom', tr: 'Kiraz çiçeği' },
    families: { floral: 0.9, fruity: 0.3, gourmand: 0.2 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 160 },
    character: { temperature: 0.2, texture: -0.4, cleanliness: 0.5, proximity: -0.2 },
  },
  {
    id: 'geranium',
    name: { en: 'Geranium', tr: 'Sardunya' },
    families: { floral: 0.7, green: 0.5, aromatic: 0.3 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 150 },
    character: { temperature: -0.2, texture: 0.3, cleanliness: 0.5, proximity: -0.3 },
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
  },
  {
    id: 'ylang-ylang',
    name: { en: 'Ylang-Ylang', tr: 'Ilang ilang' },
    families: { floral: 1.0, gourmand: 0.2, spicy: 0.2 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 210 },
    character: { temperature: 0.6, texture: -0.3, cleanliness: 0.0, proximity: -0.3 },
  },
  {
    id: 'mimosa',
    name: { en: 'Mimosa', tr: 'Mimoza' },
    families: { floral: 0.9, gourmand: 0.2, green: 0.2 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 180 },
    character: { temperature: 0.2, texture: -0.5, cleanliness: 0.6, proximity: -0.1 },
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
  },
  {
    id: 'gardenia',
    name: { en: 'Gardenia', tr: 'Gardenya' },
    families: { floral: 1.0, gourmand: 0.3, green: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 240 },
    character: { temperature: 0.4, texture: -0.4, cleanliness: 0.1, proximity: -0.3 },
  },
  {
    id: 'osmanthus',
    name: { en: 'Osmanthus', tr: 'Osmantus' },
    families: { floral: 0.9, fruity: 0.6, leather: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 220 },
    character: { temperature: 0.3, texture: -0.2, cleanliness: 0.3, proximity: -0.2 },
  },
  {
    id: 'violet',
    name: { en: 'Violet', tr: 'Menekşe' },
    families: { floral: 0.9, gourmand: 0.2, woody: 0.2 },
    volatility: { peakMinutes: 35, halfLifeMinutes: 240 },
    character: { temperature: -0.4, texture: -0.6, cleanliness: 0.5, proximity: 0.1 },
  },
  {
    id: 'narcissus',
    name: { en: 'Narcissus', tr: 'Nergis' },
    families: { floral: 0.9, green: 0.5, animalic: 0.3, mossy: 0.2 },
    volatility: { peakMinutes: 40, halfLifeMinutes: 300 },
    character: { temperature: 0.1, texture: 0.4, cleanliness: -0.3, proximity: -0.1 },
  },
  {
    id: 'iris',
    name: { en: 'Iris', tr: 'İris' },
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
  },
  {
    id: 'apricot',
    name: { en: 'Apricot', tr: 'Kayısı' },
    families: { fruity: 1.0, gourmand: 0.3 },
    volatility: { peakMinutes: 15, halfLifeMinutes: 130 },
    character: { temperature: 0.5, texture: -0.4, cleanliness: 0.3, proximity: -0.1 },
  },
  {
    id: 'mango',
    name: { en: 'Mango', tr: 'Mango' },
    families: { fruity: 1.0, gourmand: 0.2 },
    volatility: { peakMinutes: 18, halfLifeMinutes: 140 },
    character: { temperature: 0.5, texture: -0.2, cleanliness: 0.1, proximity: -0.3 },
  },
  {
    id: 'fig',
    name: { en: 'Fig', tr: 'İncir' },
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
  },
  {
    id: 'plum',
    name: { en: 'Plum', tr: 'Erik' },
    families: { fruity: 1.0, gourmand: 0.3, animalic: 0.2 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 200 },
    character: { temperature: 0.5, texture: -0.3, cleanliness: -0.1, proximity: 0.0 },
  },
  {
    id: 'wine',
    name: { en: 'Wine Accord', tr: 'Şarap akoru' },
    families: { fruity: 0.8, gourmand: 0.3, animalic: 0.2 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 150 },
    character: { temperature: 0.4, texture: 0.2, cleanliness: -0.2, proximity: -0.2 },
  },

  // ——— Gurme ———
  {
    id: 'rum',
    name: { en: 'Rum', tr: 'Rom' },
    families: { gourmand: 0.7, fruity: 0.3, resinous: 0.2 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 180 },
    character: { temperature: 0.8, texture: 0.1, cleanliness: -0.1, proximity: 0.0 },
  },
  {
    id: 'whiskey',
    name: { en: 'Whiskey', tr: 'Viski' },
    families: { gourmand: 0.6, woody: 0.4, leather: 0.3 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 210 },
    character: { temperature: 0.8, texture: 0.4, cleanliness: -0.3, proximity: 0.1 },
  },
  {
    id: 'sugar',
    name: { en: 'Sugar', tr: 'Şeker' },
    families: { gourmand: 1.0, fruity: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 240 },
    character: { temperature: 0.4, texture: -0.2, cleanliness: 0.3, proximity: 0.1 },
  },
  {
    id: 'coffee',
    name: { en: 'Coffee', tr: 'Kahve' },
    families: { gourmand: 0.8, woody: 0.3, spicy: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 240 },
    character: { temperature: 0.7, texture: 0.6, cleanliness: -0.2, proximity: 0.2 },
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
  },
  {
    id: 'milk',
    name: { en: 'Milk', tr: 'Süt' },
    families: { gourmand: 0.8, musk: 0.3 },
    volatility: { peakMinutes: 40, halfLifeMinutes: 300 },
    character: { temperature: 0.4, texture: -0.9, cleanliness: 0.5, proximity: 0.5 },
  },
  {
    id: 'hazelnut',
    name: { en: 'Hazelnut', tr: 'Fındık' },
    families: { gourmand: 0.9, woody: 0.2 },
    volatility: { peakMinutes: 45, halfLifeMinutes: 330 },
    character: { temperature: 0.6, texture: -0.3, cleanliness: 0.1, proximity: 0.3 },
  },
  {
    id: 'cocoa',
    name: { en: 'Cocoa', tr: 'Kakao' },
    families: { gourmand: 0.9, woody: 0.3, mossy: 0.2 },
    volatility: { peakMinutes: 45, halfLifeMinutes: 330 },
    character: { temperature: 0.5, texture: 0.3, cleanliness: -0.2, proximity: 0.3 },
  },
  {
    id: 'caramel',
    name: { en: 'Caramel', tr: 'Karamel' },
    families: { gourmand: 1.0 },
    volatility: { peakMinutes: 50, halfLifeMinutes: 360 },
    character: { temperature: 0.8, texture: -0.5, cleanliness: 0.1, proximity: 0.4 },
  },
  {
    id: 'honey',
    name: { en: 'Honey', tr: 'Bal' },
    families: { gourmand: 0.7, animalic: 0.5, floral: 0.3 },
    volatility: { peakMinutes: 50, halfLifeMinutes: 400 },
    character: { temperature: 0.8, texture: -0.2, cleanliness: -0.4, proximity: 0.4 },
  },

  // ——— Aromatik ve baharat ———
  {
    id: 'lavender',
    name: { en: 'Lavender', tr: 'Lavanta' },
    families: { aromatic: 1.0, floral: 0.3, green: 0.2 },
    volatility: { peakMinutes: 15, halfLifeMinutes: 110 },
    character: { temperature: -0.3, texture: 0.2, cleanliness: 0.7, proximity: -0.4 },
  },
  {
    id: 'camphor',
    name: { en: 'Camphor', tr: 'Kâfur' },
    families: { aromatic: 1.0, mineral: 0.3 },
    volatility: { peakMinutes: 15, halfLifeMinutes: 90 },
    character: { temperature: -1.0, texture: 0.7, cleanliness: 0.6, proximity: -0.6 },
  },
  {
    id: 'nutmeg',
    name: { en: 'Nutmeg', tr: 'Muskat' },
    families: { spicy: 0.9, woody: 0.3 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 170 },
    character: { temperature: 0.6, texture: 0.4, cleanliness: 0.2, proximity: -0.1 },
  },
  {
    id: 'cinnamon',
    name: { en: 'Cinnamon', tr: 'Tarçın' },
    families: { spicy: 1.0, gourmand: 0.3 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 170 },
    character: { temperature: 0.9, texture: 0.5, cleanliness: 0.1, proximity: 0.0 },
  },
  {
    id: 'clove',
    name: { en: 'Clove', tr: 'Karanfil' },
    families: { spicy: 1.0, woody: 0.2 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 180 },
    character: { temperature: 0.8, texture: 0.6, cleanliness: 0.0, proximity: 0.0 },
  },
  {
    id: 'cumin',
    name: { en: 'Cumin', tr: 'Kimyon' },
    families: { spicy: 0.9, animalic: 0.6 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 180 },
    character: { temperature: 0.6, texture: 0.5, cleanliness: -0.8, proximity: 0.4 },
  },
  {
    id: 'hay',
    name: { en: 'Hay', tr: 'Kuru ot' },
    families: { aromatic: 0.6, gourmand: 0.3, green: 0.3, mossy: 0.2 },
    volatility: { peakMinutes: 40, halfLifeMinutes: 300 },
    character: { temperature: 0.4, texture: 0.5, cleanliness: 0.0, proximity: 0.1 },
  },
  {
    id: 'clover',
    name: { en: 'Clover', tr: 'Yonca' },
    families: { green: 0.8, floral: 0.3, gourmand: 0.2 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 190 },
    character: { temperature: -0.1, texture: 0.2, cleanliness: 0.5, proximity: -0.2 },
  },
  {
    id: 'carrot',
    name: { en: 'Carrot Seed', tr: 'Havuç tohumu' },
    families: { green: 0.6, gourmand: 0.4, floral: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 220 },
    character: { temperature: 0.0, texture: -0.3, cleanliness: 0.3, proximity: 0.1 },
  },

  // ——— Reçineler ———
  {
    id: 'elemi',
    name: { en: 'Elemi', tr: 'Elemi' },
    families: { resinous: 0.8, citrus: 0.4, aromatic: 0.3 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 200 },
    character: { temperature: 0.0, texture: 0.3, cleanliness: 0.6, proximity: -0.3 },
  },
  {
    id: 'frankincense',
    name: { en: 'Frankincense', tr: 'Günlük' },
    families: { resinous: 1.0, aromatic: 0.3, citrus: 0.2 },
    volatility: { peakMinutes: 45, halfLifeMinutes: 360 },
    character: { temperature: 0.1, texture: 0.3, cleanliness: 0.6, proximity: -0.1 },
  },
  {
    id: 'myrrh',
    name: { en: 'Myrrh', tr: 'Mür' },
    families: { resinous: 1.0, gourmand: 0.2, animalic: 0.2 },
    volatility: { peakMinutes: 60, halfLifeMinutes: 420 },
    character: { temperature: 0.5, texture: 0.2, cleanliness: 0.0, proximity: 0.3 },
  },

  // ——— Odun, deri, hayvansal ———
  {
    id: 'pine',
    name: { en: 'Pine', tr: 'Çam' },
    families: { woody: 0.7, aromatic: 0.6, resinous: 0.3 },
    volatility: { peakMinutes: 20, halfLifeMinutes: 160 },
    character: { temperature: -0.4, texture: 0.6, cleanliness: 0.6, proximity: -0.4 },
  },
  {
    id: 'cypress',
    name: { en: 'Cypress', tr: 'Servi' },
    families: { woody: 0.7, aromatic: 0.5, green: 0.3 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 240 },
    character: { temperature: -0.4, texture: 0.5, cleanliness: 0.6, proximity: -0.2 },
  },
  {
    id: 'rubber',
    name: { en: 'Rubber', tr: 'Kauçuk' },
    families: { leather: 0.6, mineral: 0.3, animalic: 0.2 },
    volatility: { peakMinutes: 30, halfLifeMinutes: 200 },
    character: { temperature: 0.2, texture: 0.7, cleanliness: -0.4, proximity: 0.1 },
  },
  {
    id: 'indole',
    name: { en: 'Indole', tr: 'İndol' },
    families: { animalic: 0.9, floral: 0.4 },
    volatility: { peakMinutes: 35, halfLifeMinutes: 280 },
    character: { temperature: 0.4, texture: 0.1, cleanliness: -0.9, proximity: 0.3 },
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
  },
  {
    id: 'vetiver',
    name: { en: 'Vetiver', tr: 'Vetiver' },
    families: { woody: 0.8, mossy: 0.5, green: 0.3 },
    volatility: { peakMinutes: 60, halfLifeMinutes: 480 },
    character: { temperature: -0.2, texture: 0.7, cleanliness: 0.2, proximity: 0.2 },
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
] as const;
