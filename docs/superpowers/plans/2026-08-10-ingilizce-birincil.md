# İngilizce Birincil — Uygulama Planı

> **Ajan işçiler için:** ZORUNLU ALT SKILL: Bu planı görev görev uygulamak için
> `superpowers:subagent-driven-development` (tavsiye) ya da
> `superpowers:executing-plans` kullanın. Adımlar onay kutusu (`- [ ]`) ile takip
> ediliyor.

**Hedef:** OSMOS'un ekran dili Türkçeden İngilizceye geçsin; tasarım, akış ve
davranış birebir aynı kalsın.

**Mimari:** Ekrandaki bütün sözcükler tek bir sözlük modülüne (`src/i18n/`)
taşınıyor. `en.ts` sözlüğün şeklini tanımlıyor, `tr.ts` bugünkü Türkçeyi devralıp
`Dict` olarak imzalanıyor ve beklemeye geçiyor. Ekran yalnızca `en`i okuyor.
Yönlendirme katmanı, `[lang]` segmenti ve dil değiştirici **yok** — onlar Faz 2.

**Teknoloji:** Next.js 16.2.12 (App Router, Turbopack), React 19.2.4,
TypeScript 5, Tailwind 4, Vitest 4. Yeni bağımlılık **eklenmiyor**.

## Kürsel Kısıtlar

Her görevin gereksinimleri bu bölümü kapsıyor sayılır.

- **Yeni bağımlılık yok.** `package.json` dependencies `next`, `react`,
  `react-dom` olarak kalır. i18n kütüphanesi kurulmaz.
- **Ekranda noktalı büyük İ yasak.** Sahibin kesin kuralı. `<html lang="en">`
  aynen kalır; büyütme için `toUpperCase()` kullanılır,
  `toLocaleUpperCase('tr')` **kullanılmaz**.
- **Kod yorumları Türkçe kalır.** Kural yalnızca ekrana çıkan metin için.
- **Fırlatılan hata mesajları Türkçe kalır** (`throw new Error(...)`). Geliştirici
  metni, ekran metni değil.
- **Sesi veri belirliyor: sergi etiketi.** Kısa, somut, süssüz; uzun tire
  serbest, pazarlama dili yok. Örnek: `A rose left too long in a room full of
  smoke — sweet, medicinal, unwilling to leave.`
- **İngiliz imlası.** `colour`, `neighbour`, `-ise` değil `-ize` yok — tek bir
  imla seçilip her yerde tutuluyor. Karışık imla, metnin çeviri olduğunu ele
  veren ilk şeydir.
- **Tasarım değişmez.** Sınıf adları, düzen, animasyon, renk, boşluk: hiçbirine
  dokunulmaz. Yalnızca metin ve dosya adları değişir.
- **`?mark=` ve `?feel=` parametreleri aynen kalır.**
- Her görev sonunda `npx tsc --noEmit` ve `npm test` yeşil olmalı; son görevde
  ayrıca `npm run lint` sessiz ve `npm run build` temiz (195 sayfa).
- Commit mesajları ASCII yazılır (Türkçe diakritik yok), depo geleneği bu.

---

## Dosya Yapısı

| dosya | sorumluluk |
|---|---|
| `src/i18n/en.ts` | **yeni.** Ekranın bütün sözcükleri; `Dict` şeklini tanımlar |
| `src/i18n/tr.ts` | **yeni.** Bugünkü Türkçe, `Dict` olarak imzalı, beklemede |
| `src/i18n/i18n.test.ts` | **yeni.** Sözlük bütünlüğü + `.tr` denetimi + kaçak Türkçe avcısı |
| `src/app/{perfume,notes,note,evolution,space}/` | `git mv` ile yeni adlar |
| `src/app/layout.tsx` | metadata sözlükten |
| `src/app/page.tsx` | giriş metni sözlükten |
| `src/components/space/*` | katmanlar, kaydıraçlar, klavye listesi |
| `src/components/*.tsx` | sayfa bileşenleri |
| `src/lib/note-measures.ts` | eksen tanımları sözlükten, `axisWord` besleyici parametreli |
| `src/lib/evolution-loop.ts` | `formatDuration` / `phaseLabel` besleyici parametreli |
| `src/data/notes.ts` | `BAND_LABEL` kalkar, yerini sözlük alır |
| `public/intro.js` | `window.OSMOS_INTRO_TEXT` sözleşmesi |

**Sözlüğün tek dosyada durması bilinçli.** Ekranın bütün sözcükleri yan yana
görünmezse ses tutarlılığı denetlenemez — ve bu işin asıl teslimatı ses.

---

## Görev 1: Sözlük modülü

**Dosyalar:**
- Oluştur: `src/i18n/en.ts`
- Oluştur: `src/i18n/tr.ts`
- Oluştur: `src/i18n/i18n.test.ts`

**Arayüzler:**
- Üretir: `EN` (sözlük nesnesi), `type Dict = typeof EN`, `TR: Dict`.
  Sonraki bütün görevler `import { EN } from '@/i18n/en'` ile okuyor.

- [ ] **Adım 1: Bütünlük sınamasını yaz (kırmızı)**

`src/i18n/i18n.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { EN } from './en';
import { TR } from './tr';

/**
 * Sözlük bütünlüğü.
 *
 * Şekli tip zaten zorluyor (`TR: Dict`). Bu sınama tipin göremediğini
 * yakalıyor: boş dize, unutulmuş yer tutucu, ve işlev/metin karışması.
 */
function flatten(value: unknown, path: string, out: Map<string, unknown>): void {
  if (value === null || typeof value !== 'object') {
    out.set(path, value);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    flatten(child, path ? `${path}.${key}` : key, out);
  }
}

describe('sozluk butunlugu', () => {
  test('iki sozluk ayni anahtar kumesine sahip', () => {
    const en = new Map<string, unknown>();
    const tr = new Map<string, unknown>();
    flatten(EN, '', en);
    flatten(TR, '', tr);

    expect([...tr.keys()].sort()).toEqual([...en.keys()].sort());
  });

  test('hicbir deger bos degil', () => {
    for (const dict of [EN, TR]) {
      const flat = new Map<string, unknown>();
      flatten(dict, '', flat);

      for (const [path, value] of flat) {
        if (typeof value === 'string') expect(value.trim(), path).not.toBe('');
        else expect(typeof value, path).toBe('function');
      }
    }
  });

  test('ingilizce sozlukte Turkceye ozgu harf yok', () => {
    const flat = new Map<string, unknown>();
    flatten(EN, '', flat);

    for (const [path, value] of flat) {
      if (typeof value !== 'string') continue;
      expect(value, path).not.toMatch(/[çğıöşüÇĞİÖŞÜ]/);
    }
  });
});
```

- [ ] **Adım 2: Sınamayı çalıştır, kırıldığını gör**

Çalıştır: `npx vitest run src/i18n/i18n.test.ts`
Beklenen: FAIL — `Cannot find module './en'`

- [ ] **Adım 3: `src/i18n/en.ts` dosyasını yaz**

```ts
/**
 * Ekranın sözlüğü — İngilizce.
 *
 * Bu dosya sözlüğün ŞEKLİNİ tanımlıyor: `type Dict = typeof EN`. `tr.ts` onu
 * imzalamak zorunda, yani bir anahtar eksik kalırsa derleme kırılır. Aynı
 * numara `Note.description` ve `Perfume.year`da da var — veri bütünlüğünü
 * sınamaya değil tipe bekletmek.
 *
 * ⚠️ `as const` KOYULMAYACAK. O durumda `typeof EN` her değeri kendi dize
 * sabitine daraltır ve `tr.ts` hiçbir anahtarı tutturamaz. Zorunluluk
 * anahtarlarda, değerlerde değil.
 *
 * Araya giren değerler işlev olarak yazılıyor, şablon dizesi olarak değil:
 * İngilizce ile Türkçenin sözcük sırası aynı değil ("52 parfümde" ↔ "in 52
 * perfumes"). Dilbilgisi sözlüğün içinde kalsın diye.
 */
export const EN = {
  site: {
    name: 'OSMOS',
    title: 'OSMOS',
    description: 'The scent universe — a map of niche perfume.',
  },

  nav: {
    notes: 'NOTES',
    backToSpace: '← back to the space',
    allNotes: '← all notes',
  },

  space: {
    intro: (count: number) =>
      `${count} perfumes, placed by what their notes share. Drag, zoom, touch a point.`,
    entryHint: 'KEEP SCROLLING',
    keyboardList: 'Scent space — go to a perfume',
    perfumeLink: (name: string) => `${name} page`,
    sliders: {
      temperature: { label: 'Temperature — cool to warm', low: 'COOL', high: 'WARM' },
      cleanliness: { label: 'Cleanliness — dirty to clean', low: 'DIRTY', high: 'CLEAN' },
      texture: { label: 'Texture — velvety to sharp', low: 'VELVET', high: 'SHARP' },
      proximity: { label: 'Proximity — airborne to skin-close', low: 'AIR', high: 'SKIN' },
      openDetail: 'Two more axes: texture and proximity',
      closeDetail: 'Close the texture and proximity axes',
    },
  },

  /** Açılış perdesi ve astronot — ikisi aynı ipucunu söylüyor. */
  intro: {
    word: 'osmos',
    tag: (count: number) => `${count} perfumes, a map drawn from the kinship of notes`,
    hint: 'scroll to come closer',
  },

  perfume: {
    title: (name: string, brand: string) => `${name} — ${brand} · OSMOS`,
    fallbackDescription: (name: string, brand: string) => `${name}, ${brand}.`,
    frame: { family: 'FAMILY', year: 'YEAR', notes: 'NOTES' },
    position: (index: number, total: number) =>
      `PERFUME ${String(index).padStart(3, '0')}/${total}`,
    sections: { evolution: 'EVOLUTION', notes: 'NOTES', neighbours: 'NEIGHBOURS' },
    neighbourLabel: (name: string, count: number, list: string) =>
      `The ${count} perfumes closest to ${name}: ${list}.`,
    neighbourEntry: (name: string, percent: number) => `${name}, ${percent}%`,
    neighbourCaption:
      'The one in the middle is this perfume. Closeness is similarity: the nearer it sits, the more alike it is. Height is depth in the space — those above the ring sit deeper, those below sit closer to the surface. It is the difference the flat map cannot show.',
  },

  note: {
    title: (name: string) => `${name} — note · OSMOS`,
    frame: { band: 'BAND', peak: 'PEAK', life: 'LIFE' },
    position: (index: number, total: number) =>
      `NOTE ${String(index).padStart(3, '0')}/${total}`,
    usage: (carriers: number, total: number) => `${carriers}/${total} PERFUMES`,
    carriersHeading: (count: number) =>
      count > 0 ? `IN ${count} PERFUMES` : 'IN NO PERFUME YET',
    unused: (total: number) =>
      `This note is part of the palette but appears in none of the ${total} perfumes in the selection. The encyclopedia is a dictionary of notes, not a list of uses.`,
    orbitEmpty: (name: string) => `${name} appears in no perfume yet.`,
    orbitLabel: (name: string, count: number, list: string) =>
      `${count} perfumes containing ${name}, turning in a three-dimensional orbit: ${list}.`,
    measures: {
      volatility: 'VOLATILITY',
      character: 'CHARACTER',
      peak: 'PEAK',
      halfLife: 'HALF-LIFE',
    },
    /** Çerçevenin dar alanına sığan kısaltma: 90 dakika → `1h 30′`. */
    shortMinutes: (minutes: number) => `${minutes}′`,
    shortHours: (hours: number) => `${hours}h`,
    shortHoursMinutes: (hours: number, minutes: number) => `${hours}h ${minutes}′`,
  },

  notesIndex: {
    title: (count: number) => `Notes — ${count} materials · OSMOS`,
    description: 'The note database behind the scent space, ordered by volatility band.',
    heading: 'Notes',
    lede: (count: number) =>
      `${count} materials, ordered by volatility band. Colour is the dominant scent family — the same palette as the points in the space.`,
    status: (count: number) => `PALETTE ${count}`,
    tail: (used: number) => `${used} IN USE`,
  },

  /**
   * Bant ve piramit katmanı adları — büyük harfli.
   *
   * Tek harita iki tipe hizmet ediyor: `NoteBand` ile `PyramidTier` aynı üç
   * değere sahip ve ekranda aynı sözcükleri gösteriyorlar. Ayrı iki harita
   * tutmak "aynı veriye iki ad" olurdu.
   */
  bands: { top: 'TOP', heart: 'HEART', base: 'BASE' },

  chart: {
    /** Çizelgenin katman göstergesi — büyük harfli değil, cümle düzeni. */
    tiers: { top: 'Top', heart: 'Heart', base: 'Base' },
    timeLabel: 'Time',
    disclaimer:
      'This chart is an estimate, not a measurement. It is modelled from the volatility of the notes; the real development shifts with temperature, skin and concentration.',
    signatureLabel: (name: string, notes: string) =>
      `${name} evolution signature: ${notes} rising and falling over eight hours.`,
  },

  /** `phaseLabel` — dakikanın hangi evrede olduğu. */
  phases: { opening: 'Opening', heart: 'Heart', base: 'Base' },

  /**
   * `formatDuration` — dakikayı okunur süreye çevirir.
   *
   * ⚠️ Tekil/çoğul ayrımı Türkçede yoktu ve İngilizcede zorunlu: `peakMinutes`
   * 1 olan notalar var, "1 minutes" yazardı.
   */
  duration: {
    firstSeconds: 'the first seconds',
    minutes: (n: number) => `${n} minute${n === 1 ? '' : 's'}`,
    hours: (h: number) => `${h} hour${h === 1 ? '' : 's'}`,
    hoursMinutes: (h: number, m: number) =>
      `${h} hour${h === 1 ? '' : 's'} ${m} minute${m === 1 ? '' : 's'}`,
  },

  /**
   * Nota sayfasındaki dört karakter ekseni.
   *
   * `low`/`high` ekranda büyük harfle duran uç damgaları; `lowWord`/`highWord`
   * ekran okuyucunun duyduğu sıfat hâlleri.
   *
   * ⚠️ Uç damgaları **en fazla altı harf**. Sütun genişliği (`EDGE_CLASS`,
   * `w-[4.2rem]`) en uzun etikete göre sabit; daha uzunu dört kaydıracın rayını
   * farklı yerlerden başlatır ve sütun eğrilir. 'ON SKIN' bu yüzden elendi,
   * 'SKIN' kaldı.
   *
   * Uç sözcükleri kaydıraçlarınkiyle aynı olmak zorunda: ikisi aynı veriyi
   * (`Character`) gösteriyor ve tek eksene iki ad takmak kullanıcıya iki ayrı
   * şey varmış gibi geliyor — bu şikâyet Türkçede bir kez yaşandı.
   *
   * ⚠️ Eksen **kimlikleri** burada yok, `Character`ın anahtarlarıyla eşleşmek
   * zorundalar ve çevrilecek bir şey değiller. Sıra da burada değil: ikisi de
   * `note-measures.ts`te, kavramın sahibinde duruyor.
   */
  axes: {
    temperature: { low: 'COOL', high: 'WARM', lowWord: 'cool', highWord: 'warm' },
    texture: { low: 'VELVET', high: 'SHARP', lowWord: 'velvety', highWord: 'sharp' },
    cleanliness: { low: 'DIRTY', high: 'CLEAN', lowWord: 'dirty', highWord: 'clean' },
    proximity: { low: 'AIR', high: 'SKIN', lowWord: 'airborne', highWord: 'skin-close' },
  },

  /** `axisWord` — ölçümün sıfatı, basamakların yerine okunan metin. */
  axisWords: {
    between: (low: string, high: string) => `between ${low} and ${high}`,
    faint: (word: string) => `faintly ${word}`,
    plain: (word: string) => word,
    strong: (word: string) => `distinctly ${word}`,
  },

  /** Doğrulama ekranları — sahip kalmalarına karar verdi. */
  draft: {
    spaceHeading: 'Space draft',
    spaceLede: (count: number) =>
      `The verification screen for the similarity engine. ${count} perfumes; each read through three channels — scent family, character (temperature, texture, cleanliness, proximity) and shared notes. The cosine distance of the three combined was reduced to two dimensions with classical MDS. Colour shows the dominant family, point size the third component (depth).`,
    spaceHint: 'Hover — the name appears. Click — it links to its three nearest neighbours.',
    spaceLabel: 'How the perfumes spread across the scent space',
    checkpoints: 'Checkpoints',
    neighbours: 'Nearest neighbours',
    neighboursNote:
      'The number is cosine similarity: 1.00 the same character, 0.00 nothing in common.',
    missing: 'none',
    expectations: {
      nasomatto: 'The Nasomatto pair should sit close',
      mossy: 'The mossy edge should hold together',
      dirty: 'The dirty edge should hold together',
      alone: 'Not a Perfume should stand alone',
    },
  },
};

export type Dict = typeof EN;
```

- [ ] **Adım 4: `src/i18n/tr.ts` dosyasını yaz**

Bugünkü Türkçe metinler **birebir** taşınıyor — yeniden yazım yok, bulunduğu
yerdeki hâliyle. `Dict` imzası eksik anahtarı derlemede yakalıyor.

```ts
import type { Dict } from './en';

/**
 * Ekranın sözlüğü — Türkçe, beklemede.
 *
 * Faz 1'de ekran bunu okumuyor. Ölü kod değil: sitenin bugüne kadarki bütün
 * Türkçe metni burada duruyor ve Faz 2'nin (dil değiştirici + /tr adresleri)
 * metin işi hazır bekliyor. Alternatifi dizeleri yerinde çevirmekti; o durumda
 * bu cümleler yalnızca git geçmişinde kalırdı.
 *
 * ⚠️ Ekranda noktalı büyük İ yok — sahibin kesin kuralı. IÇIN, KADIFE, KESKIN,
 * TEMIZ, KIRLI, DIP, AILE hepsi noktasız I.
 */
export const TR: Dict = {
  site: {
    name: 'OSMOS',
    title: 'OSMOS',
    description: 'Koku evreni — niche parfümlerin haritası.',
  },

  nav: {
    notes: 'NOTALAR',
    backToSpace: '← uzaya dön',
    allNotes: '← bütün notalar',
  },

  space: {
    intro: (count) =>
      `${count} parfüm, konumları nota akrabalığından hesaplandı. Sürükle, yakınlaş, bir noktaya dokun.`,
    entryHint: 'KAYDIRMAYA DEVAM ET',
    keyboardList: 'Koku uzayı — parfüme git',
    perfumeLink: (name) => `${name} sayfası`,
    sliders: {
      temperature: { label: 'Sıcaklık — soğuktan sıcağa', low: 'SOĞUK', high: 'SICAK' },
      cleanliness: { label: 'Temizlik — kirliden temize', low: 'KIRLI', high: 'TEMIZ' },
      texture: { label: 'Doku — kadifemsiden keskine', low: 'KADIFE', high: 'KESKIN' },
      proximity: {
        label: 'Yakınlık — havada dağılandan tene yapışana',
        low: 'HAVADA',
        high: 'TENDE',
      },
      openDetail: 'Iki eksen daha: doku ve yakınlık',
      closeDetail: 'Doku ve yakınlık eksenlerini kapat',
    },
  },

  intro: {
    word: 'osmos',
    tag: (count) => `${count} parfüm, nota akrabalığından doğan bir harita`,
    hint: 'yaklaşmak için kaydır',
  },

  perfume: {
    title: (name, brand) => `${name} — ${brand} · OSMOS`,
    fallbackDescription: (name, brand) => `${name}, ${brand}.`,
    frame: { family: 'AILE', year: 'YIL', notes: 'NOTA' },
    position: (index, total) => `PARFÜM ${String(index).padStart(3, '0')}/${total}`,
    sections: { evolution: 'EVRIM', notes: 'NOTALAR', neighbours: 'KOMŞULAR' },
    neighbourLabel: (name, count, list) =>
      `${name} parfümüne en çok benzeyen ${count} parfüm: ${list}.`,
    neighbourEntry: (name, percent) => `${name}, %${percent}`,
    neighbourCaption:
      'Ortadaki bu parfüm. Yakınlık benzerlik: ne kadar yakınsa o kadar benziyor. Yükseklik kokunun uzaydaki derinliği — halkanın üstündekiler daha derin, altındakiler daha yüzeysel. Haritanın düz hâlinde görünmeyen fark bu.',
  },

  note: {
    title: (name) => `${name} — nota · OSMOS`,
    frame: { band: 'BANT', peak: 'TEPE', life: 'ÖMÜR' },
    position: (index, total) => `NOTA ${String(index).padStart(3, '0')}/${total}`,
    usage: (carriers, total) => `${carriers}/${total} PARFÜM`,
    carriersHeading: (count) =>
      count > 0 ? `${count} PARFÜMDE` : 'HENÜZ HIÇBIR PARFÜMDE',
    unused: (total) =>
      `Bu nota paletin parçası ama seçkideki ${total} parfümün hiçbirinde geçmiyor. Ansiklopedi bir nota sözlüğü; kullanım listesi değil.`,
    orbitEmpty: (name) => `${name} henüz hiçbir parfümde geçmiyor.`,
    orbitLabel: (name, count, list) =>
      `${name} notasını içeren ${count} parfüm, üç boyutlu bir yörüngede dönüyor: ${list}.`,
    measures: {
      volatility: 'UÇUCULUK',
      character: 'KARAKTER',
      peak: 'TEPE',
      halfLife: 'YARI ÖMÜR',
    },
    shortMinutes: (minutes) => `${minutes}′`,
    shortHours: (hours) => `${hours}s`,
    shortHoursMinutes: (hours, minutes) => `${hours}s ${minutes}′`,
  },

  notesIndex: {
    title: (count) => `Notalar — ${count} malzeme · OSMOS`,
    description: 'Koku uzayını besleyen nota veritabanı, uçuculuk bandına göre.',
    heading: 'Notalar',
    lede: (count) =>
      `${count} malzeme, uçuculuk bandına göre. Renk baskın koku ailesi — uzaydaki noktalarla aynı palet.`,
    status: (count) => `PALET ${count}`,
    tail: (used) => `${used} KULLANIMDA`,
  },

  bands: { top: 'ÜST', heart: 'KALP', base: 'DIP' },

  chart: {
    tiers: { top: 'Üst', heart: 'Kalp', base: 'Dip' },
    timeLabel: 'Zaman',
    disclaimer:
      'Bu çizelge bir tahmindir, ölçüm değil. Notaların uçuculuğundan modellenmiştir; gerçek gelişim sıcaklığa, tene ve konsantrasyona göre değişir.',
    signatureLabel: (name, notes) =>
      `${name} evrim imzası: ${notes} notalarının 8 saat boyunca yükselip düşüşü.`,
  },

  phases: { opening: 'Açılış', heart: 'Kalp', base: 'Dip' },

  duration: {
    firstSeconds: 'ilk saniyeler',
    minutes: (n) => `${n} dakika`,
    hours: (h) => `${h} saat`,
    hoursMinutes: (h, m) => `${h} saat ${m} dakika`,
  },

  axes: {
    temperature: { low: 'SOĞUK', high: 'SICAK', lowWord: 'soğuk', highWord: 'sıcak' },
    texture: { low: 'KADIFE', high: 'KESKIN', lowWord: 'kadifemsi', highWord: 'keskin' },
    cleanliness: { low: 'KIRLI', high: 'TEMIZ', lowWord: 'kirli', highWord: 'temiz' },
    proximity: {
      low: 'HAVADA',
      high: 'TENDE',
      lowWord: 'havada dağılan',
      highWord: 'tene yapışan',
    },
  },

  axisWords: {
    between: (low, high) => `${low} ile ${high} arasında`,
    faint: (word) => `hafif ${word}`,
    plain: (word) => word,
    strong: (word) => `belirgin ${word}`,
  },

  draft: {
    spaceHeading: 'Uzay taslağı',
    spaceLede: (count) =>
      `Benzerlik motorunun doğrulama ekranı. ${count} parfüm; her biri üç kanaldan okunuyor — koku ailesi, karakter (sıcaklık, doku, temizlik, yakınlık) ve paylaşılan notalar. Üçünün birleşiminden çıkan kosinüs uzaklığı klasik MDS ile iki boyuta indirildi. Renk baskın aileyi, nokta boyutu üçüncü bileşeni (derinlik) gösteriyor.`,
    spaceHint: 'Üstüne gel — adı çıkar. Tıkla — en yakın üç komşusuna bağlanır.',
    spaceLabel: 'Parfümlerin koku uzayındaki dağılımı',
    checkpoints: 'Kontrol noktaları',
    neighbours: 'En yakın komşular',
    neighboursNote:
      'Sayı kosinüs benzerliği: 1.00 aynı karakter, 0.00 ortak hiçbir şey yok.',
    missing: 'yok',
    expectations: {
      nasomatto: 'Nasomatto çifti yakın olmalı',
      mossy: 'Yosunlu uç bir arada olmalı',
      dirty: 'Kirli uç bir arada olmalı',
      alone: 'Not a Perfume yapayalnız olmalı',
    },
  },
};
```

- [ ] **Adım 5: Sınamayı çalıştır, geçtiğini gör**

Çalıştır: `npx vitest run src/i18n/i18n.test.ts`
Beklenen: PASS (3 sınama)

- [ ] **Adım 6: Tip denetimi**

Çalıştır: `npx tsc --noEmit`
Beklenen: hata yok. Hata varsa `tr.ts` bir anahtarı kaçırmıştır — tipin işi
tam olarak bu.

- [ ] **Adım 7: Commit**

```bash
git add src/i18n
git commit -m "feat: ekranin sozlugu — en.ts sekli tanimliyor, tr.ts bekliyor

Sitenin butun ekran metni tek modulde toplandi. en.ts sozlugun SEKLINI
tanimliyor (type Dict = typeof EN), tr.ts bugunku Turkceyi devralip Dict
olarak imzalaniyor: bir anahtar eksik kalirsa derleme kiriliyor.

Araya giren degerler islev, sablon dizesi degil — Ingilizce ile Turkcenin
sozcuk sirasi ayni degil ve dilbilgisi sozlugun icinde kalmali.

Faz 1'de ekran yalnizca EN'i okuyacak. TR olu kod degil, beklemede: Faz 2'nin
metin isi hazir duruyor.

Uc sinama: anahtar kumeleri esit, hicbir deger bos degil, EN'de Turkceye ozgu
harf yok.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 2: Veri okumaları `.en`e dönüyor

**Dosyalar:**
- Değiştir: `src/lib/note-marks.ts:131-132`, `src/lib/space-marks.ts:56`
- Değiştir: `src/app/uzay/page.tsx:74`, `src/app/notalar/page.tsx:105`,
  `src/app/nota/[id]/page.tsx:47-48`, `src/app/parfum/[id]/page.tsx:53,78,172`
- Değiştir: `src/components/EvolutionTimeline.tsx:60`,
  `src/components/EvolutionSignature.tsx:214,392`,
  `src/components/EvolutionChart.tsx:120`, `src/components/PerfumeNotes.tsx:87`
- Değiştir: `src/i18n/i18n.test.ts` (yeni sınama eklenir)

**Arayüzler:**
- Tüketir: yok. Bu görev tek başına duruyor.
- Üretir: yok. Ekranda 52 küratör cümlesi + 136 nota adı + 136 tarif İngilizceye
  döner.

- [ ] **Adım 1: Kalan `.tr` okumasını arayan sınamayı yaz (kırmızı)**

`src/i18n/i18n.test.ts` sonuna:

```ts
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** `src/` altındaki bütün kaynak dosyaları, verilen uzantılarla. */
function sourceFiles(dir: string, extensions: readonly string[]): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...sourceFiles(path, extensions));
    else if (extensions.some((ext) => entry.name.endsWith(ext))) found.push(path);
  }

  return found;
}

/**
 * Veri okumaları tek uçtan.
 *
 * `.tr` alan erişimi kalmışsa ekran karışık dil gösterir. Kaçak Türkçe avcısı
 * bunu göremez — `.tr` içinde Türkçeye özgü harf yok.
 *
 * Muaf: `src/data/**` (veri iki dilli kalıyor) ve `src/i18n/` (sözlüğün evi).
 */
test('ekranda .tr okumasi kalmadi', () => {
  const offenders: string[] = [];

  for (const file of sourceFiles('src', ['.ts', '.tsx'])) {
    const unixPath = file.split('\\').join('/');
    if (unixPath.startsWith('src/data/') || unixPath.startsWith('src/i18n/')) continue;

    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (/\.tr\b/.test(line)) offenders.push(`${unixPath}:${index + 1}`);
    });
  }

  expect(offenders).toEqual([]);
});
```

- [ ] **Adım 2: Sınamayı çalıştır, kırıldığını gör**

Çalıştır: `npx vitest run src/i18n/i18n.test.ts`
Beklenen: FAIL — 15 konum listelenir (10 dosya).

- [ ] **Adım 3: On beş okumayı `.en`e çevir**

Her birinde yalnızca alan adı değişiyor, başka hiçbir şey:

| dosya:satır | önce | sonra |
|---|---|---|
| `lib/note-marks.ts:131` | `note.name.tr` | `note.name.en` |
| `lib/note-marks.ts:132` | `note.description.tr` | `note.description.en` |
| `lib/space-marks.ts:56` | `perfume.line?.tr ?? null` | `perfume.line?.en ?? null` |
| `app/uzay/page.tsx:74` | `{family.name.tr}` | `{family.name.en}` |
| `app/notalar/page.tsx:105` | `{note.name.tr}` | `{note.name.en}` |
| `app/nota/[id]/page.tsx:47` | `note.name.tr` | `note.name.en` |
| `app/nota/[id]/page.tsx:48` | `note.description.tr` | `note.description.en` |
| `app/parfum/[id]/page.tsx:53` | `perfume.line?.tr` | `perfume.line?.en` |
| `app/parfum/[id]/page.tsx:78` | `family.name.tr.toUpperCase()` | `family.name.en.toUpperCase()` |
| `app/parfum/[id]/page.tsx:172` | `{perfume.line.tr}` | `{perfume.line.en}` |
| `components/EvolutionTimeline.tsx:60` | `{perfume.line.tr}` | `{perfume.line.en}` |
| `components/EvolutionSignature.tsx:214` | `note.name.tr` | `note.name.en` |
| `components/EvolutionSignature.tsx:392` | `{family.name.tr}` | `{family.name.en}` |
| `components/EvolutionChart.tsx:120` | `getNote(entry.noteId).name.tr` | `getNote(entry.noteId).name.en` |
| `components/PerfumeNotes.tsx:87` | `{note.name.tr}` | `{note.name.en}` |

⚠️ `parfum/[id]/page.tsx:78`teki `toUpperCase()` **aynen kalıyor**.
`toLocaleUpperCase('tr')`a çevrilmeyecek — bu bir devrilmiş karar.

- [ ] **Adım 4: Sınamaları çalıştır**

Çalıştır: `npm test`
Beklenen: PASS, 182 sınama (178 + 4). `note-marks.test.ts` etkilenmiyor:
sahte verisi `{ en: id, tr: id }` kullanıyor, iki uç aynı.

- [ ] **Adım 5: Commit**

```bash
git add -A
git commit -m "feat: veri okumalari .en ucundan — ceviri yok, dogru alan

52 kurator cumlesi, 136 nota adi ve 136 tarif ekranda artik Ingilizce.
Bunlarin hicbiri cevrilmedi: veri bastan iki dilli yazilmisti ve Ingilizcesi
kaynak metindi, Turkcesi onun yeniden yazimi.

15 yer, 10 dosya. Bir sinama kalan .tr okumasini ariyor — kacak Turkce
avcisi bunu goremez, .tr icinde Turkceye ozgu harf yok.

parfum sayfasindaki toUpperCase() aynen kaldi: toLocaleUpperCase('tr')
devrilmis bir karar, geri getirilmeyecek.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 3: Yol adları İngilizceleşiyor

**Dosyalar:**
- Taşı: `src/app/parfum/` → `src/app/perfume/`
- Taşı: `src/app/notalar/` → `src/app/notes/`
- Taşı: `src/app/nota/` → `src/app/note/`
- Taşı: `src/app/evrim/` → `src/app/evolution/`
- Taşı: `src/app/uzay/` → `src/app/space/`
- Değiştir: içeride bu yolları yazan altı dosya (aşağıda)

**Arayüzler:**
- Tüketir: yok.
- Üretir: son adresler. Sonraki görevler yeni yolları kullanır.

- [ ] **Adım 1: Klasörleri taşı**

```bash
git mv src/app/parfum src/app/perfume
git mv src/app/notalar src/app/notes
git mv src/app/nota src/app/note
git mv src/app/evrim src/app/evolution
git mv src/app/uzay src/app/space
```

- [ ] **Adım 2: Ölü bağlantıları listele (kırmızı)**

Yollar dize, tip değil — `tsc` bunu göremez ve `next build` de patlamaz,
yalnızca hiçbir yere gitmeyen bağlantılar üretir. Kırmızı sinyal bu yüzden
aramadan geliyor:

```bash
grep -rn "/parfum/\|/notalar\|/nota/\|/evrim\|/uzay" src public --include="*.ts" --include="*.tsx" --include="*.js"
```

Beklenen: **7 eşleşme** — hepsi aşağıdaki tabloda.

- [ ] **Adım 3: İçerideki yolları güncelle**

| dosya | önce | sonra |
|---|---|---|
| `src/app/note/[id]/page.tsx:117` | `href="/notalar"` | `href="/notes"` |
| `src/app/note/[id]/page.tsx:172` | `` href={`/parfum/${carrier.id}`} `` | `` href={`/perfume/${carrier.id}`} `` |
| `src/app/note/[id]/page.tsx:204` | `href="/notalar"` | `href="/notes"` |
| `src/app/notes/page.tsx:96` | `` href={`/nota/${note.id}`} `` | `` href={`/note/${note.id}`} `` |
| `src/app/perfume/[id]/page.tsx:130` | `href="/notalar"` | `href="/notes"` |
| `src/components/PerfumeNotes.tsx:74` | `` href={`/nota/${entry.noteId}`} `` | `` href={`/note/${entry.noteId}`} `` |
| `src/components/space/SpaceKeyboardList.tsx:35` | `` href={`/parfum/${mark.id}`} `` | `` href={`/perfume/${mark.id}`} `` |

- [ ] **Adım 4: Eski yol kalmadığını doğrula**

Çalıştır:

```bash
grep -rn "/parfum/\|/notalar\|/nota/\|/evrim\|/uzay" src public --include="*.ts" --include="*.tsx" --include="*.js"
```

Beklenen: hiçbir eşleşme yok. (Yorumlardaki `docs/` yol atıfları farklı biçimde
yazılıyor, eşleşmezler; eşleşen bir yorum çıkarsa o da güncellenir.)

- [ ] **Adım 5: Derlemeyi ve sınamaları çalıştır**

Çalıştır: `npm test && npx next build`
Beklenen: 182 sınama yeşil; derleme temiz ve **195 sayfa** (136 nota + 52
parfüm + 7 sabit). Sayı değişirse bir rota kaybolmuştur.

- [ ] **Adım 6: Commit**

```bash
git add -A
git commit -m "refactor: yollar Ingilizce — parfum/notalar/nota/evrim/uzay dustu

/perfume/[id], /notes, /note/[id], /evolution, /space. Ingilizce bir sitenin
adres cubugunda Turkce sozcukler durmasin diye.

Bedeli sifir: site hicbir yere yayinlanmadi, uzak depo bile yok — kirilacak
dis baglanti mevcut degil. ?mark= ve ?feel= parametreleri aynen kaldi.

Uretim derlemesi yine 195 sayfa: 136 nota + 52 parfum + 7 sabit.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 4: Kök uzay ekranı

**Dosyalar:**
- Değiştir: `src/app/layout.tsx:15-18`, `src/app/page.tsx:66-70`
- Değiştir: `src/components/space/SpaceOverlays.tsx:164`
- Değiştir: `src/components/space/SpaceFeelSliders.tsx:290-346, 373-375`
- Değiştir: `src/components/space/SpaceKeyboardList.tsx:23, 35`

**Arayüzler:**
- Tüketir: `EN.site`, `EN.space` (Görev 1).
- Üretir: yok.

- [ ] **Adım 1: `layout.tsx` metadata'sını sözlükten al**

```tsx
import { EN } from '@/i18n/en';

export const metadata: Metadata = {
  title: EN.site.title,
  description: EN.site.description,
};
```

`lang="en"` **değişmiyor** — bu bir karar, tesadüf değil.

- [ ] **Adım 2: `page.tsx` giriş metnini sözlükten al**

```tsx
import { EN } from '@/i18n/en';

// ...
<div>
  <p className="text-xs tracking-[0.3em] text-white/30">{EN.site.name}</p>
  <p className="mt-3 max-w-[15rem] text-xs leading-relaxed text-white/25">
    {EN.space.intro(PERFUMES.length)}
  </p>
</div>
```

- [ ] **Adım 3: `SpaceOverlays.tsx` giriş şeridini çevir**

`164`. satırdaki `KAYDIRMAYA DEVAM ET` yerine `{EN.space.entryHint}`.
`119`. satırdaki `OSMOS` yerine `{EN.site.name}`.

- [ ] **Adım 4: `SpaceFeelSliders.tsx` dört ekseni sözlükten besle**

```tsx
import { EN } from '@/i18n/en';

const S = EN.space.sliders;

// ...
<Axis axis={0} label={S.temperature.label} low={S.temperature.low} high={S.temperature.high} ... />
<Axis axis={2} label={S.cleanliness.label} low={S.cleanliness.low} high={S.cleanliness.high} ... />
// detaylı blokta:
<Axis axis={DETAIL_AXES[0]} label={S.texture.label} low={S.texture.low} high={S.texture.high} ... />
<Axis axis={DETAIL_AXES[1]} label={S.proximity.label} low={S.proximity.low} high={S.proximity.high} ... />

// "…" düğmesi:
aria-label={detailed ? S.closeDetail : S.openDetail}
```

⚠️ `EDGE_CLASS` (`w-[4.2rem]`) **değişmiyor.** Yeni uç damgalarının en uzunu
altı harf (`VELVET`) — Türkçedeki en uzunla (`KADIFE`) aynı. Sütun genişliği
sabit kalabiliyor, bu yüzden `AIR`/`SKIN` seçildi.

- [ ] **Adım 5: `SpaceKeyboardList.tsx`i çevir**

```tsx
<ul className="sr-only" aria-label={EN.space.keyboardList}>
// ...
<Link href={`/perfume/${mark.id}`}>{EN.space.perfumeLink(mark.name)}</Link>
```

- [ ] **Adım 6: Sınamaları ve derlemeyi çalıştır**

Çalıştır: `npm test && npx tsc --noEmit`
Beklenen: 182 sınama yeşil, tip hatası yok.

- [ ] **Adım 7: Ekranda doğrula**

Çalıştır: `npm run dev`, `http://localhost:3000` açılır.
Beklenen: sol üstte İngilizce giriş cümlesi; kaydıraç uçları `COOL/WARM` ve
`DIRTY/CLEAN`; "…" açılınca `VELVET/SHARP` ve `AIR/SKIN`; dört rayın da sol
kenarı **aynı hizada** (sütun eğrilmemiş).

- [ ] **Adım 8: Commit**

```bash
git add -A
git commit -m "feat: kok uzay ekrani Ingilizce — giris metni, kaydiraclar, klavye listesi

Dort eksenin uc damgalari alti harfi asmiyor: EDGE_CLASS sabit genislikte ve
daha uzun bir etiket dort rayin baslangicini kaydirir, sutun egrilir. 'ON SKIN'
bu yuzden elendi, 'SKIN' kaldi.

lang=\"en\" degismedi — CSS uppercase noktasiz I uretsin diye orada.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 5: Perde ve astronot

**Dosyalar:**
- Değiştir: `public/intro.js:62-81`
- Değiştir: `src/components/IntroOverlay.tsx:8-14, 72-98`
- Değiştir: `src/components/AstronotIntro.tsx:417-422`

**Arayüzler:**
- Tüketir: `EN.intro` (Görev 1).
- Üretir: `window.OSMOS_INTRO_TEXT` sözleşmesi:
  `{ word: string; tag: string; hint: string }`.

- [ ] **Adım 1: `public/intro.js`e metin alanı ekle**

Dosyanın kendi geleneği `window.OSMOS_INTRO_*`; aynı geleneğe bir alan daha
katılıyor. **Yedekler kalıyor** — dosyanın başındaki kullanım notu onu "drop-in,
framework agnostic" diye tanımlıyor ve tek başına da çalışmalı.

`62-81` arası şöyle olur:

```js
    var text = window.OSMOS_INTRO_TEXT || {};

    var word = document.createElement('div');
    word.className = 'osmos-intro__word';
    word.textContent = text.word || 'osmos';
    overlay.appendChild(word);

    var tag = document.createElement('div');
    tag.className = 'osmos-intro__tag';
    // Sayı gömülü değil, noktalardan sayılıyor: parfüm eklenince perde de sayar.
    tag.textContent = text.tag || pts.length + ' perfumes, a map drawn from the kinship of notes';
    overlay.appendChild(tag);

    var hint = document.createElement('div');
    hint.className = 'osmos-intro__hint';
    /*
     * Perde kalkınca sırada sürükleme değil YAKLAŞMA var (`space-approach.ts`):
     * uzay çok uzakta başlıyor ve tekerlekle geliniyor. Sürüklemek işe yarayan
     * bir hamle, ama sıradaki hamle değil.
     */
    hint.textContent = text.hint || 'scroll to come closer';
    overlay.appendChild(hint);
```

Dosyanın başındaki kullanım notuna da bir madde eklenir:

```
    5. To translate the overlay, set window.OSMOS_INTRO_TEXT = { word, tag, hint }
       before this script runs. Any missing field falls back to English.
```

- [ ] **Adım 2: `IntroOverlay.tsx`ten metni ver**

```tsx
import { EN } from '@/i18n/en';

declare global {
  interface Window {
    OSMOS_INTRO_POINTS?: readonly IntroPoint[];
    OSMOS_INTRO_DISABLE?: boolean;
    OSMOS_INTRO_TEXT?: { readonly word: string; readonly tag: string; readonly hint: string };
    OsmosIntro?: { readonly init: (points?: readonly IntroPoint[]) => void };
  }
}
```

Noktaları yazan etkinin yanına metin de yazılıyor — **aynı etkide**, çünkü
ikisi de betiğin okuduğu tek yönlü bir pencere değişkeni:

```tsx
  useEffect(() => {
    window.OSMOS_INTRO_POINTS = points;
    window.OSMOS_INTRO_TEXT = {
      word: EN.intro.word,
      tag: EN.intro.tag(points.length),
      hint: EN.intro.hint,
    };
  }, [points]);
```

⚠️ Sayı `points.length`ten geliyor, sabit değil — betiğin kendi yorumu
"parfüm eklenince perde de sayar" diyor ve o söz korunuyor.

- [ ] **Adım 3: `AstronotIntro.tsx` ipucunu çevir**

`421`. satırdaki `yaklaşmak için kaydır` yerine `{EN.intro.hint}`.
Üstündeki yorum bloğu güncellenir: örnek artık "için → IÇIN" değil, İngilizce
metnin zaten noktasız I ürettiği. `uppercase` sınıfı **kalır**.

- [ ] **Adım 4: Ekranda doğrula**

Çalıştır: `npm run dev`, `http://localhost:3000` **yeni sekmede** (oturum
bayrağı yüzünden aynı sekmede kapı ikinci kez oynamaz).
Beklenen sıra: astronot + `SCROLL TO COME CLOSER` → kaydır → perde: `osmos`,
`52 perfumes, a map drawn from the kinship of notes`, `SCROLL TO COME CLOSER`
→ yaklaşma sahnesi.

- [ ] **Adım 5: Sınamalar ve lint**

Çalıştır: `npm test && npm run lint`
Beklenen: 182 yeşil, lint sessiz. `public/intro.js` lint kapsamında ve tek
uyarısı geçen turda temizlenmişti — yeni uyarı çıkmamalı.

- [ ] **Adım 6: Commit**

```bash
git add -A
git commit -m "feat: perde ve astronot Ingilizce — intro.js kendi sozlesmesiyle

public/intro.js'e window.OSMOS_INTRO_TEXT alani eklendi; metni IntroOverlay
sozlukten dolduruyor. Yedek degerler dosyada kaldi: dosyanin basindaki kullanim
notu onu 'drop-in, framework agnostic' diye tanimliyor ve tek basina da
calismali.

Sayi yine noktalardan sayiliyor (pts.length) — 'parfum eklenince perde de
sayar' sozu korundu.

Astronot ile perde ayni ipucunu soyluyor, o yuzden tek anahtar: EN.intro.hint.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 6: Parfüm sayfası

**Dosyalar:**
- Değiştir: `src/app/perfume/[id]/page.tsx:52, 77-84, 179, 195, 201, 210`
- Değiştir: `src/components/PerfumeNotes.tsx:36-40`
- Değiştir: `src/components/Neighbors.tsx:56-65`
- Değiştir: `src/components/EvolutionSignature.tsx:318-333`

**Arayüzler:**
- Tüketir: `EN.perfume`, `EN.nav`, `EN.bands`, `EN.chart`, `EN.phases`,
  `EN.duration` (Görev 1).
- Üretir: yok.

- [ ] **Adım 1: Sayfanın kendi metinlerini çevir**

```tsx
import { EN } from '@/i18n/en';

// generateMetadata:
return {
  title: EN.perfume.title(perfume.name, perfume.brand),
  description: perfume.line?.en ?? EN.perfume.fallbackDescription(perfume.name, perfume.brand),
};

// çerçeve:
const readouts: readonly FrameReadout[] = [
  { label: EN.perfume.frame.family, value: family.name.en.toUpperCase() },
  { label: EN.perfume.frame.year, value: String(perfume.year) },
  { label: EN.perfume.frame.notes, value: String(perfume.notes.length) },
];

const position = EN.perfume.position(index, PERFUMES.length);

// bölüm başlıkları:
<h2 ...>{EN.perfume.sections.evolution}</h2>
<h2 ...>{EN.perfume.sections.notes}</h2>
<h2 ...>{EN.perfume.sections.neighbours}</h2>

// gezinme:
<Link href="/notes" ...>{EN.nav.notes}</Link>
<Link href={`/?mark=${perfume.id}`} ...>{EN.nav.backToSpace}</Link>
```

- [ ] **Adım 2: `PerfumeNotes.tsx`teki katman haritasını sözlüğe bağla**

Yerel `TIER_LABEL` sabiti **siliniyor** — `EN.bands` aynı üç değeri taşıyor ve
`PyramidTier` ile `NoteBand` aynı dize birleşimi:

```tsx
import { EN } from '@/i18n/en';

// TIER_LABEL sabiti kalkar; kullanım yeri:
<h3 className="mb-3 text-[0.65rem] tracking-[0.3em] text-white/25">
  {EN.bands[tier]}
</h3>
```

- [ ] **Adım 3: `Neighbors.tsx` etiketini ve açıklamasını çevir**

```tsx
import { EN } from '@/i18n/en';

<NeighborOrbit
  neighbors={neighbors}
  centerDepth={depths.get(perfume.id) ?? 0.5}
  centerColor={colorOf(perfume)}
  label={EN.perfume.neighbourLabel(
    perfume.name,
    neighbors.length,
    neighbors
      .map((entry) => EN.perfume.neighbourEntry(entry.name, Math.round(entry.score * 100)))
      .join('; '),
  )}
/>

<p className="mx-auto mt-8 max-w-lg text-xs leading-relaxed text-white/25">
  {EN.perfume.neighbourCaption}
</p>
```

⚠️ Yüzde işareti yer değiştirdi: Türkçe `%85`, İngilizce `85%`. Bu yüzden
`neighbourEntry` bir işlev — biçim sözlüğün içinde kalıyor.

- [ ] **Adım 4: `EvolutionSignature.tsx` saat yazısını ve etiketini çevir**

```tsx
import { EN } from '@/i18n/en';

<span ref={phaseRef} className="text-sm tracking-wide text-white/80">
  {EN.phases.opening}
</span>
<span className="text-white/25">·</span>
<span ref={durationRef} className="text-sm tabular-nums text-white/50">
  {EN.duration.firstSeconds}
</span>

// svg:
aria-label={EN.chart.signatureLabel(perfume.name, rows.map((row) => row.label).join(', '))}
```

⚠️ Bu iki `<span>` yalnızca **ilk kare**; sonrasını `phaseRef`/`durationRef`
üzerinden çizim döngüsü yazıyor ve o değerler `phaseLabel`/`formatDuration`tan
geliyor (Görev 9). İkisi aynı dili konuşmazsa ilk kare İngilizce, ikinci kare
Türkçe olur — Görev 9 bitene kadar bu böyle kalır ve normaldir.

- [ ] **Adım 5: Sınamalar ve ekran**

Çalıştır: `npm test && npx tsc --noEmit`
Beklenen: 182 yeşil, tip hatası yok.

Ekranda: `http://localhost:3000/perfume/dior-oud-ispahan` — çerçevede
`FAMILY / YEAR / NOTES`, başlıklar `EVOLUTION / NOTES / NEIGHBOURS`, altta
`← back to the space`.

- [ ] **Adım 6: Commit**

```bash
git add -A
git commit -m "feat: parfum sayfasi Ingilizce — kunye, bolumler, komsular

PerfumeNotes'taki yerel TIER_LABEL sabiti dustu: EN.bands ayni uc degeri
tasiyor ve PyramidTier ile NoteBand ayni dize birlesimi. Ayni veriye iki ad
takmamak bu deponun yazili kurali.

Yuzde isareti yer degistirdi (%85 -> 85%), o yuzden neighbourEntry bir islev:
bicim sozlugun icinde kaliyor.

Imzanin ilk karesi Ingilizce; sonraki kareleri yazan phaseLabel/formatDuration
Gorev 9'da ceviriliyor.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 7: Nota sayfası ve eksenler

**Dosyalar:**
- Değiştir: `src/lib/note-measures.ts:104-166, 219-227`
- Değiştir: `src/lib/note-measures.test.ts:190-224`
- Değiştir: `src/components/NoteMeasures.tsx:107, 111, 189, 194`
- Değiştir: `src/components/NoteOrbit.tsx:294-300`
- Değiştir: `src/app/note/[id]/page.tsx:47, 53-58, 75-83, 117, 153-157, 196-197, 207, 213`

**Arayüzler:**
- Tüketir: `EN.axes`, `EN.axisWords`, `EN.note`, `EN.nav` (Görev 1).
- Üretir: `axisWord(axis, value, words?)` — üçüncü parametre varsayılanı
  `EN.axisWords`. Faz 2 bunu Türkçeyle çağıracak.

- [ ] **Adım 1: `note-measures.test.ts` beklentilerini İngilizceye çevir (kırmızı)**

`190-224` arası:

```ts
  test('tarafsiz banda dusen deger iki ucun arasinda diye okunuyor', () => {
    expect(axisWord(TEMPERATURE, 0)).toBe('between cool and warm');
    expect(axisWord(TEMPERATURE, 0.1)).toBe('between cool and warm');
  });

  test('siddet bandlari sifatla ayriliyor', () => {
    expect(axisWord(TEMPERATURE, 0.2)).toBe('faintly warm');
    expect(axisWord(TEMPERATURE, 0.5)).toBe('warm');
    expect(axisWord(TEMPERATURE, 0.9)).toBe('distinctly warm');
  });

  test('isaret yonu belirliyor', () => {
    expect(axisWord(TEMPERATURE, -0.2)).toBe('faintly cool');
    expect(axisWord(TEMPERATURE, -0.9)).toBe('distinctly cool');
  });
```

Bant taramasındaki sınıflandırma da (`216-223`):

```ts
        seen.add(
          word.startsWith('faintly')
            ? 'faint'
            : word.startsWith('distinctly')
              ? 'distinct'
              : word.startsWith('between')
                ? 'between'
                : 'plain',
        );
    // ...
    expect(seen).toEqual(new Set(['between', 'faint', 'plain', 'distinct']));
```

⚠️ Sıra önemli: `between …` kontrolü `plain`den önce gelmeli, yoksa tarafsız
cümle "düz" sayılır ve dört bandın hepsi dolu görünür.

- [ ] **Adım 2: Sınamayı çalıştır, kırıldığını gör**

Çalıştır: `npx vitest run src/lib/note-measures.test.ts`
Beklenen: FAIL — beklenen `between cool and warm`, gelen
`soğuk ile sıcak arasında`.

- [ ] **Adım 3: `note-measures.ts`i sözlüğe bağla**

`AXES` dizisi siliniyor ve yerini sözlük alıyor. `Axis` arayüzü burada
kalıyor — kavram bu modülün:

```ts
import { EN } from '@/i18n/en';

// ... Axis arayüzü aynen duruyor ...

/**
 * Dört eksen — sözcükler sözlükte, kimlik ve sıra burada.
 *
 * Kimlikler `Character`ın anahtarları, yani çevrilecek bir şey değiller; sıra da
 * `types.ts`ten geliyor ve DEĞİŞMEMELİ. İkisi de sözlüğe verilseydi bir çeviri
 * dosyası veri şemasını kaydırabilirdi.
 *
 * `en.ts` bu modülden hiçbir şey import etmiyor — döngüsel bağımlılık yok.
 */
const AXIS_ORDER = ['temperature', 'texture', 'cleanliness', 'proximity'] as const;

export const AXES: readonly Axis[] = AXIS_ORDER.map((id) => ({ id, ...EN.axes[id] }));

// ...

export function axisWord(
  axis: Axis,
  value: number,
  words: typeof EN.axisWords = EN.axisWords,
): string {
  const size = Math.abs(value);
  if (size < NEUTRAL_BELOW) return words.between(axis.lowWord, axis.highWord);

  const word = value < 0 ? axis.lowWord : axis.highWord;
  if (size < FAINT_BELOW) return words.faint(word);
  if (size < PLAIN_BELOW) return words.plain(word);
  return words.strong(word);
}
```

⚠️ `words` parametresi süs değil: Faz 2'de aynı ölçüm Türkçe okunacak ve o gün
bu imza değişmeyecek. Bugün maliyeti sıfır.

- [ ] **Adım 4: Sınamayı çalıştır, geçtiğini gör**

Çalıştır: `npx vitest run src/lib/note-measures.test.ts`
Beklenen: PASS

- [ ] **Adım 5: `NoteMeasures.tsx` etiketlerini çevir**

`TEPE` → `{EN.note.measures.peak}`, `YARI ÖMÜR` → `{EN.note.measures.halfLife}`,
`UÇUCULUK` → `{EN.note.measures.volatility}`, `KARAKTER` →
`{EN.note.measures.character}`.

- [ ] **Adım 6: `NoteOrbit.tsx` etiketini çevir**

```tsx
aria-label={
  carriers.length === 0
    ? EN.note.orbitEmpty(noteName)
    : EN.note.orbitLabel(
        noteName,
        carriers.length,
        carriers.map((carrier) => carrier.name).join(', '),
      )
}
```

- [ ] **Adım 7: Nota sayfasını çevir**

```tsx
// generateMetadata:
title: EN.note.title(note.name.en),
description: note.description.en,

// minutesLabel — biçim sözlükten:
function minutesLabel(minutes: number): string {
  if (minutes < 60) return EN.note.shortMinutes(minutes);

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? EN.note.shortHours(hours) : EN.note.shortHoursMinutes(hours, rest);
}

// çerçeve:
const readouts: readonly FrameReadout[] = [
  { label: EN.note.frame.band, value: band },
  { label: EN.note.frame.peak, value: minutesLabel(note.volatility.peakMinutes) },
  { label: EN.note.frame.life, value: minutesLabel(note.volatility.halfLifeMinutes) },
];

const position = EN.note.position(index, NOTES.length);
const usage = EN.note.usage(page.carriers.length, PERFUMES.length);

// taşıyıcı başlığı:
<h2 ...>{EN.note.carriersHeading(page.carriers.length)}</h2>

// boş yörünge metni:
<p ...>{EN.note.unused(PERFUMES.length)}</p>

// gezinme:
<Link href="/notes" ...>{EN.nav.notes}</Link>
<Link href="/notes" ...>{EN.nav.allNotes}</Link>
<Link href="/" ...>{EN.nav.backToSpace}</Link>
```

`band` değeri Görev 8'de sözlüğe bağlanıyor; bu görevde hâlâ `BAND_LABEL`den
geliyor ve Türkçe görünüyor. Bu bilinçli bir sıra: bant adı iki sayfada birden
kullanılıyor, ikisi tek commit'te dönmeli.

- [ ] **Adım 8: Sınamalar ve ekran**

Çalıştır: `npm test`
Beklenen: 182 yeşil.

Ekranda: `http://localhost:3000/note/oud` — `VOLATILITY` / `CHARACTER`
başlıkları, eksen uçları `COOL/WARM`, `VELVET/SHARP`, `DIRTY/CLEAN`,
`AIR/SKIN`; çerçevede `BAND / PEAK / LIFE`.

Ayrıca hiç kullanılmayan bir nota (`http://localhost:3000/note/civet` gibi;
listeyi `countUsedNotes` veriyor) açılıp boş yörünge metni okunur.

- [ ] **Adım 9: Commit**

```bash
git add -A
git commit -m "feat: nota sayfasi ve dort eksen Ingilizce

AXES dizisi sozluge tasindi; Axis arayuzu note-measures.ts'te kaldi cunku kavram
bu modulun. Yapisal tipleme sayesinde en.ts arayuzu import etmiyor, dongusel
bagimlilik yok.

axisWord ucuncu bir parametre aldi (words = EN.axisWords). Faz 2'de ayni olcum
Turkce okunacak ve o gun bu imza degismeyecek; bugun maliyeti sifir.

Uc uc sozcugu kaydiraclarinkiyle ayni: ikisi ayni veriyi (Character) gosteriyor
ve tek eksene iki ad takmak Turkcede bir kez sikayet konusu oldu.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 8: Nota dizini ve bant adları

**Dosyalar:**
- Değiştir: `src/data/notes.ts:54-59` (`BAND_LABEL` siliniyor)
- Değiştir: `src/app/notes/page.tsx:25-28, 53-56, 71-72, 76-82, 87-90`
- Değiştir: `src/app/note/[id]/page.tsx:67` (bant kaynağı)

**Arayüzler:**
- Tüketir: `EN.bands`, `EN.notesIndex`, `EN.nav` (Görev 1).
- Üretir: `BAND_LABEL` artık yok; çağıranlar `EN.bands[band]` kullanıyor.

- [ ] **Adım 1: `BAND_LABEL`i veriden çıkar**

`src/data/notes.ts`teki şu blok **siliniyor**:

```ts
/** Bandın ekranda görünen adı. */
export const BAND_LABEL: Readonly<Record<NoteBand, string>> = {
  top: 'ÜST',
  heart: 'KALP',
  base: 'DIP',
};
```

⚠️ Bu bir yer değiştirmeden fazlası: `BAND_LABEL` ekran metniydi ama veri
klasöründe duruyordu. Orada kalsaydı Görev 10'un kaçak Türkçe avcısı onu
göremezdi — `src/data/**` muaf, çünkü nota ve parfüm verisi iki dilli kalıyor.
Ekran metni veri klasöründe durmamalı.

- [ ] **Adım 2: `notes/page.tsx`i çevir**

```tsx
import { EN } from '@/i18n/en';
import { BANDS, NOTES } from '@/data/notes';   // BAND_LABEL kalktı

export const metadata = {
  title: EN.notesIndex.title(NOTES.length),
  description: EN.notesIndex.description,
};

// çerçeve:
const readouts: readonly FrameReadout[] = BANDS.map(({ band, notes }) => ({
  label: EN.bands[band],
  value: String(notes.length),
}));

status={EN.notesIndex.status(NOTES.length)}
tail={EN.notesIndex.tail(used)}

// başlık ve giriş:
<h1 ...>{EN.notesIndex.heading}</h1>
<p ...>{EN.notesIndex.lede(NOTES.length)}</p>

// bölüm başlığı:
<h2 ...>
  {EN.bands[band]}
  <span className="ml-3 text-white/20">{notes.length}</span>
</h2>
```

- [ ] **Adım 3: Nota sayfasındaki bant kaynağını değiştir**

`src/app/note/[id]/page.tsx:67`:

```tsx
const band = EN.bands[noteBand(id)];
```

`BAND_LABEL` importu kalkar; `noteBand` kalır.

- [ ] **Adım 4: Tip denetimi ve sınamalar**

Çalıştır: `npx tsc --noEmit && npm test`
Beklenen: hata yok, 182 yeşil. `BAND_LABEL`i başka bir yer import ediyorsa
derleme burada patlar — beklenen davranış.

- [ ] **Adım 5: Ekranda doğrula**

`http://localhost:3000/notes` — başlık `Notes`, bölümler `TOP / HEART / BASE`,
çerçevede `PALETTE 136` ve `… IN USE`.

- [ ] **Adım 6: Commit**

```bash
git add -A
git commit -m "feat: nota dizini Ingilizce, BAND_LABEL veriden cikti

BAND_LABEL ekran metniydi ama src/data/ icinde duruyordu. Orada kalsaydi
kacak Turkce avcisi onu goremezdi: data/ muaf, cunku nota ve parfum verisi
iki dilli kalmali. Ekran metni veri klasorunde durmaz.

Bant adlari (TOP/HEART/BASE) tek haritadan geliyor ve piramit katmanlariyla
paylasiliyor — NoteBand ile PyramidTier ayni uc degere sahip.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 9: Doğrulama ekranları ve saat

**Dosyalar:**
- Değiştir: `src/lib/evolution-loop.ts:102-117`
- Değiştir: `src/lib/evolution-loop.test.ts:88-89, 128-160`
- Değiştir: `src/components/EvolutionChart.tsx:49-53, 152, 208-211`
- Değiştir: `src/components/ScentSpace.tsx:54`
- Değiştir: `src/app/space/page.tsx:28-36, 52-64, 80, 90, 99-102`

**Arayüzler:**
- Tüketir: `EN.duration`, `EN.phases`, `EN.chart`, `EN.draft` (Görev 1).
- Üretir: `formatDuration(minutes, words?)` ve `phaseLabel(minutes, words?)` —
  ikisinin de son parametresi varsayılanlı, Faz 2 için.

- [ ] **Adım 1: `evolution-loop.test.ts` beklentilerini çevir (kırmızı)**

```ts
    expect(formatDuration(minutesAt(0.5, SIGNATURE_MAX_MINUTES))).toBe('21 minutes');
    expect(formatDuration(minutesAt(0.5, SLIDER_MAX_MINUTES))).toBe('26 minutes');
// ...
  test('bir dakikanin alti sozle soyleniyor', () => {
    expect(formatDuration(0)).toBe('the first seconds');
    expect(formatDuration(0.4)).toBe('the first seconds');
  });

  test('saatin alti dakikayla', () => {
    expect(formatDuration(3)).toBe('3 minutes');
  });

  test('tam saat dakikasiz yaziliyor', () => {
    expect(formatDuration(120)).toBe('2 hours');
  });

  test('60 dakika siniri — saat bicimine tam burada geciyor', () => {
    expect(formatDuration(59)).toBe('59 minutes');
    expect(formatDuration(60)).toBe('1 hour');
  });

  test('saat ve dakika birlikte', () => {
    expect(formatDuration(185)).toBe('3 hours 5 minutes');
  });

  test('tekil bicimler — Ingilizcenin Turkcede olmayan ayrimi', () => {
    expect(formatDuration(1)).toBe('1 minute');
    expect(formatDuration(61)).toBe('1 hour 1 minute');
  });

  test('evre sinirlari', () => {
    expect(phaseLabel(0)).toBe('Opening');
    expect(phaseLabel(14)).toBe('Opening');
    expect(phaseLabel(15)).toBe('Heart');
    expect(phaseLabel(119)).toBe('Heart');
    expect(phaseLabel(120)).toBe('Base');
  });
```

⚠️ `formatDuration(60)` → `1 hour` (çoğul değil) ve yeni tekil sınaması
İngilizcenin Türkçede olmayan bir ayrımını çiviliyor: `peakMinutes` 1 olan
notalar var (`aldehydes`), yani "1 minutes" gerçekten ekrana çıkabilirdi.

- [ ] **Adım 2: Sınamayı çalıştır, kırıldığını gör**

Çalıştır: `npx vitest run src/lib/evolution-loop.test.ts`
Beklenen: FAIL — beklenen `21 minutes`, gelen `21 dakika`.

- [ ] **Adım 3: `evolution-loop.ts`i sözlüğe bağla**

```ts
import { EN } from '@/i18n/en';

/** Dakikayı okunur süreye çevirir. */
export function formatDuration(
  minutes: number,
  words: typeof EN.duration = EN.duration,
): string {
  if (minutes < 1) return words.firstSeconds;
  if (minutes < 60) return words.minutes(Math.round(minutes));

  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest === 0 ? words.hours(hours) : words.hoursMinutes(hours, rest);
}

/** Dakikanın hangi evrede olduğu. */
export function phaseLabel(
  minutes: number,
  words: typeof EN.phases = EN.phases,
): string {
  if (minutes < 15) return words.opening;
  if (minutes < 120) return words.heart;
  return words.base;
}
```

⚠️ Modülün "hiçbir şey import etmiyor" sözü bir sözlük sabitiyle bozulmuyor:
kural React/DOM/SVG içindi. Saf kalıyor, tek başına sınanabiliyor.

- [ ] **Adım 4: Sınamayı çalıştır, geçtiğini gör**

Çalıştır: `npx vitest run src/lib/evolution-loop.test.ts`
Beklenen: PASS (bir sınama arttı)

- [ ] **Adım 5: `EvolutionChart.tsx`i çevir**

Yerel `TIER_LABEL` sabiti siliniyor; `EN.chart.tiers` alıyor.
`aria-label="Zaman"` → `aria-label={EN.chart.timeLabel}`.
Alttaki uyarı paragrafı → `{EN.chart.disclaimer}`.

`TIER_COLOR` **kalıyor** — o metin değil, renk.

- [ ] **Adım 6: `ScentSpace.tsx` etiketini çevir**

`aria-label="Parfümlerin koku uzayındaki dağılımı"` →
`aria-label={EN.draft.spaceLabel}`.

`89`. satırdaki `` aria-label={`${mark.name}, ${mark.brand}`} `` **değişmiyor**
— iki özel ad, çevrilecek bir şey yok.

- [ ] **Adım 7: `/space` doğrulama ekranını çevir**

```tsx
import { EN } from '@/i18n/en';

const EXPECTATIONS: readonly { readonly label: string; readonly ids: readonly string[] }[] = [
  { label: EN.draft.expectations.nasomatto, ids: ['nasomatto-baraonda', 'nasomatto-blamage'] },
  {
    label: EN.draft.expectations.mossy,
    ids: ['parfum-dempire-azemour-les-orangers', 'papillon-dryad'],
  },
  { label: EN.draft.expectations.dirty, ids: ['bogue-maai', 'serge-lutens-muscs-koublai-khan'] },
  { label: EN.draft.expectations.alone, ids: ['juliette-has-a-gun-not-a-perfume'] },
];

// gövde:
<p ...>{EN.site.name}</p>
<h1 ...>{EN.draft.spaceHeading}</h1>
<p ...>{EN.draft.spaceLede(PERFUMES.length)}</p>
<p ...>{EN.draft.spaceHint}</p>
<h2 ...>{EN.draft.checkpoints}</h2>
<h2 ...>{EN.draft.neighbours}</h2>
<p ...>{EN.draft.neighboursNote}</p>

// eksik nokta:
return point ? `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})` : EN.draft.missing;
```

`/evolution` sayfasındaki tek metin `OSMOS` — `{EN.site.name}` olur.

- [ ] **Adım 8: Bütün sınamalar ve ekran**

Çalıştır: `npm test`
Beklenen: 183 yeşil (182 + yeni tekil sınaması).

Ekranda: `http://localhost:3000/evolution` — kaydırıldıkça `Opening · 3 minutes`
gibi yazılar; `http://localhost:3000/space` — `Space draft` başlığı ve
`Checkpoints` listesi. Parfüm sayfasında imzanın saat yazısı artık ilk kareden
sonra da İngilizce.

- [ ] **Adım 9: Commit**

```bash
git add -A
git commit -m "feat: dogrulama ekranlari ve saat Ingilizce

formatDuration ve phaseLabel son parametrelerini varsayilanli aldi
(words = EN.duration / EN.phases): Faz 2'de ayni saat Turkce okunacak ve o gun
imza degismeyecek.

Yeni bir sinama Ingilizcenin Turkcede olmayan ayrimini civiledi: tekil/cogul.
peakMinutes 1 olan notalar var (aldehydes), yani '1 minutes' gercekten ekrana
cikabilirdi.

EvolutionChart'taki yerel TIER_LABEL dustu, EN.chart.tiers aldi. TIER_COLOR
kaldi — o metin degil, renk.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 10: Kaçak Türkçe avcısı ve son kapı

**Dosyalar:**
- Değiştir: `src/i18n/i18n.test.ts` (tarayıcı sınaması eklenir)
- Değiştir: taramanın bulduğu her yer

**Arayüzler:**
- Tüketir: her şey.
- Üretir: "site tamamen İngilizce" iddiasının ölçülmüş hâli.

- [ ] **Adım 1: Tarayıcı sınamasını yaz (kırmızı)**

```ts
/**
 * Kaçak Türkçe avcısı.
 *
 * "Site tamamen İngilizce" bir iddia değil, ölçülen bir şey olsun diye.
 * Yorumlar atlanıyor — kural yalnızca ekrana çıkan metin için, kod yorumları
 * Türkçe kalıyor.
 *
 * Muaf tutulanlar:
 *   · `src/data/**`    — nota ve parfüm verisi iki dilli kalıyor
 *   · `src/i18n/tr.ts` — bekleyen Türkçe sözlüğün evi
 *   · `*.test.ts`      — sınamaların kendi başlıkları ve yorumları
 *   · `throw new Error(...)` satırları — geliştirici metni, ekran metni değil
 *
 * ⚠️ Tarayıcı yorumları atlar ama dizeleri okur: satır içi `//` taşıyan bir dize
 * (URL gibi) o satırın kalanını gizleyebilir. Bu yön güvenli — eksik yakalar,
 * yanlış yakalamaz.
 */
const TURKISH = /[çğıöşüÇĞİÖŞÜ]/;

/** Yorumları düşürür; blok yorumları satırlar arasında takip eder. */
function stripComments(lines: readonly string[]): string[] {
  const out: string[] = [];
  let inBlock = false;

  for (const line of lines) {
    const trimmed = line.trimStart();

    if (inBlock) {
      if (trimmed.includes('*/')) inBlock = false;
      out.push('');
      continue;
    }
    if (trimmed.startsWith('/*') || trimmed.startsWith('{/*')) {
      if (!trimmed.includes('*/')) inBlock = true;
      out.push('');
      continue;
    }
    if (trimmed.startsWith('*') || trimmed.startsWith('//')) {
      out.push('');
      continue;
    }

    out.push(line.split('//')[0]);
  }

  return out;
}

test('ekrana cikabilecek Turkce dize kalmadi', () => {
  const files = [
    ...sourceFiles('src', ['.ts', '.tsx', '.css']),
    ...sourceFiles('public', ['.js']),
  ];
  const offenders: string[] = [];

  for (const file of files) {
    const unixPath = file.split('\\').join('/');
    if (
      unixPath.startsWith('src/data/') ||
      unixPath === 'src/i18n/tr.ts' ||
      unixPath.endsWith('.test.ts')
    ) {
      continue;
    }

    stripComments(readFileSync(file, 'utf8').split('\n')).forEach((line, index) => {
      if (line.includes('throw new Error(')) return;
      if (TURKISH.test(line)) offenders.push(`${unixPath}:${index + 1}: ${line.trim()}`);
    });
  }

  expect(offenders).toEqual([]);
});
```

- [ ] **Adım 2: Sınamayı çalıştır ve listeyi oku**

Çalıştır: `npx vitest run src/i18n/i18n.test.ts`
Beklenen: FAIL ya da PASS. Kırılırsa çıktı her kaçağı `dosya:satır: içerik`
biçiminde yazar. Görevler 4-9 kapsamı doğru yakaladıysa liste boş çıkabilir —
o zaman bu adım yalnızca kapıyı kurmuş olur.

- [ ] **Adım 3: Listedeki her kaçağı gider**

Her satır için karar: ekran metni mi, yoksa yanlışlıkla kalmış bir Türkçe
tanımlayıcı mı? Ekran metniyse sözlüğe taşınır (`en.ts` ve `tr.ts`e birlikte),
tanımlayıcıysa İngilizceleştirilir. **Yorum ise sınamada bir kaçak vardır** —
`stripComments` onu atlamalıydı; sınama düzeltilir, yorum değil.

- [ ] **Adım 4: Sınamayı çalıştır, geçtiğini gör**

Çalıştır: `npm test`
Beklenen: bütün sınamalar yeşil (≈184).

- [ ] **Adım 5: Lint ve üretim derlemesi**

Çalıştır: `npm run lint`
Beklenen: **tamamen sessiz.** Depo bu duruma geçen turda geldi, geriye
düşmemeli.

Çalıştır: `npm run build`
Beklenen: temiz derleme, **195 sayfa**.

- [ ] **Adım 6: Ekranda son tur**

`npm run dev` ile beş ekranın hepsi gezilir: `/`, `/perfume/<bir parfüm>`,
`/notes`, `/note/<bir nota>`, `/evolution`, `/space`. Açılış kapısı yeni bir
sekmede baştan izlenir.

Aranan: Türkçe bir kelime, kırık bir düzen, taşan bir etiket, noktalı büyük İ.

- [ ] **Adım 7: Commit**

```bash
git add -A
git commit -m "test: kacak Turkce avcisi — iddia degil olcum

src/ ve public/ taraniyor, yorumlar atlaniyor, data/ ile i18n/tr.ts muaf
tutuluyor. Ekrana cikabilecek bir Turkce dize kalmissa sinama kirmizi yaniyor.

Boylece 'site tamamen Ingilizce' bir sozden ibaret kalmiyor.

Firlatilan hata mesajlari muaf: gelistirici metni, ekran metni degil — kod
yorumlarinin Turkce kalmasiyla ayni gerekce.

Butun sinamalar yesil, lint sessiz, derleme temiz (195 sayfa).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Bitirme

Bütün görevler bittiğinde `superpowers:finishing-a-development-branch` ile
devam edilir. **Master'a geçmeden sahipten ayrıca izin istenir** — önceki onay
yenisini kapsamıyor, bu deponun yazılı kuralı.

Sahibe gösterilecekler: beş ekran, açılış kapısı, ve sayılar (sınama adedi,
lint, 195 sayfa).
