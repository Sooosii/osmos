import type { Perfume } from '../types';

/**
 * Küratörlü seçki — birinci grup.
 *
 * Bu gruptaki parfümler benzerlik motorunun kontrol noktaları. Üç marka çift
 * veriyor (Nasomatto, Zoologist, Orto Parisi); harita onları birbirine yakın
 * çıkarmazsa aile ağırlıklarında ya da izdüşümde hata var demektir. Argos çifti
 * dördüncü kontrol noktasıydı — Pour Femme'in karakteri teyit edilemediği için
 * ikisi de teyitsizler grubuna alındı, o test oraya kaydı.
 *
 * Oud Ispahan ve Philosykos evrim modelini sınamak için zıt seçilmişti:
 * dip-ağır 15 saat ↔ üst-ağır dağılan.
 *
 * `line` küratör cümlesi — özgün metin. Marka tanıtımından hiçbir şey
 * kopyalanmıyor. Nota listeleri olgusal veri; `weight` bizim kompozisyon okumamız.
 */
export const CURATED_A: readonly Perfume[] = [
  {
    id: 'dior-oud-ispahan',
    name: 'Oud Ispahan',
    brand: 'Dior',
    year: 2012,
    perfumer: 'François Demachy',
    curated: true,
    /*
      ⚠️ **Buradaki tek satıcı bağlantısı KALDIRILDI ve arama bağlantısı bir
      daha konmayacak — ölçüldü.** (2026-08-11)

      Satır "nerede bulunur" örneği olsun diye düz bir Amazon aramasına
      bağlanıyordu. Gerçek tarayıcıda üç parfümle denendi ve sonuç şu:

        Dior Oud Ispahan → Versace Pour Homme Oud Noir, Lattafa (klonlar)
        Orto Parisi Megamare → RASASI Shuhrah, Jo Milano (alakasız)
        Bogue Maai → hiç sonuç yok

      Yani bağlantı işe yaramaz değil, **yanıltıcıydı**: küratörlü bir
      parfümü arayan ziyaretçiyi klonuna gönderiyordu. Sitenin bütün değeri
      dürüst seçki olduğu için bu, sayfadaki en pahalı hataydı.

      Satırın kendisi ve altyapısı duruyor (`Retailer` tipi, sınamalar,
      i18n metinleri, komisyon dipnotu): `retailers` boşken satır zaten
      çizilmiyor. Affiliate hesapları açıldığında satıcının kendi paneli
      **ürün sayfasına** derin bağlantı üretecek ve 52 parfüm topluca
      dolacak. `retailers.test.ts` arama biçimli adresleri reddediyor.
    */
    line: {
      en: 'A rose left too long in a room full of smoke — sweet, medicinal, unwilling to leave.',
      tr: 'Dumanla dolu bir odada fazla kalmış bir gül — tatlı, tıbbi, gitmeye niyetsiz.',
    },
    notes: [
      { noteId: 'saffron', tier: 'top', weight: 0.6 },
      { noteId: 'rose', tier: 'heart', weight: 1.0 },
      { noteId: 'oud', tier: 'base', weight: 1.0 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.7 },
      { noteId: 'patchouli', tier: 'base', weight: 0.5 },
      { noteId: 'labdanum', tier: 'base', weight: 0.4 },
    ],
  },
  {
    id: 'diptyque-philosykos',
    name: 'Philosykos',
    brand: 'Diptyque',
    year: 1996,
    perfumer: 'Olivia Giacobetti',
    curated: true,
    line: {
      en: 'The whole tree, not the fruit: leaf, bark, milk and shade.',
      tr: 'Meyve değil, ağacın tamamı: yaprak, kabuk, süt ve gölge.',
    },
    notes: [
      { noteId: 'fig-leaf', tier: 'top', weight: 1.0 },
      { noteId: 'fig', tier: 'heart', weight: 0.85 },
      { noteId: 'coconut', tier: 'heart', weight: 0.4 },
      { noteId: 'cedar', tier: 'base', weight: 0.7 },
    ],
  },

  // ——— Nasomatto çifti ———
  {
    // Küratör yönü: viskimsi odunsu. Deri ve reçine geri çekildi, odunlar öne
    // alındı — amber bir zemin, gövde değil.
    id: 'nasomatto-baraonda',
    name: 'Baraonda',
    brand: 'Nasomatto',
    year: 2011,
    perfumer: 'Alessandro Gualtieri',
    curated: true,
    line: {
      en: 'A spilled glass on bare wood — the wood keeps the smell longer than the drink lasted.',
      tr: 'Çıplak ahşaba devrilmiş bir kadeh — odun, kokuyu içkinin sürdüğünden uzun tutuyor.',
    },
    notes: [
      { noteId: 'whiskey', tier: 'top', weight: 1.0 },
      { noteId: 'rum', tier: 'top', weight: 0.4 },
      { noteId: 'tobacco', tier: 'heart', weight: 0.5 },
      { noteId: 'honey', tier: 'heart', weight: 0.4 },
      { noteId: 'cedar', tier: 'base', weight: 0.8 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.7 },
      { noteId: 'guaiac-wood', tier: 'base', weight: 0.6 },
      { noteId: 'amber-accord', tier: 'base', weight: 0.5 },
      { noteId: 'benzoin', tier: 'base', weight: 0.4 },
    ],
  },
  {
    // Küratör yönü: doğrudan deri, geri kalanı onun üstüne kuruluyor.
    id: 'nasomatto-blamage',
    name: 'Blamage',
    brand: 'Nasomatto',
    year: 2014,
    perfumer: 'Alessandro Gualtieri',
    curated: true,
    line: {
      en: 'Leather that was never cleaned, and a bitter nut cracked over it.',
      tr: 'Hiç temizlenmemiş bir deri, üzerinde kırılmış acı bir çekirdek.',
    },
    notes: [
      { noteId: 'almond', tier: 'top', weight: 0.5 },
      { noteId: 'hay', tier: 'heart', weight: 0.4 },
      { noteId: 'leather', tier: 'base', weight: 1.0 },
      { noteId: 'cedar', tier: 'base', weight: 0.6 },
      { noteId: 'suede', tier: 'base', weight: 0.5 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.5 },
      { noteId: 'patchouli', tier: 'base', weight: 0.4 },
      { noteId: 'civet', tier: 'base', weight: 0.3 },
      { noteId: 'earth', tier: 'base', weight: 0.3 },
    ],
  },

  // ——— Zoologist çifti ———
  {
    id: 'zoologist-hummingbird',
    name: 'Hummingbird',
    brand: 'Zoologist',
    year: 2018,
    perfumer: 'Cristiano Canali',
    curated: true,
    line: {
      en: 'Sweetness that never lands — sour green stalk under the nectar.',
      tr: 'Hiç konmayan bir tatlılık — nektarın altında ekşi yeşil bir sap.',
    },
    notes: [
      { noteId: 'rhubarb', tier: 'top', weight: 0.8 },
      { noteId: 'pear', tier: 'top', weight: 0.6 },
      { noteId: 'blackcurrant', tier: 'top', weight: 0.6 },
      { noteId: 'bergamot', tier: 'top', weight: 0.4 },
      { noteId: 'hyacinth', tier: 'heart', weight: 0.7 },
      { noteId: 'magnolia', tier: 'heart', weight: 0.7 },
      { noteId: 'orange-blossom', tier: 'heart', weight: 0.5 },
      { noteId: 'honeysuckle', tier: 'heart', weight: 0.4 },
      { noteId: 'honey', tier: 'heart', weight: 0.4 },
      { noteId: 'white-musk', tier: 'base', weight: 0.6 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.5 },
    ],
  },
  {
    // Küratör yönü: havuçlu kek olduğu baskıyla görünsün. Tarçın, muskat,
    // şeker ve fındık gurme tarafı kuruyor; havuç kökü ve ot onu tarlada tutuyor.
    id: 'zoologist-rabbit',
    name: 'Rabbit',
    brand: 'Zoologist',
    year: 2022,
    perfumer: 'Sarah McCartney',
    curated: true,
    line: {
      en: 'A carrot cake cooling on the windowsill, and the field it was pulled from.',
      tr: 'Pencere kenarında soğuyan havuçlu kek, ve söküldüğü tarla.',
    },
    notes: [
      { noteId: 'carrot-root', tier: 'top', weight: 1.0 },
      { noteId: 'clover', tier: 'top', weight: 0.5 },
      { noteId: 'mint', tier: 'top', weight: 0.3 },
      { noteId: 'milk', tier: 'heart', weight: 0.8 },
      { noteId: 'sugar', tier: 'heart', weight: 0.6 },
      { noteId: 'hay', tier: 'heart', weight: 0.6 },
      { noteId: 'cinnamon', tier: 'heart', weight: 0.5 },
      { noteId: 'hazelnut', tier: 'heart', weight: 0.5 },
      { noteId: 'nutmeg', tier: 'heart', weight: 0.4 },
      { noteId: 'vanilla', tier: 'base', weight: 0.5 },
      { noteId: 'white-musk', tier: 'base', weight: 0.5 },
      { noteId: 'earth', tier: 'base', weight: 0.4 },
      { noteId: 'sandalwood', tier: 'base', weight: 0.3 },
    ],
  },

  // ——— Orto Parisi çifti ———
  {
    // Küratör yönü: doğrudan yeşillik, geri kalanı onun üstüne. Baharat ve
    // reçine yok; yeşilin kendisi kompozisyonun gövdesi.
    id: 'orto-parisi-viride',
    name: 'Viride',
    brand: 'Orto Parisi',
    year: 2014,
    perfumer: 'Alessandro Gualtieri',
    curated: true,
    line: {
      en: 'Not a garden — the broken stem itself, still leaking.',
      tr: 'Bahçe değil — kırılmış sapın kendisi, hâlâ akıyor.',
    },
    notes: [
      { noteId: 'galbanum', tier: 'top', weight: 1.0 },
      { noteId: 'violet-leaf', tier: 'top', weight: 0.8 },
      { noteId: 'tomato-leaf', tier: 'top', weight: 0.6 },
      { noteId: 'basil', tier: 'top', weight: 0.6 },
      { noteId: 'mint', tier: 'top', weight: 0.5 },
      { noteId: 'moss', tier: 'heart', weight: 0.5 },
      { noteId: 'clary-sage', tier: 'heart', weight: 0.4 },
      { noteId: 'vetiver', tier: 'base', weight: 0.6 },
      { noteId: 'patchouli', tier: 'base', weight: 0.3 },
    ],
  },
  {
    id: 'orto-parisi-megamare',
    name: 'Megamare',
    brand: 'Orto Parisi',
    year: 2022,
    perfumer: 'Alessandro Gualtieri',
    curated: true,
    line: {
      en: 'Not the sea — the stone the wave pulled back from.',
      tr: 'Deniz değil — dalganın çekildiği taş.',
    },
    notes: [
      { noteId: 'sea-salt', tier: 'top', weight: 0.9 },
      { noteId: 'marine', tier: 'top', weight: 0.8 },
      { noteId: 'ozone', tier: 'top', weight: 0.6 },
      { noteId: 'seaweed', tier: 'heart', weight: 1.0 },
      { noteId: 'flint', tier: 'heart', weight: 0.5 },
      { noteId: 'ambergris', tier: 'base', weight: 0.8 },
      { noteId: 'ambroxan', tier: 'base', weight: 0.7 },
      { noteId: 'cedar', tier: 'base', weight: 0.4 },
    ],
  },

  // ——— Argos ———
  {
    id: 'argos-triumph-of-bacchus',
    name: 'Triumph of Bacchus',
    brand: 'Argos',
    year: 2019,
    perfumer: 'Christian Petrovich',
    curated: true,
    line: {
      en: 'Grapes left in the cellar: sweet, heavy, faintly holy.',
      tr: 'Mahzende bırakılmış üzüm: tatlı, ağır, hafifçe kutsal.',
    },
    notes: [
      { noteId: 'wine', tier: 'top', weight: 0.9 },
      { noteId: 'bergamot', tier: 'top', weight: 0.4 },
      { noteId: 'plum', tier: 'heart', weight: 0.5 },
      { noteId: 'rum', tier: 'heart', weight: 0.5 },
      { noteId: 'frankincense', tier: 'heart', weight: 0.5 },
      { noteId: 'amber-accord', tier: 'base', weight: 0.8 },
      { noteId: 'benzoin', tier: 'base', weight: 0.6 },
      { noteId: 'tonka', tier: 'base', weight: 0.5 },
      { noteId: 'labdanum', tier: 'base', weight: 0.4 },
    ],
  },
] as const;
