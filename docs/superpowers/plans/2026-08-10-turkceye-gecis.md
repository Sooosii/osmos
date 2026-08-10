# Türkçeye Geçiş — Uygulama Planı (Faz 2)

> **Ajan işçiler için:** ZORUNLU ALT SKILL: Bu planı görev görev uygulamak için
> `superpowers:subagent-driven-development` (tavsiye) ya da
> `superpowers:executing-plans` kullanın. Adımlar onay kutusu (`- [ ]`) ile
> takip ediliyor.

**Hedef:** Türk bir ziyaretçi köşedeki `EN|TR`ye basıp siteyi bugünkü Türkçesiyle
okuyabilsin; `/` İngilizce kalsın.

**Mimari:** Bütün sayfalar `src/app/[lang]/` altına taşınıyor; `src/proxy.ts`
öneksiz yolları içeriden `/en/...`e yeniden yazıyor, böylece adres çubuğunda
`/en` hiç görünmüyor. Dil kodu bir istemci bağlamıyla (`LocaleProvider`) aşağı
iniyor ve `useDict()` sözlüğü statik bir haritadan çözüyor.

**Teknoloji:** Next.js 16.2.12 (App Router, Turbopack), React 19.2.4,
TypeScript 5, Tailwind 4, Vitest 4. Yeni bağımlılık **eklenmiyor**.

## Küresel Kısıtlar

- **Yeni bağımlılık yok.** i18n kütüphanesi kurulmaz.
- **Ekranda noktalı büyük İ yasak.** Sahibin kesin kuralı.
- **CSS `uppercase` sitede hiç kullanılmaz.** Büyütme her zaman `toUpperCase()`
  ile; `toLocaleUpperCase('tr')` **kullanılmaz** (devrilmiş karar).
- **Hatırlama yok.** Çerez yok, oturum bayrağı yok, tarayıcı diline bakan
  yönlendirme yok. `/` her zaman İngilizce, `/tr` her zaman Türkçe.
- **Kod yorumları Türkçe kalır**; fırlatılan hata mesajları da.
- **Tasarım değişmez.** Düzen, animasyon, renk, boşluk: hiçbirine dokunulmaz.
- **`?mark=` ve `?feel=` dil değiştirirken korunur.**
- Her görev sonunda `npx tsc --noEmit` ve `npm test` yeşil olmalı; son görevde
  ayrıca `npm run lint` sessiz ve `npm run build` temiz.
- Commit mesajları ASCII yazılır (Türkçe diakritik yok), depo geleneği bu.

---

## ⚠️ Planı yazarken çıkan iki tuzak

Bunlar spec'te yok; plan aşamasında bulundular ve tasarımı değiştirdiler.

**① Sözlük prop olarak istemciye geçemez.** İçinde işlev var (`intro(count)`,
`position(i, n)`, `carriersHeading(n)` …) ve React sunucudan istemciye işlev
serileştiremiyor — *"Functions cannot be passed directly to Client Components"*
diye çalışma anında patlardı. Bu, Faz 1'in "dilbilgisi sözlüğün içinde kalsın"
kararının doğrudan sonucu.

**Çözüm:** `LocaleProvider` sözlüğü değil **dil kodunu** (`'en' | 'tr'`, düz bir
dize) taşır; `useDict()` onu statik bir haritadan çözer. İki sözlük de istemci
paketine iner — kabul edilen bedel, ikisi de gerçekten kullanılıyor.

**② `useSearchParams` statik üretimi düşürüyor.** `?mark=`/`?feel=` korumak için
gerekiyor ama Suspense sınırı olmadan bütün sayfayı istemciye düşürüyor —
`app/page.tsx`in kendi yorumu bunu ölçmüş ve yazmış. Sınır koyup yedek olarak
"parametresiz" bir sürüm göstermek de kötü: üretilen HTML'de dil düğmesi
**eksik** olur, sonradan belirir.

**Çözüm:** Değiştirici `<Link>` olarak yalnızca yoldan kuruluyor (statik güvenli,
her zaman doğru); düz sol tıklama `onClick` ile yakalanıp adres parametreleri
canlı `window.location.search`ten okunarak ekleniyor. Ctrl/⌘/orta tık dokunulmadan
yeni sekmede açılıyor — yeni sekme zaten taze bir başlangıç.

---

## Dosya Yapısı

| dosya | sorumluluk |
|---|---|
| `src/i18n/locale.ts` | **yeni.** Saf: dil listesi, önek ekle/at, parametre koru |
| `src/i18n/locale.test.ts` | **yeni.** |
| `src/i18n/dict.ts` | **yeni.** `getDict(locale)` — statik harita |
| `src/i18n/LocaleProvider.tsx` | **yeni.** İstemci bağlamı (**dil kodu**) + `useDict()` |
| `src/proxy.ts` | **yeni.** Öneksiz yolları `/en/...`e yeniden yazar, `/en/...`i kanonik yola yönlendirir |
| `src/components/LangSwitch.tsx` | **yeni.** `EN\|TR` |
| `src/app/[lang]/**` | bütün sayfalar taşınıyor |
| `src/lib/note-measures.ts` | `AXES` sabiti → `axesFor(dict)` |
| `src/i18n/i18n.test.ts` | CSS `uppercase` bekçisi eklenir |

---

## Görev 1: `locale.ts` — saf modül

**Dosyalar:**
- Oluştur: `src/i18n/locale.ts`, `src/i18n/locale.test.ts`

**Arayüzler:**
- Üretir: `LOCALES`, `type Locale`, `DEFAULT_LOCALE`, `isLocale(v)`,
  `stripLocale(pathname)`, `withLocale(locale, path)`,
  `switchPath(pathname, search, target)`.

- [ ] **Adım 1: Sınamayı yaz (kırmızı)**

```ts
import { describe, expect, test } from 'vitest';
import { DEFAULT_LOCALE, LOCALES, isLocale, stripLocale, switchPath, withLocale } from './locale';

/**
 * Adres katının saf tarafı.
 *
 * `space-feel-url.ts` ile aynı sözleşme ve aynı gerekçe: değiştirici bileşeni
 * sınanamaz, bu modül sınanabilir.
 */
describe('isLocale', () => {
  test('yalnizca bilinen diller', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('tr')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale('')).toBe(false);
    expect(isLocale('note')).toBe(false);
  });
});

describe('stripLocale', () => {
  test('oneksiz yol varsayilan dile ait', () => {
    expect(stripLocale('/')).toEqual({ locale: 'en', rest: '/' });
    expect(stripLocale('/notes')).toEqual({ locale: 'en', rest: '/notes' });
    expect(stripLocale('/note/oud')).toEqual({ locale: 'en', rest: '/note/oud' });
  });

  test('tr oneki ayriliyor', () => {
    expect(stripLocale('/tr')).toEqual({ locale: 'tr', rest: '/' });
    expect(stripLocale('/tr/notes')).toEqual({ locale: 'tr', rest: '/notes' });
    expect(stripLocale('/tr/note/oud')).toEqual({ locale: 'tr', rest: '/note/oud' });
  });

  test('dil adiyla baslayan gercek bir yol onek sanilmiyor', () => {
    // 'note' bir dil degil; kirpilmamali.
    expect(stripLocale('/note/tr')).toEqual({ locale: 'en', rest: '/note/tr' });
  });
});

describe('withLocale', () => {
  test('varsayilan dil onek almiyor', () => {
    expect(withLocale('en', '/')).toBe('/');
    expect(withLocale('en', '/notes')).toBe('/notes');
  });

  test('tr onek aliyor, kokte de', () => {
    expect(withLocale('tr', '/')).toBe('/tr');
    expect(withLocale('tr', '/notes')).toBe('/tr/notes');
  });
});

describe('switchPath', () => {
  test('ayni sayfanin obur dildeki hali', () => {
    expect(switchPath('/notes', '', 'tr')).toBe('/tr/notes');
    expect(switchPath('/tr/notes', '', 'en')).toBe('/notes');
    expect(switchPath('/', '', 'tr')).toBe('/tr');
    expect(switchPath('/tr', '', 'en')).toBe('/');
  });

  test('cift onek olusmuyor — ayni dile basmak yerinde birakiyor', () => {
    expect(switchPath('/tr/notes', '', 'tr')).toBe('/tr/notes');
    expect(switchPath('/notes', '', 'en')).toBe('/notes');
  });

  test('adres parametreleri korunuyor', () => {
    // Uzayda bir parfum seciliyken ya da kaydiraclar ayarliyken dil
    // degistiren kisi durumunu kaybetmemeli.
    expect(switchPath('/', '?mark=dior-oud-ispahan', 'tr')).toBe(
      '/tr?mark=dior-oud-ispahan',
    );
    expect(switchPath('/tr', 'mark=x&feel=0.75,,0.3,', 'en')).toBe(
      '/?mark=x&feel=0.75,,0.3,',
    );
  });

  test('bos parametre soru isareti birakmiyor', () => {
    expect(switchPath('/notes', '', 'tr')).toBe('/tr/notes');
    expect(switchPath('/notes', '?', 'tr')).toBe('/tr/notes');
  });
});

describe('LOCALES', () => {
  test('varsayilan dil listenin icinde ve ilk sirada', () => {
    expect(LOCALES[0]).toBe(DEFAULT_LOCALE);
    expect(LOCALES).toEqual(['en', 'tr']);
  });
});
```

- [ ] **Adım 2: Çalıştır, kırıldığını gör**

Çalıştır: `npx vitest run src/i18n/locale.test.ts`
Beklenen: FAIL — `Cannot find module './locale'`

- [ ] **Adım 3: `src/i18n/locale.ts` yaz**

```ts
/**
 * Adres katının saf tarafı — React, DOM ve Next tanımıyor.
 *
 * `space-feel-url.ts` ile aynı sözleşme: bileşen sınanamaz, modül sınanabilir.
 *
 * İngilizce **öneksiz** duruyor (`/notes`), Türkçe önekli (`/tr/notes`). Bu bir
 * tercih değil sahibin kararı: `/` her zaman İngilizce açılır, hatırlama yok.
 */
export const LOCALES = ['en', 'tr'] as const;

export type Locale = (typeof LOCALES)[number];

/** Öneksiz yolların dili. */
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Yolu dil öneki ve geri kalanı olarak ayırır.
 *
 * Geri kalan **öneksiz İngilizce yol**: `/tr/note/oud` → `/note/oud`. Bütün
 * bağlantılar bu biçimde yazılıyor ve dil eklemesi `withLocale`in işi.
 */
export function stripLocale(pathname: string): { readonly locale: Locale; readonly rest: string } {
  const segments = pathname.split('/');
  const first = segments[1] ?? '';

  if (isLocale(first) && first !== DEFAULT_LOCALE) {
    const rest = segments.slice(2).join('/');
    return { locale: first, rest: rest === '' ? '/' : `/${rest}` };
  }

  return { locale: DEFAULT_LOCALE, rest: pathname };
}

/** Öneksiz yola dil önekini takar. Varsayılan dil önek almaz. */
export function withLocale(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

/**
 * Bulunulan sayfanın öbür dildeki adresi — parametreleriyle birlikte.
 *
 * ⚠️ Parametreler bilerek taşınıyor: uzayda bir parfüm seçiliyken (`?mark=`) ya
 * da kaydıraçlar ayarlıyken (`?feel=`) dil değiştiren kişi durumunu
 * kaybetmemeli. Kaybı fark etmek zor, sebebini anlamak daha da zor.
 */
export function switchPath(pathname: string, search: string, target: Locale): string {
  const { rest } = stripLocale(pathname);
  const path = withLocale(target, rest);

  const query = search.startsWith('?') ? search.slice(1) : search;
  return query === '' ? path : `${path}?${query}`;
}
```

- [ ] **Adım 4: Çalıştır, geçtiğini gör**

Çalıştır: `npx vitest run src/i18n/locale.test.ts`
Beklenen: PASS (10 sınama)

- [ ] **Adım 5: Commit**

```bash
git add src/i18n/locale.ts src/i18n/locale.test.ts
git commit -m "feat: adres katinin saf tarafi — locale.ts

Dil listesi, onek ekleme/atma ve dil degistirirken adres parametrelerinin
korunmasi. React, DOM ve Next tanimiyor; space-feel-url.ts ile ayni sozlesme
ve ayni gerekce: degistirici bileseni sinanamaz, bu modul sinanabilir.

Ingilizce oneksiz (/notes), Turkce onekli (/tr/notes). Sahibin karari: / her
zaman Ingilizce acilir, hatirlama yok.

Bir sinama 'note' gibi dil adina benzeyen gercek yollarin kirpilmadigini
denetliyor; bir digeri ?mark= ve ?feel='in korundugunu.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 2: CSS `uppercase` yasağı

**Dosyalar:**
- Değiştir: `src/components/AstronotIntro.tsx:422`
- Değiştir: `src/components/intro.css:127`
- Değiştir: `src/components/NoteMeasures.tsx:96`
- Değiştir: `src/i18n/i18n.test.ts` (bekçi sınaması eklenir)

**Arayüzler:**
- Tüketir: yok.
- Üretir: sitede CSS `uppercase` kalmaması — Türkçe içerik gelmeden önce
  kapanması gereken delik.

- [ ] **Adım 1: Bekçi sınamasını yaz (kırmızı)**

`src/i18n/i18n.test.ts` sonuna:

```ts
/**
 * CSS `uppercase` yasağı.
 *
 * Ölçüldü (Chromium, 2026-08-10): `lang="tr"` altında CSS `text-transform:
 * uppercase` küçük `i`yi noktalı `İ`ye çeviriyor. Sahibin kuralı ekranda
 * noktalı İ olmaması; JS `toUpperCase()` dilden bağımsız çalışıyor ve parfüm
 * künyesinde bu karar zaten yazılı.
 *
 * Yasak, "dile bağlı metinlerde kullanılmasın"dan daha geniş ve bilerek öyle:
 * tek kural iki kuraldan iyi ve bu kural gözle denetlenebilir.
 */
test('sitede CSS uppercase kullanilmiyor', () => {
  const files = [
    ...sourceFiles('src', ['.ts', '.tsx', '.css']),
    ...sourceFiles('public', ['.js']),
  ];
  const offenders: string[] = [];

  for (const file of files) {
    const path = unix(file);
    if (path.endsWith('.test.ts')) continue;

    stripComments(readFileSync(file, 'utf8').split('\n')).forEach((line, index) => {
      if (/text-transform:\s*uppercase|(^|[\s"'`])uppercase([\s"'`]|$)/.test(line)) {
        offenders.push(`${path}:${index + 1}: ${line.trim()}`);
      }
    });
  }

  expect(offenders).toEqual([]);
});
```

- [ ] **Adım 2: Çalıştır, üç kaçağı gör**

Çalıştır: `npx vitest run src/i18n/i18n.test.ts`
Beklenen: FAIL — `AstronotIntro.tsx`, `intro.css`, `NoteMeasures.tsx`.

- [ ] **Adım 3: `AstronotIntro.tsx` ipucunu JS ile büyüt**

`className`den `uppercase` kelimesi çıkar, metin büyütülür:

```tsx
      <p
        ref={hintRef}
        className="absolute -translate-x-1/2 text-[0.6875rem] tracking-[0.3em] whitespace-nowrap text-white/20 [text-indent:0.3em]"
      >
        {EN.intro.hint.toUpperCase()}
      </p>
```

Üstündeki yorum bloğu şununla değişir:

```
        Büyütme CSS'te değil JS'te ve bu ölçülmüş bir karar: `lang="tr"`
        altında CSS `uppercase` küçük i'yi noktalı İ'ye çeviriyor (Chromium'da
        ölçüldü). `toUpperCase()` dilden bağımsız. Aynı karar parfüm
        künyesinde de yazılı.
```

- [ ] **Adım 4: `intro.css`ten `text-transform` satırını kaldır**

`.osmos-intro__hint` kuralından yalnızca `text-transform: uppercase;` satırı
silinir; `letter-spacing`, `text-indent`, `font-size` ve renk **kalır**.

- [ ] **Adım 5: `intro.js` ipucunu büyük harfle ver**

`IntroOverlay.tsx`teki metin ataması:

```tsx
      hint: EN.intro.hint.toUpperCase(),
```

`public/intro.js`teki yedek de büyük harfe döner:

```js
    hint.textContent = text.hint || 'SCROLL TO COME CLOSER';
```

- [ ] **Adım 6: `NoteMeasures.tsx` uç etiketlerini JS ile büyüt**

```tsx
      <div className="mt-2 flex justify-between text-[9px] tracking-[0.2em] text-white/45">
        <span>{formatDuration(STRIP_FIRST_MINUTE).toUpperCase()}</span>
        <span>{formatDuration(SIGNATURE_MAX_MINUTES).toUpperCase()}</span>
      </div>
```

- [ ] **Adım 7: Sınamalar ve ekran**

Çalıştır: `npm test`
Beklenen: bekçi dahil hepsi yeşil.

Ekranda (`npm run dev`): açılış ipucu ve `/note/bergamot` şerit etiketleri
**önceki turdakiyle birebir aynı** görünmeli — değişen yalnızca büyütmenin
nerede yapıldığı.

- [ ] **Adım 8: Commit**

```bash
git add -A
git commit -m "refactor: CSS uppercase kalkti, buyutme JS'e gecti

Uc yer: AstronotIntro ipucu, intro.css perde ipucu, NoteMeasures serit
etiketleri. Ekranda hicbir sey degismiyor — degisen yalnizca buyutmenin nerede
yapildigi.

Sebep olculdu: lang=\"tr\" altinda CSS text-transform uppercase kucuk i'yi
noktali I'ye ceviriyor. Turkce icerik gelmeden once kapanmasi gereken delik
buydu. toUpperCase() dilden bagimsiz ve ayni karar parfum kunyesinde zaten
yazili.

Bir bekci sinama kurali kalici hale getirdi: sitede CSS uppercase sifir kez
geciyor.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 3: `getDict` + `LocaleProvider`

**Dosyalar:**
- Oluştur: `src/i18n/dict.ts`, `src/i18n/LocaleProvider.tsx`
- Değiştir: `src/i18n/i18n.test.ts` (bir sınama eklenir)

**Arayüzler:**
- Tüketir: `Locale`, `DEFAULT_LOCALE`, `isLocale` (Görev 1); `EN`, `TR`, `Dict`.
- Üretir: `getDict(locale: Locale): Dict`, `dictFor(value: string): Dict`,
  `<LocaleProvider locale={Locale}>`, `useDict(): Dict`, `useLocale(): Locale`.

- [ ] **Adım 1: Sınamayı yaz (kırmızı)**

`src/i18n/i18n.test.ts` sonuna:

```ts
test('getDict her dil icin dogru sozlugu veriyor', async () => {
  const { getDict, dictFor } = await import('./dict');

  expect(getDict('en')).toBe(EN);
  expect(getDict('tr')).toBe(TR);
  // Bilinmeyen dil varsayilana düşüyor: adres elle yazılabilir.
  expect(dictFor('de')).toBe(EN);
  expect(dictFor('tr')).toBe(TR);
});
```

- [ ] **Adım 2: Çalıştır, kırıldığını gör**

Çalıştır: `npx vitest run src/i18n/i18n.test.ts`
Beklenen: FAIL — `Cannot find module './dict'`

- [ ] **Adım 3: `src/i18n/dict.ts` yaz**

```ts
import { DEFAULT_LOCALE, isLocale, type Locale } from './locale';
import { EN, type Dict } from './en';
import { TR } from './tr';

/**
 * Dil kodundan sözlüğe — statik harita.
 *
 * ⚠️ Rehberin önerdiği `import()` ile tembel yükleme **kullanılmıyor.** Sebep
 * `LocaleProvider`da: sözlük istemciye prop olarak geçemiyor (içinde işlev
 * var), o yüzden istemci onu kendi paketinden çözmek zorunda. İki sözlük de
 * pakete iniyor; ikisi de gerçekten kullanıldığı için israf değil.
 */
const DICTS: Readonly<Record<Locale, Dict>> = { en: EN, tr: TR };

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}

/** Doğrulanmamış bir dizeden sözlük; tanınmayan dil varsayılana düşer. */
export function dictFor(value: string): Dict {
  return isLocale(value) ? DICTS[value] : DICTS[DEFAULT_LOCALE];
}
```

- [ ] **Adım 4: `src/i18n/LocaleProvider.tsx` yaz**

```tsx
'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_LOCALE, type Locale } from './locale';
import { getDict } from './dict';
import type { Dict } from './en';

/**
 * Sayfanın dili — istemci ağacına inen tek şey.
 *
 * ⚠️ **Bağlam sözlüğü değil dil KODUNU taşıyor.** Sözlükte işlev var
 * (`intro(count)`, `position(i, n)` …) ve React sunucudan istemciye işlev
 * serileştiremiyor: "Functions cannot be passed directly to Client Components"
 * diye çalışma anında patlardı. Dize geçiyor, sözlük istemcide çözülüyor.
 *
 * Bu, Faz 1'in "dilbilgisi sözlüğün içinde kalsın" kararının bedeli ve karar
 * yine de doğru: Türkçe ile İngilizcenin sözcük sırası aynı değil.
 */
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

interface LocaleProviderProps {
  readonly locale: Locale;
  readonly children: ReactNode;
}

export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** İstemci bileşenlerinin sözlüğü. Sunucuda `getDict(lang)` kullanılır. */
export function useDict(): Dict {
  return getDict(useContext(LocaleContext));
}
```

⚠️ React 19'da `<Context>` doğrudan sağlayıcı olarak kullanılabiliyor
(`<LocaleContext value=…>`); `.Provider` yazmak da çalışır ama gereksiz.

- [ ] **Adım 5: Çalıştır, geçtiğini gör**

Çalıştır: `npm test`
Beklenen: hepsi yeşil.

- [ ] **Adım 6: Commit**

```bash
git add src/i18n/dict.ts src/i18n/LocaleProvider.tsx src/i18n/i18n.test.ts
git commit -m "feat: getDict ve LocaleProvider — baglam dil kodunu tasiyor

⚠️ Baglam sozlugu DEGIL dil kodunu tasiyor. Sozlukte islev var (intro(count),
position(i, n) ...) ve React sunucudan istemciye islev serilestiremiyor;
'Functions cannot be passed directly to Client Components' diye calisma
aninda patlardi. Dize geciyor, sozluk istemcide statik haritadan cozuluyor.

Bu, Faz 1'in 'dilbilgisi sozlugun icinde kalsin' kararinin bedeli ve karar yine
de dogru: Turkce ile Ingilizcenin sozcuk sirasi ayni degil, yuzde isareti bile
taraf degistiriyor.

Rehberin onerdigi import() ile tembel yukleme bu yuzden kullanilmiyor: istemci
sozlugu kendi paketinden cozmek zorunda. Iki sozluk de pakete iniyor, ikisi de
gercekten kullaniliyor.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 4: Ağaç `[lang]` altına, proxy kuruluyor

**Dosyalar:**
- Taşı: `src/app/{page.tsx,layout.tsx,evolution,note,notes,perfume,space}` →
  `src/app/[lang]/...`
- Değiştir: taşınan altı sayfanın `params` tipleri ve `generateStaticParams`ları
- Oluştur: `src/proxy.ts`

**Arayüzler:**
- Tüketir: `LOCALES`, `isLocale`, `DEFAULT_LOCALE` (Görev 1).
- Üretir: `/tr/...` adreslerinin çalışması. İçerik hâlâ İngilizce — dil bu
  görevde yalnızca **taşınıyor**, kullanılmıyor.

- [ ] **Adım 1: Dosyaları taşı**

```bash
mkdir src/app/tmp-lang
git mv src/app/page.tsx src/app/layout.tsx src/app/evolution src/app/note src/app/notes src/app/perfume src/app/space src/app/tmp-lang/
git mv src/app/tmp-lang "src/app/[lang]"
```

`src/app/globals.css` **taşınmıyor** — `[lang]/layout.tsx` ona `../globals.css`
ile ulaşacak.

- [ ] **Adım 2: `layout.tsx`i dile bağla**

`src/app/[lang]/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locale";
import { dictFor } from "@/i18n/dict";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = dictFor(lang);
  return { title: t.site.title, description: t.site.description };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  /*
    ⚠️ `lang` artık gerçekten sayfanın dili ve bu bir davranış değişikliği:
    `lang="tr"` altında tarayıcı Türkçe büyütme kuralına geçiyor. Sitede CSS
    `uppercase` kalmadığı için (Görev 2) noktalı İ çıkmıyor; o görev bu
    satırın önkoşuluydu.
  */
  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider locale={lang}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
```

- [ ] **Adım 3: Altı sayfanın parametrelerini genişlet**

Her sayfa `lang`i de alıyor ve `generateStaticParams` iki dili birden üretiyor.

`src/app/[lang]/page.tsx` ve `src/app/[lang]/evolution/page.tsx` (parametresiz
sayfalar) — üst düzen zaten `lang` üretiyor, ek bir şey gerekmiyor.

`src/app/[lang]/notes/page.tsx` — aynı, ek yok. `metadata` sabiti
`generateMetadata`ya döner:

```tsx
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = dictFor(lang);
  return { title: t.notesIndex.title(NOTES.length), description: t.notesIndex.description };
}
```

`src/app/[lang]/note/[id]/page.tsx`:

```tsx
export function generateStaticParams() {
  return LOCALES.flatMap((lang) => NOTES.map((note) => ({ lang, id: note.id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { id } = await params;
  if (!hasNote(id)) return {};

  const note = getNote(id);
  return {
    title: EN.note.title(note.name.en),
    description: note.description.en,
  };
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { id } = await params;
  if (!hasNote(id)) notFound();
  // gövdenin geri kalanı bu görevde değişmiyor
}
```

⚠️ Bu görevde `lang` **okunuyor ama kullanılmıyor**: gövdeler hâlâ `EN` ve
`.en` diyor. Dil bağlama Görev 5'in işi ve ayrı durması bilinçli — taşımanın
kendisi tek başına doğrulanabilir olmalı (derleme 390 sayfa, `/tr` 200 dönüyor)
ki bir şey kırılırsa sebebi taşıma mı bağlama mı belli olsun.

`src/app/[lang]/perfume/[id]/page.tsx` aynı biçimde:

```tsx
export function generateStaticParams() {
  return LOCALES.flatMap((lang) => PERFUMES.map((perfume) => ({ lang, id: perfume.id })));
}
```

`src/app/[lang]/space/page.tsx` — parametresiz, ek yok.

⚠️ `generateStaticParams` **tam bileşimi** döndürüyor (`{ lang, id }`), yalnızca
`{ id }` değil. İç içe biçim de çalışıyor ama bu hâli tek başına okunabilir ve
derlemede sayı doğrulanabilir.

- [ ] **Adım 4: `src/proxy.ts` yaz**

```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale';

/**
 * Dil öneki katmanı.
 *
 * Üç durum var:
 *   · `/tr/...`  → dokunulmuyor.
 *   · `/en/...`  → öneksiz hâline **yönlendiriliyor**. İngilizcenin tek bir
 *                  kanonik adresi olsun diye; `/en/notes` ile `/notes` aynı
 *                  sayfayı iki adreste göstermesin.
 *   · geri kalan → içeriden `/en/...`e **yeniden yazılıyor**. Adres çubuğu
 *                  değişmiyor: `/` bugünkü gibi kalıyor.
 *
 * Next 16'da bu dosyanın adı `proxy.ts` (eskiden `middleware.ts`);
 * `01-app/01-getting-started/16-proxy.md`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split('/')[1] ?? '';

  if (first === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || '/';
    return NextResponse.redirect(url);
  }

  if (isLocale(first)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.rewrite(url);
}

/*
  Uzantılı dosyalar dışarıda: `public/intro.js` ve `favicon.ico` yeniden
  yazılırsa 404 olurlar. `_next` de aynı sebeple.
*/
export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
```

- [ ] **Adım 5: Derleme ve adresler**

Çalıştır: `rm -rf .next && npx next build`
Beklenen: temiz derleme. Sayfa sayısı **390 civarı** (136×2 nota + 52×2 parfüm
+ 2×5 sabit + `_not-found`). Sayı 195'te kalırsa `generateStaticParams` dili
üretmiyordur.

Çalıştır: `npm run dev`, sonra:

```bash
curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" -L http://localhost:3000/
curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" -L http://localhost:3000/tr
curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" -L http://localhost:3000/tr/notes
curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" -L http://localhost:3000/en/notes
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/intro.js
```

Beklenen: ilk üçü `200`; `/en/notes` **`/notes`e yönlenip** `200`;
`/intro.js` `200` (proxy ona dokunmuyor).

- [ ] **Adım 6: Sınamalar**

Çalıştır: `npm test && npx tsc --noEmit`
Beklenen: hepsi yeşil. Sınamalar rota bilmiyor, taşımadan etkilenmiyorlar.

- [ ] **Adım 7: Commit**

```bash
git add -A
git commit -m "feat: agac [lang] altina tasindi, proxy kuruldu

Butun sayfalar src/app/[lang]/ altinda; [lang]/layout.tsx kok duzen oldu ve
<html lang> artik dinamik. proxy.ts oneksiz yollari iceriden /en/...'e yeniden
yaziyor, yani adres cubugunda /en hic gorunmuyor ve / bugunku gibi kaliyor.

/en/... ayrica oneksiz haline yonlendiriliyor: Ingilizcenin tek bir kanonik
adresi olsun, ayni sayfa iki adreste durmasin.

Matcher uzantili dosyalari disarida birakiyor — public/intro.js yeniden
yazilsaydi 404 olurdu.

Icerik hala Ingilizce: bu gorevde dil yalnizca tasiniyor, kullanilmiyor.
Uretim derlemesi 195'ten ~390 sayfaya cikti.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 5: Sunucu tarafı Türkçe konuşuyor

**Dosyalar:**
- Değiştir: `src/app/[lang]/{page,evolution/page,notes/page,note/[id]/page,perfume/[id]/page,space/page}.tsx`
- Değiştir: `src/components/{Neighbors,NoteMeasures,PerfumeNotes}.tsx`
- Değiştir: `src/lib/note-measures.ts` (`AXES` → `axesFor`)
- Değiştir: `src/lib/note-measures.test.ts` (çağrı biçimi)

**Arayüzler:**
- Tüketir: `dictFor` (Görev 3), `Locale` (Görev 1).
- Üretir: `axesFor(dict: Dict): readonly Axis[]`. `AXES` sabiti **kalkıyor**.
- Sunucu alt bileşenleri artık `lang: string` prop'u alıyor:
  `<Neighbors perfume={…} lang={lang} />`,
  `<NoteMeasures volatility={…} character={…} color={…} lang={lang} />`,
  `<PerfumeNotes perfume={…} lang={lang} />`.

- [ ] **Adım 1: `note-measures.test.ts`i yeni çağrıya çevir (kırmızı)**

`AXES` importu `axesFor` olur ve dosyanın başında bir kez çözülür:

```ts
import { EN } from '@/i18n/en';
import { axesFor, /* … */ } from './note-measures';

const AXES = axesFor(EN);
```

Sınama gövdeleri **değişmiyor** — beklentiler aynı, yalnızca `AXES`in nereden
geldiği değişti.

- [ ] **Adım 2: Çalıştır, kırıldığını gör**

Çalıştır: `npx vitest run src/lib/note-measures.test.ts`
Beklenen: FAIL — `axesFor` dışa verilmemiş.

- [ ] **Adım 3: `note-measures.ts`te `AXES` → `axesFor(dict)`**

```ts
import type { Dict } from '@/i18n/en';

/**
 * Dört eksen — sözcükler sözlükten, kimlik ve sıra buradan.
 *
 * Faz 1'de sabitti çünkü tek dil vardı. İki dilde sabit olamaz: aynı eksenin
 * uç adları sayfanın diline göre değişiyor.
 */
export function axesFor(dict: Dict): readonly Axis[] {
  return AXIS_ORDER.map((id) => ({ id, ...dict.axes[id] }));
}
```

`export const AXES` satırı siliniyor; `EN` importu da (artık gerekmiyor —
`axisWord`ün varsayılanı hariç, o duruyor).

- [ ] **Adım 4: Çalıştır, geçtiğini gör**

Çalıştır: `npx vitest run src/lib/note-measures.test.ts`
Beklenen: PASS (25 sınama)

- [ ] **Adım 5: Altı sayfayı sözlüğe bağla**

Her sayfada aynı iki satır: dili oku, sözlüğü çöz. Örnek
(`src/app/[lang]/perfume/[id]/page.tsx`):

```tsx
import { dictFor } from '@/i18n/dict';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const perfume = PERFUMES.find((entry) => entry.id === id);
  if (!perfume) return {};

  const t = dictFor(lang);
  const line = lang === 'tr' ? perfume.line?.tr : perfume.line?.en;
  return {
    title: t.perfume.title(perfume.name, perfume.brand),
    description: line ?? t.perfume.fallbackDescription(perfume.name, perfume.brand),
  };
}

export default async function PerfumePage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const t = dictFor(lang);
  // ... EN.perfume.* -> t.perfume.*, EN.nav.* -> t.nav.*
}
```

⚠️ **Veri de dile bağlanıyor.** Faz 1'de her okuma `.en`e sabitlenmişti; artık
seçim dile göre. Bunun için `src/i18n/dict.ts`e küçük bir yardımcı ekleniyor ve
on beş çağrı ondan geçiyor:

```ts
import type { Localized } from '@/data/types';

/** İki dilli bir alanın o dildeki hâli. */
export function say(value: Localized, locale: Locale): string {
  return value[locale];
}
```

Kullanım: `say(note.name, locale)`, `say(perfume.line, locale)`.
`locale` `isLocale(lang) ? lang : DEFAULT_LOCALE` ile elde ediliyor — sayfa
zaten `notFound()` ile korunuyor, bu yalnızca tipi daraltıyor.

Bağlanacak on beş yer Faz 1'in tablosuyla aynı: `note-marks.ts` (2),
`space-marks.ts` (1), `space/page.tsx` (1), `notes/page.tsx` (1),
`note/[id]/page.tsx` (2), `perfume/[id]/page.tsx` (3),
`EvolutionTimeline` (1), `EvolutionSignature` (2), `EvolutionChart` (1),
`PerfumeNotes` (1). Son dördü istemci tarafında ve **Görev 6'da** bağlanıyor;
bu görevde ilk on birine dokunuluyor.

⚠️ `note-marks.ts` ve `space-marks.ts` saf modüller: dili **parametre** olarak
alıyorlar (`buildNotePage(note, perfumes, locale)`, `buildMarks(perfumes,
locale)`), kendi başlarına sözlük çözmüyorlar. Sınamaları buna göre güncelleniyor
(`note-marks.test.ts` sahte verisi `{ en: id, tr: id }` kullandığı için
beklentiler değişmiyor, yalnızca çağrılar).

- [ ] **Adım 6: Üç sunucu bileşenine `lang` prop'u**

`Neighbors`, `NoteMeasures` ve `PerfumeNotes` sözlüğü sayfadan alıyor:

```tsx
interface NoteMeasuresProps {
  readonly volatility: Volatility;
  readonly character: Character;
  readonly color: string;
  /** Sayfanın dili — bileşenin dili bilmesinin başka yolu yok ve olmamalı. */
  readonly lang: string;
}

export function NoteMeasures({ volatility, character, color, lang }: NoteMeasuresProps) {
  const t = dictFor(lang);
  const axes = axesFor(t);
  // ...
}
```

⚠️ Prop olarak **`lang` geçiyor, sözlük değil**: bu üçü bugün sunucu bileşeni
ama biri yarın `'use client'` alırsa sözlük prop'u işlev taşıdığı için patlardı.
Dize her iki durumda da geçerli.

- [ ] **Adım 7: Sınamalar ve ekranda ilk Türkçe**

Çalıştır: `npm test && npx tsc --noEmit`

Ekranda: `http://localhost:3000/tr/notes` — başlık **Notalar**, bantlar
`ÜST / KALP / DIP`, çerçevede `PALET 136`. `http://localhost:3000/notes` hâlâ
İngilizce.

⚠️ `/tr` kökünde uzay ekranı hâlâ İngilizce görünecek — giriş metni ve
kaydıraçlar istemci tarafında ve Görev 6'da bağlanıyor. Bu ara hâl beklenen.

- [ ] **Adım 8: Commit**

```bash
git add -A
git commit -m "feat: sunucu tarafi Turkce konusuyor

Alti sayfa ve uc sunucu bileseni sozlugu dile gore cozuyor. Veri okumalari da
dile bagli artik: say(value, locale) yardimcisi ile, Faz 1'de .en'e sabitlenmis
on bes yerin on biri.

AXES sabiti axesFor(dict) fonksiyonuna dondu. Faz 1'de sabitti cunku tek dil
vardi; ayni eksenin uc adlari artik sayfanin diline gore degisiyor.

⚠️ Uc sunucu bilesenine prop olarak LANG geciyor, sozluk degil: bugun sunucu
bilesenleri ama biri yarin 'use client' alirsa sozluk prop'u islev tasidigi
icin patlardi. Dize her iki durumda da gecerli.

note-marks ve space-marks saf modul kaldi: dili parametre olarak aliyorlar,
kendi baslarina sozluk cozmuyorlar.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 6: İstemci tarafı Türkçe konuşuyor

**Dosyalar:**
- Değiştir: `src/components/{AstronotIntro,EvolutionChart,EvolutionSignature,IntroOverlay,NoteOrbit,ScentSpace}.tsx`
- Değiştir: `src/components/space/{SpaceOverlays,SpaceFeelSliders,SpaceKeyboardList}.tsx`
- Değiştir: `src/components/EvolutionTimeline.tsx`

**Arayüzler:**
- Tüketir: `useDict()`, `useLocale()` (Görev 3).
- Üretir: yok.

- [ ] **Adım 1: Dokuz istemci dosyasında sözlüğü değiştir**

Her birinde aynı iki satır. Örnek (`SpaceFeelSliders.tsx`):

```tsx
import { useDict } from '@/i18n/LocaleProvider';

export function SpaceFeelSliders({ targetRef, requestDraw }: SpaceFeelSlidersProps) {
  const WORDS = useDict().space.sliders;
  // ...
}
```

⚠️ Modül düzeyindeki `const WORDS = EN.space.sliders;` satırı **kalkmak
zorunda**: kanca ancak bileşenin içinde çağrılabilir.

Dosya listesi ve okudukları dal:

| dosya | sözlük dalı |
|---|---|
| `AstronotIntro.tsx` | `intro.hint` |
| `IntroOverlay.tsx` | `intro.word`, `intro.tag`, `intro.hint` |
| `SpaceOverlays.tsx` | `site.name`, `space.entryHint` |
| `SpaceFeelSliders.tsx` | `space.sliders.*` |
| `SpaceKeyboardList.tsx` | `space.keyboardList`, `space.perfumeLink` |
| `ScentSpace.tsx` | `draft.spaceLabel` |
| `NoteOrbit.tsx` | `note.orbitEmpty`, `note.orbitLabel` |
| `EvolutionChart.tsx` | `chart.*`, artı `formatDuration`/`phaseLabel`e sözlük geçiyor |
| `EvolutionSignature.tsx` | `phases.opening`, `duration.firstSeconds`, `chart.signatureLabel` |

- [ ] **Adım 2: Saat fonksiyonlarına sözlüğü geçir**

`EvolutionChart` ve `EvolutionSignature` bugün `formatDuration(minutes)` ve
`phaseLabel(minutes)` çağırıyor; varsayılan İngilizce. Artık:

```tsx
const t = useDict();
// ...
phaseLabel(minutes, t.phases)
formatDuration(minutes, t.duration)
```

`NoteMeasures` (sunucu) aynısını `dictFor(lang)` ile yapıyor.

⚠️ Bu parametreler Faz 1'de tam bugün için konmuştu ve imzaları değişmiyor.

- [ ] **Adım 3: `EvolutionTimeline` ve `EvolutionSignature` veri okumaları**

Kalan dört `.en` okuması dile bağlanıyor: `EvolutionTimeline` (küratör
cümlesi), `EvolutionSignature` (nota adı + aile adı), `EvolutionChart` (nota
adı), `PerfumeNotes` (nota adı — Görev 5'te `lang` prop'u aldı).

```tsx
const locale = useLocale();
// ...
label: say(note.name, locale),
```

- [ ] **Adım 4: Sınamalar ve ekran**

Çalıştır: `npm test && npx tsc --noEmit && npm run lint`

Ekranda `http://localhost:3000/tr`:
- giriş metni "52 parfüm, konumları nota akrabalığından hesaplandı…"
- kaydıraç uçları `SOĞUK/SICAK`, `KIRLI/TEMIZ`, "…" açınca `KADIFE/KESKIN` ve
  `HAVADA/TENDE`
- giriş şeridi `KAYDIRMAYA DEVAM ET`
- açılış perdesi ve astronot ipucu `YAKLAŞMAK IÇIN KAYDIR`

⚠️ **Bu ekranda noktalı İ aranacak.** `lang="tr"` artık gerçek; Görev 2 deliği
kapattıysa hiçbir yerde İ görünmemeli.

- [ ] **Adım 5: Commit**

```bash
git add -A
git commit -m "feat: istemci tarafi Turkce konusuyor

Dokuz istemci dosyasi useDict() kullaniyor. Ucu ('use client' isaretsiz olan
SpaceOverlays, SpaceFeelSliders, SpaceKeyboardList) yine istemci: siniri
ScentSpaceCanvas ciziyor ve gerekce dosyalarinin kendi basliklarinda yazili.

SpaceFeelSliders'taki modul duzeyi sabit kalkti — kanca ancak bilesenin icinde
cagrilabilir.

formatDuration ve phaseLabel artik sozluklerini cagirandan aliyor. Bu
parametreler Faz 1'de tam bugun icin konmustu; imzalari degismedi.

Ekranda /tr Turkce ve noktali I yok: lang=\"tr\" artik gercek ve Gorev 2'nin
kapattigi delik tutuyor.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 7: Değiştirici

**Dosyalar:**
- Oluştur: `src/components/LangSwitch.tsx`
- Değiştir: `src/components/ScreenFrame.tsx`
- Değiştir: `src/components/space/SpaceOverlays.tsx`

**Arayüzler:**
- Tüketir: `switchPath`, `stripLocale`, `LOCALES` (Görev 1).
- Üretir: `<LangSwitch />`.

- [ ] **Adım 1: `LangSwitch.tsx` yaz**

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { LOCALES, stripLocale, switchPath } from '@/i18n/locale';

/**
 * Dil değiştirici — sitenin tek "meta" kontrolü.
 *
 * ⚠️ **`useSearchParams` bilerek kullanılmıyor.** Suspense sınırı olmadan
 * bütün sayfayı istemciye düşürüyor (`app/[lang]/page.tsx`in kendi yorumu bunu
 * ölçmüş); sınır koyup yedek göstermek de kötü, çünkü üretilen HTML'de dil
 * düğmesi eksik olur ve sonradan belirir.
 *
 * Bunun yerine: bağlantı yalnızca yoldan kuruluyor (statik güvenli ve her
 * zaman doğru), düz sol tıklama yakalanıp adres parametreleri **canlı**
 * `window.location.search`ten ekleniyor. Ctrl/⌘/orta tık dokunulmadan geçiyor
 * ve yeni sekmede parametresiz açılıyor — yeni sekme zaten taze bir başlangıç.
 *
 * Parametrelerin korunması süs değil: uzayda bir parfüm seçiliyken (`?mark=`)
 * ya da kaydıraçlar ayarlıyken (`?feel=`) dil değiştiren kişi durumunu
 * kaybetmemeli.
 */
export function LangSwitch({ className = '' }: { readonly className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = stripLocale(pathname).locale;

  return (
    <div className={`flex items-center gap-1.5 text-[9px] tracking-[0.18em] ${className}`}>
      {LOCALES.map((locale, index) => (
        <span key={locale} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span aria-hidden="true" className="text-white/15">
              |
            </span>
          ) : null}

          {locale === active ? (
            <span aria-current="true" className="text-white/70">
              {locale.toUpperCase()}
            </span>
          ) : (
            <Link
              href={switchPath(pathname, '', locale)}
              hrefLang={locale}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                router.push(switchPath(pathname, window.location.search, locale));
              }}
              className="text-white/30 transition-colors hover:text-white/70"
            >
              {locale.toUpperCase()}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Adım 2: `ScreenFrame`in üst şeridine tak**

`readouts` listesinin sağına, aynı `<div>` içinde:

```tsx
          <div className="flex items-center gap-3 sm:gap-5">
            <dl className="flex items-center gap-3 text-[9px] tracking-[0.18em] text-white/35 sm:gap-5">
              {/* readouts — değişmiyor */}
            </dl>
            <LangSwitch />
          </div>
```

⚠️ `ScreenFrame` sunucu bileşeni ve öyle kalıyor: `LangSwitch` kendi
`'use client'` sınırını taşıyor, sarmalayan bileşeni istemciye düşürmüyor.

- [ ] **Adım 3: Uzayda sağ üst köşeye tak**

`SpaceOverlays.tsx`te, sol üst sütunun kardeşi olarak:

```tsx
      {/*
        Dil değiştirici — sağ üst.

        Yaklaşma sahnesi boyunca yok, varışta beliriyor: "sahne boyunca ekranda
        kontrol olmaz" kuralı kaydıraçlarda yazılı ve burada da geçerli.
      */}
      <div
        ref={switchRef}
        className="pointer-events-auto absolute right-6 top-6 opacity-0 transition-opacity duration-700 sm:right-10 sm:top-10"
      >
        <LangSwitch />
      </div>
```

`switchRef` `SpaceOverlaysProps`a ekleniyor ve `use-approach-scene.ts`in
`paintScene`ine bağlanıyor.

⚠️ **Örnek `introRef` DEĞİL, `feelRef`.** İkisi farklı davranıyor ve fark
kritik:

```ts
    // introRef — düz metin, yalnızca opaklık:
    if (introRef.current) {
      introRef.current.style.opacity = active ? '0' : '1';
    }

    // feelRef — içinde odaklanılabilir öğe var, ayrıca inert:
    if (feelRef.current) {
      feelRef.current.style.opacity = active ? '0' : '1';
      feelRef.current.toggleAttribute('inert', active);
    }
```

Değiştiricinin içinde `<Link>` var, yani **odaklanılabilir**. Yalnızca opaklık
verilirse klavyeyle gezen biri, sahne sürerken ekranda hiç görünmeyen bir
bağlantıya düşer. Depo bu tuzağı iki kez yazmış (`SpaceFeelSliders`'ta `inert`,
`PerfumeNotes`'ta "görünmez link yarı zamanlı bir tuzak"); üçüncüsü açılmayacak.
Eklenecek blok:

```ts
    if (switchRef.current) {
      switchRef.current.style.opacity = active ? '0' : '1';
      switchRef.current.toggleAttribute('inert', active);
    }
```

- [ ] **Adım 4: Ekranda doğrula**

`npm run dev`:
- `/notes` üst şeridinde sağda `EN|TR`, EN parlak
- `EN|TR`den TR'ye bas → `/tr/notes`, sayfa Türkçe, TR parlak
- `/` uzayda: yaklaşma bitene kadar düğme **yok**, varışta beliriyor
- bir parfüm seç (`?mark=` adrese düşer), TR'ye bas → `/tr?mark=…` ve **seçim
  duruyor**
- kaydıraç ayarla (`?feel=` düşer), TR'ye bas → `?feel=` **duruyor**
- TR'ye ctrl+tık → yeni sekmede `/tr` (parametresiz, beklenen)

- [ ] **Adım 5: Sınamalar**

Çalıştır: `npm test && npx tsc --noEmit && npm run lint`

- [ ] **Adım 6: Commit**

```bash
git add -A
git commit -m "feat: dil degistirici — kosede EN|TR

Belge sayfalarinda ScreenFrame'in ust seridinde, uzayda sag ust kosede.
Uzayda yaklasma sahnesi boyunca yok, varista giris metniyle ayni anda
beliriyor: 'sahne boyunca ekranda kontrol olmaz' kurali kaydiraclarda yazili.

⚠️ useSearchParams bilerek kullanilmadi: Suspense sinirsiz butun sayfayi
istemciye dusuruyor (app sayfasinin kendi yorumu bunu olcmus), sinir koyup
yedek gostermek de kotu cunku uretilen HTML'de dugme eksik olur ve sonradan
belirir. Baglanti yalnizca yoldan kuruluyor; duz sol tiklama yakalanip
parametreler canli window.location.search'ten ekleniyor. Ctrl/orta tik
dokunulmadan geciyor.

Parametrelerin korunmasi sus degil: uzayda bir parfum seciliyken ya da
kaydiraclar ayarliyken dil degistiren kisi durumunu kaybetmemeli.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Görev 8: Son kapı

**Dosyalar:**
- Değiştir: bulunan her yer

- [ ] **Adım 1: Bütün sınamalar**

Çalıştır: `npm test`
Beklenen: hepsi yeşil (184 + Görev 1'in 10'u + Görev 2 ve 3'ün birer sınaması
≈ 196).

- [ ] **Adım 2: Lint ve üretim derlemesi**

Çalıştır: `npm run lint`
Beklenen: **tamamen sessiz.**

Çalıştır: `rm -rf .next && npm run build`
Beklenen: temiz, **~390 sayfa**.

- [ ] **Adım 3: Üretilen HTML'de İ avı**

Türkçe sayfaları çekip noktalı büyük İ ara:

```bash
for p in /tr /tr/notes /tr/note/bergamot /tr/perfume/dior-oud-ispahan /tr/evolution /tr/space; do
  echo "--- $p"
  curl -s "http://localhost:3000$p" | grep -o "İ[A-ZÇĞİÖŞÜ]*" | sort -u | head
done
```

Beklenen: hiçbir çıktı yok. Çıkarsa Görev 2'nin kapattığı delik geri açılmış
demektir — kaynağı bul, CSS `uppercase` geri gelmiş olmalı.

- [ ] **Adım 4: İngilizce hâlâ bozulmamış**

```bash
for p in / /notes /note/bergamot /perfume/dior-oud-ispahan; do
  curl -s "http://localhost:3000$p" | grep -c "parfüm\|Notalar\|KOMŞULAR" || true
done
```

Beklenen: hepsi `0`.

- [ ] **Adım 5: Ekranda son tur**

Altı ekranın ikişer dili: `/` ve `/tr`, `/notes` ve `/tr/notes`,
`/note/bergamot` ve `/tr/note/bergamot`, `/perfume/…` ikisi, `/evolution`
ikisi, `/space` ikisi. Açılış kapısı yeni sekmede, iki dilde.

Aranan: yarım çevrilmiş bir ekran, kırık düzen, taşan etiket, noktalı İ.

- [ ] **Adım 6: Commit**

```bash
git add -A
git commit -m "chore: Faz 2 son kapi — iki dil, iki adres, sifir I

Butun sinamalar yesil, lint sessiz, uretim derlemesi ~390 sayfa. Uretilen
Turkce HTML'de noktali buyuk I yok; Ingilizce sayfalarda Turkce kelime yok.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Bitirme

`superpowers:finishing-a-development-branch` ile devam edilir. **Master'a
geçmeden sahipten ayrıca izin istenir** — önceki onay yenisini kapsamıyor.
