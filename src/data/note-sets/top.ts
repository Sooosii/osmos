import type { Note } from '../types';

/**
 * Uçucu bant — tepe noktası 15 dakikadan önce.
 *
 * Açılışı kuran notalar: narenciyeler, aromatikler, keskin yeşiller,
 * hafif meyveler ve baharatın uçucu ucu. Çoğu bir saat içinde susuyor.
 *
 * Açıklama alanı Aşama 3'te dolduruldu ve artık zorunlu (`types.ts`); bu bandın
 * 41 notasının 41'i açıklamalı.
 */
export const TOP_NOTES: readonly Note[] = [
  {
    id: 'aldehydes',
    name: { en: 'Aldehydes', tr: 'Aldehitler' },
    families: { aldehydic: 1.0, musk: 0.2 },
    volatility: { peakMinutes: 1, halfLifeMinutes: 30 },
    character: { temperature: -0.5, texture: 0.3, cleanliness: 0.9, proximity: -0.9 },
    description: {
      en: 'A cold fizz above the perfume — soap, starched linen, and the smell of air itself.',
      tr: 'Parfümün üstünde soğuk bir kabarcık — sabun, kolalı keten, havanın kendi kokusu.',
    },
  },
  {
    id: 'bergamot',
    name: { en: 'Bergamot', tr: 'Bergamot' },
    families: { citrus: 1.0, green: 0.2 },
    volatility: { peakMinutes: 2, halfLifeMinutes: 20 },
    character: { temperature: -0.6, texture: -0.3, cleanliness: 0.8, proximity: -0.7 },
    description: {
      en: 'Bitter citrus peel with a floral shadow. The most common opening in perfumery.',
      tr: 'Çiçeksi bir gölgesi olan acı narenciye kabuğu. Parfümeride en yaygın açılış.',
    },
  },
  {
    id: 'lemon',
    name: { en: 'Lemon', tr: 'Limon' },
    families: { citrus: 1.0 },
    volatility: { peakMinutes: 2, halfLifeMinutes: 15 },
    character: { temperature: -0.7, texture: 0.0, cleanliness: 0.9, proximity: -0.8 },
    description: {
      en: 'The citrus everyone can name — bright, sour, and gone before the others have started.',
      tr: 'Herkesin adını bildiği narenciye — parlak, ekşi ve diğerleri daha başlamadan biten.',
    },
  },
  {
    id: 'lime',
    name: { en: 'Lime', tr: 'Misket limonu' },
    families: { citrus: 1.0, green: 0.2 },
    volatility: { peakMinutes: 2, halfLifeMinutes: 12 },
    character: { temperature: -0.8, texture: 0.3, cleanliness: 0.9, proximity: -0.85 },
    description: {
      en: 'Sharper and greener than lemon — the citrus that cuts rather than shines.',
      tr: 'Limondan daha keskin, daha yeşil — parlayan değil, kesen narenciye.',
    },
  },
  {
    id: 'yuzu',
    name: { en: 'Yuzu', tr: 'Yuzu' },
    families: { citrus: 1.0, floral: 0.2 },
    volatility: { peakMinutes: 2, halfLifeMinutes: 18 },
    character: { temperature: -0.6, texture: 0.1, cleanliness: 0.85, proximity: -0.75 },
    description: {
      en: 'Japanese citrus with a floral edge: mandarin sweetness held inside grapefruit bitterness.',
      tr: 'Çiçeksi bir kenarı olan Japon narenciyesi: mandalinanın tatlısı, greyfurtun acısının içinde.',
    },
  },
  {
    id: 'grapefruit',
    name: { en: 'Grapefruit', tr: 'Greyfurt' },
    families: { citrus: 1.0, fruity: 0.2 },
    volatility: { peakMinutes: 2, halfLifeMinutes: 18 },
    character: { temperature: -0.6, texture: 0.2, cleanliness: 0.8, proximity: -0.7 },
    description: {
      en: 'Bitter pith with a faint sulphur edge — the citrus that smells slightly sweaty, and is better for it.',
      tr: 'Hafif kükürtlü bir kenarı olan acı kabuk içi — biraz terli kokan ve bundan kazançlı çıkan narenciye.',
    },
  },
  {
    id: 'mandarin',
    name: { en: 'Mandarin', tr: 'Mandalina' },
    families: { citrus: 1.0, fruity: 0.3 },
    volatility: { peakMinutes: 2, halfLifeMinutes: 22 },
    character: { temperature: 0.0, texture: -0.2, cleanliness: 0.7, proximity: -0.6 },
    description: {
      en: 'The softest citrus: sweet, round, and closer to candy than to fruit.',
      tr: 'Narenciyelerin en yumuşağı: tatlı, yuvarlak, meyveden çok şekere yakın.',
    },
  },
  {
    id: 'bitter-orange',
    name: { en: 'Bitter Orange', tr: 'Acı portakal' },
    families: { citrus: 1.0, green: 0.2, aromatic: 0.2 },
    volatility: { peakMinutes: 3, halfLifeMinutes: 25 },
    character: { temperature: -0.3, texture: 0.4, cleanliness: 0.6, proximity: -0.6 },
    description: {
      en: 'Peel without the flesh — dry, bitter, and the backbone of every cologne.',
      tr: 'Etsiz kabuk — kuru, acı; her kolonyanın omurgası.',
    },
  },
  {
    id: 'petitgrain',
    name: { en: 'Petitgrain', tr: 'Petitgrain' },
    families: { citrus: 0.7, green: 0.6, aromatic: 0.3 },
    volatility: { peakMinutes: 3, halfLifeMinutes: 30 },
    character: { temperature: -0.5, texture: 0.3, cleanliness: 0.7, proximity: -0.5 },
    description: {
      en: 'The twig, not the fruit: green, woody, and faintly bitter like crushed leaves.',
      tr: 'Meyve değil dal: yeşil, odunsu ve ezilmiş yaprak gibi hafif acı.',
    },
  },
  {
    id: 'pink-pepper',
    name: { en: 'Pink Pepper', tr: 'Pembe biber' },
    families: { spicy: 0.8, fruity: 0.3, citrus: 0.2 },
    volatility: { peakMinutes: 3, halfLifeMinutes: 25 },
    character: { temperature: 0.2, texture: 0.6, cleanliness: 0.4, proximity: -0.4 },
    description: {
      en: 'Not truly pepper — a rosy, sparkling prickle that lifts everything around it.',
      tr: 'Aslında biber değil — çevresindeki her şeyi kaldıran gülsü, kıvılcımlı bir batış.',
    },
  },
  {
    id: 'black-pepper',
    name: { en: 'Black Pepper', tr: 'Kara biber' },
    families: { spicy: 1.0, woody: 0.2 },
    volatility: { peakMinutes: 3, halfLifeMinutes: 30 },
    character: { temperature: 0.5, texture: 0.8, cleanliness: 0.2, proximity: -0.3 },
    description: {
      en: 'Dry heat with no sweetness in it — the smell just before a sneeze.',
      tr: 'İçinde hiç tatlı olmayan kuru bir sıcaklık — hapşırmadan hemen önceki koku.',
    },
  },
  {
    id: 'ginger',
    name: { en: 'Ginger', tr: 'Zencefil' },
    families: { spicy: 0.9, citrus: 0.3 },
    volatility: { peakMinutes: 3, halfLifeMinutes: 30 },
    character: { temperature: 0.7, texture: 0.6, cleanliness: 0.4, proximity: -0.4 },
    description: {
      en: 'Heat that fizzes rather than burns — sharp, wet, and faintly soapy.',
      tr: 'Yakmak yerine kabaran bir sıcaklık — keskin, ıslak ve hafifçe sabunlu.',
    },
  },
  {
    id: 'cardamom',
    name: { en: 'Cardamom', tr: 'Kakule' },
    families: { spicy: 0.9, aromatic: 0.4, citrus: 0.2 },
    volatility: { peakMinutes: 4, halfLifeMinutes: 40 },
    character: { temperature: 0.3, texture: 0.4, cleanliness: 0.6, proximity: -0.3 },
    description: {
      en: 'Green camphor inside a warm shell — the spice that reads cold before it reads hot.',
      tr: 'Sıcak bir kabuğun içinde yeşil kâfur — sıcak okunmadan önce soğuk okunan baharat.',
    },
  },
  {
    id: 'coriander',
    name: { en: 'Coriander', tr: 'Kişniş' },
    families: { spicy: 0.7, aromatic: 0.5, citrus: 0.2 },
    volatility: { peakMinutes: 4, halfLifeMinutes: 35 },
    character: { temperature: 0.2, texture: 0.3, cleanliness: 0.4, proximity: -0.3 },
    description: {
      en: 'Citrus and soap ground into a seed — divisive on the tongue, easy in a perfume.',
      tr: 'Tohuma öğütülmüş narenciye ve sabun — dilde bölücü, parfümde uysal.',
    },
  },
  {
    id: 'mint',
    name: { en: 'Mint', tr: 'Nane' },
    families: { aromatic: 1.0, green: 0.4 },
    volatility: { peakMinutes: 2, halfLifeMinutes: 20 },
    character: { temperature: -0.9, texture: 0.5, cleanliness: 0.8, proximity: -0.7 },
    description: {
      en: 'Cold you feel before you smell — the only note that makes the air itself seem colder.',
      tr: 'Koklamadan önce hissedilen bir soğukluk — havayı daha soğuk gösteren tek nota.',
    },
  },
  {
    id: 'basil',
    name: { en: 'Basil', tr: 'Fesleğen' },
    families: { aromatic: 0.9, green: 0.5 },
    volatility: { peakMinutes: 3, halfLifeMinutes: 25 },
    character: { temperature: -0.2, texture: 0.4, cleanliness: 0.5, proximity: -0.5 },
    description: {
      en: 'Aniseed and cut stems — the herb that always brings a kitchen with it.',
      tr: 'Anason ve kesik sap — yanında hep bir mutfak getiren ot.',
    },
  },
  {
    id: 'rosemary',
    name: { en: 'Rosemary', tr: 'Biberiye' },
    families: { aromatic: 1.0, green: 0.3 },
    volatility: { peakMinutes: 4, halfLifeMinutes: 35 },
    character: { temperature: 0.0, texture: 0.5, cleanliness: 0.6, proximity: -0.4 },
    description: {
      en: 'Dry, resinous and slightly medicinal — a shrub baking in the sun.',
      tr: 'Kuru, reçineli ve hafif tıbbi — güneşte pişen bir çalı.',
    },
  },
  {
    id: 'eucalyptus',
    name: { en: 'Eucalyptus', tr: 'Okaliptüs' },
    families: { aromatic: 1.0, green: 0.4 },
    volatility: { peakMinutes: 2, halfLifeMinutes: 25 },
    character: { temperature: -0.6, texture: 0.7, cleanliness: 0.8, proximity: -0.7 },
    description: {
      en: 'Cold and medicinal — the smell of breathing more easily, closer to menthol than to a leaf.',
      tr: 'Soğuk ve tıbbi — daha rahat nefes almanın kokusu; yapraktan çok mentole yakın.',
    },
  },
  {
    id: 'juniper',
    name: { en: 'Juniper', tr: 'Ardıç' },
    families: { aromatic: 0.8, green: 0.4, resinous: 0.2 },
    volatility: { peakMinutes: 4, halfLifeMinutes: 40 },
    character: { temperature: -0.3, texture: 0.6, cleanliness: 0.5, proximity: -0.4 },
    description: {
      en: 'Cold resin and a pine cone in your palm — what gin smells like before it is gin.',
      tr: 'Soğuk reçine ve avucundaki bir kozalak — cin daha cin olmadan önceki kokusu.',
    },
  },
  {
    id: 'spruce',
    name: { en: 'Spruce', tr: 'Ladin' },
    families: { aromatic: 0.6, green: 0.5, resinous: 0.4, woody: 0.3 },
    volatility: { peakMinutes: 5, halfLifeMinutes: 45 },
    character: { temperature: -0.4, texture: 0.6, cleanliness: 0.5, proximity: -0.5 },
    description: {
      en: 'Resin still wet on the bark. Colder and sharper than pine, without any of its dust.',
      tr: 'Kabuğunda henüz kurumamış reçine. Çamdan daha soğuk ve daha keskin, onun tozu hiç yok.',
    },
  },
  {
    id: 'clary-sage',
    name: { en: 'Clary Sage', tr: 'Misk adaçayı' },
    families: { aromatic: 0.9, green: 0.3, animalic: 0.2 },
    volatility: { peakMinutes: 5, halfLifeMinutes: 50 },
    character: { temperature: 0.1, texture: 0.3, cleanliness: 0.2, proximity: -0.2 },
    description: {
      en: 'Herbal and faintly human — a sage that smells like warm skin under a shirt.',
      tr: 'Otsu ve hafifçe insansı — gömlek altındaki sıcak teni andıran bir adaçayı.',
    },
  },
  {
    id: 'galbanum',
    name: { en: 'Galbanum', tr: 'Galbanum' },
    families: { green: 1.0, aromatic: 0.3, mossy: 0.2 },
    volatility: { peakMinutes: 4, halfLifeMinutes: 45 },
    character: { temperature: -0.8, texture: 0.8, cleanliness: 0.2, proximity: -0.3 },
    description: {
      en: 'The coldest green there is: crushed stems, bitter sap, almost hostile at first.',
      tr: 'Var olan en soğuk yeşil: ezilmiş sap, acı özsu, ilk anda neredeyse düşmanca.',
    },
  },
  {
    id: 'fig-leaf',
    name: { en: 'Fig Leaf', tr: 'İncir yaprağı' },
    families: { green: 1.0, aromatic: 0.3, mineral: 0.2 },
    volatility: { peakMinutes: 4, halfLifeMinutes: 50 },
    character: { temperature: -0.6, texture: 0.5, cleanliness: 0.3, proximity: -0.4 },
    description: {
      en: 'Bitter, milky sap and rough leaf — the shade of the tree rather than its fruit.',
      tr: 'Acı, sütsü özsu ve pürüzlü yaprak — ağacın meyvesi değil, gölgesi.',
    },
  },
  {
    id: 'violet-leaf',
    name: { en: 'Violet Leaf', tr: 'Menekşe yaprağı' },
    families: { green: 1.0, floral: 0.3, mineral: 0.2 },
    volatility: { peakMinutes: 5, halfLifeMinutes: 55 },
    character: { temperature: -0.7, texture: 0.4, cleanliness: 0.4, proximity: -0.3 },
    description: {
      en: 'Cucumber skin and wet metal — green without any sweetness at all.',
      tr: 'Salatalık kabuğu ve ıslak metal — hiç tatlısı olmayan bir yeşil.',
    },
  },
  {
    id: 'tomato-leaf',
    name: { en: 'Tomato Leaf', tr: 'Domates yaprağı' },
    families: { green: 1.0, aromatic: 0.3 },
    volatility: { peakMinutes: 4, halfLifeMinutes: 45 },
    character: { temperature: -0.4, texture: 0.6, cleanliness: 0.1, proximity: -0.4 },
    description: {
      en: 'Bitter, hairy stems in the sun — the greenest thing in the palette, and the least polite.',
      tr: 'Güneşte acı, tüylü saplar — paletteki en yeşil ve en kaba şey.',
    },
  },
  {
    id: 'mastic',
    name: { en: 'Mastic', tr: 'Sakız reçinesi' },
    families: { resinous: 0.6, green: 0.5, aromatic: 0.4 },
    volatility: { peakMinutes: 6, halfLifeMinutes: 70 },
    character: { temperature: 0.0, texture: 0.5, cleanliness: 0.4, proximity: -0.2 },
    description: {
      en: 'Pine resin chewed until it turns sweet — the Aegean shrub that behaves like gum.',
      tr: 'Tatlanana kadar çiğnenmiş çam reçinesi — sakız gibi davranan Ege çalısı.',
    },
  },
  {
    id: 'saffron',
    name: { en: 'Saffron', tr: 'Safran' },
    families: { spicy: 0.9, leather: 0.3, resinous: 0.2 },
    volatility: { peakMinutes: 8, halfLifeMinutes: 90 },
    character: { temperature: 0.5, texture: 0.5, cleanliness: 0.0, proximity: -0.1 },
    description: {
      en: 'Dry, faintly medicinal and metallic. Almost always found guarding a rose.',
      tr: 'Kuru, hafif tıbbi ve metalik. Neredeyse her zaman bir gülün başında nöbette.',
    },
  },
  {
    id: 'apple',
    name: { en: 'Apple', tr: 'Elma' },
    families: { fruity: 1.0, green: 0.3 },
    volatility: { peakMinutes: 3, halfLifeMinutes: 28 },
    character: { temperature: -0.1, texture: 0.1, cleanliness: 0.5, proximity: -0.5 },
    description: {
      en: 'The crunch more than the fruit: cold, watery, faintly sour.',
      tr: 'Meyveden çok çıtırtısı: soğuk, sulu, hafif ekşi.',
    },
  },
  {
    id: 'pear',
    name: { en: 'Pear', tr: 'Armut' },
    families: { fruity: 1.0 },
    volatility: { peakMinutes: 3, halfLifeMinutes: 28 },
    character: { temperature: 0.0, texture: -0.3, cleanliness: 0.5, proximity: -0.5 },
    description: {
      en: 'Soft and slightly waxy — the fruit that never smells sharp.',
      tr: 'Yumuşak ve hafif mumsu — asla keskin kokmayan meyve.',
    },
  },
  {
    id: 'blackcurrant',
    name: { en: 'Blackcurrant', tr: 'Frenk üzümü' },
    families: { fruity: 1.0, green: 0.4 },
    volatility: { peakMinutes: 3, halfLifeMinutes: 30 },
    character: { temperature: -0.1, texture: 0.5, cleanliness: -0.1, proximity: -0.5 },
    description: {
      en: 'Sweet and feral at once — the fruit note that smells faintly of cat.',
      tr: 'Aynı anda tatlı ve vahşi — hafifçe kedi kokan meyve notası.',
    },
  },
  {
    id: 'lychee',
    name: { en: 'Lychee', tr: 'Liçi' },
    families: { fruity: 1.0, floral: 0.3 },
    volatility: { peakMinutes: 3, halfLifeMinutes: 30 },
    character: { temperature: 0.2, texture: -0.3, cleanliness: 0.4, proximity: -0.5 },
    description: {
      en: 'A rose dissolved in sugar water — fruit that keeps drifting back toward flower.',
      tr: 'Şekerli suda çözülmüş bir gül — sürekli çiçeğe geri kayan bir meyve.',
    },
  },
  {
    id: 'raspberry',
    name: { en: 'Raspberry', tr: 'Ahududu' },
    families: { fruity: 1.0, gourmand: 0.2 },
    volatility: { peakMinutes: 4, halfLifeMinutes: 35 },
    character: { temperature: 0.3, texture: -0.1, cleanliness: 0.3, proximity: -0.4 },
    description: {
      en: 'Jam with a violet shadow — sweet, but never simply sweet.',
      tr: 'Menekşe gölgesi olan reçel — tatlı, ama asla yalnızca tatlı değil.',
    },
  },
  {
    id: 'pineapple',
    name: { en: 'Pineapple', tr: 'Ananas' },
    families: { fruity: 1.0, gourmand: 0.2 },
    volatility: { peakMinutes: 4, halfLifeMinutes: 35 },
    character: { temperature: 0.4, texture: 0.3, cleanliness: 0.1, proximity: -0.5 },
    description: {
      en: 'Sharp, boozy, and slightly rotten at the edge — the most tropical thing there is.',
      tr: 'Keskin, alkollü ve kenarı hafif çürük — var olan en tropik şey.',
    },
  },
  {
    id: 'passionfruit',
    name: { en: 'Passionfruit', tr: 'Çarkıfelek meyvesi' },
    families: { fruity: 1.0, green: 0.2 },
    volatility: { peakMinutes: 5, halfLifeMinutes: 40 },
    character: { temperature: 0.3, texture: 0.5, cleanliness: -0.2, proximity: -0.5 },
    description: {
      en: 'Tropical and slightly sulphurous — sweetness with something faintly rotten under it.',
      tr: 'Tropikal ve hafif kükürtlü — altında hafif çürümüş bir şey taşıyan tatlılık.',
    },
  },
  {
    id: 'davana',
    name: { en: 'Davana', tr: 'Davana' },
    families: { fruity: 0.7, aromatic: 0.4, gourmand: 0.3 },
    volatility: { peakMinutes: 6, halfLifeMinutes: 70 },
    character: { temperature: 0.4, texture: 0.2, cleanliness: -0.1, proximity: -0.2 },
    description: {
      en: 'Apricot, rum and metal — the material that smells different on every person.',
      tr: 'Kayısı, rom ve metal — her insanda başka kokan malzeme.',
    },
  },
  {
    id: 'ozone',
    name: { en: 'Ozone', tr: 'Ozon' },
    families: { mineral: 0.8, aldehydic: 0.4 },
    volatility: { peakMinutes: 3, halfLifeMinutes: 60 },
    character: { temperature: -0.6, texture: 0.0, cleanliness: 0.9, proximity: -0.8 },
    description: {
      en: 'The smell of air after lightning — nothing organic in it at all.',
      tr: 'Şimşekten sonraki havanın kokusu — içinde organik hiçbir şey yok.',
    },
  },
  {
    id: 'marine',
    name: { en: 'Marine Accord', tr: 'Deniz akoru' },
    families: { mineral: 0.9, aldehydic: 0.2, fruity: 0.2 },
    volatility: { peakMinutes: 5, halfLifeMinutes: 90 },
    character: { temperature: -0.5, texture: 0.1, cleanliness: 0.7, proximity: -0.6 },
    description: {
      en: 'Watermelon rind and swimming pools — the note that invented the nineties.',
      tr: 'Karpuz kabuğu ve yüzme havuzu — doksanları icat eden nota.',
    },
  },
  {
    id: 'rhubarb',
    name: { en: 'Rhubarb', tr: 'Ravent' },
    families: { fruity: 0.7, green: 0.6 },
    volatility: { peakMinutes: 3, halfLifeMinutes: 25 },
    character: { temperature: -0.5, texture: 0.4, cleanliness: 0.3, proximity: -0.5 },
    description: {
      en: 'A sour green stalk — acidity without fruit, and sharper than any citrus.',
      tr: 'Ekşi yeşil bir sap — meyvesiz bir asitlik, her narenciyeden keskin.',
    },
  },
  {
    id: 'hyacinth',
    name: { en: 'Hyacinth', tr: 'Sümbül' },
    families: { floral: 0.9, green: 0.6 },
    volatility: { peakMinutes: 7, halfLifeMinutes: 45 },
    character: { temperature: -0.4, texture: 0.2, cleanliness: 0.4, proximity: -0.4 },
    description: {
      en: 'A flower that smells like its own stem — cold, green, and slightly bruised.',
      tr: 'Kendi sapı gibi kokan bir çiçek — soğuk, yeşil ve hafifçe ezilmiş.',
    },
  },
  {
    // `carrot` (havuç tohumu) ayrı bir malzeme: kuru, irismsi, pudralı.
    // Bu, kökün kendisi — çiğ, tatlı, topraklı. Rabbit'in açılışı bu.
    id: 'carrot-root',
    name: { en: 'Fresh Carrot', tr: 'Taze havuç' },
    families: { green: 0.5, gourmand: 0.4, woody: 0.2 },
    volatility: { peakMinutes: 10, halfLifeMinutes: 90 },
    character: { temperature: 0.1, texture: 0.3, cleanliness: -0.2, proximity: 0.2 },
    description: {
      en: 'Sweet earth and raw root — the closest thing to iris that grows in a garden.',
      tr: 'Tatlı toprak ve çiğ kök — bahçede yetişen, irise en yakın şey.',
    },
  },
  {
    // Meyveli ama sulu — bu yüzden `mineral` de var. Diğer meyvelerin aksine
    // kavun serinletiyor, ağırlaştırmıyor; karakteri soğuk tarafta.
    id: 'melon',
    name: { en: 'Melon', tr: 'Kavun' },
    families: { fruity: 0.9, green: 0.3, mineral: 0.2 },
    volatility: { peakMinutes: 5, halfLifeMinutes: 55 },
    character: { temperature: -0.4, texture: -0.3, cleanliness: 0.5, proximity: -0.4 },
    description: {
      en: 'A cool, watery sweetness that disappears if you look straight at it.',
      tr: 'Doğrudan bakınca kaybolan serin, sulu bir tatlılık.',
    },
  },
] as const;
