import type { Note } from '../types';

/**
 * Dip bandı — tepe noktası 90 dakika ve sonrası.
 *
 * Kalıcılığı taşıyan malzemeler: reçineler, amber yapıcılar, ağır odunlar,
 * deri, hayvansallar, yosun ve miskler. Bunların yarı ömrü saatlerle ölçülüyor.
 */
export const BASE_NOTES: readonly Note[] = [
  // ——— Odun ———
  {
    id: 'patchouli',
    name: { en: 'Patchouli', tr: 'Paçuli' },
    families: { woody: 0.7, mossy: 0.6, animalic: 0.2, gourmand: 0.1 },
    volatility: { peakMinutes: 90, halfLifeMinutes: 660 },
    character: { temperature: 0.2, texture: 0.4, cleanliness: -0.4, proximity: 0.4 },
    description: {
      en: 'Damp cellar and dark chocolate. Cleaned up in modern use, but the earth is still there.',
      tr: 'Nemli mahzen ve bitter çikolata. Modern kullanımda arıtıldı ama toprağı hâlâ duruyor.',
    },
  },
  {
    id: 'fir-balsam',
    name: { en: 'Fir Balsam', tr: 'Köknar balsamı' },
    families: { woody: 0.6, resinous: 0.6, green: 0.3 },
    volatility: { peakMinutes: 90, halfLifeMinutes: 480 },
    character: { temperature: -0.2, texture: 0.4, cleanliness: 0.4, proximity: 0.1 },
  },
  {
    id: 'papyrus',
    name: { en: 'Papyrus', tr: 'Papirüs' },
    families: { woody: 0.8, mossy: 0.3, green: 0.2 },
    volatility: { peakMinutes: 100, halfLifeMinutes: 540 },
    character: { temperature: -0.2, texture: 0.6, cleanliness: 0.3, proximity: 0.2 },
  },
  {
    id: 'sandalwood',
    name: { en: 'Sandalwood', tr: 'Sandal ağacı' },
    families: { woody: 1.0, gourmand: 0.2, musk: 0.2 },
    volatility: { peakMinutes: 120, halfLifeMinutes: 720 },
    character: { temperature: 0.4, texture: -0.7, cleanliness: 0.4, proximity: 0.6 },
    description: {
      en: 'Milky, rounded wood with no edges — the softest way a perfume can end.',
      tr: 'Sütsü, köşesiz, yuvarlak bir odun — bir parfümün bitebileceği en yumuşak hâl.',
    },
  },
  {
    id: 'guaiac-wood',
    name: { en: 'Guaiac Wood', tr: 'Guaiac odunu' },
    families: { woody: 1.0, leather: 0.3, resinous: 0.2 },
    volatility: { peakMinutes: 120, halfLifeMinutes: 660 },
    character: { temperature: 0.6, texture: 0.5, cleanliness: -0.2, proximity: 0.3 },
  },
  {
    id: 'oud',
    name: { en: 'Oud', tr: 'Oud' },
    families: { woody: 1.0, animalic: 0.7, leather: 0.4, resinous: 0.2 },
    volatility: { peakMinutes: 150, halfLifeMinutes: 900 },
    character: { temperature: 0.5, texture: 0.9, cleanliness: -0.8, proximity: 0.5 },
    description: {
      en: 'Infected heartwood. Medicinal, barnyard, sweet and rotten at once — the most divisive material.',
      tr: 'Enfekte olmuş öz odun. Tıbbi, ahır kokulu, aynı anda tatlı ve çürük — en bölücü malzeme.',
    },
  },

  // ——— Yosun ve toprak ———
  {
    id: 'moss',
    name: { en: 'Moss', tr: 'Yosun' },
    families: { mossy: 1.0, green: 0.3, mineral: 0.2 },
    volatility: { peakMinutes: 100, halfLifeMinutes: 540 },
    character: { temperature: -0.4, texture: 0.4, cleanliness: 0.0, proximity: 0.2 },
  },
  {
    id: 'earth',
    name: { en: 'Earth', tr: 'Toprak' },
    families: { mossy: 0.7, woody: 0.3, animalic: 0.2 },
    volatility: { peakMinutes: 110, halfLifeMinutes: 600 },
    character: { temperature: -0.1, texture: 0.5, cleanliness: -0.5, proximity: 0.3 },
  },
  {
    id: 'oakmoss',
    name: { en: 'Oakmoss', tr: 'Meşe yosunu' },
    families: { mossy: 1.0, green: 0.4, woody: 0.2 },
    volatility: { peakMinutes: 120, halfLifeMinutes: 600 },
    character: { temperature: -0.5, texture: 0.5, cleanliness: -0.1, proximity: 0.2 },
    description: {
      en: 'Forest floor after rain — dry, inky, bitter. The backbone of every chypre.',
      tr: 'Yağmur sonrası orman zemini — kuru, mürekkepsi, acı. Her chypre’in omurgası.',
    },
  },

  // ——— Reçine ve amber ———
  {
    id: 'vanilla',
    name: { en: 'Vanilla', tr: 'Vanilya' },
    families: { gourmand: 1.0, resinous: 0.3 },
    volatility: { peakMinutes: 90, halfLifeMinutes: 600 },
    character: { temperature: 0.9, texture: -0.8, cleanliness: 0.2, proximity: 0.7 },
    description: {
      en: 'Warm, smooth, and closer to the skin than almost anything else. Rarely quiet.',
      tr: 'Sıcak, pürüzsüz ve neredeyse her şeyden daha çok tene yakın. Nadiren sessiz.',
    },
  },
  {
    id: 'tonka',
    name: { en: 'Tonka Bean', tr: 'Tonka fasulyesi' },
    families: { gourmand: 0.8, resinous: 0.3, aromatic: 0.2 },
    volatility: { peakMinutes: 100, halfLifeMinutes: 540 },
    character: { temperature: 0.7, texture: -0.5, cleanliness: 0.3, proximity: 0.6 },
    description: {
      en: 'Almond, hay and tobacco folded into sweetness. Softer and drier than vanilla.',
      tr: 'Tatlılığa katlanmış badem, kuru ot ve tütün. Vanilyadan daha yumuşak ve daha kuru.',
    },
  },
  {
    id: 'benzoin',
    name: { en: 'Benzoin', tr: 'Benzoin' },
    families: { resinous: 1.0, gourmand: 0.4 },
    volatility: { peakMinutes: 100, halfLifeMinutes: 540 },
    character: { temperature: 0.8, texture: -0.5, cleanliness: 0.3, proximity: 0.6 },
  },
  {
    id: 'tolu-balsam',
    name: { en: 'Tolu Balsam', tr: 'Tolu balsamı' },
    families: { resinous: 0.9, gourmand: 0.4 },
    volatility: { peakMinutes: 100, halfLifeMinutes: 540 },
    character: { temperature: 0.8, texture: -0.4, cleanliness: 0.2, proximity: 0.5 },
  },
  {
    id: 'labdanum',
    name: { en: 'Labdanum', tr: 'Labdanum' },
    families: { resinous: 1.0, leather: 0.4, gourmand: 0.3, animalic: 0.2 },
    volatility: { peakMinutes: 110, halfLifeMinutes: 660 },
    character: { temperature: 0.8, texture: 0.2, cleanliness: -0.2, proximity: 0.5 },
    description: {
      en: 'Sticky resin scraped from a shrub — honeyed, leathery, and the backbone of amber.',
      tr: 'Bir çalıdan kazınan yapışkan reçine — ballı, derimsi; amberin omurgası.',
    },
  },
  {
    id: 'cistus',
    name: { en: 'Cistus', tr: 'Laden' },
    families: { resinous: 0.8, leather: 0.4, animalic: 0.3 },
    volatility: { peakMinutes: 110, halfLifeMinutes: 600 },
    character: { temperature: 0.7, texture: 0.3, cleanliness: -0.3, proximity: 0.4 },
  },
  {
    id: 'opoponax',
    name: { en: 'Opoponax', tr: 'Opoponaks' },
    families: { resinous: 0.9, gourmand: 0.3, animalic: 0.2 },
    volatility: { peakMinutes: 110, halfLifeMinutes: 600 },
    character: { temperature: 0.8, texture: -0.1, cleanliness: -0.1, proximity: 0.5 },
  },
  {
    id: 'styrax',
    name: { en: 'Styrax', tr: 'Styraks' },
    families: { resinous: 0.8, leather: 0.5, animalic: 0.2 },
    volatility: { peakMinutes: 110, halfLifeMinutes: 600 },
    character: { temperature: 0.7, texture: 0.4, cleanliness: -0.3, proximity: 0.4 },
  },
  {
    id: 'amber-accord',
    name: { en: 'Amber', tr: 'Amber' },
    families: { resinous: 0.8, gourmand: 0.4, musk: 0.3 },
    volatility: { peakMinutes: 120, halfLifeMinutes: 660 },
    character: { temperature: 0.9, texture: -0.5, cleanliness: 0.2, proximity: 0.6 },
  },

  // ——— Deri ———
  {
    id: 'cade',
    name: { en: 'Cade', tr: 'Katran ardıcı' },
    families: { leather: 0.8, woody: 0.5, resinous: 0.3 },
    volatility: { peakMinutes: 90, halfLifeMinutes: 540 },
    character: { temperature: 0.7, texture: 0.9, cleanliness: -0.6, proximity: 0.3 },
  },
  {
    id: 'tobacco',
    name: { en: 'Tobacco', tr: 'Tütün' },
    families: { leather: 0.5, gourmand: 0.4, resinous: 0.3, animalic: 0.2 },
    volatility: { peakMinutes: 90, halfLifeMinutes: 540 },
    character: { temperature: 0.7, texture: 0.3, cleanliness: -0.2, proximity: 0.4 },
  },
  {
    id: 'leather',
    name: { en: 'Leather', tr: 'Deri' },
    families: { leather: 1.0, animalic: 0.3, woody: 0.2 },
    volatility: { peakMinutes: 100, halfLifeMinutes: 600 },
    character: { temperature: 0.5, texture: 0.6, cleanliness: -0.4, proximity: 0.4 },
  },

  // ——— Hayvansal ———
  {
    id: 'beeswax',
    name: { en: 'Beeswax', tr: 'Balmumu' },
    families: { gourmand: 0.5, animalic: 0.4, musk: 0.3, resinous: 0.2 },
    volatility: { peakMinutes: 100, halfLifeMinutes: 540 },
    character: { temperature: 0.6, texture: -0.3, cleanliness: -0.1, proximity: 0.5 },
  },
  {
    id: 'civet',
    name: { en: 'Civet', tr: 'Misk kedisi' },
    families: { animalic: 1.0, musk: 0.4 },
    volatility: { peakMinutes: 150, halfLifeMinutes: 840 },
    character: { temperature: 0.7, texture: 0.2, cleanliness: -1.0, proximity: 0.8 },
  },
  {
    id: 'castoreum',
    name: { en: 'Castoreum', tr: 'Kastoreum' },
    families: { animalic: 1.0, leather: 0.6 },
    volatility: { peakMinutes: 150, halfLifeMinutes: 840 },
    character: { temperature: 0.7, texture: 0.4, cleanliness: -0.9, proximity: 0.7 },
  },
  {
    id: 'hyraceum',
    name: { en: 'Hyraceum', tr: 'Hyraceum' },
    families: { animalic: 1.0, leather: 0.4, mossy: 0.2 },
    volatility: { peakMinutes: 160, halfLifeMinutes: 900 },
    character: { temperature: 0.6, texture: 0.5, cleanliness: -1.0, proximity: 0.7 },
  },

  // ——— Misk ———
  {
    id: 'white-musk',
    name: { en: 'White Musk', tr: 'Beyaz misk' },
    families: { musk: 1.0 },
    volatility: { peakMinutes: 90, halfLifeMinutes: 600 },
    character: { temperature: 0.2, texture: -0.8, cleanliness: 0.9, proximity: 0.6 },
  },
  {
    id: 'ambrette',
    name: { en: 'Ambrette', tr: 'Ambrette' },
    families: { musk: 0.9, floral: 0.3, woody: 0.2 },
    volatility: { peakMinutes: 100, halfLifeMinutes: 540 },
    character: { temperature: 0.1, texture: -0.6, cleanliness: 0.6, proximity: 0.5 },
  },
  {
    id: 'cashmeran',
    name: { en: 'Cashmeran', tr: 'Cashmeran' },
    families: { woody: 0.6, musk: 0.5, gourmand: 0.3 },
    volatility: { peakMinutes: 110, halfLifeMinutes: 660 },
    character: { temperature: 0.5, texture: -0.4, cleanliness: 0.4, proximity: 0.5 },
  },
  {
    id: 'ambergris',
    name: { en: 'Ambergris', tr: 'Amber gris' },
    families: { musk: 0.7, mineral: 0.5, animalic: 0.4 },
    volatility: { peakMinutes: 120, halfLifeMinutes: 780 },
    character: { temperature: 0.4, texture: -0.3, cleanliness: 0.3, proximity: 0.6 },
  },
] as const;
