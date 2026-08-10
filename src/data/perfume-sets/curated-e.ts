import type { Perfume } from '../types';

/**
 * Küratörlü seçki — beşinci ve son grup.
 *
 * Bunlar listenin en uzun süre teyitsiz kalan altısı. Diğer gruplarda önce ben
 * taslak yazdım, küratör düzeltti; burada sıra tersine döndü — küratör her
 * kokuyu bir iki cümleyle tarif etti, notalar o tarife göre kuruldu. Şimdiye
 * kadarki en isabetli veri bu yoldan geldi (bkz. Miami Tropical Confessions),
 * o yüzden tarifler yorum satırlarında birebir duruyor.
 *
 * İkisi bilinçli olarak birbirinin ikizi: Yaringa ile Good Morning aynı tarifi
 * paylaşıyor, tek bir malzeme dışında. Motorun onları hem yakın tutması hem de
 * ayırt etmesi gerekiyor — nota kanalının en dar sınavı.
 */
export const CURATED_E: readonly Perfume[] = [
  {
    // Küratör: "ağırlıklı olarak narenciye, zencefil, tabii ki çiçeksi ama
    // daha az, vanilyalı ve tatlı ve pudramsı."
    id: 'argos-pour-femme',
    name: 'Pour Femme',
    brand: 'Argos',
    year: 2017,
    perfumer: 'Christian Petrovich',
    curated: true,
    line: {
      en: 'Citrus with ginger under it, and powder settling over both.',
      tr: 'Altında zencefil olan bir narenciye, üstüne çöken pudra.',
    },
    notes: [
      { noteId: 'bergamot', tier: 'top', weight: 0.9 },
      { noteId: 'ginger', tier: 'top', weight: 0.8 },
      { noteId: 'mandarin', tier: 'top', weight: 0.6 },
      { noteId: 'lemon', tier: 'top', weight: 0.4 },
      { noteId: 'pink-pepper', tier: 'top', weight: 0.3 },
      { noteId: 'iris', tier: 'heart', weight: 0.5 },
      { noteId: 'rose', tier: 'heart', weight: 0.4 },
      { noteId: 'violet', tier: 'heart', weight: 0.3 },
      { noteId: 'orange-blossom', tier: 'heart', weight: 0.3 },
      { noteId: 'vanilla', tier: 'base', weight: 0.5 },
      { noteId: 'white-musk', tier: 'base', weight: 0.5 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.4 },
      { noteId: 'tonka', tier: 'base', weight: 0.3 },
    ],
  },
  {
    // Küratör: "Madagaskar vanilyası, sonradan yoğunlaşan; açılışından sonuna
    // kadar detaylı meyveli, özellikle kavun, şeftali ve liçi yoğunluklu."
    //
    // "Sonradan yoğunlaşan" için ayrıca bir şey yapmaya gerek yok: vanilya zaten
    // dip nota, uçuculuk modeli onu geç tepe yaptırıyor. Meyveler üstte, vanilya
    // altta — evrim çizelgesi bu geçişi kendiliğinden çiziyor.
    id: 'royal-crown-nocturna',
    name: 'Nocturna',
    brand: 'Royal Crown',
    year: 2022,
    perfumer: 'Antonio Martino Visconti',
    curated: true,
    line: {
      en: 'Fruit all the way through, and the vanilla only arrives at the end.',
      tr: 'Baştan sona meyve, vanilya ancak sonunda geliyor.',
    },
    notes: [
      { noteId: 'melon', tier: 'top', weight: 0.9 },
      { noteId: 'peach', tier: 'top', weight: 0.8 },
      { noteId: 'lychee', tier: 'top', weight: 0.7 },
      { noteId: 'mandarin', tier: 'top', weight: 0.3 },
      { noteId: 'jasmine', tier: 'heart', weight: 0.3 },
      { noteId: 'ylang-ylang', tier: 'heart', weight: 0.3 },
      { noteId: 'vanilla', tier: 'base', weight: 1.0 },
      { noteId: 'white-musk', tier: 'base', weight: 0.5 },
      { noteId: 'tonka', tier: 'base', weight: 0.4 },
      { noteId: 'benzoin', tier: 'base', weight: 0.3 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.3 },
    ],
  },
  {
    // Küratör: "çeşitli güller + oud yoğunluklu, alttan çiçeklerle."
    //
    // "Çeşitli güller" iki ayrı nota olarak yazıldı — `rose` ve `turkish-rose`.
    // Nota kanalında bu, tek bir gülün ağırlığını artırmaktan farklı bir şey:
    // parfüm hem genel gül kullanan hem Türk gülü kullanan komşulara bağlanıyor.
    id: 'memo-argentina',
    name: 'Argentina',
    brand: 'Memo Paris',
    year: 2021,
    perfumer: 'Aliénor Massenet',
    curated: true,
    line: {
      en: 'More than one rose, and a wood standing behind all of them.',
      tr: 'Birden fazla gül, hepsinin arkasında duran bir odun.',
    },
    notes: [
      { noteId: 'saffron', tier: 'top', weight: 0.4 },
      { noteId: 'bergamot', tier: 'top', weight: 0.3 },
      { noteId: 'pink-pepper', tier: 'top', weight: 0.3 },
      { noteId: 'rose', tier: 'heart', weight: 1.0 },
      { noteId: 'turkish-rose', tier: 'heart', weight: 0.7 },
      { noteId: 'geranium', tier: 'heart', weight: 0.4 },
      { noteId: 'jasmine', tier: 'heart', weight: 0.4 },
      { noteId: 'ylang-ylang', tier: 'heart', weight: 0.3 },
      { noteId: 'oud', tier: 'base', weight: 0.9 },
      { noteId: 'patchouli', tier: 'base', weight: 0.4 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.4 },
      { noteId: 'amber-accord', tier: 'base', weight: 0.4 },
      { noteId: 'white-musk', tier: 'base', weight: 0.3 },
    ],
  },
  {
    // Küratör: "incir kokularının baş tacı, mükemmel bir incir kokusu, tonka ile
    // beraber."
    //
    // Philosykos'un nihayet gerçek bir komşusu var. İkisi de incir ama aynı
    // olmamalı: Philosykos yaprak ve süt tarafında, bu tonka ile tatlı tarafta.
    id: 'floraiku-ao',
    name: 'AO',
    brand: 'Floraïku',
    year: 2019,
    perfumer: 'Christian Provenzano',
    curated: true,
    line: {
      en: 'The fig, and something sweet resting underneath it.',
      tr: 'Incir, ve altında dinlenen tatlı bir şey.',
    },
    notes: [
      { noteId: 'fig-leaf', tier: 'top', weight: 0.7 },
      { noteId: 'bergamot', tier: 'top', weight: 0.3 },
      { noteId: 'fig', tier: 'heart', weight: 1.0 },
      { noteId: 'milk', tier: 'heart', weight: 0.3 },
      { noteId: 'tonka', tier: 'base', weight: 0.8 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.5 },
      { noteId: 'white-musk', tier: 'base', weight: 0.4 },
      { noteId: 'cedar', tier: 'base', weight: 0.3 },
    ],
  },
  {
    // Küratör: "denizimsi, tuzumsu, temiz — Megamare benzeri diyebilirim ama tek
    // farkla: hindistan cevizi farkını yaratıyor. Yaz ayları için birebir."
    //
    // Denetim noktası: Megamare'e yakın çıkmalı ama üstüne binmemeli. Farkı
    // yaratan tek malzeme nota kanalında görünür olmalı.
    id: 'parfums-delmar-yaringa',
    name: 'Yaringa',
    brand: "Parfums d'Elmar",
    year: 2022,
    perfumer: 'Christian Carbonnel',
    curated: true,
    line: {
      en: 'Salt water, and a coconut left on the sand.',
      tr: 'Tuzlu su, ve kumda unutulmuş bir hindistan cevizi.',
    },
    notes: [
      { noteId: 'sea-salt', tier: 'top', weight: 0.9 },
      { noteId: 'marine', tier: 'top', weight: 0.7 },
      { noteId: 'ozone', tier: 'top', weight: 0.5 },
      { noteId: 'bergamot', tier: 'top', weight: 0.3 },
      { noteId: 'coconut', tier: 'heart', weight: 0.8 },
      { noteId: 'seaweed', tier: 'heart', weight: 0.3 },
      { noteId: 'ambroxan', tier: 'base', weight: 0.6 },
      { noteId: 'white-musk', tier: 'base', weight: 0.6 },
      { noteId: 'ambergris', tier: 'base', weight: 0.4 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.3 },
    ],
  },
  {
    // Küratör: "bu da aynı şekil, tek fark hindistan cevizi yerine mandarin.
    // Tuz yoğunluklu, temiz, yaz ayları için güzel, ferah hissettiriyor."
    //
    // Yaringa'nın ikizi. İkisi haritada yan yana durmalı ama tek nokta olmamalı;
    // aralarındaki mesafe nota kanalının çözünürlüğünü ölçüyor.
    id: 'jusbox-good-morning',
    name: 'Good Morning',
    brand: 'Jusbox',
    year: 2017,
    perfumer: 'Dominique Ropion',
    curated: true,
    line: {
      en: 'Salt and mandarin — the first hour of a summer day.',
      tr: 'Tuz ve mandalina — bir yaz gününün ilk saati.',
    },
    notes: [
      { noteId: 'mandarin', tier: 'top', weight: 0.9 },
      { noteId: 'sea-salt', tier: 'top', weight: 0.8 },
      { noteId: 'marine', tier: 'top', weight: 0.5 },
      { noteId: 'ozone', tier: 'top', weight: 0.5 },
      { noteId: 'lemon', tier: 'top', weight: 0.4 },
      { noteId: 'neroli', tier: 'heart', weight: 0.4 },
      { noteId: 'orange-blossom', tier: 'heart', weight: 0.3 },
      { noteId: 'white-musk', tier: 'base', weight: 0.7 },
      { noteId: 'ambroxan', tier: 'base', weight: 0.5 },
      { noteId: 'ambrette', tier: 'base', weight: 0.3 },
      { noteId: 'cedar', tier: 'base', weight: 0.3 },
    ],
  },
] as const;
