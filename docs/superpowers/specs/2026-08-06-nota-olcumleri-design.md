# Nota Ölçümleri — Tasarım (nota sayfasının ③'ü)

## Sorun

Nota sayfası iki soru cevaplıyor: **ne** (tarif cümlesi) ve **nerede** (taşıyıcı
parfümlerin yörüngesi). Üçüncüsünü, "**nasıl bir şey**"i cevaplamıyor.

Cevap veride hazır: `volatility` her notada dolu, `character`ın dört ekseni de.
İkisi de sayfada hiç görünmüyordu.

Bu bir eksiklik değil, **verilmiş bir karardı.** Nota ansiklopedisi spec'inin
④. kararı ikisini de bilerek kapsam dışı bırakmıştı:

> *"İkisi de kapsam dışı bırakıldı ve bu bilinçli. […] ikisi de ③'te reddedilen
> şeyin ta kendisi: çubuk ve eğri. Karakter eksenleri ayrıca ikinci bir tuzak
> taşıyor: uzaydaki kaydıraç bir arama aracı, nota sayfasındaki eksen ise durgun
> bir ölçüm. Aynı görünselerdi kullanıcı nota sayfasında da arama yaptığını
> sanırdı. İstenirse ayrı iş."*

Sahip istedi. Bu spec o "ayrı iş" — ve kararı devirirken **iki gerekçesini de
geçersiz kılmak zorunda**, yok saymak değil.

## Kararlar

### ① Uçuculuk bir şerit, çubuk değil

Sekiz saat soldan sağa, **logaritmik**. Sütunun taşıdığı tek şey **doku
yoğunluğu**: notanın o andaki gücü tram noktalarının sıklığı olarak çiziliyor.

Çubuk grafiğinden ayıran şey ölçülebilir:

- **Yükseklik hiçbir şey kodlamıyor.** Bütün sütunlar aynı yükseklikte; sütun
  dikeyde dolmuyor, dokusu koyulaşıyor.
- Eksen çizgisi yok, ızgara yok, okunacak sayı yok. İki uç damgası (*ilk
  saniyeler* / *8 saat*) ve iki ölçüm (*tepe* / *yarı ömür*) var, o kadar.
- Karşılaştırma gözle yapılıyor: bergamotun şeridi solda yığılıp dağılıyor,
  sandalınki aynanın öbür tarafı. Ekranda yan yana konup doğrulandı.

**Zaman ekseni neden logaritmik:** doğrusal olsaydı sekiz saatin ilk beş dakikası
120 sütunun birine sıkışırdı — oysa bir üst notanın bütün hikâyesi orada geçiyor.

**Ayrımı taşıyan şeyin ölçüsü.** Toplam doluluk işe yaramıyor: 136 notanın tamamı
%49–72 arasına sıkışıyor, yani toplama bakan biri bergamotla sandalı ayırt edemez.
Ayıran şey **eğim** — şeridin sol yarısı eksi sağ yarısı:

| | sol | sağ | eğim |
|---|---|---|---|
| bergamot (2 dk / 20 dk) | 0.90 | 0.19 | **+0.71** |
| sandal ağacı (120 dk / 720 dk) | 0.46 | 0.87 | **−0.41** |

İşaret dönüyor ve sınama bunu denetliyor. Sağ yarının 136 nota boyunca yayılımı
0.11–0.93; bu aralık daralırsa 136 sayfa birbirine benzemeye başlar ve şerit süse
döner.

*Reddedilen:* nefes alan disk (`evolution-loop.ts` döngüsüyle) ve sadece cümle +
iki sayı. İkisi de ayakta duruyordu; şerit ekranda görülüp seçildi.

### ② Karakter eksenleri ortadan dışa doluyor

Dört satır, her satırda iki uç adı ve 16 basamak. Kaydıraçtan ayıran dört şey:

- **topuz yok**, tutulacak yer yok
- `cursor` değişmiyor, odaklanmıyor, tıklanmıyor
- **basamaklı** — 0.50 ile 0.51 aynı basamağa düşüyor; kaydıraç sürekli
- **ortadan iki yana açılıyor** — kaydıraçlar tek uçtan dolar

Sonuncusu sonradan geldi ve bir hatayı düzeltti. İlk hâl soldan doluyordu:
bergamot (`temperature −0.6`, yani soğuk) 16 hücrenin 3'ünü doldurup ekranda "az
bir şey var" diyordu, "soğuğa yakın" demiyordu. **Eksen bir miktar değil bir yön
ölçüyor**; dolgunun ortadan başlaması bunu söyleyen tek biçim. Ekranda görülüp
düzeltildi.

Tarafsız bir nota (|değer| < 0.15) hiçbir hücre doldurmuyor, o yüzden orta çizgi
hep duruyor — olmasa satır eksik veri gibi görünürdü.

**Sıfat eşikleri ölçülerek konuldu**, tahminle değil. 136 notanın 544 ekseni:

| |değer| | pay | sıfat |
|---|---|---|
| < 0.15 | %15 | *soğuk ile sıcak arasında* |
| 0.15 – 0.40 | %29 | *hafif sıcak* |
| 0.40 – 0.70 | %41 | *sıcak* |
| ≥ 0.70 | %16 | *belirgin sıcak* |

Dört bandın da veride dolu olması sınanıyor: bir bant boşalırsa eşikler veriye
değil tahmine dayanıyor demektir.

### ③ Yeri ① ile ② arasında

Tarif → ölçümler → taşıyıcı parfümler. **Ne → nasıl → nerede.** Sahip seçti;
alternatif yörüngeden sonrası ("önce çarpıcı olan") idi.

### ④ Üç yüzey tek dokuyu paylaşıyor

Şerit eşiğini `dither-field.ts`ten alıyor, kopyalamıyor. Arka plan alanı, nota
yörüngesi ve şerit aynı Bayer matrisini kullanınca sayfa **tek bir madde** gibi
okunuyor — üç ayrı efekt gibi değil.

⚠️ Şeridin satır ve sütun sayısı **dördün katı olmak zorunda.** 10 satır denendi:
Bayer 4 satırda tekrar ettiği için ilk iki satır üç, son ikisi iki kez örnekleniyor
ve şerit eşiklerin tamamını eşit temsil etmiyordu — yoğunluk sistematik olarak
yanlış çıkıyordu.

### ⑤ Sunucu bileşeni, istemciye hiçbir şey inmiyor

Durum yok, animasyon yok, `'use client'` yok. Ölçüm durgun olduğu için gerek de
yok — ve **o durgunluk eksenleri kaydıraçtan ayıran şeyin kendisi**. Bileşene bir
gün `'use client'` gerekiyorsa tasarım kaymış demektir.

1440 hücre için 1440 `<rect>` yerine yatayda bitişik dolu hücreler tek `<path>`
parçasına katlanıyor; görüntü birebir aynı, `crispEdges` kenarları yumuşatmıyor.

## Mimari

Geometri ve eşikler `lib/note-measures.ts`te — React, DOM, canvas bilmeyen saf
modül, `note-orbit.ts` ve `dither-field.ts` ile aynı sözleşme. Çizim
`components/NoteMeasures.tsx`te.

Eğri formülü **yeniden yazılmadı**: `evolution.ts`in `intensityAt`i çağrılıyor,
`evolution-loop.ts`in `formatDuration`ı ve `SIGNATURE_MAX_MINUTES`i kullanılıyor.
Bu, vitest'e `@/` takma adını öğretmeyi gerektirdi (`vitest.config.mts`) — bugüne
kadar sınanan modüllerin hiçbiri o yolu kullanmıyordu. Alternatif formülü ikinci
kez yazmaktı; `evolution.ts`in "eğri modeli tek yerden ayarlanır" sözünü bozardı.

## Yan düzeltme: arka plan yazıyı yutuyordu

`DitherBackdrop`ın `DOT_ALPHA` değeri 170'ti (255'in %67'si) ve ekranda
görüldüğünde sayfanın **bütün yazısını** okunmaz hâle getiriyordu — başlık, tarif,
ölçümler. 46'ya indirildi. Alan arka plan; ön plana çıktığı anda işini yapmıyor
demektir.

## Kapsam dışı

Çerçevenin (`ScreenFrame`) siteye yayılması · açılış sahnesi (hero-scrub) · çift
dil (`next-intl` bağımlılıkta duruyor, hiç kullanılmıyor) · `?feel=` kaydıraç
durumunun URL'de taşınması · README'nin hâlâ create-next-app şablonu olması.
