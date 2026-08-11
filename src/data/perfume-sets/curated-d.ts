import type { Perfume } from '../types';

/**
 * Küratörlü seçki — dördüncü grup: haritanın karanlık tarafı.
 *
 * Oud, tütsü, is ve tütün. Üç oud bilerek yan yana: nota kanalının gerçek
 * sınavı bu. Aile ve karakter kanalları için üçü de "sıcak-odunsu-yoğun";
 * onları ayıracak olan hangi malzemelerden yapıldıkları — Aaron Terence
 * Hughes'ta oud gövdenin kendisi, Maracujá'da altta duran bir gölge,
 * Ajyal'da yalnızca bir iz.
 *
 * Küratör düzeltmesi (Ajyal): ilk taslakta oud 0.8'di — yanlış. Ajyal aşırı
 * meyveli, temiz, yazlık bir koku; oud illaki vardır ama gövde değil. 0.2'ye
 * indi, yerini meyve ve beyaz misk aldı. Motorun bunu meyveli tarafa
 * yerleştirmesi gerekiyor, oud kümesine değil.
 */
export const CURATED_D: readonly Perfume[] = [
  {
    // Küratör düzeltmesi: safran ve gül taslaktakinden belirgin daha fazla —
    // ve gül genel gül değil, Türk gülü. Bu ayrım nota kanalında görünüyor:
    // `turkish-rose` ayrı bir kimlik, `rose` kullanan parfümlerle eşleşmiyor.
    id: 'maison-crivelli-oud-maracuja',
    name: 'Oud Maracujá',
    brand: 'Maison Crivelli',
    year: 2021,
    perfumer: 'Jordi Fernández',
    curated: true,
    line: {
      en: 'Passion fruit and a darkened wood beneath it — not the sweet side.',
      tr: 'Çarkıfelek meyvesi ve altında kararmış bir odun — tatlı olan taraf değil.',
    },
    notes: [
      { noteId: 'passionfruit', tier: 'top', weight: 1.0 },
      { noteId: 'saffron', tier: 'top', weight: 0.6 },
      { noteId: 'pear', tier: 'top', weight: 0.4 },
      { noteId: 'pink-pepper', tier: 'top', weight: 0.3 },
      { noteId: 'oud', tier: 'heart', weight: 0.7 },
      { noteId: 'turkish-rose', tier: 'heart', weight: 0.5 },
      { noteId: 'papyrus', tier: 'base', weight: 0.5 },
      { noteId: 'benzoin', tier: 'base', weight: 0.4 },
      { noteId: 'cedar', tier: 'base', weight: 0.4 },
      { noteId: 'white-musk', tier: 'base', weight: 0.3 },
    ],
    retailers: [
      { name: 'Maison Crivelli', url: 'https://maisoncrivelli.us/products/oud-maracuja' },
      { name: 'Luckyscent', url: 'https://www.luckyscent.com/products/oud-maracuja-by-maison-crivelli' },
    ],
  },
  {
    // Referans noktası: listedeki "saf oud" bu. Diğer iki oudun ne kadar
    // saptığı buradan ölçülüyor.
    id: 'aaron-terence-hughes-oud',
    name: 'Oud',
    brand: 'Aaron Terence Hughes',
    year: 2021,
    perfumer: 'Aaron Terence Hughes',
    curated: true,
    line: {
      en: 'The wood itself, with nothing dressed on top of it.',
      tr: 'Odunun kendisi, süslenmemiş hâli.',
    },
    notes: [
      { noteId: 'saffron', tier: 'top', weight: 0.5 },
      { noteId: 'bergamot', tier: 'top', weight: 0.3 },
      { noteId: 'oud', tier: 'heart', weight: 1.0 },
      { noteId: 'rose', tier: 'heart', weight: 0.5 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.5 },
      { noteId: 'patchouli', tier: 'base', weight: 0.4 },
      { noteId: 'amber-accord', tier: 'base', weight: 0.4 },
      { noteId: 'white-musk', tier: 'base', weight: 0.3 },
    ],
  },
  {
    // Küratör tarifi: aşırı meyveli, temiz, yazlık, eşsiz. Adında oud geçiyor
    // ve listenin en kalabalık kompozisyonlarından biri — ama oud gövde değil,
    // iz. Ağırlık meyvede ve beyaz miskte; ağır reçineler bilerek yok, onlar
    // kokuyu "temiz yazlık" olmaktan çıkarırdı.
    // `perfumer` YOK ve bu eksik veri değil: marka burnu bilerek öne çıkarmıyor,
    // anlatısını kavram üzerine kuruyor. Vanille Abricot ile birlikte 52'nin
    // açıklanmamış iki adı; tahminle doldurulmasın. Long Board da parfümörsüz
    // ama başka sebeple — `curated-f.ts`.
    id: 'spirit-of-dubai-ajyal',
    name: 'Ajyal',
    brand: 'Spirit of Dubai',
    year: 2023,
    curated: true,
    line: {
      en: 'So much fruit that the wood underneath forgets to speak.',
      tr: 'O kadar çok meyve ki alttaki odun konuşmayı unutuyor.',
    },
    notes: [
      { noteId: 'apricot', tier: 'top', weight: 1.0 },
      { noteId: 'peach', tier: 'top', weight: 0.6 },
      { noteId: 'plum', tier: 'top', weight: 0.5 },
      { noteId: 'mandarin', tier: 'top', weight: 0.4 },
      { noteId: 'saffron', tier: 'top', weight: 0.3 },
      { noteId: 'rose', tier: 'heart', weight: 0.5 },
      { noteId: 'osmanthus', tier: 'heart', weight: 0.4 },
      { noteId: 'jasmine', tier: 'heart', weight: 0.3 },
      { noteId: 'orange-blossom', tier: 'heart', weight: 0.3 },
      { noteId: 'white-musk', tier: 'base', weight: 0.7 },
      { noteId: 'ambrette', tier: 'base', weight: 0.4 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.4 },
      { noteId: 'amber-accord', tier: 'base', weight: 0.3 },
      { noteId: 'oud', tier: 'base', weight: 0.2 },
    ],
    retailers: [
      { name: 'The Spirit of Dubai', url: 'https://www.thespiritofdubai.com/dubaiajyal50ml' },
    ],
  },
  {
    id: 'jovoy-les-jeux-sont-faits',
    name: 'Les Jeux sont Faits',
    brand: 'Jovoy',
    year: 2012,
    perfumer: 'Amélie Bourgeois',
    curated: true,
    line: {
      en: 'A cigar left on the table, an unfinished glass beside it.',
      tr: 'Masaya bırakılmış puro, yanında bitmemiş bir kadeh.',
    },
    notes: [
      { noteId: 'bergamot', tier: 'top', weight: 0.4 },
      { noteId: 'cardamom', tier: 'top', weight: 0.4 },
      { noteId: 'rum', tier: 'top', weight: 0.4 },
      { noteId: 'tobacco', tier: 'heart', weight: 0.8 },
      { noteId: 'leather', tier: 'heart', weight: 0.6 },
      { noteId: 'honey', tier: 'heart', weight: 0.3 },
      { noteId: 'oud', tier: 'base', weight: 0.5 },
      { noteId: 'patchouli', tier: 'base', weight: 0.5 },
      { noteId: 'tonka', tier: 'base', weight: 0.5 },
      { noteId: 'vanilla', tier: 'base', weight: 0.4 },
      { noteId: 'labdanum', tier: 'base', weight: 0.4 },
    ],
  },
  {
    // Lavs'ın eksik komşusu. Lavs tütsünün soğuk-taş hâli, bu ısıtılmış hâli;
    // ikisi haritada yakın ama üst üste olmamalı.
    id: 'jo-malone-myrrh-tonka',
    name: 'Myrrh & Tonka',
    brand: 'Jo Malone',
    year: 2016,
    perfumer: 'Mathilde Bijaoui',
    curated: true,
    line: {
      en: 'Incense softened — not the church, the memory of one.',
      tr: 'Tütsünün yumuşatılmış hâli — kilise değil, kilisenin hatırası.',
    },
    notes: [
      { noteId: 'lavender', tier: 'top', weight: 0.4 },
      { noteId: 'bergamot', tier: 'top', weight: 0.3 },
      { noteId: 'myrrh', tier: 'heart', weight: 0.9 },
      { noteId: 'almond', tier: 'heart', weight: 0.4 },
      { noteId: 'tonka', tier: 'base', weight: 0.9 },
      { noteId: 'vanilla', tier: 'base', weight: 0.6 },
      { noteId: 'benzoin', tier: 'base', weight: 0.4 },
      { noteId: 'white-musk', tier: 'base', weight: 0.4 },
    ],
  },
  {
    id: 'atelier-des-ors-lune-feline',
    name: 'Lune Féline',
    brand: 'Atelier des Ors',
    year: 2015,
    perfumer: 'Marie Salamagne',
    curated: true,
    line: {
      en: 'An animal approaching in the dark, and it is not frightening.',
      tr: 'Karanlıkta yaklaşan bir hayvan, ama korkutmuyor.',
    },
    notes: [
      { noteId: 'cardamom', tier: 'top', weight: 0.5 },
      { noteId: 'pink-pepper', tier: 'top', weight: 0.4 },
      { noteId: 'bergamot', tier: 'top', weight: 0.3 },
      { noteId: 'frankincense', tier: 'heart', weight: 0.5 },
      { noteId: 'leather', tier: 'heart', weight: 0.5 },
      { noteId: 'osmanthus', tier: 'heart', weight: 0.4 },
      { noteId: 'tonka', tier: 'base', weight: 0.7 },
      { noteId: 'white-musk', tier: 'base', weight: 0.6 },
      { noteId: 'benzoin', tier: 'base', weight: 0.5 },
      { noteId: 'cedar', tier: 'base', weight: 0.4 },
      { noteId: 'ambrette', tier: 'base', weight: 0.3 },
    ],
    retailers: [
      { name: 'Luckyscent', url: 'https://www.luckyscent.com/products/lune-feline-by-atelier-des-ors' },
    ],
  },
] as const;
