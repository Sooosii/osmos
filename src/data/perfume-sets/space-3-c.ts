import type { Perfume } from '../types';

/**
 * Matière Première dörtlüsü — bir B2B demosunun açtığı boşluktan geldi.
 *
 * ⚠️ **Neden bu dört parfüm.** `nischengold.com` için kurulan demo seçkisinde
 * dükkânın rafında bizde de bulunan 11 parfüm vardı ve ölçüm bir sorun
 * gösterdi: o on bir, on beş koku ailesinden yalnız sekizini tutuyordu.
 * **floral, resinous, aromatic, spicy** boştu — harita bu hâliyle bir köşede
 * toplanırdı. Demo katalogunun ailelere yayılması gerektiği `demo-selva`
 * yorumunda zaten yazılıydı; burada o kural bir seçim ölçütüne dönüştü.
 *
 * Dördü de aynı evden ve aynı burundan (Aurélien Guichard) çünkü ev hem o dört
 * boşluğu birden dolduruyordu hem de notalarını yayımlıyor. Bizde zaten Santal
 * Austral vardı, yani ev katalogda yabancı değil.
 *
 * ⚠️ **Veri kaynağı ve sınırı.** Yıl, burun ve piramit markanın yayımladığı
 * bilgiden alındı. Dükkânın kendi sayfası notaları düz liste hâlinde veriyor
 * (üst/kalp/dip ayrımı yok); piramit oradan **türetilmedi**, çünkü sıralamayı
 * tahmin etmek uydurmak olurdu.
 *
 * ⚠️ **Ağırlıklar YAYIMLANMIŞ VERİ DEĞİL, yargı.** Hiçbir ev nota ağırlığı
 * açıklamıyor; buradaki sayılar evin kendi anlatımına dayanıyor ("gül
 * absolüsünün aşırı dozu", "Yunan safran yağının çevresine kurulu"). İlk
 * yazımda üst notalar fazla ağırdı ve `dominantFamily` Radical Rose'u
 * **spicy**, Crystal Saffron'u **musk** saydı — ikisi de evin anlattığı
 * parfüm değil. Ağırlıklar merkeze göre düzeltildi ve aile yeniden ölçüldü.
 * Yani bu satırlar bir kez ölçüme çarpıp geri döndü.
 *
 * ⚠️ **`retailers` bilerek boş.** Bu depoda her satıcı adresi gerçek tarayıcıda
 * açılıp ürün adı görülerek yazılıyor; doğrulanmamış adres yazmaktansa satır
 * hiç çizilmiyor.
 *
 * ⚠️ **Genişleme tarafına ekleniyor.** Uzay 1 tam 52 parfüm olmak zorunda
 * (`buildPerfumeSpaces` bunu fırlatarak tutuyor); yeni kayıtlar `OSMOS_LEGACY`e
 * girseydi derleme patlardı.
 */
export const SPACE_3_C: readonly Perfume[] = [
  {
    id: 'matiere-premiere-radical-rose',
    name: 'Radical Rose',
    brand: 'MATIERE PREMIERE',
    year: 2020,
    perfumer: 'Aurélien Guichard',
    curated: true,
    line: {
      en: 'Not a rose in a garden — a rose in a jar, undiluted.',
      tr: 'Bahçedeki gül değil — kavanozdaki gül, seyreltilmemiş.',
    },
    /*
      Evin kendi anlatımı "gül absolüsünün aşırı dozu" — ağırlık da onu
      söylüyor: kalpteki gül tek başına 1.0, geri kalanı ona çerçeve.
    */
    notes: [
      { noteId: 'saffron', tier: 'top', weight: 0.35 },
      { noteId: 'pink-pepper', tier: 'top', weight: 0.3 },
      { noteId: 'raspberry', tier: 'top', weight: 0.25 },
      { noteId: 'rose', tier: 'heart', weight: 1.0 },
      { noteId: 'patchouli', tier: 'base', weight: 0.7 },
      { noteId: 'labdanum', tier: 'base', weight: 0.5 },
    ],
  },
  {
    id: 'matiere-premiere-encens-suave',
    name: 'Encens Suave',
    brand: 'MATIERE PREMIERE',
    year: 2019,
    perfumer: 'Aurélien Guichard',
    curated: true,
    line: {
      en: 'Incense after the smoke settles — warm resin, and coffee somewhere behind it.',
      tr: 'Duman dindikten sonraki tütsü — ılık reçine, arkasında bir yerde kahve.',
    },
    notes: [
      { noteId: 'coffee', tier: 'top', weight: 0.5 },
      { noteId: 'frankincense', tier: 'heart', weight: 1.0 },
      { noteId: 'vanilla', tier: 'heart', weight: 0.8 },
      { noteId: 'benzoin', tier: 'base', weight: 0.7 },
      { noteId: 'labdanum', tier: 'base', weight: 0.6 },
      { noteId: 'amber-accord', tier: 'base', weight: 0.5 },
    ],
  },
  {
    id: 'matiere-premiere-crystal-saffron',
    name: 'Crystal Saffron',
    brand: 'MATIERE PREMIERE',
    year: 2022,
    perfumer: 'Aurélien Guichard',
    curated: true,
    line: {
      en: 'Saffron without the kitchen — dry, mineral, lit from behind.',
      tr: 'Mutfaksız safran — kuru, mineral, arkadan aydınlatılmış.',
    },
    notes: [
      { noteId: 'white-musk', tier: 'top', weight: 0.4 },
      { noteId: 'saffron', tier: 'heart', weight: 1.0 },
      { noteId: 'ambroxan', tier: 'base', weight: 0.45 },
      { noteId: 'frankincense', tier: 'base', weight: 0.4 },
    ],
  },
  {
    id: 'matiere-premiere-metal-lavender',
    name: 'Metal Lavender',
    brand: 'MATIERE PREMIERE',
    year: 2026,
    perfumer: 'Aurélien Guichard',
    curated: true,
    line: {
      en: 'Two lavenders arguing — one metallic from the field, one soft from the drawer.',
      tr: 'Tartışan iki lavanta — biri tarladan, metalik; biri çekmeceden, yumuşak.',
    },
    /*
      ⚠️ Parfümün fikri iki ayrı lavanta malzemesini karşı karşıya koymak
      (üstte Grasse lavandini, kalpte Haute-Provence lavanta absolüsü) ve ilk
      yazımda ikisi ayrı katmanlara `lavender` diye yazılmıştı. Depo bunu
      REDDETTİ: bir parfümde aynı nota iki kez geçemiyor
      (`perfume-spaces.test.ts`). Kural haklı — nota havuzlanırken aynı
      kimliğin iki kez sayılması ağırlığı sessizce şişiriyor.

      Dağarcıkta lavandin için ayrı bir nota yok, o yüzden ikisi tek kayda
      indi. Katman olarak kalp seçildi: absolü kompozisyonun merkezi.
    */
    notes: [
      { noteId: 'lavender', tier: 'heart', weight: 1.0 },
      { noteId: 'cashmeran', tier: 'base', weight: 0.8 },
      { noteId: 'white-musk', tier: 'base', weight: 0.7 },
    ],
  },
];
