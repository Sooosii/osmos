import type { Perfume } from '../types';

/**
 * Küratörlü seçki — ikinci grup: gurme ve tropik blok.
 *
 * Bu grubun bir görevi var. Ana planın dağılım analizi listenin gurme tarafta
 * 3× fazla olduğunu söylüyordu ve bir kontrol koymuştu: motor Sel-Vanille'i
 * Vanille Abricot'tan ayırabiliyor mu? Dört vanilya ve dört tropik-gurme burada
 * yan yana duruyor. Tek bir tatlı lekeye çökerlerse motor bu bölgede kör demektir.
 *
 * Ağırlıklar küratör düzeltmesinden geçti: Bianco Oro odunsu-baskın (badem
 * değil), Bonbon Pop şeftalili (ahududu yok), Miami piña colada gibi hindistan
 * cevizi ağırlıklı, Sel-Vanille ciddi bir vanilya — tuz aksesuar, gövde değil.
 */
export const CURATED_B: readonly Perfume[] = [
  // ——— Vanilya kümesi ———
  {
    id: 'guerlain-vanille-planifolia',
    name: 'Vanille Planifolia',
    brand: 'Guerlain',
    year: 2021,
    perfumer: 'Thierry Wasser',
    curated: true,
    line: {
      en: 'Not a spice but a resin: dark, smoky, almost a liqueur.',
      tr: 'Baharat değil reçine: koyu, isli, neredeyse likör.',
    },
    notes: [
      { noteId: 'rum', tier: 'top', weight: 0.5 },
      { noteId: 'bergamot', tier: 'top', weight: 0.3 },
      { noteId: 'vanilla', tier: 'heart', weight: 1.0 },
      { noteId: 'tolu-balsam', tier: 'heart', weight: 0.5 },
      { noteId: 'benzoin', tier: 'base', weight: 0.7 },
      { noteId: 'tonka', tier: 'base', weight: 0.6 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.5 },
      { noteId: 'beeswax', tier: 'base', weight: 0.3 },
    ],
  },
  {
    // Küratör yönü: önce vanilya, sonra tuz. Etraftaki tatlı-meyveli yaz
    // kokularının aksine bu ciddi bir vanilya — tuz onu keskinleştiren bir
    // kenar, kompozisyonun gövdesi değil. Derinlik benzoin ve tonkadan geliyor.
    id: 'maison-tahite-sel-vanille',
    name: 'Sel-Vanille',
    brand: 'Maison Tahité',
    year: 2020,
    perfumer: 'David Maruitte',
    curated: true,
    line: {
      en: 'Salt scattered over the sweetness — it does not soften the vanilla, it sharpens it.',
      tr: 'Tatlının üstüne serpilmiş tuz — vanilyayı yumuşatmıyor, keskinleştiriyor.',
    },
    notes: [
      { noteId: 'sea-salt', tier: 'top', weight: 0.5 },
      { noteId: 'bergamot', tier: 'top', weight: 0.3 },
      { noteId: 'vanilla', tier: 'heart', weight: 1.0 },
      { noteId: 'coconut', tier: 'heart', weight: 0.4 },
      { noteId: 'benzoin', tier: 'heart', weight: 0.4 },
      { noteId: 'tonka', tier: 'base', weight: 0.5 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.4 },
      { noteId: 'white-musk', tier: 'base', weight: 0.4 },
      { noteId: 'ambrette', tier: 'base', weight: 0.3 },
    ],
  },
  {
    // `perfumer` YOK ve bu eksik veri değil, bir olgu: marka bu kokunun burnunu
    // hiç açıklamadı. Aranıp bulunamadı diye boş bırakılmış sanılıp bir gün
    // tahminle doldurulmasın. Ajyal ile birlikte 52'nin açıklanmamış iki adı.
    // Long Board da parfümörsüz ama başka sebeple — `curated-f.ts`.
    id: 'comptoir-sud-pacifique-vanille-abricot',
    name: 'Vanille Abricot',
    brand: 'Comptoir Sud Pacifique',
    year: 1994,
    curated: true,
    line: {
      en: 'An apricot left in the sun, warm cream underneath.',
      tr: 'Güneşte kalmış kayısı, altında ılık bir krema.',
    },
    notes: [
      { noteId: 'apricot', tier: 'top', weight: 1.0 },
      { noteId: 'peach', tier: 'top', weight: 0.4 },
      { noteId: 'mandarin', tier: 'top', weight: 0.4 },
      { noteId: 'vanilla', tier: 'heart', weight: 0.9 },
      { noteId: 'jasmine', tier: 'heart', weight: 0.3 },
      { noteId: 'sugar', tier: 'base', weight: 0.4 },
      { noteId: 'white-musk', tier: 'base', weight: 0.5 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.3 },
    ],
  },
  {
    // Küratör düzeltmesi: ağırlıklı olarak ODUNSU, vanilya eşlik ediyor.
    // İlk taslakta badem başı çekiyordu — yanlış. Badem artık bir aksan.
    id: 'giardini-di-toscana-bianco-oro',
    name: 'Bianco Oro',
    brand: 'Giardini di Toscana',
    year: 2023,
    perfumer: 'Silvia Martinelli',
    curated: true,
    line: {
      en: 'Sanded wood with something sweet resting on it.',
      tr: 'Zımparalanmış odun ve üzerine bırakılmış tatlı bir şey.',
    },
    notes: [
      { noteId: 'bergamot', tier: 'top', weight: 0.3 },
      { noteId: 'vanilla', tier: 'heart', weight: 0.7 },
      { noteId: 'almond', tier: 'heart', weight: 0.4 },
      { noteId: 'ylang-ylang', tier: 'heart', weight: 0.3 },
      { noteId: 'sandalwood', tier: 'base', weight: 1.0 },
      { noteId: 'cedar', tier: 'base', weight: 0.7 },
      { noteId: 'cashmeran', tier: 'base', weight: 0.6 },
      { noteId: 'tonka', tier: 'base', weight: 0.5 },
      { noteId: 'white-musk', tier: 'base', weight: 0.4 },
    ],
  },

  // ——— Tropik / meyveli gurme ———
  {
    // Küratör düzeltmesi: ahududu yok, şeftali var. Meyve-gurme baskın,
    // odun yalnızca altta hafif bir zemin.
    id: 'house-of-oud-bonbon-pop',
    name: 'Bonbon Pop',
    brand: 'The House of Oud',
    year: 2022,
    perfumer: 'Douglas Morel',
    curated: true,
    line: {
      en: 'Candy straight out of the wrapper — sweet without apology.',
      tr: 'Kâğıdından yeni çıkmış şeker — utanmadan tatlı.',
    },
    notes: [
      { noteId: 'peach', tier: 'top', weight: 1.0 },
      { noteId: 'lemon', tier: 'top', weight: 0.3 },
      { noteId: 'sugar', tier: 'heart', weight: 0.8 },
      { noteId: 'vanilla', tier: 'heart', weight: 0.6 },
      { noteId: 'caramel', tier: 'heart', weight: 0.4 },
      { noteId: 'white-musk', tier: 'base', weight: 0.5 },
      { noteId: 'cedar', tier: 'base', weight: 0.4 },
      { noteId: 'tonka', tier: 'base', weight: 0.4 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.3 },
    ],
  },
  {
    id: 'lorenzo-pazzaglia-summer-hammer',
    name: 'Summer Hammer',
    brand: 'Lorenzo Pazzaglia',
    year: 2023,
    perfumer: 'Lorenzo Pazzaglia',
    curated: true,
    line: {
      en: 'Pineapple on ice and burnt sugar — not the holiday, its first night.',
      tr: 'Buzda ananas ve kavrulmuş şeker — tatil değil, tatilin ilk gecesi.',
    },
    notes: [
      { noteId: 'pineapple', tier: 'top', weight: 1.0 },
      { noteId: 'rum', tier: 'top', weight: 0.5 },
      { noteId: 'lemon', tier: 'top', weight: 0.4 },
      { noteId: 'coconut', tier: 'heart', weight: 0.8 },
      { noteId: 'vanilla', tier: 'heart', weight: 0.6 },
      { noteId: 'caramel', tier: 'heart', weight: 0.5 },
      { noteId: 'tonka', tier: 'base', weight: 0.5 },
      { noteId: 'benzoin', tier: 'base', weight: 0.4 },
      { noteId: 'white-musk', tier: 'base', weight: 0.4 },
    ],
  },
  {
    // Küratör tarifi: hindistan cevizi yoğunluklu, çiçeksi, tatlı — piña colada
    // içiyormuş hissi. Ananas ve rom o hissi kuruyor, ama gövde hindistan cevizi.
    id: 'city-rhythm-miami-tropical-confessions',
    name: 'Miami Tropical Confessions',
    brand: 'City Rhythm',
    year: 2023,
    perfumer: 'Niles Ramadhin',
    curated: true,
    line: {
      en: 'A piña colada in a glass you did not order, and flowers on the table.',
      tr: 'Ismarlamadığın bir bardakta piña colada, masada da çiçekler.',
    },
    notes: [
      { noteId: 'pineapple', tier: 'top', weight: 0.8 },
      { noteId: 'rum', tier: 'top', weight: 0.4 },
      { noteId: 'lemon', tier: 'top', weight: 0.3 },
      { noteId: 'coconut', tier: 'heart', weight: 1.0 },
      { noteId: 'ylang-ylang', tier: 'heart', weight: 0.6 },
      { noteId: 'vanilla', tier: 'heart', weight: 0.5 },
      { noteId: 'orange-blossom', tier: 'heart', weight: 0.4 },
      { noteId: 'sugar', tier: 'base', weight: 0.5 },
      { noteId: 'white-musk', tier: 'base', weight: 0.5 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.3 },
    ],
  },
  {
    id: 'vilhelm-mango-skin',
    name: 'Mango Skin',
    brand: 'Vilhelm Parfumerie',
    year: 2018,
    perfumer: 'Jan Ahlgren',
    curated: true,
    line: {
      en: 'Not the fruit — the skin of someone who just ate it.',
      tr: 'Meyve değil — meyveyi az önce yemiş birinin teni.',
    },
    notes: [
      { noteId: 'mango', tier: 'top', weight: 1.0 },
      { noteId: 'davana', tier: 'top', weight: 0.5 },
      { noteId: 'lychee', tier: 'top', weight: 0.4 },
      { noteId: 'wine', tier: 'heart', weight: 0.3 },
      { noteId: 'ylang-ylang', tier: 'heart', weight: 0.3 },
      { noteId: 'white-musk', tier: 'base', weight: 0.8 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.5 },
      { noteId: 'ambrette', tier: 'base', weight: 0.4 },
    ],
  },
] as const;
