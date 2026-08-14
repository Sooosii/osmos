import type { Note } from '../types';

export const EXPANSION_TOP_NOTES: readonly Note[] = [
  {
    id: 'strawberry',
    name: { en: 'Strawberry', tr: 'Çilek' },
    families: { fruity: 1, gourmand: 0.35 },
    volatility: { peakMinutes: 8, halfLifeMinutes: 85 },
    character: { temperature: 0.2, texture: -0.4, cleanliness: 0.2, proximity: -0.1 },
    description: {
      en: 'Red fruit with a green cap — tart at first, then quickly creamy and sweet.',
      tr: 'Yeşil saplı kırmızı meyve — önce mayhoş, ardından hızla kremamsı ve tatlı.',
    },
  },
  {
    id: 'angelica-root',
    name: { en: 'Angelica Root', tr: 'Melek otu kökü' },
    families: { aromatic: 0.8, green: 0.55, woody: 0.4 },
    volatility: { peakMinutes: 12, halfLifeMinutes: 150 },
    character: { temperature: -0.45, texture: 0.5, cleanliness: 0.1, proximity: -0.25 },
    description: {
      en: 'Dry roots, celery leaf, and peppery earth — a green smell with a dusty underside.',
      tr: 'Kuru kök, kereviz yaprağı ve biberli toprak — altında toz taşıyan yeşil bir koku.',
    },
  },
  {
    id: 'anise',
    name: { en: 'Anise', tr: 'Anason' },
    families: { spicy: 0.8, aromatic: 0.55, gourmand: 0.25 },
    volatility: { peakMinutes: 7, halfLifeMinutes: 105 },
    character: { temperature: -0.15, texture: 0.15, cleanliness: 0.35, proximity: -0.2 },
    description: {
      en: 'Cool liquorice and crushed seed — sweet in shape, medicinal at the edge.',
      tr: 'Serin meyan kökü ve ezilmiş tohum — biçimi tatlı, kenarı ilaçsı.',
    },
  },
];

export const EXPANSION_HEART_NOTES: readonly Note[] = [
  {
    id: 'rice',
    name: { en: 'Rice', tr: 'Pirinç' },
    families: { gourmand: 0.7, woody: 0.2, musk: 0.2 },
    volatility: { peakMinutes: 35, halfLifeMinutes: 240 },
    character: { temperature: 0.25, texture: -0.85, cleanliness: 0.65, proximity: 0.35 },
    description: {
      en: 'Warm steam above a plain bowl — soft starch, pale grain, and almost no sweetness.',
      tr: 'Sade bir kâsenin üstündeki sıcak buhar — yumuşak nişasta, açık tahıl, neredeyse şekersiz.',
    },
  },
  {
    id: 'green-tea',
    name: { en: 'Green Tea', tr: 'Yeşil çay' },
    families: { green: 0.85, aromatic: 0.45 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 180 },
    character: { temperature: -0.55, texture: 0.05, cleanliness: 0.8, proximity: -0.5 },
    description: {
      en: 'Steeped leaves and faint bitterness — transparent, grassy, and quietly dry.',
      tr: 'Demlenmiş yaprak ve hafif burukluk — saydam, otsu ve sessizce kuru.',
    },
  },
  {
    id: 'biscuit',
    name: { en: 'Biscuit', tr: 'Bisküvi' },
    families: { gourmand: 1, woody: 0.15 },
    volatility: { peakMinutes: 45, halfLifeMinutes: 300 },
    character: { temperature: 0.7, texture: -0.25, cleanliness: 0.1, proximity: 0.65 },
    description: {
      en: 'Toasted flour and browned butter — drier and crumblier than caramel.',
      tr: 'Kavrulmuş un ve kızarmış tereyağı — karamelden daha kuru, daha kırıntılı.',
    },
  },
  {
    id: 'grape',
    name: { en: 'Grape', tr: 'Üzüm' },
    families: { fruity: 1, gourmand: 0.15 },
    volatility: { peakMinutes: 28, halfLifeMinutes: 180 },
    character: { temperature: 0.25, texture: -0.35, cleanliness: 0.1, proximity: -0.1 },
    description: {
      en: 'Dark juice and taut skin — sweeter than wine, sharper than jam.',
      tr: 'Koyu meyve suyu ve gergin kabuk — şaraptan tatlı, reçelden keskin.',
    },
  },
  {
    id: 'cactus',
    name: { en: 'Cactus', tr: 'Kaktüs' },
    families: { green: 0.8, mineral: 0.45 },
    volatility: { peakMinutes: 25, halfLifeMinutes: 180 },
    character: { temperature: -0.35, texture: 0.35, cleanliness: 0.75, proximity: -0.55 },
    description: {
      en: 'A snapped green stem holding cold water — vegetal, airy, and barely sweet.',
      tr: 'İçinde soğuk su tutan kırılmış yeşil sap — bitkisel, havadar, çok az tatlı.',
    },
  },
  {
    id: 'champaca',
    name: { en: 'Champaca', tr: 'Şampaka' },
    families: { floral: 1, fruity: 0.35, spicy: 0.25 },
    volatility: { peakMinutes: 50, halfLifeMinutes: 300 },
    character: { temperature: 0.55, texture: -0.25, cleanliness: 0.05, proximity: 0.45 },
    description: {
      en: 'Golden petals with tea, banana, and warm spice folded into the flower.',
      tr: 'Çiçeğin içine katlanmış çay, muz ve sıcak baharat taşıyan altın renkli taç yapraklar.',
    },
  },
];

export const EXPANSION_BASE_NOTES: readonly Note[] = [
  {
    id: 'brown-sugar',
    name: { en: 'Brown Sugar', tr: 'Esmer şeker' },
    families: { gourmand: 1, resinous: 0.25 },
    volatility: { peakMinutes: 100, halfLifeMinutes: 520 },
    character: { temperature: 0.85, texture: -0.2, cleanliness: -0.1, proximity: 0.8 },
    description: {
      en: 'Molasses-dark sweetness — damp, granular, and deeper than white sugar.',
      tr: 'Pekmez koyuluğunda tatlılık — nemli, taneli ve beyaz şekerden daha derin.',
    },
  },
];
