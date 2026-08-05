# Uzaydaki Komşular — Tasarım (yol haritası ④, birinci yarı)

## Sorun

Parfüm sayfası ①②③ ile bitiyor: isim + küratör cümlesi, evrim imzası, "← uzaya dön".
İmzayı okuyup **"buna benzeyen ne var?"** diyen kişinin bugün tek seçeneği uzaya
dönüp noktayı yeniden bulmak. Sayfa o dürtüyü karşılıksız bırakıyor.

Yol haritasının ④'ü (künye + uzaydaki komşular) bir kez ertelenmişti. Gerekçe
`page.tsx:20`'de yazılı ve sayılarak doğrulandı: 44 parfümün **23'ünde parfümör,
18'inde yıl** bilgisi yok. (Sayım veri dosyalarından yapıldı, yorumdaki iddiaya
güvenilmedi.)

Sahip ④'ü ikiye ayırdı:

- **Künye ertelendi** — veri elle doldurulduktan sonra ayrı bir tasarım turu.
  Bu spec'in kapsamında değil.
- **Komşular şimdi** — komşu verisi 44 parfümün hepsinde tam; eksik veri sorunu
  bu yarıda hiç doğmuyor.

## Karar

Parfüm sayfasına, imzanın altına, **uzayın o bölgesinden kırpılmış küçük bir harita
parçası** geliyor. Sıralı liste değil: sitenin dili harita, komşuluğu söylemek
yerine göstermek gerekiyor.

| Konu | Karar | Nasıl seçildi |
|---|---|---|
| Biçim | Harita parçası | Üç seçenek (liste / liste+gerekçe / parça) sunuldu |
| İşlev | Adlar yazılı, tıklanınca o parfüme gidiyor | Doğrudan seçildi |
| Konum kaynağı | ~~Gerçek uzay konumları (kırpılmış)~~ → **benzerlikten üretiliyor** | Ekranda görülünce değişti, aşağıya bak |
| Komşu tanımı | **Benzerlik top-5** (haritadaki yakınlık değil) | Sahip kararı, ölçümü gördükten sonra |
| Komşu sayısı | **5** | Aşağıda gerekçesi |
| Biçim | ~~Kırpılmış harita parçası~~ → **dönen üç boyutlu yörünge** | Ekranda görülünce değişti |

> **Bu bölümün altındaki "harita parçası / kırpma / gerçek konumlar" anlatısı
> AŞILDI.** Yazıldığı hâliyle bırakılıyor çünkü bugünkü çözüm o yoldan geçerek
> bulundu ve ölçümleri hâlâ geçerli. Bugün ne olduğunu okumak için doğrudan
> [Son hâl](#son-hâl--dönen-üç-boyutlu-yörünge) bölümüne git.

Beş, sabitlenmiş bir sayı değil bir başlangıç: `nearestNeighbors`'ın `count`
parametresi zaten var, değiştirmek tek satır. Beşle başlanıyor çünkü etiket
çakışması nokta sayısıyla birlikte hızla artıyor ve bu parçanın alanı küçük.
Etiket ölçümü (Doğrulama 6) taşma gösterirse sayı düşürülecek — pencereyi
büyütmek değil, çünkü pencere büyüdükçe kırpma "yakın komşuluk" olmaktan çıkıp
uzayın geneline dönüşür.

## Çözülmemiş gerilim — ölçüm kapatacak

`nearestNeighbors` **benzerliğe** göre sıralıyor. `projectToSpace` ise üç bileşenden
ikisini ekrana koyuyor, üçüncüsü `depth`'e gidiyor (`similarity.ts:339`). Yani "en
benzer beş" ile "haritada en yakın görünen beş" aynı küme olmak zorunda değil.

Harita parçası bu farkı **görünür kılar**: yan yana çizilmiş ama komşu sayılmayan
bir nokta, ya da uzakta duran bir "komşu" çıkabilir. Liste seçilseydi fark gizli
kalırdı; parça seçildiği için gizlenemiyor.

Karar kuralı sonucu görmeden yazıldı ki sonradan eğilip bükülmesin:

- ortalama örtüşme **≥ 4/5** → gerçek uzay konumları, kırpılmış
- ortalama örtüşme **< 4/5** → fark büyüklüğüyle birlikte sahibe sunulur; varsayılan
  öneri yine gerçek konumlar, çünkü iki ekranın aynı şeyi farklı göstermesi bu
  projede daha ağır bir kusur

### Ölçüm sonucu (44 parfüm)

| | |
|---|---|
| Ortalama örtüşme | **3.16 / 5** (%63) |
| En kötü | `frederic-malle-bigarade-concentree` — 1/5 |
| Benzerlik top-5'te olup 2B top-**10** dışında | 35 / 220 (%16) |

Dağılım: 5/5 → 4 parfüm, 4/5 → 15, 3/5 → 13, 2/5 → 8, 1/5 → 4.

Eşik geçilmedi, yani karar sahibe gitti. Üç seçenek gerçek veriyle çizilip yan yana
gösterildi (en iyi / ortanca / en kötü vaka). **Sahip B'yi seçti: gerçek konumlar,
komşu tanımı benzerlik.**

Gerekçe: "en benzer" iddiası korunuyor ve projeksiyonun bilgi kaybettiği gizlenmiyor.
Uzağa düşen bir komşu, kaybın kendisini görünür kılıyor.

### Kabul edilen bedel — ölçülerek

Uzaktaki bir komşuyu çerçeveye almak pencereyi büyütüyor, pencere büyüyünce araya
komşu olmayan noktalar doluyor:

| Parfüm (örtüşme) | Pencere A | Pencere B | Penceredeki nokta |
|---|---|---|---|
| Bonbon Pop (5/5) | 0.185 | 0.185 | 6 → 6 |
| Blamage (3/5) | 0.270 | 0.517 | 6 → 11 |
| Bigarade (1/5) | 0.589 | 0.737 | 11 → 16 |

En kötü vakada 44 parfümün 16'sı pencereye giriyor. Sahibe bu sayılarla söylendi ve
B yine de seçildi — bilinçli ödün, "sonradan fark edildi" değil.

---

## Son hâl — dönen üç boyutlu yörünge

Yukarıdaki B kararı **uygulandı ve ekranda görülünce geri alındı.** Sebebi tahmin
değil gözlem: kırpılmış gerçek konumlarla parça okunmuyordu. Merkez parfüm pencerenin
kenarına kaçıyor ("neredeyim?" sorusu cevapsız), 28 nokta neredeyse aynı boy ve
soluklukta bir bulut oluşturuyor, "en benzeyen" çoğu sayfada en yakın olmuyordu.

Sahibin istediği cümle net: **en benzeyen en yakında dursun, komşular dört bir yana
dağılsın, sıra hâlinde değil.** Bu cümlenin her sayfada tutmasının tek yolu konumları
benzerlikten üretmek — ölçüm zaten gerçek konumlarla tutmadığını göstermişti (3.16/5).

Ardından ilk çember hâli de beğenilmedi ("slop gibi duruyor"); istenen 7/24 dönen,
gerçekten üç boyutlu, şık bir şey.

### Üç eksen, üçü de veri

| Eksen | Ne taşıyor |
|---|---|
| Yarıçap | Benzerlik skoru — mutlak, kümedeki sıralama değil |
| Açı | Ayrışma; eşit bölünüyor ki sıra değil çember olsun |
| **Yükseklik** | **`depth` farkı** — `projectToSpace`in üçüncü bileşeni |

Üçüncü boyut süs değil: `depth` bugüne kadar hiçbir yerde kullanılmıyordu ve
benzerlik ile 2B yakınlığın ayrışmasının (3.16/5) sebebi tam olarak o kayıp
bileşendi. Takımyıldız dönerken onu geri veriyor — bir komşu yakın görünüp
derinlikte uzak durabiliyor. Yani eğim sahte bir 3B efekti değil; perspektif
gerçek, yükseklik gerçek veri.

Yarıçap mutlak skordan alınıyor, sıralamadan değil: komşuları zayıf bir parfümün
yörüngesi geniş açılıyor, sıkı bir kümenin ortasındakinin dar kalıyor. Sıralamayla
normalleştirilseydi her sayfada en benzeyen aynı mesafede durur, "ne kadar" bilgisi
kaybolurdu.

### Denenip bırakılanlar

- **Merkezden dağılma efekti** (komşular merkezde toplanıp ayrışıyordu): sürekli
  dönüş gelince gereksizleşti, kaldırıldı. Ondan önce bir kusuru da ölçülmüştü —
  animasyon sayfa yüklenince başlıyordu, bölüm ekranın altında olduğu için kimse
  göremiyordu.
- **Merkezden komşulara bağ çizgileri:** halka zaten yörüngeyi anlatıyordu,
  çizgiler üstüne binip kalabalık yapıyordu.
- **Etiketin noktanın sağına/soluna yaslanması:** komşu merkezin öbür yanına
  geçtiği anda ad sıçrıyordu. Yan seçimi tamamen kaldırıldı, ad noktanın üstünde
  ortalı.
- **Dikey yörünge** (`PITCH` 1.15): hareket istenen gibi yukarı-aşağı oldu ama
  halka tam daireye dönüşünce düz bir çember gibi okundu ve daha az üç boyutlu
  durdu. Yatık elipse dönüldü. Gerekçe `lib/neighbor-orbit.ts`teki `PITCH`
  yorumunda.

### Dosyalar

| Dosya | Sorumluluk |
|---|---|
| `src/lib/neighbor-orbit.ts` | Saf geometri: koltuklar, perspektif izdüşümü, ufuk halkası. Import'suz, tek başına sınanabilir. |
| `src/lib/neighbor-orbit.test.ts` | Yukarıdakinin sınamaları — 11 sınama. |
| `src/components/Neighbors.tsx` | **Sunucu bileşeni.** Benzerlik ve `depth` burada hesaplanıyor. |
| `src/components/NeighborOrbit.tsx` | İstemci bileşeni: `requestAnimationFrame` döngüsü, ref üzerinden çizim. |

Ayrım şart: benzerlik motoru 44×44'lük bir kosinüs matrisi kuruyor
(`space-marks.ts:11-13`). İstemciye inseydi bütün veri seti ve hesap tarayıcı
paketine binerdi. Kare başına `setState` yok — `EvolutionChart.tsx:26`'nın kuralı.

Öndeki komşu merkezin önünden, arkadaki arkasından geçiyor. Bu örtme, dönüşün
gerçekten derinlik taşıdığını anlatan en güçlü işaret; taraf değişimi yalnızca
kesişme anında DOM'a dokunuyor, her karede değil.

Hareket azaltılmışsa dönmüyor, sabit bir çeyrek turda duruyor. İmza bu ayrımı
bilerek yapmıyor ama gerekçesi oraya özgü: orada hareket anlatının konusu (zamanın
geçişi), burada yalnızca üçüncü boyutu gösterme yolu ve bilgi durduğunda da ayakta.

**Bunu düzeltmeye çalışan biri için:** pencereyi daraltıp uzak komşuyu kenara
kelepçelemek (off-screen göstergesi) akla gelen ilk çözüm. Denenebilir, ama ancak
Doğrulama 6'daki etiket ölçümü gerçek bir çakışma gösterirse. Ölçüm temizse
dokunulmayacak: B'nin bütün değeri o uzaklığı göstermesinde.

## Mimari

Dosyalar ve sorumlulukları [Son hâl](#son-hâl--dönen-üç-boyutlu-yörünge) bölümünde.
Buradaki kurallar biçim değişse de geçerli kaldı:

- Saf geometri modülü hiçbir şey import etmiyor — vitest'te `@/` takma adı
  çözülmediği için bu şart gevşetilemez.
- Hesap sunucuda, çizim istemcide. Benzerlik motoru tarayıcı paketine inmiyor.
- Kare başına `setState` yok.

### Çizim kuralları

- Nokta rengi `dominantFamily → getFamily().color` zincirinden. Sayfanın tepesindeki
  ışıkla **aynı kaynak**; ikinci bir renk yolu açılmıyor (`page.tsx:24-27`).
- Merkez parfüm ayırt edilir ama tıklanmaz — zaten oradasın.
- Adlar gerçek `<text>`, kırpılmıyor. `ScentSpaceCanvas.tsx:216` ve imza aynı kararı
  zaten verdi. Adın yeri ölçülerek ayrıldı: yarıçapları büyütürken sınamada boşluk
  çıktı — nokta konumu denetleniyordu ama etiket genişliği değil, oysa çerçeveden
  asıl taşan şey ad. `LABEL_HALF_WIDTH` o sınamanın ölçüsü.
- Adın arkasında koyu kontur: dönen bir düzende iki adın üst üste gelmesi kaçınılmaz,
  engellemek yerine okunabilir kılınıyor.

### Erişilebilirlik

SVG `role="img"` ve komşuları yüzdeleriyle sayan bir `aria-label`. Bağlantılar
gerçek `<a>` olduğu için klavyeyle gezilebiliyor. Hareket azaltılmışsa yörünge
dönmüyor.

## Sınama

`src/lib/neighbor-orbit.test.ts` — saf modülün 11 sınaması: en benzeyen gerçekten
en yakında mı, derinlik dikeye gidiyor mu, komşular dört bir yana dağılıyor mu, tur
boyunca nokta ve **etiket** çerçeveden taşıyor mu, perspektif gerçek mi (öndeki
arkadakinden belirgin biçimde büyük), tam tur başa dönüyor mu.

Bileşen ve E2E sınaması kapsam dışı: projede altyapısı yok. Bileşen tarayıcıda
ölçülerek doğrulanıyor.

## Doğrulama

1. `npm run build`, `npm test`, `npm run lint` yeşil (lint'in 2 hatası
   `ScentSpaceCanvas.tsx`'te ve bu dalın işi değil; 2'yi geçerse bizim işimiz)
2. Bir komşuya tıkla → doğru parfüm sayfası açılıyor
3. Yörünge hiç durmuyor; öndeki komşu merkezin önünden, arkadaki arkasından geçiyor
4. Noktaların renkleri `/uzay`daki aynı parfümlerin renkleriyle birebir
5. En benzeyen gerçekten en yakında — her sayfada, tesadüfe bırakılmadan
6. Ad taşmıyor ve dönerken bir yandan diğerine sıçramıyor
7. 375 px genişlikte okunur
8. Konsol dört sayfada da temiz

## Bu işe dahil olmayanlar

- **Künye** — veri doldurulduktan sonra ayrı tur
- `ScentSpaceCanvas.tsx`'in 971 satırı; parça onu kullanmıyor, yeni ve küçük bir SVG
- Kalan dört ertelenmiş minör
- Aşama 3 nota ansiklopedisi, çift dil
- Dalın `master`'a alınması
