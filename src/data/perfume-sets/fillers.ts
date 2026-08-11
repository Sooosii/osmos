import type { Perfume } from '../types';

/**
 * Boşluk doldurucular — uzayın soğuk / yosunlu / kirli ucu.
 *
 * Küratör listesi sıcak-tatlı-reçineli tarafta güçlü, karşı uçta boştu. Bu
 * parfümler o boşlukları kapatmak için seçildi; "gizli mücevher" ölçütünü
 * bozmuyorlar ama görevleri haritanın tek kütleye çökmesini engellemek.
 *
 * Hepsi `curated: true` — alan, uzaya yalnızca yoğunluk katan katalog
 * noktalarını ayırmak için var; onlar sonraki aşamalarda gelecek.
 *
 * Not a Perfume burada özel bir iş görüyor: tek moleküllü, tek notalı. Benzerlik
 * motoru doğru çalışıyorsa uzayda hiçbir kümeye tutunmadan yalnız durmalı.
 */
export const FILLERS: readonly Perfume[] = [
  {
    id: 'parfum-dempire-azemour-les-orangers',
    name: 'Azemour les Orangers',
    brand: "Parfum d'Empire",
    year: 2016,
    perfumer: 'Marc-Antoine Corticchiato',
    curated: true,
    line: {
      en: 'An orange grove, not the fruit: peel, leaf, and the damp ground beneath.',
      tr: 'Portakal bahçesi, meyvesi değil: kabuk, yaprak ve altındaki nemli toprak.',
    },
    notes: [
      { noteId: 'bitter-orange', tier: 'top', weight: 1.0 },
      { noteId: 'grapefruit', tier: 'top', weight: 0.6 },
      { noteId: 'petitgrain', tier: 'top', weight: 0.5 },
      { noteId: 'blackcurrant', tier: 'top', weight: 0.4 },
      { noteId: 'cypress', tier: 'heart', weight: 0.6 },
      { noteId: 'hay', tier: 'heart', weight: 0.4 },
      { noteId: 'cumin', tier: 'heart', weight: 0.3 },
      { noteId: 'oakmoss', tier: 'base', weight: 0.8 },
      { noteId: 'patchouli', tier: 'base', weight: 0.5 },
      { noteId: 'cistus', tier: 'base', weight: 0.4 },
    ],
    retailers: [
      { name: 'Luckyscent', url: 'https://www.luckyscent.com/products/azemour-les-orangers-by-parfum-dempire' },
    ],
  },
  {
    id: 'bogue-maai',
    name: 'MAAI',
    brand: 'Bogue',
    year: 2015,
    perfumer: 'Antonio Gardoni',
    curated: true,
    line: {
      en: 'Something unwashed under a starched shirt.',
      tr: 'Kolalı bir gömleğin altında hiç yıkanmamış bir şey.',
    },
    notes: [
      { noteId: 'aldehydes', tier: 'top', weight: 1.0 },
      { noteId: 'bergamot', tier: 'top', weight: 0.4 },
      { noteId: 'tuberose', tier: 'heart', weight: 0.7 },
      { noteId: 'jasmine', tier: 'heart', weight: 0.6 },
      { noteId: 'iris', tier: 'heart', weight: 0.5 },
      { noteId: 'hay', tier: 'heart', weight: 0.4 },
      { noteId: 'civet', tier: 'base', weight: 0.8 },
      { noteId: 'oakmoss', tier: 'base', weight: 0.8 },
      { noteId: 'castoreum', tier: 'base', weight: 0.7 },
      { noteId: 'vetiver', tier: 'base', weight: 0.5 },
      { noteId: 'patchouli', tier: 'base', weight: 0.5 },
    ],
  },
  {
    // Uzayın kontrol noktası: tek nota. Hiçbir kümeye yakın düşmemeli.
    id: 'juliette-has-a-gun-not-a-perfume',
    name: 'Not a Perfume',
    brand: 'Juliette Has a Gun',
    year: 2010,
    perfumer: 'Romano Ricci',
    curated: true,
    line: {
      en: 'A single molecule. Not the smell itself, but what skin answers back.',
      tr: 'Tek bir molekül. Kokunun kendisi değil, tenin ona verdiği cevap.',
    },
    notes: [{ noteId: 'ambroxan', tier: 'base', weight: 1.0 }],
    retailers: [
      {
        name: 'Luckyscent',
        url: 'https://www.luckyscent.com/products/not-a-perfume-by-juliette-has-a-gun',
      },
    ],
  },
  {
    id: 'papillon-dryad',
    name: 'Dryad',
    brand: 'Papillon',
    year: 2017,
    perfumer: 'Liz Moores',
    curated: true,
    line: {
      en: 'A woman turned into a tree — green, bitter, no longer moving.',
      tr: 'Ağaca dönüşmüş bir kadın — yeşil, acı, kıpırdamayan.',
    },
    notes: [
      { noteId: 'galbanum', tier: 'top', weight: 0.9 },
      { noteId: 'coriander', tier: 'top', weight: 0.4 },
      { noteId: 'pink-pepper', tier: 'top', weight: 0.3 },
      { noteId: 'narcissus', tier: 'heart', weight: 0.8 },
      { noteId: 'clary-sage', tier: 'heart', weight: 0.5 },
      { noteId: 'jasmine', tier: 'heart', weight: 0.5 },
      { noteId: 'iris', tier: 'heart', weight: 0.5 },
      { noteId: 'tuberose', tier: 'heart', weight: 0.3 },
      { noteId: 'oakmoss', tier: 'base', weight: 0.9 },
      { noteId: 'vetiver', tier: 'base', weight: 0.6 },
      { noteId: 'styrax', tier: 'base', weight: 0.4 },
      { noteId: 'patchouli', tier: 'base', weight: 0.4 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.4 },
    ],
    retailers: [
      { name: 'Luckyscent', url: 'https://www.luckyscent.com/products/dryad-by-papillon-artisan-perfumes' },
    ],
  },
  {
    id: 'serge-lutens-muscs-koublai-khan',
    name: 'Muscs Koublaï Khân',
    brand: 'Serge Lutens',
    year: 1998,
    perfumer: 'Christopher Sheldrake',
    curated: true,
    line: {
      en: 'Where an animal passed. The perfume ends here and the skin begins.',
      tr: 'Bir hayvanın geçtiği yer. Parfüm burada bitiyor, ten başlıyor.',
    },
    notes: [
      { noteId: 'cumin', tier: 'top', weight: 0.7 },
      { noteId: 'rose', tier: 'heart', weight: 0.5 },
      { noteId: 'hyraceum', tier: 'base', weight: 1.0 },
      { noteId: 'civet', tier: 'base', weight: 0.8 },
      { noteId: 'castoreum', tier: 'base', weight: 0.6 },
      { noteId: 'white-musk', tier: 'base', weight: 0.6 },
      { noteId: 'ambergris', tier: 'base', weight: 0.5 },
      { noteId: 'labdanum', tier: 'base', weight: 0.4 },
      { noteId: 'vanilla', tier: 'base', weight: 0.3 },
    ],
  },
  {
    // Kirli ucun eksik üçüncüsü. MAAI ile Muscs Koublaï Khân arasında bir yere
    // düşmesi bekleniyor: MAAI kadar aldehitli-parlak değil, MKK kadar da
    // çıplak ten değil — arada, çiçekli ve yosunlu.
    id: 'papillon-salome',
    name: 'Salome',
    brand: 'Papillon',
    year: 2014,
    perfumer: 'Liz Moores',
    curated: true,
    line: {
      en: 'An unwashed flower — and it is not hiding it.',
      tr: 'Yıkanmamış bir çiçek — ve bunu saklamıyor.',
    },
    notes: [
      { noteId: 'cumin', tier: 'top', weight: 0.7 },
      { noteId: 'bergamot', tier: 'top', weight: 0.4 },
      { noteId: 'jasmine', tier: 'heart', weight: 0.8 },
      { noteId: 'rose', tier: 'heart', weight: 0.5 },
      { noteId: 'clove', tier: 'heart', weight: 0.3 },
      { noteId: 'oakmoss', tier: 'base', weight: 0.8 },
      { noteId: 'castoreum', tier: 'base', weight: 0.6 },
      { noteId: 'hyraceum', tier: 'base', weight: 0.5 },
      { noteId: 'civet', tier: 'base', weight: 0.5 },
      { noteId: 'leather', tier: 'base', weight: 0.4 },
      { noteId: 'vanilla', tier: 'base', weight: 0.3 },
    ],
    retailers: [
      { name: 'Luckyscent', url: 'https://www.luckyscent.com/products/salome-by-papillon-artisan-perfumes' },
    ],
  },
  {
    // Haritanın en dumanlı noktası. Bir uç nokta daha: is ekseninin ucunda
    // kimse yoksa uzayın o tarafı boş kalıyor.
    id: 'naomi-goodsir-bois-dascese',
    name: "Bois d'Ascèse",
    brand: 'Naomi Goodsir',
    year: 2012,
    perfumer: 'Julien Rasquinet',
    curated: true,
    line: {
      en: 'The morning after a fire was put out.',
      tr: 'Söndürülmüş ateşin ertesi sabahı.',
    },
    notes: [
      { noteId: 'whiskey', tier: 'top', weight: 0.6 },
      { noteId: 'bergamot', tier: 'top', weight: 0.3 },
      { noteId: 'cade', tier: 'heart', weight: 0.8 },
      { noteId: 'frankincense', tier: 'heart', weight: 0.6 },
      { noteId: 'birch-tar', tier: 'base', weight: 0.9 },
      { noteId: 'cistus', tier: 'base', weight: 0.6 },
      { noteId: 'guaiac-wood', tier: 'base', weight: 0.5 },
      { noteId: 'labdanum', tier: 'base', weight: 0.4 },
    ],
    retailers: [
      { name: 'Luckyscent', url: 'https://www.luckyscent.com/products/bois-dascese-by-naomi-goodsir' },
    ],
  },
] as const;
