# Nota Ansiklopedisi — Tasarım (Aşama 3)

## Sorun

`types.ts:90` ve `top.ts:9` bir söz vermişti: *"Açıklama alanı bilinçli olarak boş —
nota ansiklopedisiyle birlikte (Aşama 3) doldurulacak. İlk 15 nota üslup örneği
olarak açıklamalı."* Söz dört spec'in dördünde de "kapsam dışı" satırında
tekrarlandı ve hiç tutulmadı.

Bugün 136 notanın **35'i** açıklamalı ve `description` alanı **hiçbir yerde ekrana
çıkmıyor.** Yazılmış 35 cümle atıl duruyor.

Daha derin sorun şu: **notaların sitede bir yeri yok.** Uzaydan parfüme, parfümden
uzaya gidiliyor; notalar bu zincirin hiçbir yerinde durak değil. Evrim imzasında
adları geçiyor ama tıklanacak bir şey değiller. Parfüm sayfası nota listesi bile
göstermiyor.

## Kararlar

### ① Notanın kendi sayfası var

`/nota/[id]`. Nota, parfüm gibi bir varlık oluyor.

*Reddedilen:* derinlik katmanı — tarif yalnızca evrim imzasındaki etikete
dokununca açılan bir katman olsun, yeni rota olmasın. Daha küçük iş ve kaydıraç
kararının ruhuna daha yakındı ("uzay cevap verir, sayfa değişmez"), ama 101 tarif
yazıp her birini tek bir minik yerde göstermek onları ikinci kez gömmek olurdu.
Sahip açıkça ayrı sayfa istedi.

### ② İki kapı: etiketler tıklanır **ve** dizin açılır

Evrim imzasındaki nota etiketleri `/nota/[id]`ye link oluyor, **ve** `/notalar`
dizini açılıyor.

Gerekçe tek bir sayıda: tek kapı bırakılsaydı 101 tarifin çoğu pratikte hiç
görülmezdi. Yalnızca etiketler tıklansaydı bir notaya ulaşmak için onu içeren
parfümü önceden bulmak gerekirdi — tek parfümde geçen bir nota neredeyse
ulaşılamaz olurdu. Yalnızca dizin olsaydı parfümden notaya geçiş hiç kurulmaz,
ansiklopedi sitenin geri kalanından kopuk bir ada olurdu.

İkisi birlikte siteyi **çift yönlü** yapıyor: parfüm → nota → parfüm.

⚠️ Etiketleri link yapmak evrim imzasına dokunmak demek ve o bileşen 12 saniyelik
bir turda hiç durmadan dönüyor. Etiketler gerçek SVG `<text>` (bileşenin kendi
yorumu bunu şart koşuyor, `EvolutionSignature.tsx:25`), dolayısıyla SVG `<a>` ile
sarılabiliyorlar. Dönen hareketin bozulmaması uygulamada ölçülecek.

### ③ Nota sayfasının merkezi: yörünge, grafik değil

"Bu nota hangi parfümlerde var" sorusu bir liste ya da çubuk grafikle
cevaplanmıyor. **Merkezde nota, etrafında onu içeren parfümler dönüyor.**

- **yarıçap** — notanın o parfümdeki ağırlığı (baskınsa merkeze yakın)
- **yükseklik** — `depth`, haritanın iki boyuta sığdıramadığı üçüncü bileşen
- **renk** — parfümün baskın aile rengi, uzaydaki noktasıyla aynı zincirden

Sahip açıkça istedi: çubuk yok, eğri yok, slope yok, "her yerde bulunacak
tarzdan" bir şey yok. Karar ekranda bir maketle görülüp onaylandı.

### ③b Doku dithered — ayrımı taşıyan şey bu

Yörünge pürüzsüz daireler ve degradelerle değil, **tram noktalarıyla** çiziliyor:
yoğunluk bir nokta ızgarasına **Bayer 4×4** eşiğiyle çevriliyor. Eşik sıralı,
rastgele değil — rastgele olsaydı desen dönerken titrerdi.

Fikir sahibin gönderdiği bir referanstan geldi (UnicornStudio ile yapılmış bir
"ASCII/dithered" hero). **Referanstaki bileşen alınmadı ve alınamazdı:** sahne
üçüncü tarafın barındırılan proje kimliğiydi, kodun yarısı servisin marka yazısını
silmeye çalışıyordu, çalışma anında CDN'e bağlanıyordu ve `Math.random()` ile
hidrasyon uyuşmazlığı üretiyordu. Alınan tek şey **doku**; kendi canvas'ımızda,
sıfır bağımlılıkla yazıldı.

Referanstaki HUD süsleri de bilerek alınmadı — köşe parantezleri, `LAT/LONG`
okumaları, `SYSTEM.ACTIVE`, sahte çubuk göstergeler. OSMOS'un tamamı boşluk
üzerine kurulu (`text-white/25`, tek bir ince aile rengi, fotoğraf yok); o süsler
sitenin kendi dilini bozardı.

⚠️ **Kabul edilmiş risk ve çözümü:** yörünge komşu takımyıldızının (`NeighborOrbit`)
çok yakınına düşüyor — o da üç boyutlu, o da dönüyor. Sahip riski bilerek kabul
etti ("çok aynı gelirse değiştiririz"), ama dithered doku riski büyük ölçüde
çözüyor: **komşu takımyıldızı pürüzsüz SVG kalıyor, nota yörüngesi tram.** Aynı
geometri, bambaşka madde.

İkinci ayrım sayıda: komşu takımyıldızında hep **üç** nokta
döner; nota yörüngesinde sayı **1 ile 26 arası** değişir. `sandalwood` 26 parfümde
geçiyor, `dorayaki` bir tanesinde. Yoğunluğun kendisi bilgi — `oud` yoğun bir
sürü, `dorayaki` yalnız bir nokta.

Bu yüzden yörünge **hepsini gösteriyor, ilk N'i değil.** Kalabalık bir kusur
değil, o notanın paletteki ağırlığının ta kendisi. Okunurluk etiketlerden
çözülüyor: yalnızca öne dönen birkaç parfümün adı yazılıyor, arkadakiler
sönerken adları da sönüyor.

### ④ Uçuculuk eğrisi ve karakter eksenleri sayfada yok

İkisi de kapsam dışı bırakıldı ve bu bilinçli. Notanın uçuculuğu `evolution.ts`te
hazır duruyor, dört ekseni de `character`ta — ikisini de çizmek kolaydı. Ama
ikisi de ③'te reddedilen şeyin ta kendisi: çubuk ve eğri.

Karakter eksenleri ayrıca ikinci bir tuzak taşıyor: uzaydaki kaydıraç bir **arama**
aracı, nota sayfasındaki eksen ise durgun bir **ölçüm**. Aynı görünselerdi
kullanıcı nota sayfasında da arama yaptığını sanırdı.

*İstenirse ayrı iş.*

### ⑤ Tarifler bant bant yazılıyor

101 eksik tarif üç turda: önce üst (30), sonra kalp (49), sonra dip (22). Her
banttan sonra sahip okuyor.

Sahip bunu seçti; alternatifler "hepsini tek seferde" (en hızlı ama üslup sapması
geç görülür) ve "önce 10 örnek" idi.

Üslup 35 örnekle kurulu ve aynen izleniyor: tek cümle, duyusal, karşılaştırmalı;
pazarlama dili yok. TR birebir çeviri değil, yeniden yazım.

## Mimari

### Geometri saf modülde

`lib/note-orbit.ts` — React, DOM ve SVG bilmeyen, hiçbir şey import etmeyen saf
modül. `space-approach.ts`, `evolution-loop.ts` ve `neighbor-orbit.ts` ile aynı
sözleşme, aynı sebeple: depoda `vitest.config.*` yok, dolayısıyla `@/` takma adı
sınamalarda çözülmüyor. Bu bir kolaylık değil zorunluluk.

`neighbor-orbit.ts` **kopyalanmıyor.** Ortaklaşan ne varsa (perspektif izdüşümü,
etiket yerleşimi) oradan çıkarılıp paylaşılıyor; ayrışan tek şey nokta
kümesinin nereden geldiği ve yarıçapın ne anlama geldiği.

### Hesap sunucuda

`space-marks.ts`in sözleşmesi burada da geçerli: nota veritabanı ve benzerlik
motoru istemci paketine girmiyor. Nota sayfası sunucuda üretiliyor, istemciye
yalnızca çizilecek noktalar iniyor.

`generateStaticParams` ile 136 nota sayfası da statik üretiliyor — parfüm
sayfasının deseni (`parfum/[id]/page.tsx:40`).

### Dizin sayfası

`/notalar` — 136 nota, banda göre gruplu (üst / kalp / dip), her biri aile
renginde. Sunucu bileşeni, istemci JavaScript'i yok.

## Doğrulama

- `npm test`, `npm run lint`, `npm run build` yeşil; 136 nota sayfası üretiliyor.
- Tarayıcıda, üretim derlemesinde:
  - Evrim imzasındaki etiket tıklanınca doğru notaya gidiyor **ve dönen hareket
    bozulmuyor** — asıl risk bu.
  - Yörünge dönüyor; `sandalwood` (26 parfüm) kalabalık, `dorayaki` (1 parfüm)
    yalnız duruyor. İkisi de okunur.
  - Nota → parfüm → nota turu kapanıyor.
  - `prefers-reduced-motion` açıkken yörünge duruyor.
  - Konsol temiz.

## Kapsam dışı

- Uçuculuk eğrisi ve karakter eksenleri nota sayfasında (karar ④).
- **Çift dil.** `next-intl` bağımlılıklarda duruyor ama hiç kullanılmıyor; ekran
  tamamen `.tr`'ye sabit. Tarifler iki dilli yazılıyor, yani ansiklopedi çift dile
  hazır doğuyor — ama arayüzü çevirmek ayrı iş.
- Notada arama / filtreleme. 136 nota dizinde tek ekranda geziliyor.
