# OSMOS — Evrim imzası (yol haritası ②)

## Bağlam

Parfüm sayfası bugün ① (isim + marka + küratör cümlesi) ve ③ (evrim çizelgesi)
bölümlerinden oluşuyor. `parfum/[id]/page.tsx:16` ②'nin — "imzanın grafiğe dönüşmesi,
morph" — Aşama 2'ye ait olduğunu yazıyor. Yaklaşma sahnesi bittiğine göre Aşama 2'de
kalan tek madde bu.

③'ün başındaki yorum amacı tek cümlede söylüyor: **"aa, o aslında veriymiş"**
(`page.tsx:115`). Tasarımın tamamı bu cümleyi doğru kılmak üzerine kurulu.

## Karar

Parfüm sayfasındaki ③ bölümü, kaydıraçsız ve hiç durmadan dönen bir **evrim imzası**na
dönüşüyor. Turda iki şey birden döngüde:

- **biçim** — notaların zaman eğrileri ↔ yatay çizelge çubukları
- **zaman** — 0 → 12 saat → 0

Tur 12 saniye. Üstünde o anki yeri söyleyen bir satır duruyor: "Açılış · 3 dakika".

İmza ayrı bir süs değil, **çizelgenin kendisinin başka bir hâli**. Eğri dümdüz olup
çubuğa oturduğunda çubuğun uzunluğu o notanın o andaki yüzdesi oluyor — aynı sayılar,
iki biçim. Morph bu yüzden bir benzetme değil, açıklama.

### Ekranda görülüp bağlanan kararlar

| Konu | Karar | Nasıl seçildi |
|---|---|---|
| İmzanın maddesi | Evrim eğrilerinin kendisi | Üç seçenek çizilip karşılaştırıldı |
| Renk | Notanın baskın ailesinin rengi | Aynı ekranda; aile paleti beğenildi |
| Döngü | Biçim **ve** zaman birlikte | Üçü de çalışır hâlde denendi |
| Tetikleyici | Yok — kendiliğinden, sürekli | "Ne sağa ne sola ne aşağı yukarı kaydırma" |
| Görünür kaydıraç | Yok | Beğenilen şey zamanın ilerlemesiydi, kaydıracın kendisi değil |
| Tur süresi | 12 saniye | Doğrudan seçildi |
| Saat yazısı | Kalıyor | "Kesinlikle kalsın, yoksa anlamsız olur" |
| `prefers-reduced-motion` | **Ayrım yok**, animasyon herkeste dönüyor | Kullanıcı kararı; aşağıda notu var |

### Sorulmadan verilen kararlar (gerekçeli)

- **`EvolutionChart` ve `/evrim` ellenmiyor.** Çizelge iki yerden birden kullanılıyor:
  parfüm sayfası ve `EvolutionTimeline.tsx:71` üzerinden `/evrim` doğrulama ekranı.
  Kaydıracı oradan sökmek doğrulama ekranını sakatlardı. Parfüm sayfası yeni bir
  bileşen alıyor, çizelge olduğu yerde kalıyor.
- **SVG, tuval değil.** Nota adları ve yüzdeler gerçek `<text>` olarak kalıyor.
  Proje bu kararı bir kez zaten vermiş: `ScentSpaceCanvas.tsx:216` etiketleri bilerek
  tuvale değil HTML'e koymuş. Aynı gerekçe burada da geçerli. Tuval seçeneği elenmedi,
  ertelendi — önce SVG görülecek.
- **Kare başına `setState` yok.** `EvolutionChart.tsx:26`'nın ölçerek koyduğu kural.
  Path'ler ve saat yazısı ref üzerinden yazılıyor.

## Uygulama

### 1. `src/lib/evolution-loop.ts` — yeni, saf modül

`space-approach.ts`'in kardeşi: React, DOM, SVG bilmiyor; tek başına sınanabilir.

```ts
export const CYCLE_MS = 12_000;

/** Geçen süreden döngüsel ilerleme, 0–1. */
export function cycleProgress(elapsedMs: number): number;

/** İlerlemeden dakika — logaritmik. */
export function minutesAt(progress: number): number;

/** İlerlemeden biçim, 0 = eğri, 1 = çizelge. Turda iki kez gidip geliyor. */
export function morphAt(progress: number): number;
```

`minutesAt` bugünkü kaydıracın eşlemesiyle **aynı formül** (`EvolutionChart.tsx:49`,
`sliderToMinutes`). Turun ilk yarısı ilk 1 saati, ikinci yarısı kalan 11 saati kaplıyor.
"12 saniye ama notaları takip etmek kolay olsun" isteğini karşılayan şey bu: kokunun
ilginç kısmı yavaş, sakin kısmı hızlı geçiyor.

İki kopya bırakmamak için `sliderToMinutes` bu modüle taşınıyor ve `EvolutionChart` da
buradan alıyor. Davranışı değişmiyor — aynı fonksiyon, yeni ev.

`morphAt(p) = 0.5 − 0.5·cos(4πp)` — turda iki tam gidiş geliş.

### 2. `src/components/EvolutionSignature.tsx` — yeni bileşen

İstemci bileşeni, tek prop `perfume: Perfume`. SVG çiziyor.

**Geometri.** Her nota bir `<path>`, 80 örnek nokta. Örnek `j` için `u = j/80`:

- *eğri hâli:* `x = u` ekseninde yayılıyor, `y` = `intensityAt(volatility, minutesAt(u)) × weight`
- *çizelge hâli:* `y` = notanın satır çizgisi, `x` uzunluğu = o andaki `level`
- *ara:* iki nokta arasında doğrusal karışım, katsayı `morphAt(p)`

**Renk.** Notanın baskın ailesinden:

```ts
const vector = FAMILY_ORDER.map((family) => note.families[family] ?? 0);
const color = getFamily(dominantFamily(vector)).color;
```

`dominantFamily` (`space-marks.ts:28`) ham vektör alıyor, yani yeni bir argmax mantığı
yazılmıyor ve eşitlik durumları uzaydakiyle birebir aynı çözülüyor. Renk zinciri
sayfanın tepesindeki ışıkla (`page.tsx:46`) ve uzaydaki noktayla aynı yerden besleniyor.

**Kare döngüsü.** Tek `requestAnimationFrame`, tek saat `performance.now()`. Her karede
`path.setAttribute('d', …)` ve saat yazısının `textContent`'i ref üzerinden yazılıyor.
React durumu kare başına dokunulmuyor. Bileşen sökülürken kare iptal ediliyor ve
`frameRef` sıfırlanıyor — `ScentSpaceCanvas.tsx:634`'ün anlattığı kilitlenmenin aynısı
burada da mümkün.

Sekme arka plandayken tarayıcı `rAF`'ı zaten durduruyor; dönüldüğünde döngü geçen süreye
göre başka bir noktadan devam ediyor. Döngü sonsuz olduğu için bu zararsız, telafi
edilmiyor.

### 3. `src/app/parfum/[id]/page.tsx` — bağlama

`EvolutionChart` yerine `EvolutionSignature`. Bölüm başlığı (`EVRİM`) ve `<section>`
yapısı duruyor. Sayfa sunucu bileşeni olarak kalıyor; inen tek istemci kodu bu bileşen.

### 4. Erişilebilirlik

Animasyon herkeste ve her zaman dönüyor — `prefers-reduced-motion` ayrımı bilerek yok.
**Bu bilinçli bir ödün:** işletim sisteminde hareket azaltma açan kullanıcı bunu
kapatamıyor. Hareketin büyük alanlı bir kayma değil, çubuk uzunluğu ve biçim değişimi
olması riski sınırlıyor.

Sürekli değişen yüzdeleri ekran okuyucuya canlı okutmak gürültü olurdu: yüzdeler
`aria-hidden`, SVG'ye notaları ve katmanlarını sayan sabit bir metin karşılığı konuyor.
Nota adları gerçek `<text>` olarak kalıyor.

### 5. Test

`src/lib/evolution-loop.test.ts` — mevcut vitest altyapısı.

- `cycleProgress(0) === 0`; `cycleProgress(CYCLE_MS)` başa dönüyor; hep 0–1 arasında
- `minutesAt(0) === 0`, `minutesAt(1) === 720`
- `minutesAt(0.5)` ≈ 60 — "ilk yarı ilk saat" iddiasının sınandığı yer
- `morphAt` uçları ve ortası; 0–1 dışına çıkmıyor

Bileşen ve E2E testi kapsam dışı: projede altyapısı yok.

## Doğrulama

1. `npm run build` yeşil, `npm test` geçiyor.
2. Bir parfüm sayfası: imza dönüyor, hiç durmuyor, saat yazısı ilerliyor.
3. Bir tur 12 saniye; ilk 1 saat turun yaklaşık yarısını kaplıyor.
4. Eğri çubuğa oturduğunda uzunluk o andaki yüzdeyle uyuşuyor.
5. Renkler notanın ailesinden geliyor; sayfanın tepesindeki ışıkla aynı aileden olan
   nota aynı rengi gösteriyor.
6. `/evrim` ve `/uzay` bozulmamış; kaydıraç orada çalışmaya devam ediyor.
7. Sayfadan çıkıp girmek kare döngüsünü kilitlemiyor.

## Bu işe dahil olmayanlar

- `ScentSpaceCanvas.tsx`'in 971 satırı (kendi 800 sınırının üstünde, ayrı iş)
- ④ künye + komşular
- Aşama 3 nota ansiklopedisi
- Çift dil / `next-intl`
- Tuval (Canvas 2D) varyantı — SVG görüldükten sonra değerlendirilecek
