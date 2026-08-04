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
- **zaman** — 0 → 8 saat → 0

> Tur önce 12 saati kapsıyordu; sahip canlı sitede modelin 8. saatten sonra düzleştiğini
> görüp 8'e indirtti. `/evrim` kaydıracı **12 saatte kaldı** — o ekranın işi modeli
> sınamak ve yarı ömür hatası tam da o düz kuyrukta görünür.

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

/** İmza turunun kapsadığı ömür — 8 saat. */
export const SIGNATURE_MAX_MINUTES = 480;
/** `/evrim` kaydıracının kapsadığı ömür — 12 saat. */
export const SLIDER_MAX_MINUTES = 720;

/** İlerlemeden dakika — logaritmik. Aralık varsayılansız parametre. */
export function minutesAt(progress: number, spanMinutes: number): number;

/** İlerlemeden biçim, 0 = eğri, 1 = çizelge. Turda tek kez gidip geliyor. */
export function morphAt(progress: number): number;
```

`minutesAt` bugünkü kaydıracın eşlemesiyle **aynı formül** (`EvolutionChart.tsx:49`,
`sliderToMinutes`). "12 saniye ama notaları takip etmek kolay olsun" isteğini karşılayan
şey bu: kokunun ilginç kısmı yavaş, sakin kısmı hızlı geçiyor. 8 saatlik imza turunda
ilk yarı ilk ~21 dakikayı, %66.6'sı ilk saati kaplıyor; 12 saatlik kaydıraçta aynı
oranlar ~26 dakika ve %62.5.

Aralığın **varsayılanı yok** — çağıran hangi ölçekte olduğunu yazmak zorunda. İki tüketici
iki farklı aralık kullanıyor ve bir varsayılan konsaydı biri diğerine sessizce kayardı;
ölçek hatası ekranda hemen değil, aylar sonra fark edilir.

İki kopya bırakmamak için `sliderToMinutes` bu modüle taşınıyor ve `EvolutionChart` da
buradan alıyor. Davranışı değişmiyor — aynı fonksiyon, yeni ev.

`morphAt(p) = 0.5 − 0.5·cos(2πp)` — turda **tek** tam gidiş geliş.

> **Sonradan not (Task 6, 2026-08-04):** İlk sürümde katsayı `4π`'ydi — turda iki
> gidiş geliş. Sahibi canlı siteyi izleyince şunu bildirdi: "grafik saat daha 2.
> saati gösterirken bitiyor, sonra baştan başlıyor, 12. saati hiç görmüyoruz."
> Kök neden: **biçim** (`morphAt`) turda iki kez dönerken **zaman** (`minutesAt`)
> yalnızca bir kez 0 → tur sonuna gidiyordu — ikisi senkron değildi. Aşağıdaki
> dakikalar o dönemin okumaları; imza turu henüz 12 saati kapsıyordu: çubuk anları
> p = 0.25 (4. dakika) ve p = 0.75 (2 saat 18. dakika) idi; 12. saat p = 1'e,
> yani etiketlerin gizlendiği eğri anına denk geliyordu.
>
> Sahibiyle üç seçenek (iki gidiş geliş / tek gidiş geliş / başka bir eşleme)
> canlı, etkileşimli bir örnekte karşılaştırıldı. Seçilen: **tek gidiş geliş**.
> Kabul edilen sonuç: çubuk anı artık turun ortasında ve turun son saati yine eğri
> anına denk geliyor — ama etiketlerin çok daha kalıcı olmasıyla
> (`LABEL_FADE_START` ve kare-kök solma eğrisi, `EvolutionSignature.tsx`)
> okunur bant turun ~%87'sine çıkıyor. O yüzde `morphAt`in şeklinden geliyor,
> aralıktan değil — span değişse de %87 değişmez. "Son saati çubuk hâlinde de
> görmek" bilerek çözülmedi — ayrı, ertelenmiş bir iş.
>
> **Sonradan not (Task 7, 2026-08-04):** aralık 480'e inince aynı anlar şuraya
> kaydı — çubuk anı ~21. dakika, etiketlerin söndüğü an 7 sa 52 dk yerine
> 5 sa 23 dk. Okunamayan kuyruk 4 sa 08 dk'dan 2 sa 37 dk'ya düştü.

### 2. `src/components/EvolutionSignature.tsx` — yeni bileşen

İstemci bileşeni, tek prop `perfume: Perfume`. SVG çiziyor.

**Geometri.** Her nota bir `<path>`, 80 örnek nokta. Örnek `j` için `u = j/80`:

- *eğri hâli:* `x = u` ekseninde yayılıyor, `y` = `intensityAt(volatility, minutesAt(u, SIGNATURE_MAX_MINUTES)) × weight`
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
- `minutesAt(0, span) === 0`, `minutesAt(1, span)` ≈ `span` — her iki aralıkta da
- `minutesAt(p, 480) < minutesAt(p, 720)` — aralığın gerçekten parametre olduğu; biri
  diğerine sabitlenirse ya da bir varsayılana düşerse burada yakalanıyor
- `minutesAt(0.5, span) < 60 < minutesAt(0.7, span)` — turun yarıdan fazlasının ilk saate
  ayrıldığı
- `formatDuration(minutesAt(0.5, 480)) === '21 dakika'` — çubukların okunduğu anda ekranda
  yazan saat; sayı değil, görünen metin sınanıyor
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
