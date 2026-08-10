# Açılış Kapısı — Tasarım

## Sorun

Uzayın önünde yalnızca yaklaşma sahnesi vardı (`space-approach.ts`): kamera
0.14'ten 1'e, beş tekerlek çentiği. Sahne bir eşik, ama siteye ait bir **yüz**
değil — ekran açıldığında ortada isimsiz bir toz bulutu duruyor.

Sahibin getirdiği drop-in perde (`public/intro.js`) bir dal olarak duruyordu
(`2a98ebe`), master'a girmemişti ve üç ölçülmüş sorunu vardı: adın üç kez
görünmesi (perde → uzak im → varış; oysa `space-approach.ts:50-55` "kavuşma"
gerekçesini **iki** kez için yazmış), ilk tekerlek çentiğinin perde tarafından
yutulması, ve tanıtım cümlesinin ekranda ~1 saniye kalması.

## Kararlar

Kararların tamamı **ekranda görülüp** verildi (sahibin kuralı: göster, sonra sor).

### ① Kapının üç adımı var: astronot → perde → yaklaşma

Sıra `Acilis.tsx`te kuruluyor. Perde silinmedi — sahip geri istedi ("süperdi") ve
**aynen** oynuyor: noktalar uçuşuyor, 2.6 saniyede kendiliğinden çekiliyor,
uzaya bırakıyor. `intro.js`e tek bir olgu düzeltmesi dışında dokunulmadı.

Zamanlamanın iki ucu da yanlış, doğrusu ortası:

- **Baştan kurulamaz.** `intro.js` "atla" dinleyicilerini (`wheel`/`scroll`/
  `click`, hepsi `once`) kurulduğu anda takıyor; astronotu uğurlayan ilk
  kaydırma perdeyi de atlatırdı — perde hiç görünmezdi.
- **Astronot gittikten sonra da kurulamaz.** 700 ms'lik solma boyunca altta uzay
  görünüyordu. Sahip ekranda yakaladı: *"önce uzay açılıyor, sonra perde
  geliyor."*

Doğru an uğurlamanın **başı** (`onLeaving`): perde alta kurulur, astronot z-70'te
onun üstünde erir. Uğurlayan kaydırma perde kurulmadan önce yaşandığı için
perdenin atla dinleyicilerine değmiyor.

*Kazanılan:* ad artık iki kez görünüyor (uzak im + varış) — kapıda isim yok, o
yüzden "kavuşma" gerekçesi geri geldi. İlk çentik de yutulmuyor: astronotun
katmanı `pointer-events: none`, çentik hem onu uğurluyor hem yaklaşmayı
başlatıyor.

### ② Özne tek: astronot, etrafında hiçbir şey yok

Sahibin referansı 21st.dev'deki `hero-ascii-one`. Bileşen kurcalandı: efektin
aslı dışarıdan yüklenen bir **UnicornStudio** sahnesi (`cdn.21st.dev`teki
bundle'da `unicornstudio.js` gömülü). Sahne değiştirilemiyor ve site çalışma
anında dışarıya istek atmıyor — görsel dil elle kuruldu. **Aynı karar bu depoda
ikinci kez veriliyor**; `dither-field.ts` de atılmış bir UnicornStudio gömüsünün
elle yazılmış karşılığı.

Sahibin getirdiği üç bölümlük taslaktan (`acilis-taslak.html`) yalnızca astronot
alındı. *Reddedilen:* SPACE bölümü, gezegen kartları (SUN/EARTH/MOON), JOIN NOW,
navigasyon — hepsi şablon artığı. Ekranda özneden ve tek satır ipucundan başka
hiçbir şey yok.

### ③ Doku karakter merdiveni — üç deneme sonunda

| deneme | sonuç |
|---|---|
| karakter merdiveni (` .:-=+*#%@`) | ilk hâl |
| tek tip nokta | "beğenmedim" |
| yarıton (boyu tonla değişen nokta) | "çok aşırı yapay" |
| **karakter merdiveni, gradyanlı figür üstünde** | **seçildi** |

Yapaylığın kaynağı kusursuz nokta ızgarasıydı; karakterlerin düzensiz biçimleri
ve kıpırtısı dokuyu organikleştiriyor. Yarıton denemesinin **biçimi** kaldı
("şekiller durabilir, güzel onlar"): gradyanlı gövde, kapkara vizör, eldivenler,
botlar, ayrık çanta kanatları.

Vizör kara boyalı çünkü örnekleyici **parlaklık × örtme** okuyor — kara yüzey
delik gibi davranıyor ve figürü tek başına "astronot" diye okutan şey o.

### ④ Arka planda ritim yasak

Tarla ilk kurulduğunda bütün noktalar tek hızda iniyor ve hücre boyunda **hep
birlikte** sarıyordu (`(t·hız) % BG_CELL`); yanıp sönme de tek ortak frekanstaydı.
Sahip duydu: *"tak tak tak gibi çalışıyor, ritim diye bir şey olmasın; nasıl ki
astronotu oluşturan şeylerde ritim yok, arka planda da olmasın."*

Şimdi her noktanın kendi düşüş hızı, yatay salınımı ve yanıp sönme frekansı var
(`fieldDot`); sarma noktaya özgü ve ekran boyunda. Ortak periyot yok → dikişsiz
döngü, sıfır vuruş. Bu bir his değil **sözleşme**: "iki noktanın hızı ya da
frekansı eşit olamaz" bizzat sınanıyor.

Tarla ayrıca canlandırıldı (ilk hâli "çok sönük"tü): nokta boyu çeşitlendi
(1.1–2.4 px, iri olan hızlı düşüyor — ucuz paralaks), parlaklık bandı genişledi,
%4'lük bir azınlık gerçek yıldız oldu. Tavan yine de figürün altında — özne
astronot.

### ⑤ Uzayın zemini mat siyah

`space-draw.ts`teki vinyet (merkez `#14141B` → kenar `#050507`) kapatıldı, iki
sabit de `#000000`. Sabitler ayrı duruyor: vinyet tek satırla geri gelir.
Sayfanın ve perdenin zeminleri de siyaha çekildi ki devir teslim bir renk
değişimi değil, yalnızca içeriğin belirmesi olsun.

### ⑥ Ekranda noktalı büyük İ yok

Sahibin kesin kuralı: *"İ bunu görmiyim, düzelt bunu her yerden."* IÇIN, KADIFE,
KESKIN, TEMIZ, KIRLI, DIP, EVRIM, AILE, Iris, Incir, Indol — hepsi noktasız I.

Bu bir dizgi düzeltmesi **değil**, tercih; ve bir kararı devirdi. Parfüm
künyesindeki `toLocaleUpperCase('tr')` ("ÇIÇEKSI bozuk görünüyor" gerekçesiyle
konmuştu) `toUpperCase()`a döndü. Belge `lang="en"` olduğu için CSS'in
`uppercase` dönüşümü de zaten i→I üretiyor — istenen davranış bu, dokunulmuyor.
Kural yalnızca ekrana çıkan metin için; kod yorumlarında İ serbest.

### ⑦ Nota yörüngesindeki merkez disk kısıldı

Sahip: *"tam ortalarında duran güneş gibi bir simge var, çok önde, göz yoruyor
gibi — çok az söndür."* `ditherDisc` çağrısı 0.95/1.05'ten 0.82/0.92'ye indi.
Kazanç 1'in altına inince kenar hücreleri Bayer eşiğine takılıp seyreliyor: disk
ışık kaynağı olmaktan çıkıp öteki disklerle aynı dokuya dönüyor. Tek bileşen,
136 nota sayfasının hepsinde geçerli.

## Ölçüm ve dayanıklılık kararları

Üçü de ekranda görülen bozulmalardan doğdu; her biri bir varsayımın çürümesi.

**Tarla pencereyi dinlemek zorunda.** İlk sürüm tuvali açılış anındaki boyuta
çakmıştı ("kapı saniyelik, kimse boyutlandırmaz"). Sahip küçük pencerede açıp
büyüttü: CSS eski tamponu gerdirdi, yuvarlak noktalar yumurtaya döndü. `setupBg`
artık `resize`da yeniden kuruyor — nokta kimliği hücresinden geldiği için
(`fieldDot(col, row)`) yeniden kurulum görüntüyü bozmuyor, büyüyen alana yalnızca
yeni hücreler ekleniyor.

**DPI kırpılmaz, tampon ekrandaki gerçek boyuta kurulur.** Figür 616 piksele
çizilip CSS'e 560'a küçülttürülüyordu; o yeniden örnekleme karakterleri
yumuşatıyordu ("çok kalitesiz"). `setupFig` artık `rect × dpr` boyutunda tampon
kuruyor, CSS hiçbir şeyi ölçeklemiyor. Piksel oranı da kırpılmıyor — uzayın ana
tuvaliyle aynı politika (`use-canvas-size.ts`).

**Kapı düzen kutusuna değil görünür alana çapalı.** Sahibin ekranında astronot,
perde ve uzay birlikte sağ-alta kaymış göründü; temiz profilde aynı pencere ve
piksel oranlarında (1×/1.5×/2×) her şey piksel piksel merkezdeydi. Sebep ortamdı,
ama savunma koda girdi: `visibleBox()` konumları `visualViewport`tan okuyor,
`counterZoom()` dışarıdan basılan `zoom`un tersini kapının köküne basıyor; perde
için aynısını `fitPerde()` yapıyor (`intro.js`e dokunmadan). Normal ortamda
ikisinin de etkisi sıfır.

## Yapı

| dosya | iş |
|---|---|
| `src/lib/astronot-tram.ts` | saf: rampa, kıpırtı, salınım, tarla noktasının kimliği ve hareketi |
| `src/lib/astronot-tram.test.ts` | 22 sınama — ritimsizlik ve bantlar dahil |
| `src/components/AstronotIntro.tsx` | figür + tarla tuvalleri, uğurlama, ölçü kurulumları |
| `src/components/Acilis.tsx` | sıra: astronot → perde |
| `src/components/IntroOverlay.tsx` | perdeyi bağlayan katman + görünür alana oturtma |

Saf modül React, DOM ve canvas tanımıyor; bileşen yalnızca "ne zaman çiz"
sorusunu yanıtlıyor. 171 sınama yeşil.

### ⑧ Dönenlere kapı yok (ek karar, aynı gün)

Kapı ilk hâlinde her ziyarette oynuyordu. Sahip ekranda yakaladı: *"her notadan
mesela asıl uzaya geçince giriyormuş; geri dönüşte perdeyi atlayıp doğrudan
uzaya bıraksın."*

Kural zaten yazılıydı — `use-approach-scene.ts`: *"sahne bir eşik, ama tanıdık
bir yere dönen için eşik yoktur."* Ama yalnızca `?mark=` ile işliyordu: parfüm
sayfası dönüş bağlantısında onu taşıyor, **nota sayfası düz `/`'e dönüyor**. Açık
kalan yol oydu.

Bayrak adresle değil **oturumla** taşınıyor (`acilis-oturum.ts`). *Reddedilen:*
dönüş bağlantılarına parametre iliştirmek — dönüş yolu üç yerden geliyor (nota,
parfüm, tarayıcının geri tuşu) ve her yeni bağlantıda unutulacak bir borç olurdu;
nota sayfasında tam da bu olmuş.

Dönüşte üç adımın üçü de atlanıyor: astronot, perde, yaklaşma. Bayrak astronot
uğurlanırken yazılıyor — perdenin ortasında ayrılan da baştan izlemiyor. Oturum
bitince kapı yeniden kapı.

⚠️ Bayrak **render sırasında okunamaz**: oturum deposu sunucuda yok, okumak
hidrasyonu kırar. Karar bir etkide veriliyor, yani dönüş ziyaretinde kapı bir
kare duruyor — görünmüyor, çünkü kapının da altındaki uzayın da zemini siyah.
Depo erişimi fırlarsa (gizli pencere) kapı görünür: sayfanın açılması eşiğin
atlanmasından önemli.

## Açık uçlar

- Astronot SVG'si bileşenin içinde gömülü. Başka bir öznenin denenmesi kolay
  ama şu an tek kullanıcısı olduğu için dışarı çıkarılmadı (YAGNI).
