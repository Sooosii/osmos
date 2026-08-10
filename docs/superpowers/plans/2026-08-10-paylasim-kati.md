# Paylaşım Katı — Uygulama Planı

> **Ajan işçiler için:** ZORUNLU ALT SKILL: Bu planı görev görev uygulamak için
> `superpowers:subagent-driven-development` (tavsiye) ya da
> `superpowers:executing-plans` kullanın. Adımlar onay kutusu (`- [ ]`) ile
> takip ediliyor.

**Hedef:** Bir parfüm ya da nota linki paylaşıldığında veriden çizilmiş bir kart
çıksın; arama motoru 387 sayfayı ve iki dilin eşleşmesini görsün.

**Mimari:** Görseli besleyen karar saf bir modülde (`share-marks.ts`),
`opengraph-image.tsx` yalnızca çiziyor. Sitemap hreflang'i de üretiyor
(`alternates.languages`). Taban adres tek bir saf modülden, çevre
değişkeninden.

**Teknoloji:** Next.js 16.2.12 (`next/og` → Satori), React 19.2.4, TypeScript 5,
Vitest 4. Yeni bağımlılık **eklenmiyor**.

## Küresel Kısıtlar

- **Yeni bağımlılık yok.**
- **Satori tuval bilmiyor.** Görsel yalnızca flexbox, gradyan, dikdörtgen ve
  metinden kurulacak. Tram dokusu, yörünge ve evrim imzası taşınamaz.
- **Fotoğraf yok, uydurma sayı yok** — sitenin baştan beri geçerli iki kuralı.
- **Ekranda büyük noktalı İ yasak**; büyütme `toUpperCase()` ile, CSS
  `uppercase` sitede hiç kullanılmıyor ve bir sınama bunu denetliyor.
- **Renk zinciri tek:** `familyVector → dominantFamily → getFamily().color`.
  İkinci bir kaynak açılmaz.
- **`NEXT_PUBLIC_SITE_URL` varsayılanı `http://localhost:3000`** — uydurma alan
  adı yazılmaz.
- Her görev sonunda `npx tsc --noEmit` ve `npm test` yeşil; son görevde ayrıca
  `npm run lint` sessiz ve `npm run build` temiz.
- **Derleme gerektiren her adımdan önce dev sunucusu durdurulur** — çalışırken
  `.next` silinirse site 500 vermeye başlıyor.
- Commit mesajları ASCII (Türkçe diakritik yok).

---

## Dosya Yapısı

| dosya | sorumluluk |
|---|---|
| `src/lib/site-url.ts` | **yeni.** Saf: taban adres, çevre değişkeninden |
| `src/lib/site-url.test.ts` | **yeni.** |
| `src/lib/share-marks.ts` | **yeni.** Saf: parfümden/notadan nokta listesi |
| `src/lib/share-marks.test.ts` | **yeni.** |
| `src/lib/note-marks.ts` | `noteColor` dışa veriliyor (şu an özel) |
| `src/app/[lang]/notes/page.tsx` | kendi `noteColor` kopyası siliniyor |
| `src/app/sitemap.ts` | **yeni.** 387 sayfa × 2 dil + hreflang |
| `src/app/robots.ts` | **yeni.** |
| `src/app/[lang]/opengraph-image.tsx` | **yeni.** Sabit kart |
| `src/app/[lang]/perfume/[id]/opengraph-image.tsx` | **yeni.** |
| `src/app/[lang]/note/[id]/opengraph-image.tsx` | **yeni.** |
| `src/app/[lang]/layout.tsx` | `metadataBase` |
| altı sayfanın `generateMetadata`sı | `alternates.languages` |

---

## Görev 1: `site-url.ts` — taban adres

**Dosyalar:** Oluştur `src/lib/site-url.ts`, `src/lib/site-url.test.ts`

**Arayüzler:**
- Üretir: `siteUrl(): string` (sondaki eğik çizgi atılmış), `absolute(path: string): string`.

- [ ] **Adım 1: Sınamayı yaz (kırmızı)**

```ts
import { afterEach, describe, expect, test, vi } from 'vitest';
import { absolute, siteUrl } from './site-url';

/**
 * Taban adres.
 *
 * ⚠️ Varsayılan bilerek `localhost`: uydurma bir alan adı yazmak, yayına
 * çıkıldığı gün kimsenin fark etmeyeceği yanlış bir sitemap üretirdi. Yanlış
 * adres sessizce çalışır; eksik adres çalışmaz ve fark edilir.
 */
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('siteUrl', () => {
  test('cevre degiskeni yoksa localhost', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    expect(siteUrl()).toBe('http://localhost:3000');
  });

  test('cevre degiskeni dinleniyor', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example');
    expect(siteUrl()).toBe('https://osmos.example');
  });

  test('sondaki egik cizgi atiliyor — cift egik cizgi uretmesin', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example/');
    expect(siteUrl()).toBe('https://osmos.example');
  });
});

describe('absolute', () => {
  test('yolu tabana ekliyor', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example');
    expect(absolute('/tr/notes')).toBe('https://osmos.example/tr/notes');
    expect(absolute('/')).toBe('https://osmos.example/');
  });
});
```

- [ ] **Adım 2: Çalıştır, kırıldığını gör**

Çalıştır: `npx vitest run src/lib/site-url.test.ts`
Beklenen: FAIL — `Cannot find module './site-url'`

- [ ] **Adım 3: Yaz**

```ts
/**
 * Sitenin taban adresi — saf, tek kaynak.
 *
 * Sitemap ve paylaşım görselleri mutlak adres istiyor; sayfalar istemiyor.
 * Tek yerden okunması, yayına çıkıldığı gün değişecek tek satırın burada
 * olması demek.
 *
 * ⚠️ Varsayılan **bilerek** `localhost`. Uydurma bir alan adı yazmak, yayına
 * çıkıldığı gün kimsenin fark etmeyeceği yanlış bir sitemap üretirdi: yanlış
 * adres sessizce çalışır, eksik adres çalışmaz ve fark edilir.
 */
const FALLBACK = 'http://localhost:3000';

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  const base = raw && raw.trim() !== '' ? raw.trim() : FALLBACK;
  return base.replace(/\/+$/, '');
}

/** Öneksiz bir yolu mutlak adrese çevirir. */
export function absolute(path: string): string {
  return `${siteUrl()}${path}`;
}
```

- [ ] **Adım 4: Çalıştır, geçtiğini gör**

Çalıştır: `npx vitest run src/lib/site-url.test.ts`
Beklenen: PASS (4 sınama)

- [ ] **Adım 5: Commit**

```bash
git add src/lib/site-url.ts src/lib/site-url.test.ts
git commit -m "feat: taban adres tek kaynaktan — site-url.ts

Sitemap ve paylasim gorselleri mutlak adres istiyor. Tek yerden okunmasi,
yayina cikildigi gun degisecek tek satirin orada olmasi demek.

⚠️ Varsayilan BILEREK localhost: uydurma bir alan adi yazmak, yayina
cikildigi gun kimsenin fark etmeyecegi yanlis bir sitemap uretirdi. Yanlis
adres sessizce calisir, eksik adres calismaz ve fark edilir.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 2: `share-marks.ts` — görseli besleyen saf modül

**Dosyalar:**
- Oluştur: `src/lib/share-marks.ts`, `src/lib/share-marks.test.ts`
- Değiştir: `src/lib/note-marks.ts` (`noteColor` dışa veriliyor)
- Değiştir: `src/app/[lang]/notes/page.tsx` (kendi kopyası siliniyor)

**Arayüzler:**
- Tüketir: `getFamily`, `dominantFamily` (`@/data/families`), `familyVector`
  (`@/lib/similarity`), `getNote` (`@/data/notes`).
- Üretir: `interface ShareDot { readonly color: string; readonly weight: number }`,
  `perfumeDots(perfume: Perfume): readonly ShareDot[]`,
  `noteDots(note: Note, perfumes: readonly Perfume[]): readonly ShareDot[]`,
  `SHARE_DOT_LIMIT`.
- Üretir: `noteColor(note: Note): string` artık `note-marks.ts`ten dışa veriliyor.

⚠️ **Bu görev bir tekrarı da kapatıyor.** `noteColor` şu an **iki yerde**
duruyor: `note-marks.ts:52` (özel) ve `notes/page.tsx:33` (özel kopya). Mantık
aynı, tek fark ilkinde ailesiz notaya karşı gürültülü bir hata olması. Spec
"ikinci bir renk kaynağı açılmıyor" diyor; bu görev üçüncüyü eklemek yerine
ikisini bire indiriyor.

- [ ] **Adım 1: Sınamayı yaz (kırmızı)**

```ts
import { describe, expect, test } from 'vitest';
import { PERFUMES } from '@/data/perfumes';
import { NOTES, getNote } from '@/data/notes';
import { getFamily } from '@/data/families';
import { noteColor } from './note-marks';
import { SHARE_DOT_LIMIT, noteDots, perfumeDots } from './share-marks';

/** Altıdan fazla notası olan bir parfüm — sınır sınanabilsin diye. */
const KALABALIK = PERFUMES.find((p) => p.notes.length > SHARE_DOT_LIMIT)!;

describe('perfumeDots', () => {
  test('en fazla alti nokta', () => {
    expect(KALABALIK.notes.length).toBeGreaterThan(SHARE_DOT_LIMIT);
    expect(perfumeDots(KALABALIK)).toHaveLength(SHARE_DOT_LIMIT);
  });

  test('agirliktan hafife siralaniyor', () => {
    const dots = perfumeDots(KALABALIK);
    for (let i = 1; i < dots.length; i += 1) {
      expect(dots[i - 1].weight).toBeGreaterThanOrEqual(dots[i].weight);
    }
  });

  test('altidan az notasi olan parfum kisa liste veriyor, eksik degil', () => {
    const az = PERFUMES.find((p) => p.notes.length < SHARE_DOT_LIMIT);
    if (!az) return;
    expect(perfumeDots(az)).toHaveLength(az.notes.length);
  });

  test('her noktanin rengi gercek bir aile rengi', () => {
    const paletteler = new Set(PERFUMES.flatMap((p) => perfumeDots(p)).map((d) => d.color));
    const aileRenkleri = new Set(NOTES.flatMap((n) => Object.keys(n.families)).map(
      (id) => getFamily(id as Parameters<typeof getFamily>[0]).color,
    ));
    for (const renk of paletteler) expect(aileRenkleri.has(renk)).toBe(true);
  });
});

describe('noteDots', () => {
  test('notayi tasiyan parfumlerin renkleri, en fazla alti', () => {
    const tasinan = NOTES.find((n) => PERFUMES.some((p) => p.notes.some((e) => e.noteId === n.id)))!;
    const dots = noteDots(tasinan, PERFUMES);
    expect(dots.length).toBeGreaterThan(0);
    expect(dots.length).toBeLessThanOrEqual(SHARE_DOT_LIMIT);
  });

  test('hic tasiyicisi olmayan nota bos liste veriyor', () => {
    // Palet ile kullanim listesi ayri seyler — gerekce `note-marks.ts`te.
    const bos = NOTES.find((n) => !PERFUMES.some((p) => p.notes.some((e) => e.noteId === n.id)));
    if (!bos) return;
    expect(noteDots(bos, PERFUMES)).toEqual([]);
  });
});

describe('renk zinciri tek', () => {
  test('ilk noktanin rengi, en agir notanin kendi rengiyle ayni', () => {
    // İkinci bir renk kaynağı açılmadığının sınaması: bağımsız hesaplanan
    // değerle karşılaştırılıyor, "dize mi" diye bakılmıyor.
    for (const perfume of PERFUMES) {
      const enAgir = [...perfume.notes].sort((a, b) => b.weight - a.weight)[0];
      expect(perfumeDots(perfume)[0].color).toBe(noteColor(getNote(enAgir.noteId)));
    }
  });

  test('noktanin agirligi notanin kompozisyondaki agirligi', () => {
    const perfume = PERFUMES[0];
    const enAgir = [...perfume.notes].sort((a, b) => b.weight - a.weight)[0];
    expect(perfumeDots(perfume)[0].weight).toBe(enAgir.weight);
  });
});
```

- [ ] **Adım 2: Çalıştır, kırıldığını gör**

Çalıştır: `npx vitest run src/lib/share-marks.test.ts`
Beklenen: FAIL — `Cannot find module './share-marks'`

- [ ] **Adım 3: `note-marks.ts`teki `noteColor`u dışa ver**

`function noteColor(note: Note): string {` satırı
`export function noteColor(note: Note): string {` olur. Gövde **değişmiyor**.

- [ ] **Adım 4: `notes/page.tsx`teki kopyayı sil**

Dosyadaki yerel `noteColor` fonksiyonu (33–43. satırlar) siliniyor ve
`import { countUsedNotes, noteColor } from '@/lib/note-marks';` ile
değiştiriliyor. `getFamily` importu artık kullanılmıyorsa o da düşüyor.

- [ ] **Adım 5: `share-marks.ts`i yaz**

```ts
import type { Note, Perfume } from '@/data/types';
import { getNote } from '@/data/notes';
import { dominantFamily, getFamily } from '@/data/families';
import { familyVector } from '@/lib/similarity';
import { noteColor } from './note-marks';

/**
 * Paylaşım kartındaki imza satırını besleyen saf modül.
 *
 * `note-marks.ts` ve `space-marks.ts` ile aynı sözleşme ve aynı gerekçe:
 * `opengraph-image.tsx` sınanamaz, bu modül sınanabilir. Bileşen yalnızca
 * çiziyor; hangi noktaların çizileceğine dair tek bir karar taşımıyor.
 */
export interface ShareDot {
  /** Baskın koku ailesinin rengi — haritadaki noktalarla aynı palet. */
  readonly color: string;
  /** 0–1. Kartta nokta çapına çevriliyor. */
  readonly weight: number;
}

/**
 * Kartta en fazla kaç nokta.
 *
 * Altı, kalabalıkla sessizlik arasındaki sınır: daha fazlası imza satırını bir
 * grafiğe çeviriyor, daha azı kompozisyonu eksik anlatıyor.
 */
export const SHARE_DOT_LIMIT = 6;

/** Parfümün notaları: ağırlıktan hafife, en fazla altı. */
export function perfumeDots(perfume: Perfume): readonly ShareDot[] {
  return [...perfume.notes]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, SHARE_DOT_LIMIT)
    .map((entry) => ({ color: noteColor(getNote(entry.noteId)), weight: entry.weight }));
}

/**
 * Notayı taşıyan parfümlerin renkleri — yörüngenin durağan hâli.
 *
 * Taşıyıcısı olmayan nota boş liste veriyor ve bu bir hata değil: palet 136
 * malzemelik, seçki 52 parfümlük. Gerekçe `note-marks.ts`te yazılı.
 */
export function noteDots(note: Note, perfumes: readonly Perfume[]): readonly ShareDot[] {
  return perfumes
    .filter((perfume) => perfume.notes.some((entry) => entry.noteId === note.id))
    .slice(0, SHARE_DOT_LIMIT)
    .map((perfume) => ({
      color: getFamily(dominantFamily(familyVector(perfume))).color,
      weight: perfume.notes.find((entry) => entry.noteId === note.id)?.weight ?? 0.5,
    }));
}
```

- [ ] **Adım 6: Çalıştır, geçtiğini gör**

Çalıştır: `npm test`
Beklenen: hepsi yeşil. `notes/page.tsx` hâlâ derleniyor — `tsc` bunu doğruluyor.

- [ ] **Adım 7: Commit**

```bash
git add -A
git commit -m "feat: paylasim kartini besleyen saf modul — share-marks.ts

Parfumden ve notadan nokta listesi cikaran fonksiyonlar. note-marks ve
space-marks ile ayni sozlesme, ayni gerekce: opengraph-image.tsx sinanamaz, bu
modul sinanabilir.

⚠️ Yaninda bir tekrar kapandi: noteColor IKI yerde duruyordu (note-marks.ts'te
ozel, notes/page.tsx'te ozel kopya). Mantik ayniydi, tek fark ilkinde ailesiz
notaya karsi gurultulu bir hata olmasi. Ucuncusunu eklemek yerine ikisi bire
indirildi — spec'in 'ikinci bir renk kaynagi acilmiyor' sozu ancak boyle dogru.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 3: `sitemap.ts` ve `robots.ts`

**Dosyalar:** Oluştur `src/app/sitemap.ts`, `src/app/robots.ts`,
`src/lib/site-map.test.ts`

**Arayüzler:**
- Tüketir: `siteUrl`, `absolute` (Görev 1); `LOCALES`, `withLocale`
  (`@/i18n/locale`).
- Üretir: `sitemapEntries(): MetadataRoute.Sitemap` (`src/lib/site-map.ts`,
  saf ve sınanabilir); `src/app/sitemap.ts` yalnızca onu döndürüyor.

- [ ] **Adım 1: Sınamayı yaz (kırmızı)**

`src/lib/site-map.test.ts`:

```ts
import { describe, expect, test, vi, afterEach } from 'vitest';
import { NOTES } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import { sitemapEntries } from './site-map';

afterEach(() => {
  vi.unstubAllEnvs();
});

/** Diller dışındaki sabit sayfalar: `/`, `/notes`, `/evolution`, `/space`. */
const SABIT_SAYFA = 4;

describe('sitemapEntries', () => {
  test('her sayfa iki dilde bir kez listeleniyor', () => {
    const entries = sitemapEntries();
    const beklenen = (SABIT_SAYFA + NOTES.length + PERFUMES.length) * 2;
    expect(entries).toHaveLength(beklenen);
  });

  test('her girdide iki dilin de alternatifi var', () => {
    for (const entry of sitemapEntries()) {
      expect(entry.alternates?.languages).toBeDefined();
      expect(Object.keys(entry.alternates!.languages!).sort()).toEqual(['en', 'tr']);
    }
  });

  test('adres cevre degiskenini dinliyor', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example');
    const entries = sitemapEntries();
    for (const entry of entries) expect(entry.url.startsWith('https://osmos.example')).toBe(true);
  });

  test('Turkce adresler /tr onekli, Ingilizce oneksiz', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example');
    const urls = sitemapEntries().map((e) => e.url);
    expect(urls).toContain('https://osmos.example/notes');
    expect(urls).toContain('https://osmos.example/tr/notes');
  });
});
```

- [ ] **Adım 2: Çalıştır, kırıldığını gör**

Çalıştır: `npx vitest run src/lib/site-map.test.ts`
Beklenen: FAIL — `Cannot find module './site-map'`

- [ ] **Adım 3: `src/lib/site-map.ts`i yaz**

```ts
import type { MetadataRoute } from 'next';
import { NOTES } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import { LOCALES, withLocale } from '@/i18n/locale';
import { absolute } from './site-url';

/**
 * Sitemap girdileri — saf, sınanabilir.
 *
 * `app/sitemap.ts` yalnızca bunu döndürüyor: dosya konvansiyonu sınanamıyor,
 * bu modül sınanabiliyor. Depodaki her saf modülle aynı sözleşme.
 *
 * hreflang ayrı bir iş değil: Next'in `alternates.languages` alanı onu doğrudan
 * üretiyor.
 */
const STATIC_PATHS = ['/', '/notes', '/evolution', '/space'] as const;

export function sitemapEntries(): MetadataRoute.Sitemap {
  const paths = [
    ...STATIC_PATHS,
    ...NOTES.map((note) => `/note/${note.id}`),
    ...PERFUMES.map((perfume) => `/perfume/${perfume.id}`),
  ];

  const now = new Date();

  /*
    Her yol iki kez giriyor: bir kez İngilizce adresiyle, bir kez Türkçe.
    İkisi de aynı `alternates` bloğunu taşıyor — arama motoru hangisine
    girerse girsin öbürünü buluyor.
  */
  return paths.flatMap((path) => {
    const languages = Object.fromEntries(
      LOCALES.map((locale) => [locale, absolute(withLocale(locale, path))]),
    );

    return LOCALES.map((locale) => ({
      url: absolute(withLocale(locale, path)),
      lastModified: now,
      alternates: { languages },
    }));
  });
}
```

- [ ] **Adım 4: `src/app/sitemap.ts` ve `robots.ts`i yaz**

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { sitemapEntries } from '@/lib/site-map';

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries();
}
```

```ts
// src/app/robots.ts
import type { MetadataRoute } from 'next';
import { absolute } from '@/lib/site-url';

/** Gizlenecek bir şey yok: site bir harita, bulunması işine yarıyor. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absolute('/sitemap.xml'),
  };
}
```

- [ ] **Adım 5: Çalıştır ve gerçek çıktıyı gör**

Çalıştır: `npm test`
Beklenen: hepsi yeşil.

Sunucuyu başlat, sonra:

```bash
curl -s http://localhost:3000/robots.txt
curl -s http://localhost:3000/sitemap.xml | head -20
curl -s http://localhost:3000/sitemap.xml | grep -c "<url>"
```

Beklenen: `robots.txt` sitemap'i işaret ediyor; `sitemap.xml` `xhtml:link`
alternatifleri taşıyor; `<url>` sayısı **384** (4 sabit + 136 nota + 52 parfüm,
hepsi ×2).

- [ ] **Adım 6: Commit**

```bash
git add -A
git commit -m "feat: sitemap ve robots — hreflang sitemap'in icinden geliyor

384 adres: 4 sabit sayfa + 136 nota + 52 parfum, hepsi iki dilde. Her girdi
iki dilin de alternatifini tasiyor, yani arama motoru hangisine girerse girsin
oburunu buluyor.

hreflang ayri bir is degil: Next'in alternates.languages alani onu dogrudan
uretiyor.

Girdileri kuran sey saf bir modul (site-map.ts); app/sitemap.ts yalnizca onu
donduruyor. Dosya konvansiyonu sinanamiyor, modul sinanabiliyor.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 4: Paylaşım görselleri

**Dosyalar:**
- Oluştur: `src/app/[lang]/opengraph-image.tsx`,
  `src/app/[lang]/perfume/[id]/opengraph-image.tsx`,
  `src/app/[lang]/note/[id]/opengraph-image.tsx`
- Değiştir: `src/app/[lang]/layout.tsx` (`metadataBase`)

**Arayüzler:**
- Tüketir: `perfumeDots`, `noteDots`, `ShareDot` (Görev 2); `siteUrl` (Görev 1);
  `dictFor`, `localeFor`, `say` (`@/i18n/dict`).

⚠️ **Yazı tipi**: `ImageResponse`un varsayılanı kullanılıyor, `fonts` geçilmiyor.
Sitenin Geist'i `next/font/google`dan geliyor ve dosya baytları çalışma anında
elde değil; ikinci bir yazı tipi indirmek yeni bir bağımlılık olurdu. Varsayılan
tipografi **ekranda görülüp onaylanacak** — Satori'nin harf aralıkları
tarayıcınınkiyle birebir değil.

- [ ] **Adım 1: `layout.tsx`e `metadataBase` ekle**

`generateMetadata` içindeki dönüşe eklenir:

```tsx
  return {
    metadataBase: new URL(siteUrl()),
    title: t.site.title,
    description: t.site.description,
  };
```

`import { siteUrl } from '@/lib/site-url';` eklenir.

- [ ] **Adım 2: Parfüm kartını yaz**

`src/app/[lang]/perfume/[id]/opengraph-image.tsx`:

```tsx
import { ImageResponse } from 'next/og';
import { PERFUMES } from '@/data/perfumes';
import { dominantFamily, getFamily } from '@/data/families';
import { familyVector } from '@/lib/similarity';
import { perfumeDots } from '@/lib/share-marks';

export const alt = 'OSMOS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Parfümün paylaşım kartı — aile ışığı ve imza satırı.
 *
 * ⚠️ Satori tuval bilmiyor: sitenin tram dokusu, dönen yörüngesi ve evrim
 * imzası buraya taşınamıyor. Taşınan şey renk, tipografi ve daire.
 *
 * Hangi noktaların çizileceğine dair karar burada değil — `share-marks.ts`te
 * ve orada sınanıyor. Bu dosya yalnızca çiziyor.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { id } = await params;
  const perfume = PERFUMES.find((entry) => entry.id === id);
  if (!perfume) return new ImageResponse(<div style={{ background: '#050507' }} />, size);

  /*
    Kartta dile bağlı hiçbir metin yok: marka, isim, parfümör ve yıl özel ad ve
    sayı. `lang` bu yüzden okunmuyor — ikinci bir dil dalı açmak, çevrilecek
    bir şey yokken bakım borcu olurdu.
  */

  const color = getFamily(dominantFamily(familyVector(perfume))).color;
  const dots = perfumeDots(perfume);
  const kunye = [perfume.perfumer, String(perfume.year)].filter(Boolean).join(', ');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          background: '#050507',
          padding: '72px 96px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '-10%',
            top: '-55%',
            width: '120%',
            height: '110%',
            background: `radial-gradient(50% 50% at 50% 50%, ${color} 0%, rgba(5,5,7,0) 70%)`,
            opacity: 0.5,
            display: 'flex',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: 'rgba(255,255,255,0.45)' }}>
            {perfume.brand.toUpperCase()}
          </div>
          <div style={{ fontSize: 88, color: '#fff', marginTop: 18, lineHeight: 1 }}>
            {perfume.name}
          </div>
          {kunye ? (
            <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.4)', marginTop: 26 }}>
              {kunye}
            </div>
          ) : null}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 34 }}>
            {dots.map((dot, index) => {
              const boy = 16 + Math.round(dot.weight * 20);
              return (
                <div
                  key={index}
                  style={{
                    width: boy,
                    height: boy,
                    borderRadius: boy,
                    background: dot.color,
                    opacity: 0.85,
                    display: 'flex',
                  }}
                />
              );
            })}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            right: 96,
            bottom: 72,
            fontSize: 18,
            letterSpacing: 7,
            color: 'rgba(255,255,255,0.3)',
            display: 'flex',
          }}
        >
          OSMOS
        </div>
      </div>
    ),
    size,
  );
}
```

- [ ] **Adım 3: Nota kartını yaz**

`src/app/[lang]/note/[id]/opengraph-image.tsx` — aynı iskelet, üç farkla:
ışık notanın kendi rengi, künye satırı **bant + tepe dakikası**, noktalar
`noteDots(note, PERFUMES)`.

```tsx
import { ImageResponse } from 'next/og';
import { getNote, hasNote, noteBand } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import { noteColor } from '@/lib/note-marks';
import { noteDots } from '@/lib/share-marks';
import { dictFor, localeFor, say } from '@/i18n/dict';

export const alt = 'OSMOS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!hasNote(id)) return new ImageResponse(<div style={{ background: '#050507' }} />, size);

  const locale = localeFor(lang);
  const t = dictFor(lang);
  const note = getNote(id);
  const color = noteColor(note);
  const dots = noteDots(note, PERFUMES);
  const kunye = `${t.bands[noteBand(id)]} · ${note.volatility.peakMinutes}′`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          background: '#050507',
          padding: '72px 96px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '-10%',
            top: '-55%',
            width: '120%',
            height: '110%',
            background: `radial-gradient(50% 50% at 50% 50%, ${color} 0%, rgba(5,5,7,0) 70%)`,
            opacity: 0.5,
            display: 'flex',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: 'rgba(255,255,255,0.45)' }}>
            {kunye}
          </div>
          <div style={{ fontSize: 88, color: '#fff', marginTop: 18, lineHeight: 1 }}>
            {say(note.name, locale)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 34 }}>
            {dots.map((dot, index) => {
              const boy = 16 + Math.round(dot.weight * 20);
              return (
                <div
                  key={index}
                  style={{
                    width: boy,
                    height: boy,
                    borderRadius: boy,
                    background: dot.color,
                    opacity: 0.85,
                    display: 'flex',
                  }}
                />
              );
            })}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            right: 96,
            bottom: 72,
            fontSize: 18,
            letterSpacing: 7,
            color: 'rgba(255,255,255,0.3)',
            display: 'flex',
          }}
        >
          OSMOS
        </div>
      </div>
    ),
    size,
  );
}
```

⚠️ Görsel rotalarına **`generateStaticParams` yazılmıyor.** Sayfanın kendisi
(`page.tsx`) zaten `{ lang, id }` üretiyor ve görsel aynı segmentte duruyor;
buraya eksik bir liste (`{ id }`) koymak iki kaynak açardı. `NOTES` importu da
bu yüzden gerekmiyor.

- [ ] **Adım 4: Sabit kartı yaz**

`src/app/[lang]/opengraph-image.tsx` — ışık yok, isim `OSMOS`, altında sitenin
kendi cümlesi:

```tsx
import { ImageResponse } from 'next/og';
import { PERFUMES } from '@/data/perfumes';
import { dictFor } from '@/i18n/dict';

export const alt = 'OSMOS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const t = dictFor((await params).lang);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#050507',
          padding: '72px 96px',
        }}
      >
        <div style={{ fontSize: 96, letterSpacing: 26, color: '#fff' }}>OSMOS</div>
        <div
          style={{
            fontSize: 30,
            color: 'rgba(255,255,255,0.4)',
            marginTop: 34,
            maxWidth: 760,
            display: 'flex',
          }}
        >
          {t.space.intro(PERFUMES.length)}
        </div>
      </div>
    ),
    size,
  );
}
```

- [ ] **Adım 5: Görselleri ekranda gör**

Sunucuyu başlat, sonra tarayıcıda (ya da indirip bakarak):

```
http://localhost:3000/perfume/dior-oud-ispahan/opengraph-image
http://localhost:3000/tr/note/oud/opengraph-image
http://localhost:3000/opengraph-image
```

Aranan: ışık aile renginde mi, isim taşıyor mu, noktalar sayfadaki renklerle
aynı mı, tipografi kabul edilebilir mi. **Satori'nin yazı tipi tarayıcınınkiyle
birebir değil** — burada karar veriliyor.

- [ ] **Adım 6: Commit**

```bash
git add -A
git commit -m "feat: paylasim gorselleri — aile isigi ve imza satiri

Parfum, nota ve sabit kart. Isik aile renginde yukaridan iniyor, altta marka ->
isim -> kunye -> nota noktalari, sag altta OSMOS. Sahibin uc yon ve iki ince
ayar arasindan sec tigi hal.

Noktalarin rengi baskin aile, boyu agirlik — haritadaki noktalarla ayni palet.
Hangi noktalarin cizilecegine dair karar burada degil, share-marks.ts'te ve
orada sinaniyor.

⚠️ Yazi tipi ImageResponse'un varsayilani. Sitenin Geist'i next/font/google'dan
geliyor ve dosya baytlari calisma aninda elde degil; ikinci bir yazi tipi
indirmek yeni bir bagimlilik olurdu. Ekranda gorulup onaylandi.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 5: Sayfalarda hreflang ve son kapı

**Dosyalar:** Değiştir — altı sayfanın `generateMetadata`sı

**Arayüzler:** Tüketir: `withLocale`, `LOCALES`; `absolute` (Görev 1).

- [ ] **Adım 1: Ortak yardımcıyı `site-url.ts`e ekle**

```ts
import { LOCALES, withLocale, type Locale } from '@/i18n/locale';

/**
 * Bir sayfanın iki dildeki mutlak adresleri — `alternates.languages` için.
 *
 * Sitemap aynı bilgiyi ayrıca veriyor; ikisi de standart ve arama motoru
 * ikisini birden okuyor. Sitemap tek başına yeterli sayılmıyor.
 */
export function languageAlternates(path: string): Record<Locale, string> {
  return Object.fromEntries(
    LOCALES.map((locale) => [locale, absolute(withLocale(locale, path))]),
  ) as Record<Locale, string>;
}
```

- [ ] **Adım 2: Altı sayfaya ekle**

Her `generateMetadata` dönüşüne `alternates: { languages: languageAlternates(<yol>) }`
ekleniyor. Yollar öneksiz yazılıyor:

| sayfa | yol |
|---|---|
| `[lang]/page.tsx` | `'/'` |
| `[lang]/notes/page.tsx` | `'/notes'` |
| `[lang]/note/[id]/page.tsx` | `` `/note/${id}` `` |
| `[lang]/perfume/[id]/page.tsx` | `` `/perfume/${id}` `` |
| `[lang]/evolution/page.tsx` | `'/evolution'` |
| `[lang]/space/page.tsx` | `'/space'` |

⚠️ `[lang]/page.tsx`, `evolution` ve `space` şu an `generateMetadata`
taşımıyor — eklenmesi gerekiyor. Kök düzenin metadata'sı başlığı zaten
veriyor; buraya yalnızca `alternates` giriyor.

- [ ] **Adım 3: Üretilen HTML'de doğrula**

```bash
curl -s http://localhost:3000/notes | grep -o '<link rel="alternate"[^>]*>'
curl -s http://localhost:3000/tr/notes | grep -o '<link rel="alternate"[^>]*>'
```

Beklenen: her ikisinde de `hreflang="en"` ve `hreflang="tr"` etiketleri, doğru
adreslerle.

- [ ] **Adım 4: Son kapı**

Dev sunucusu **durdurulur**, sonra:

```bash
npm test && npm run lint && rm -rf .next && npm run build
```

Beklenen: bütün sınamalar yeşil, lint sessiz, derleme temiz. Sayfa sayısı
387'den yükselecek — paylaşım görselleri de birer rota.

- [ ] **Adım 5: Commit**

```bash
git add -A
git commit -m "feat: hreflang sayfalarin kendisinde de

Alti sayfanin generateMetadata'sina alternates.languages eklendi. Sitemap ayni
bilgiyi ayrica veriyor; ikisi de standart ve sitemap tek basina yeterli
sayilmiyor.

Uc sayfa (kok, evolution, space) generateMetadata tasimiyordu, eklendi.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Bitirme

`superpowers:finishing-a-development-branch`. Sahip bu tur için master'a merge
iznini önceden verdi ("dogru onayla commitle mastera mergele"); yine de merge
öncesi sınamalar birleşmiş ağaç üzerinde çalıştırılır ve görseller ekranda
görülmüş olmalıdır.
