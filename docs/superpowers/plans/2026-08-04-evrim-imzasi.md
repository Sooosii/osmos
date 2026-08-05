# Evrim İmzası Uygulama Planı (yol haritası ②)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (önerilen) veya superpowers:executing-plans ile bu planı görev görev uygula. Adımlar `- [ ]` kutucuk sözdizimiyle takip ediliyor.

## Context

Parfüm sayfası (`src/app/parfum/[id]/page.tsx`) bugün yol haritasının ① (isim + marka + küratör cümlesi) ve ③ (evrim çizelgesi) bölümlerinden oluşuyor. Dosyanın kendi yorumu (satır 16) ②'nin — "imzanın grafiğe dönüşmesi, morph" — Aşama 2'ye ait olduğunu söylüyor. Yaklaşma sahnesi bittiğine göre Aşama 2'de kalan tek madde bu.

Sorun şu: ③ şu anda bir **kaydıraçla** sürülüyor. Kullanıcı kararı net — kaydıraç kalkıyor, ama kaydıracın *anlattığı* şey (zamanın saniye saniye ilerlemesi) kalıyor. Ekranda hiç durmadan kendiliğinden dönen bir imza olacak: biçim (eğri ↔ çubuk) ve zaman (0 → 12 saat) birlikte döngüde, tur 12 saniye, üstünde nerede olduğunu söyleyen bir satır.

Amaç `page.tsx:115`'teki tek cümleyi doğru kılmak: **"aa, o aslında veriymiş."** İmza ayrı bir süs değil, çizelgenin kendisinin başka bir hâli — eğri dümdüz olup çubuğa oturduğunda çubuğun uzunluğu o notanın o andaki yüzdesi.

Onaylı tasarım: `docs/superpowers/specs/2026-08-04-evrim-imzasi-design.md`.

**Goal:** Parfüm sayfasındaki evrim çizelgesini, kaydıraçsız ve hiç durmadan kendiliğinden dönen bir SVG "evrim imzası"na dönüştürmek.

**Architecture:** Döngünün bütün matematiği React ve DOM bilmeyen saf bir modülde (`evolution-loop.ts`), `space-approach.ts` ile aynı sözleşmede. Yeni bir istemci bileşeni (`EvolutionSignature.tsx`) tek bir `requestAnimationFrame` döngüsüyle SVG `<path>`lerin `d` özniteliğini ve saat yazısını **ref üzerinden** yazıyor — kare başına `setState` yok. Mevcut `EvolutionChart` hiç değişmiyor; `/evrim` doğrulama ekranı kaydıracıyla olduğu gibi kalıyor.

**Tech Stack:** Next.js 16.2.12 (App Router), React 19.2.4, TypeScript strict, Tailwind v4, Vitest 4.

## Global Constraints

- **Bütün UI metni ve kod yorumları Türkçe.** Projenin tamamı böyle.
- **`EvolutionChart.tsx` ve `EvolutionTimeline.tsx` davranışı değişmiyor.** Çizelge iki yerden kullanılıyor (`page.tsx:118` ve `EvolutionTimeline.tsx:71`); kaydıracı `/evrim` doğrulama ekranının işi.
- **`prefers-reduced-motion` ayrımı YOK.** Animasyon herkeste, her zaman dönüyor. Kullanıcı kararı, bilinçli ödün. Bunu "ekleyerek iyileştirmeye" çalışma.
- **Kare başına `setState` yasak.** `EvolutionChart.tsx:26`'nın ölçerek koyduğu kural.
- **Tuval (Canvas 2D) değil SVG.** Nota adları gerçek `<text>` kalacak — `ScentSpaceCanvas.tsx:216`'nın aynı gerekçesi.
- **Tur süresi 12 saniye** (`CYCLE_MS = 12_000`), **kapsanan süre 12 saat** (`MAX_MINUTES = 720`).
- **Saat yazısı kalıyor.** Kullanıcı: "kesinlikle kalsın yoksa anlamsız olur".
- **Vitest'in `@/` takma adı YOK.** Depoda `vitest.config.*` yok; `space-approach.test.ts` göreli yolla (`./space-approach`) import ediyor. Sınanan modül **hiçbir şey import etmemeli** ya da yalnızca göreli import kullanmalı.
- **`AGENTS.md`:** bu Next.js senin bildiğin Next.js değil. Kod yazmadan önce ilgili rehberi `node_modules/next/dist/docs/` altından oku — bu iş için `01-app/01-getting-started/05-server-and-client-components.md`.
- Commit biçimi: `<type>: <açıklama>` (feat, fix, refactor, docs, test, chore).

---

## Dosya Yapısı

| Dosya | Sorumluluk |
|---|---|
| `src/lib/evolution-loop.ts` (**yeni**) | Döngü matematiği + zaman metinleri. Saf, import'suz, tek başına sınanabilir. |
| `src/lib/evolution-loop.test.ts` (**yeni**) | Yukarıdakinin sınamaları. |
| `src/components/EvolutionSignature.tsx` (**yeni**) | Kendiliğinden dönen SVG imza. Tek istemci bileşeni. |
| `src/data/families.ts` (değişiyor) | `dominantFamily` buraya taşınıyor — yaprak modül, istemciye inebilir. |
| `src/lib/space-marks.ts` (değişiyor) | `dominantFamily`'yi dışa açmayı bırakıyor, `families.ts`'ten alıyor. |
| `src/components/EvolutionChart.tsx` (değişiyor) | Zaman fonksiyonlarını `evolution-loop.ts`'ten alıyor. Görünen davranış aynı. |
| `src/app/parfum/[id]/page.tsx` (değişiyor) | `EvolutionChart` → `EvolutionSignature`; import ve yorum güncellemesi. |

---

## Task 1: Döngü modülü — `evolution-loop.ts`

**Files:**
- Create: `src/lib/evolution-loop.ts`
- Create: `src/lib/evolution-loop.test.ts`
- Modify: `src/components/EvolutionChart.tsx` (satır 30–31, 49–67, 140 — yerel fonksiyonlar siliniyor, import ekleniyor)
- Modify: `docs/superpowers/specs/2026-08-04-evrim-imzasi-design.md` (satır 73 ve 135 — yanlış sayı düzeltmesi)

**Interfaces:**
- Consumes: yok (ilk görev).
- Produces: `CYCLE_MS: number`, `MAX_MINUTES: number`, `cycleProgress(elapsedMs: number): number`, `minutesAt(progress: number): number`, `morphAt(progress: number): number`, `formatDuration(minutes: number): string`, `phaseLabel(minutes: number): string`.

### ⚠️ Önce oku: spec'te yanlış bir sayı var

Spec (satır 73 ve 135) "turun ilk yarısı ilk 1 saati kaplıyor" diyor ve `minutesAt(0.5) ≈ 60` sınamasını istiyor. **Bu yanlış.** Gerçek değer:

```
minutesAt(0.5) = expm1(0.5 × log1p(720)) = e^3.2903 − 1 ≈ 25.8 dakika
```

İlk saat turun **%62'sini** kaplıyor (`minutesAt(0.6247) = 60`). İddia `EvolutionChart.tsx:17`'deki eski yorumdan miras; o yorum da baştan beri fazla iddialıydı. Tasarımın özü bozulmuyor — turun yarıdan fazlası hâlâ ilk saate ayrılıyor, kokunun ilginç kısmı yavaş geçiyor. Yalnızca cümle düzeltiliyor. Aşağıdaki sınama doğru olanı sınıyor.

- [ ] **Step 1: Sınamaları yaz (kırmızı)**

`src/lib/evolution-loop.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  CYCLE_MS,
  MAX_MINUTES,
  cycleProgress,
  formatDuration,
  minutesAt,
  morphAt,
  phaseLabel,
} from './evolution-loop';

/**
 * Evrim imzasının saatinin sınamaları.
 *
 * Modül saf olduğu için tarayıcı, React ya da SVG gerekmiyor — `space-approach.test.ts`
 * ile aynı sözleşme. Sınanan şey davranış: döngü başa dönüyor mu, zaman eşlemesi
 * uçlara oturuyor mu, biçim turda kaç kez gidip geliyor.
 */

describe('cycleProgress', () => {
  test('tur başında sıfır, tur sonunda başa dönüyor', () => {
    expect(cycleProgress(0)).toBe(0);
    expect(cycleProgress(CYCLE_MS)).toBe(0);
    expect(cycleProgress(CYCLE_MS * 7)).toBe(0);
  });

  test('turun ortası yarıda', () => {
    expect(cycleProgress(CYCLE_MS / 2)).toBeCloseTo(0.5);
    expect(cycleProgress(CYCLE_MS * 3.5)).toBeCloseTo(0.5);
  });

  test('hiçbir girdide 0–1 aralığından çıkmıyor — negatif dahil', () => {
    for (let ms = -5_000; ms < 60_000; ms += 137) {
      const progress = cycleProgress(ms);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThan(1);
    }
  });
});

describe('minutesAt', () => {
  test('uçlar tam oturuyor', () => {
    expect(minutesAt(0)).toBe(0);
    expect(minutesAt(1)).toBeCloseTo(MAX_MINUTES, 6);
  });

  test('tek yönlü artıyor — zaman hiç geri gitmiyor', () => {
    let previous = minutesAt(0);
    for (let p = 0.05; p <= 1; p += 0.05) {
      const current = minutesAt(p);
      expect(current).toBeGreaterThan(previous);
      previous = current;
    }
  });

  test('turun yarısından fazlası ilk saate ayrılıyor', () => {
    // "12 saniye ama notaları takip etmek kolay olsun" isteğini karşılayan şey bu:
    // eşleme logaritmik, kokunun ilginç kısmı turun büyük bölümünü kaplıyor.
    expect(minutesAt(0.5)).toBeLessThan(60);
    expect(minutesAt(0.6)).toBeLessThan(60);
    expect(minutesAt(0.7)).toBeGreaterThan(60);
  });
});

describe('morphAt', () => {
  test('turda iki tam gidiş geliş', () => {
    expect(morphAt(0)).toBeCloseTo(0);
    expect(morphAt(0.25)).toBeCloseTo(1);
    expect(morphAt(0.5)).toBeCloseTo(0);
    expect(morphAt(0.75)).toBeCloseTo(1);
    expect(morphAt(1)).toBeCloseTo(0);
  });

  test('tur başı ile tur sonu aynı — döngüde ek yeri görünmüyor', () => {
    expect(morphAt(1)).toBeCloseTo(morphAt(0), 10);
  });

  test('0–1 dışına çıkmıyor', () => {
    for (let p = 0; p <= 1; p += 0.01) {
      expect(morphAt(p)).toBeGreaterThanOrEqual(0);
      expect(morphAt(p)).toBeLessThanOrEqual(1);
    }
  });
});

describe('formatDuration', () => {
  test('bir dakikanın altı sözle söyleniyor', () => {
    expect(formatDuration(0)).toBe('ilk saniyeler');
    expect(formatDuration(0.4)).toBe('ilk saniyeler');
  });

  test('saatin altı dakikayla', () => {
    expect(formatDuration(3)).toBe('3 dakika');
  });

  test('tam saat dakikasız yazılıyor', () => {
    expect(formatDuration(120)).toBe('2 saat');
  });

  test('saat ve dakika birlikte', () => {
    expect(formatDuration(185)).toBe('3 saat 5 dakika');
  });
});

describe('phaseLabel', () => {
  test('evre sınırları', () => {
    expect(phaseLabel(0)).toBe('Açılış');
    expect(phaseLabel(14)).toBe('Açılış');
    expect(phaseLabel(15)).toBe('Kalp');
    expect(phaseLabel(119)).toBe('Kalp');
    expect(phaseLabel(120)).toBe('Dip');
  });
});
```

- [ ] **Step 2: Sınamayı çalıştır, kırmızı olduğunu gör**

```
npm test
```
Beklenen: `evolution-loop.test.ts` "Failed to resolve import ./evolution-loop" ile patlıyor. `space-approach.test.ts`'in 9 sınaması yeşil kalıyor.

- [ ] **Step 3: Modülü yaz**

`src/lib/evolution-loop.ts`:

```ts
/**
 * Evrim imzasının saati.
 *
 * `space-approach.ts` ile aynı sözleşme: React, DOM, SVG bilmiyor ve hiçbir şey
 * import etmiyor — tek başına okunup sınanabiliyor. Ekranda hiç durmadan dönen
 * animasyonun tamamı bu dosyadaki üç sayıdan ibaret; bileşenin işi yalnızca çizmek.
 *
 * Zaman eşlemesi logaritmik ve bu bir süsleme değil zorunluluk: doğrusal olsaydı
 * kokunun bütün ilginç kısmı (ilk yarım saat) 12 saniyelik turun ilk yarım
 * saniyesinde biter, geri kalan 11.5 saniye neredeyse hiç kıpırdamayan çubukları
 * seyretmekle geçerdi.
 *
 * Eşleme eskiden `EvolutionChart` içindeki kaydıracın eşlemesiydi; buraya taşındı
 * ki imza ile çizelge aynı zamanı göstersin. İki kopya olsaydı biri düzeltilip
 * diğeri unutulduğunda parfüm sayfası ile `/evrim` farklı dakikalar gösterirdi.
 */

/** Tam bir turun süresi. Doğrudan kullanıcı kararı. */
export const CYCLE_MS = 12_000;

/** Turun kapsadığı koku ömrü — 12 saat. */
export const MAX_MINUTES = 720;

/** Kaydıracın adım sayısı; `EvolutionChart` ham adımı buna bölüp ilerleme buluyor. */
export const SLIDER_STEPS = 1000;

/**
 * Geçen süreden döngüsel ilerleme, 0–1.
 *
 * Negatif girdi de sarılıyor: `performance.now()` farkı teoride negatif çıkmaz
 * ama saat kaynağı değişirse fonksiyon aralık dışına çıkmaktansa geriye sarsın.
 */
export function cycleProgress(elapsedMs: number): number {
  const wrapped = elapsedMs % CYCLE_MS;
  return (wrapped < 0 ? wrapped + CYCLE_MS : wrapped) / CYCLE_MS;
}

/**
 * İlerlemeden dakika — logaritmik.
 *
 * Uçlar tam oturuyor: `minutesAt(0) === 0`, `minutesAt(1) === MAX_MINUTES`.
 * Ortası oturmuyor ve oturmamalı: turun yarısı ilk ~26 dakikayı, %62'si ilk saati
 * kaplıyor. Kalan %38'de 11 saat akıp gidiyor — o bölümde zaten pek bir şey olmuyor.
 */
export function minutesAt(progress: number): number {
  return Math.expm1(progress * Math.log1p(MAX_MINUTES));
}

/**
 * İlerlemeden biçim: 0 = eğri, 1 = çizelge.
 *
 * Turda iki tam gidiş geliş. Kosinüs seçildi çünkü uçlarda türev sıfır — biçim
 * yerine oturduğunda bir an duraklıyor ve çizelge okunacak zaman buluyor. Ayrıca
 * `morphAt(0) === morphAt(1)`, yani sonsuz döngüde ek yeri görünmüyor.
 */
export function morphAt(progress: number): number {
  return 0.5 - 0.5 * Math.cos(progress * Math.PI * 4);
}

/** Dakikayı okunur süreye çevirir. */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return 'ilk saniyeler';
  if (minutes < 60) return `${Math.round(minutes)} dakika`;

  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest === 0 ? `${hours} saat` : `${hours} saat ${rest} dakika`;
}

/** Dakikanın hangi evrede olduğu. */
export function phaseLabel(minutes: number): string {
  if (minutes < 15) return 'Açılış';
  if (minutes < 120) return 'Kalp';
  return 'Dip';
}
```

- [ ] **Step 4: Sınamayı çalıştır, yeşil olduğunu gör**

```
npm test
```
Beklenen: bütün sınamalar geçiyor (9 eski + yeni dosya).

- [ ] **Step 5: `EvolutionChart`'ı yeni modüle bağla**

`src/components/EvolutionChart.tsx`'te:

1. Import satırlarına ekle (satır 5'ten sonra):
```ts
import {
  SLIDER_STEPS,
  formatDuration,
  minutesAt,
  phaseLabel,
} from '@/lib/evolution-loop';
```

2. **Sil:** satır 30–31'deki `const MAX_MINUTES = 720;` ve `const SLIDER_STEPS = 1000;` — ikisi de artık `evolution-loop.ts`'te.

3. **Sil:** satır 49–67'deki `sliderToMinutes`, `formatDuration`, `phaseLabel` tanımları.

4. Satır 140'ı değiştir:
```ts
const minutes = useMemo(() => minutesAt(step / SLIDER_STEPS), [step]);
```

5. Satır 17–19'daki yorumu doğru sayıyla değiştir:
```
 * Kaydıraç logaritmik: yarısı ilk yarım saati, %62'si ilk saati kaplıyor.
 * Doğrusal olsaydı bütün hareket kaydıracın ilk %2'sinde sıkışırdı — kokunun
 * ilginç kısmı ilk bir saatte oluyor. Eşleme `evolution-loop.ts`'te; imza da
 * aynı yerden besleniyor.
```

Başka hiçbir şeye dokunma. Görünen davranış birebir aynı kalmalı.

- [ ] **Step 6: Spec'teki yanlış sayıyı düzelt**

`docs/superpowers/specs/2026-08-04-evrim-imzasi-design.md`:

- Satır 73: `Turun ilk yarısı ilk 1 saati, ikinci yarısı kalan 11 saati kaplıyor.` →
  `Turun ilk yarısı ilk yarım saati, %62'si ilk saati kaplıyor.`
- Satır 135: `` - `minutesAt(0.5)` ≈ 60 — "ilk yarı ilk saat" iddiasının sınandığı yer `` →
  `` - `minutesAt(0.5) < 60 < minutesAt(0.7)` — turun yarıdan fazlasının ilk saate ayrıldığı ``

- [ ] **Step 7: Derle ve sına**

```
npm run build
npm test
```
Beklenen: build yeşil, bütün sınamalar geçiyor.

- [ ] **Step 8: Commit**

```
git add src/lib/evolution-loop.ts src/lib/evolution-loop.test.ts src/components/EvolutionChart.tsx docs/superpowers/specs/2026-08-04-evrim-imzasi-design.md
git commit -m "feat: evrim döngüsünün saati — evolution-loop modülü"
```

---

## Task 2: `dominantFamily`'yi yaprak modüle taşı

**Files:**
- Modify: `src/data/families.ts` (sona ekleme)
- Modify: `src/lib/space-marks.ts` (satır 1–3, 22–34, 51)
- Modify: `src/app/parfum/[id]/page.tsx` (satır 6)

**Interfaces:**
- Consumes: yok.
- Produces: `dominantFamily(vector: readonly number[]): ScentFamily` artık `@/data/families`'ten geliyor. `@/lib/space-marks` bunu **dışa açmıyor**.

### Neden

Spec, `EvolutionSignature`'ın `dominantFamily`'yi `space-marks.ts`'ten almasını söylüyor. Ama o dosyanın kendi yorumu (satır 11–13) net: *"Bu modül **sunucuda** çalışıyor ve orada kalmalı"* — `projectToSpace` 44×44'lük kosinüs matrisi kuruyor. Bir istemci bileşeni oradan import ederse `similarity.ts` ve bütün benzerlik motoru tarayıcı paketine iner.

`dominantFamily` yalnızca `FAMILY_ORDER`'a bağlı 6 satır. Yeri `families.ts` — yanına. Tek uygulama korunuyor, eşitlik çözümü uzaydakiyle birebir aynı kalıyor.

- [ ] **Step 1: Fonksiyonu `families.ts`'e taşı**

`src/data/families.ts` sonuna ekle:

```ts
/**
 * Vektörün en ağır bastığı aile — uzaydaki noktanın da imzadaki notanın da
 * rengi bundan geliyor.
 *
 * Eşitlikte ilk sıradaki kazanıyor; `FAMILY_ORDER` sabit olduğu için bu seçim
 * de her çalıştırmada aynı.
 *
 * Burada duruyor çünkü tek bağımlılığı `FAMILY_ORDER` ve hem sunucudaki uzay
 * hesabı hem tarayıcıdaki imza bileşeni çağırıyor. `space-marks.ts`'te kalsaydı
 * imza, 44×44'lük benzerlik matrisini istemci paketine sürüklerdi.
 */
export function dominantFamily(vector: readonly number[]): ScentFamily {
  let best = 0;
  for (let i = 1; i < vector.length; i += 1) {
    if (vector[i] > vector[best]) best = i;
  }
  return FAMILY_ORDER[best];
}
```

- [ ] **Step 2: `space-marks.ts`'ten sil, import et**

- Satır 22–34'teki `dominantFamily` tanımını **tamamen sil** (üstündeki yorum bloğuyla birlikte).
- Satır 1–2'yi şununla değiştir — `FAMILY_ORDER` ve `ScentFamily` bu dosyada yalnızca silinen fonksiyonda kullanılıyordu, ikisi de çıkıyor:
```ts
import type { Perfume, SpaceMark } from '@/data/types';
import { dominantFamily, getFamily } from '@/data/families';
```
- Satır 51 aynen kalıyor: `color: getFamily(dominantFamily(familyVector(perfume))).color,`

- [ ] **Step 3: `page.tsx`'in import'unu güncelle**

Satır 4–6'yı şuna indir:
```ts
import { dominantFamily, getFamily } from '@/data/families';
import { familyVector } from '@/lib/similarity';
```
(`import { dominantFamily } from '@/lib/space-marks';` satırı gidiyor.)

- [ ] **Step 4: Başka çağıran var mı, bak**

```
npm run lint
```
Beklenen: temiz. Uyarı çıkarsa kullanılmayan import kalmıştır, temizle.

- [ ] **Step 5: Derle ve sına**

```
npm run build
npm test
```
Beklenen: ikisi de yeşil. Bu görev saf taşıma — hiçbir davranış değişmiyor.

- [ ] **Step 6: Commit**

```
git add src/data/families.ts src/lib/space-marks.ts "src/app/parfum/[id]/page.tsx"
git commit -m "refactor: dominantFamily yaprak modüle taşındı"
```

---

## Task 3: `EvolutionSignature` bileşeni ve sayfaya bağlanması

**Files:**
- Create: `src/components/EvolutionSignature.tsx`
- Modify: `src/app/parfum/[id]/page.tsx` (satır 7, 16–18, 118)
- Read first: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

**Interfaces:**
- Consumes: `CYCLE_MS`, `cycleProgress`, `minutesAt`, `morphAt`, `formatDuration`, `phaseLabel` (Task 1); `dominantFamily`, `getFamily`, `FAMILY_ORDER` (`@/data/families`, Task 2); `intensityAt(volatility: Volatility, minutes: number): number` (`@/lib/evolution`, mevcut); `getNote(id: string): Note` (`@/data/notes`, mevcut).
- Produces: `EvolutionSignature({ perfume }: { readonly perfume: Perfume })` — varsayılan dışa aktarım değil, **adlandırılmış** dışa aktarım (`EvolutionChart` ile aynı biçim).

### Geometri

`SAMPLES + 1` noktalı tek bir `<path>` her nota için. Örnek `j` → `u = j / SAMPLES`:

- **Eğri hâli:** `x = x0 + u·span`, `y = baseY − intensityAt(volatility, minutesAt(u))·weight·curveHeight`
  (yani yatay eksen zaman, dikey eksen yoğunluk — notanın 12 saatlik ömrünün tamamı)
- **Çizelge hâli:** `x = x0 + u·level·span`, `y = rowY(i)`
  (yani düz bir çubuk; uzunluğu o **andaki** `level`)
- **Ara:** iki nokta arasında doğrusal karışım, katsayı `morphAt(progress)`

`morph = 1` olduğunda çubuğun uzunluğu tam olarak o andaki yüzde. Morph bu yüzden benzetme değil, açıklama.

- [ ] **Step 1: Next.js istemci bileşeni rehberini oku**

```
node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md
```
`'use client'` sınırının bu sürümde nasıl çalıştığını ve sunucu bileşeninden istemci bileşenine prop geçirmenin kısıtlarını doğrula. `Perfume` düz veri olduğu için serileşebilir olmalı — teyit et.

- [ ] **Step 2: Bileşeni yaz**

`src/components/EvolutionSignature.tsx`:

```tsx
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { getNote } from '@/data/notes';
import { FAMILY_ORDER, dominantFamily, getFamily } from '@/data/families';
import { intensityAt } from '@/lib/evolution';
import {
  cycleProgress,
  formatDuration,
  minutesAt,
  morphAt,
  phaseLabel,
} from '@/lib/evolution-loop';
import type { Perfume, ScentFamily, Volatility } from '@/data/types';

/**
 * Evrim imzası — parfümün 12 saatlik ömrü, kendiliğinden ve hiç durmadan.
 *
 * Kaydıraç yok, kaydırma yok, tetikleyici yok. Turda iki şey birden döngüde:
 * **biçim** (eğriler ↔ çizelge çubukları) ve **zaman** (0 → 12 saat → 0).
 * Bu bir süs değil: eğri dümdüz olup çubuğa oturduğunda çubuğun uzunluğu o
 * notanın o andaki yüzdesi. Aynı sayılar, iki biçim — "aa, o aslında veriymiş".
 *
 * Neden tuval değil SVG: nota adları ve yüzdeler gerçek `<text>` kalmalı.
 * `ScentSpaceCanvas.tsx:216` aynı kararı bir kez zaten vermiş.
 *
 * Neden kare başına `setState` yok: `EvolutionChart.tsx:26`'nın ölçerek koyduğu
 * kural. Burada React yalnızca iskeleti bir kez kuruyor; her kare `d`, `opacity`
 * ve metin içeriği ref üzerinden DOM'a yazılıyor.
 *
 * Erişilebilirlik notu: `prefers-reduced-motion` ayrımı **bilerek yok** —
 * kullanıcı kararı. Bilinçli bir ödün; hareketin büyük alanlı bir kayma değil
 * çubuk uzunluğu değişimi olması riski sınırlıyor.
 */

/** SVG'nin iç koordinat genişliği; ekranda `width:100%` ile esniyor. */
const VIEW_WIDTH = 300;
const PAD = 8;
/** Nota adı sütunu. */
const LABEL_WIDTH = 56;
/** Yüzde sütunu. */
const VALUE_WIDTH = 26;
/** İlk satırın üstündeki boşluk. */
const TOP = 14;
/** Çizelge hâlindeki satır aralığı. */
const ROW_GAP = 22;
/** Her eğriyi kaç parçaya bölerek çiziyoruz. */
const SAMPLES = 80;
/** Etiketler bu morph değerinden sonra belirmeye başlıyor. */
const LABEL_FADE_START = 0.15;

interface Geometry {
  readonly viewHeight: number;
  readonly x0: number;
  readonly span: number;
  readonly baseY: number;
  readonly curveHeight: number;
}

interface SignatureRow {
  readonly noteId: string;
  readonly label: string;
  readonly family: ScentFamily;
  readonly volatility: Volatility;
  readonly weight: number;
}

function rowY(index: number): number {
  return TOP + ROW_GAP * index;
}

function geometryFor(rowCount: number): Geometry {
  const viewHeight = TOP + ROW_GAP * Math.max(rowCount - 1, 0) + PAD;
  const x0 = PAD + LABEL_WIDTH;
  return {
    viewHeight,
    x0,
    span: VIEW_WIDTH - PAD - VALUE_WIDTH - x0,
    baseY: viewHeight - PAD,
    curveHeight: viewHeight - PAD - TOP,
  };
}

/**
 * Bir notanın o karedeki yolu.
 *
 * `morph = 0` eğri, `morph = 1` çubuk, arası doğrusal karışım. Nokta sayısı iki
 * hâlde de aynı olduğu için karışım nokta nokta yapılabiliyor — SVG'nin morph
 * için ayrı bir mekanizmasına ihtiyaç yok.
 */
function pathFor(
  row: SignatureRow,
  index: number,
  morph: number,
  level: number,
  geometry: Geometry,
): string {
  const y1 = rowY(index);
  let d = '';

  for (let j = 0; j <= SAMPLES; j += 1) {
    const u = j / SAMPLES;
    const curveX = geometry.x0 + u * geometry.span;
    const curveY =
      geometry.baseY -
      intensityAt(row.volatility, minutesAt(u)) * row.weight * geometry.curveHeight;
    const barX = geometry.x0 + u * level * geometry.span;

    const x = curveX + (barX - curveX) * morph;
    const y = curveY + (y1 - curveY) * morph;
    d += `${j === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
  }

  return d;
}

/** Etiket saydamlığı — biçim çizelgeye yaklaştıkça beliriyor. */
function labelOpacity(morph: number, max: number): string {
  if (morph <= LABEL_FADE_START) return '0';
  return (((morph - LABEL_FADE_START) / (1 - LABEL_FADE_START)) * max).toFixed(2);
}

interface EvolutionSignatureProps {
  readonly perfume: Perfume;
}

export function EvolutionSignature({ perfume }: EvolutionSignatureProps) {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const nameRefs = useRef<(SVGTextElement | null)[]>([]);
  const valueRefs = useRef<(SVGTextElement | null)[]>([]);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const durationRef = useRef<HTMLSpanElement>(null);

  /** Sabit satır bilgisi — parfüm değişmedikçe yeniden hesaplanmıyor. */
  const rows = useMemo<readonly SignatureRow[]>(
    () =>
      perfume.notes.map((entry) => {
        const note = getNote(entry.noteId);
        // Ham vektör: `dominantFamily` sırayı `FAMILY_ORDER`'dan bekliyor.
        // Yeni bir argmax yazmıyoruz ki eşitlikler uzaydakiyle aynı çözülsün.
        const vector = FAMILY_ORDER.map((family) => note.families[family] ?? 0);
        return {
          noteId: entry.noteId,
          label: note.name.tr,
          family: dominantFamily(vector),
          volatility: note.volatility,
          weight: entry.weight,
        };
      }),
    [perfume],
  );

  const geometry = useMemo(() => geometryFor(rows.length), [rows.length]);

  /**
   * Sunucuda çizilen ilk kare — `progress = 0`, yani saf eğri hâli.
   *
   * Boş `d` ile başlansaydı JavaScript inene kadar (ve JS hiç çalışmazsa
   * tamamen) boş bir kutu görünürdü. Bu hâliyle imza, animasyon başlamadan
   * önce de doğru şeyi gösteriyor.
   */
  const initialPaths = useMemo(
    () =>
      rows.map((row, index) =>
        pathFor(row, index, 0, intensityAt(row.volatility, 0) * row.weight, geometry),
      ),
    [rows, geometry],
  );

  useEffect(() => {
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now: number) {
      const progress = cycleProgress(now - start);
      const morph = morphAt(progress);
      const minutes = minutesAt(progress);

      rows.forEach((row, index) => {
        const level = intensityAt(row.volatility, minutes) * row.weight;

        const path = pathRefs.current[index];
        if (path) {
          path.setAttribute('d', pathFor(row, index, morph, level, geometry));
          path.setAttribute('stroke-width', (1.8 + morph * 1.4).toFixed(2));
        }

        const name = nameRefs.current[index];
        if (name) name.setAttribute('opacity', labelOpacity(morph, 0.55));

        const value = valueRefs.current[index];
        if (value) {
          value.setAttribute('opacity', labelOpacity(morph, 0.4));
          value.textContent = `${Math.round(level * 100)}%`;
        }
      });

      if (phaseRef.current) phaseRef.current.textContent = phaseLabel(minutes);
      if (durationRef.current) durationRef.current.textContent = formatDuration(minutes);

      frame = requestAnimationFrame(step);
    });

    // Sökülürken kareyi iptal et. `ScentSpaceCanvas.tsx:634` aynı tuzağı
    // anlatıyor: iptal edilmeyen kare, bileşen geri geldiğinde "zaten kare
    // bekliyor" sanılıp döngüyü kilitliyor.
    return () => cancelAnimationFrame(frame);
  }, [rows, geometry]);

  return (
    <div className="w-full">
      {/* Saat yazısı — hareketin neyi anlattığını söyleyen tek satır. */}
      <div className="mb-6 flex items-baseline gap-2">
        <span ref={phaseRef} className="text-sm tracking-wide text-white/80">
          Açılış
        </span>
        <span className="text-white/25">·</span>
        <span ref={durationRef} className="text-sm tabular-nums text-white/50">
          ilk saniyeler
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${geometry.viewHeight}`}
        className="block w-full"
        role="img"
        aria-label={`${perfume.name} evrim imzası: ${rows
          .map((row) => row.label)
          .join(', ')} notalarının 12 saat boyunca yükselip düşüşü.`}
      >
        {rows.map((row, index) => (
          <g key={row.noteId}>
            <path
              ref={(element) => {
                pathRefs.current[index] = element;
              }}
              d={initialPaths[index]}
              fill="none"
              stroke={getFamily(row.family).color}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              ref={(element) => {
                nameRefs.current[index] = element;
              }}
              x={PAD}
              y={rowY(index) + 3}
              opacity="0"
              fill="#ffffff"
              fontSize="8.5"
            >
              {row.label}
            </text>
            <text
              ref={(element) => {
                valueRefs.current[index] = element;
              }}
              x={VIEW_WIDTH - PAD}
              y={rowY(index) + 3}
              opacity="0"
              textAnchor="end"
              fill="#ffffff"
              fontSize="8.5"
              /* Sürekli değişen yüzdeyi ekran okuyucuya canlı okutmak gürültü olurdu. */
              aria-hidden="true"
            >
              0%
            </text>
          </g>
        ))}
      </svg>

      <p className="mt-10 max-w-lg text-xs leading-relaxed text-white/25">
        Bu çizelge bir tahmindir, ölçüm değil. Notaların uçuculuğundan modellenmiştir;
        gerçek gelişim sıcaklığa, tene ve konsantrasyona göre değişir.
      </p>
    </div>
  );
}
```

**Dikkat — React 19 ref geri çağırımı:** `ref={(element) => { ... }}` gövdesi **süslü parantezli** olmalı. Kısa gövdeli ok (`ref={(el) => (refs.current[i] = el)}`) bir değer döndürür ve React 19 bunu temizleme fonksiyonu sanıp hata verir.

**Dikkat — sorumluluk metni:** son paragraf `evolution.ts:7`'nin *"Site bunu kullanıcıya açıkça söylemek zorunda"* taahhüdü. Silinmez.

- [ ] **Step 3: Sayfaya bağla**

`src/app/parfum/[id]/page.tsx`:

1. Satır 7'yi değiştir:
```ts
import { EvolutionSignature } from '@/components/EvolutionSignature';
```

2. Satır 118'i değiştir:
```tsx
<EvolutionSignature perfume={perfume} />
```

3. Satır 10–18'deki dosya yorumunu güncelle — ② artık bekleyen iş değil:
```
 * Parfüm sayfası — yol haritasının ①, ② ve ③ bölümleri.
 *
 *   ①  isim + marka + küratör cümlesi        ← yalnızca duygu
 *          ↓
 *   ②③ evrim imzası                          ← altındaki veri, kendi kendine dönen
 *
 * ② ile ③ tek bir şeyde birleşti: imza, çizelgenin başka bir hâli. Kaydıraç yok —
 * biçim ve zaman 12 saniyelik bir turda hiç durmadan dönüyor (`EvolutionSignature`).
 * Kaydıraçlı çizelge `/evrim` doğrulama ekranında duruyor; orası iki parfümü aynı
 * dakikada karşılaştırmak için var.
 *
 * ④ (künye + uzaydaki komşular) kullanıcı kararıyla ertelendi: 44 parfümün 23'ünde
 * parfümör, 18'inde yıl bilgisi yok; yarısı boş bir künye bölümü sayfayı eksik
 * gösterirdi.
```

- [ ] **Step 4: Derle ve sına**

```
npm run build
npm run lint
npm test
```
Beklenen: üçü de yeşil.

- [ ] **Step 5: Tarayıcıda gör**

```
npm run dev -- -p 3210
```
`http://localhost:3210/parfum/memo-argentina` aç. Görmen gerekenler:
- Eğriler kendiliğinden çubuklara oturuyor, geri açılıyor, hiç durmuyor
- Saat yazısı ilerliyor: "Açılış · ilk saniyeler" → "Kalp · 1 saat" → "Dip · ..."
- Nota adları ve yüzdeler yalnızca çizelge hâlinde beliriyor
- Renkler nota bazında farklı (aile renkleri), hepsi aynı üç renk değil

Sunucuyu bu görevden sonra kapat (Windows'ta port takılı kalırsa:
`Get-NetTCPConnection -LocalPort 3210 | Stop-Process -Force`).

- [ ] **Step 6: Commit**

```
git add src/components/EvolutionSignature.tsx "src/app/parfum/[id]/page.tsx"
git commit -m "feat: evrim imzası — kaydıraçsız, kendiliğinden dönen SVG"
```

---

## Task 4: Aile göstergesi

**Files:**
- Modify: `src/components/EvolutionSignature.tsx`

**Interfaces:**
- Consumes: Task 3'ün `SignatureRow.family` alanı; `getFamily`, `FAMILY_ORDER`.
- Produces: yok (bileşen içi).

### Neden

`EvolutionChart`'ın altında bir **katman** göstergesi var (Üst / Kalp / Dip). İmzada renk katmandan değil **aileden** geliyor, dolayısıyla o gösterge burada yanlış bilgi verirdi. Yerine bu parfümde geçen aileleri sayan bir gösterge geliyor.

Bu boşluğu doldurmak keyfi bir ekleme değil: `families.ts:6-7` renk kodunun amacını yazıyor — *"Sabit ve öğrenilebilir olması şart — kullanıcı 15-20 parfüm gezdikten sonra kodu çözebilmeli."* Gösterge tam da bunu öğretiyor.

Katman bilgisi imzadan tamamen çıkıyor; eğrinin kendisi zaten aynı şeyi anlatıyor (üst notalar erken tepe yapıp sönüyor). `types.ts:97` katmanın yalnızca renk gruplaması için olduğunu söylüyor, o iş artık aileye geçti.

- [ ] **Step 1: Aile listesini türet**

`geometry` tanımının hemen ardına ekle:

```tsx
/** Bu parfümde geçen aileler, `FAMILY_ORDER` sırasında ve tekrarsız. */
const families = useMemo(() => {
  const seen = new Set(rows.map((row) => row.family));
  return FAMILY_ORDER.filter((family) => seen.has(family)).map(getFamily);
}, [rows]);
```

- [ ] **Step 2: Göstergeyi çiz**

`</svg>` ile sorumluluk paragrafının arasına ekle:

```tsx
{/*
  Renk = aile. Katman göstergesi (Üst/Kalp/Dip) burada YOK: imzada renk
  katmanı değil aileyi anlatıyor, o gösterge yanlış bilgi verirdi. Katmanlı
  hâli kaydıraçlı çizelgede, `/evrim`'de duruyor.
*/}
<div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
  {families.map((family) => (
    <span key={family.id} className="flex items-center gap-2 text-xs text-white/35">
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: family.color }}
      />
      {family.name.tr}
    </span>
  ))}
</div>
```

- [ ] **Step 3: Derle, sına, gör**

```
npm run build
npm run lint
npm test
```
Sonra `npm run dev -- -p 3210` ile `/parfum/memo-argentina` aç: gösterge çizelgenin altında, noktaların renkleri eğrilerin renkleriyle birebir aynı olmalı. Sunucuyu kapat.

- [ ] **Step 4: Commit**

```
git add src/components/EvolutionSignature.tsx
git commit -m "feat: imzada aile göstergesi"
```

---

## Task 5: Doğrulama turu

**Files:** yok (yalnızca ölçüm). Sorun çıkarsa ilgili görevin dosyasında düzelt.

- [ ] **Step 1: Sunucuyu başlat**

```
npm run build
npm run dev -- -p 3210
```

- [ ] **Step 2: İmza gerçekten hiç durmuyor mu — ölç, bakma**

Tarayıcıda `/parfum/memo-argentina` açıkken konsolda:

```js
const d1 = document.querySelector('svg path').getAttribute('d');
await new Promise((r) => setTimeout(r, 400));
const d2 = document.querySelector('svg path').getAttribute('d');
d1 !== d2;   // true olmalı
```

- [ ] **Step 3: Tur gerçekten 12 saniye mi**

Saat yazısı tur başında "ilk saniyeler"e dönüyor. İki dönüş arasını ölç:

```js
const el = document.querySelectorAll('.tabular-nums')[0];
const hits = [];
const t0 = performance.now();
let previous = el.textContent;
await new Promise((resolve) => {
  const id = setInterval(() => {
    const now = el.textContent;
    if (now === 'ilk saniyeler' && previous !== 'ilk saniyeler') {
      hits.push(performance.now() - t0);
    }
    previous = now;
    if (performance.now() - t0 > 30_000) { clearInterval(id); resolve(); }
  }, 50);
});
hits[1] - hits[0];   // ~12000 (±300) olmalı
```

- [ ] **Step 4: Çubuk uzunluğu yüzdeyle uyuşuyor mu**

`morph = 1` anını yakala (etiketler en parlakken ekran görüntüsü al). Bir notanın çubuk uzunluğunu ve yanındaki yüzdeyi karşılaştır: 300 birimlik viewBox'ta çubuk `x0 = 64`'ten başlıyor, kullanılabilir `span = 202`. `%50` yazan notanın çubuğu ~101 birim olmalı.

- [ ] **Step 5: Renk zinciri uyuşuyor mu**

Sayfanın tepesindeki ışığın rengi (`page.tsx:46`) parfümün baskın ailesinin rengi. Aile göstergesinde o aile varsa noktası aynı renkte olmalı.

- [ ] **Step 6: Bozulmayan yerler**

- `http://localhost:3210/evrim` — kaydıraç hâlâ çalışıyor, parfüm seçiciyle geçiş yapınca kaydıraç yerinde kalıyor
- `http://localhost:3210/uzay` — dokunulmadı, açılıyor
- `http://localhost:3210/` — yaklaşma sahnesi çalışıyor, bir parfüme girip geri tuşuna basınca `/?mark=<id>` adresine düşüyor (Task 0'da düzeltilmişti, regresyon olmamalı)

- [ ] **Step 7: Kare döngüsü kilitlenmiyor**

Parfüm sayfasından `← uzaya dön` ile çık, tekrar aynı parfüme gir. İmza yine dönüyor olmalı. Bu adım `ScentSpaceCanvas.tsx:634`'ün anlattığı tuzağın sınaması — `cancelAnimationFrame` unutulmuşsa burada yakalanır.

- [ ] **Step 8: Sunucuyu kapat**

```powershell
Get-NetTCPConnection -LocalPort 3210 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

---

## Verification

Bitmiş sayılması için hepsi geçmeli:

1. `npm run build` yeşil, `npm run lint` temiz, `npm test` bütün sınamalar geçiyor
2. Parfüm sayfasında imza dönüyor, hiç durmuyor, kaydıraç yok, saat yazısı ilerliyor (Task 5 Step 2–3)
3. Bir tur ≈ 12 saniye; turun yarısından fazlası ilk saate ayrılmış (`minutesAt` sınaması + gözle)
4. `morph = 1` anında çubuk uzunluğu yanındaki yüzdeyle uyuşuyor (Task 5 Step 4)
5. Renkler notanın ailesinden geliyor; sayfanın tepesindeki ışıkla aynı zincirden (Task 5 Step 5)
6. `/evrim` ve `/uzay` bozulmamış (Task 5 Step 6)
7. Sayfadan çıkıp girmek kare döngüsünü kilitlemiyor (Task 5 Step 7)

## Bu işe dahil olmayanlar

- `ScentSpaceCanvas.tsx`'in 971 satırı (kendi 800 sınırının üstünde — ayrı iş)
- ④ künye + uzaydaki komşular
- Aşama 3 nota ansiklopedisi
- Çift dil / `next-intl`
- Tuval (Canvas 2D) varyantı — SVG görüldükten sonra değerlendirilecek
- `prefers-reduced-motion` desteği — kullanıcı kararıyla dışarıda
- İstemci paketinden `notes.ts`'i çıkarmak. Bugün `EvolutionChart` de aynı veriyi indiriyor, yani regresyon yok; spec `EvolutionSignature`'ın prop'unu `perfume: Perfume` olarak sabitledi. Ayrı bir iyileştirme işi.
