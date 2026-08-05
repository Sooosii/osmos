# Sinestezi Kaydıraçları — Tasarım (şemanın son sözü)

## Sorun

Veri şeması (`data/types.ts:5-9`) her alanın hangi gösterimi süreceğini baştan
yazmıştı:

```
volatility → evrim çizelgesi          ✅
families   → Koku Uzayı'ndaki konum   ✅
character  → sinestezi kaydıraçları   ❌  + görsel imza ✅
```

Yol haritasının ①②③④'ü bitti; `character`'ın yarısı karşılıksız kaldı. Niyet
`types.ts:62`'de yazılı: *"Nota bilmeyen biri 'soğuk ve temiz bir şey istiyorum'
diyerek arama yapabilsin diye var."*

Künyeden farkı: bu iş veri beklemiyordu. 125 notanın 125'inde `character` dolu ve
`similarity.ts:93`'teki `characterVector()` zaten benzerlik motorunu besliyordu.
Eksik olan tek şey etkileşimdi.

## Kararlar

### ① Uzay cevap verir

Kaydıraç oynadıkça uymayan noktalar sönüyor, uyanlar parlıyor. **Kamera oynamıyor,
sonuç listesi açılmıyor, sayfa değişmiyor.** Sürükleme, yakınlaşma ve dokunma
aynen çalışmaya devam ediyor.

*Reddedilen:* kameranın en iyi eşleşmeye uçup onu seçmesi — kesin bir cevap verir
ama "ikincisi neydi?" sorusunu cevapsız bırakır ve haritayı bir cevap kutusuna
indirger. Ayrı bir `/ara` rotası — en net olanı, ama ikinci bir gezinme modeli
demek ve uzay merkez olmaktan çıkar.

### ② İki eksen açık, iki eksen "…" ile

Soğuk↔sıcak (`temperature`) ve kirli↔temiz (`cleanliness`) hep açık — şemanın
kendi örnek cümlesindeki ikisi. Altlarındaki "…" düğmesi pürüzsüz↔tırtıklı
(`texture`) ve uzak↔yakın (`proximity`) eksenlerini getiriyor.

**Bu karar iki eksenle başladı ve ekranda görüldükten sonra değişti.** İlk hâli
yalnızca iki eksendi; kademeli açılım "henüz kimsenin istemediği bir esneklik"
diye elenmişti (YAGNI). Çalışan hâli görünce sahip detayı istedi ve gerekçe
haklıydı: dördü de veride zaten hazır duruyordu, saklamak bilgi saklamaktı.

*Reddedilen:* dördünü birden açmak — boşluk üzerine kurulmuş bir ekranda dört
satır kontrol fazla ve dört ekseni birden ayarlamak iş gibi hissettiriyor.

**Açılım tek yönlü: açılıyor, kapanmıyor.** Kapanabilseydi iki seçenek olurdu ve
ikisi de kötü. Açılmış eksenler kapanınca tarifte kalsaydı, ekranda görünmeyen
iki koşul cevabı sürüklerdi — kullanıcı neden o sonucu aldığını göremezdi.
Sıfırlansaydı kazara kapatmak sessizce ayarı silerdi.

⚠️ Gizli eksenler yüzünden "dokunulmamışlık" **eksen başına** tutulmak zorunda
kaldı. "…" ile gelen doku kaydıracı ortada duruyor; ortayı bir tarif saysaydık
kullanıcı ona hiç dokunmadan cevabı iki koşulla daraltmış olurdu — üstelik neden
daraldığını göremeden. `FeelTarget` bu yüzden eksen başına `number | null`.

Ölçünün karekök içi de bu yüzden **ortalama**, toplam değil: "…" açmak
uzaklıkları büyütüp cevabı daraltmasın. Ölçüldü — iki eksenli ve dört eksenli
tarifler aynı ölçekte cevap veriyor (aşağıdaki tablo).

### ③ Sol üstte, giriş metninin altında

Sitenin tek "meta" köşesi. Metin "ne yapabilirsin" diyor, kaydıraçlar o cümleyi
uzatıyor.

*Reddedilen:* alt orta — küratör cümlesi ve giriş şeridi zaten oradan çıkıyor, üç
şey aynı dar banda yığılırdı. Gizli/çağrılan — uzay tertemiz kalırdı ama
`SpaceOverlays.tsx:115` bu tuzağı zaten bir kez yazmış: "denenmediği sürece
görünmez bir hareket". Aynı hataya ikinci kez düşmek olurdu.

### ④ Sürekli sönme, dip sınırlı

Her nokta yakınlığına göre derecelenir; hiçbiri tamamen kaybolmaz. Dip değeri
uzayda zaten var olan `DIM_ALPHA`.

*Reddedilen:* eşik ("en iyi N parlasın") — N keyfi ve kaydıraç sürülürken cevap
sıçrayarak değişir, sıradaki aniden yanıp söner. Dipsiz sönme — dramatik, ama
dört nokta kalan bir ekranda "neredeyim" cevapsız kalır; sürüklenecek,
yakınlaşılacak bir şey kalmaz.

### ⑤ Metin yolu karşılık vermiyor

Kaydıraçlar klavyeyle çalışıyor (native `<input type="range">` bunu veriyor) ama
sonuç seslendirilmiyor. **Özellik görsel yola ait ve bu bilinçli bir karar** —
sessizce atlanmadı.

*Reddedilen:* `aria-live` özeti ("9 parfüm bu tarife yakın") — boşluğu doldururdu.
`SpaceKeyboardList`in kaydıraça göre yeniden sıralanması — en simetrik çözüm, ama
sekmeyle gezerken listenin ayaktan kayması odağı kaybettirir; depo bu tuzağı
etiket çapasında bir kez yaşayıp geri almış.

## Kilit kısıt: dokunulmamış kaydıraç bir tarif değil

Topuzlar ortada doğuyor. Ortayı bir tarif saysaydık uzay daha varış anında, kimse
bir şey sormadan sönerdi — "0.5, 0.5"e uzak kalan her parfüm karartılırdı.

Dokunulmamış kaydıraç **"nötr istiyorum" değil "sormuyorum"** demek. İkisi aynı
sayıya düştüğü için ayrımı tip taşıyor: `FeelTarget = readonly [number, number] | null`.
Ayrı bir bayrak yok; `null`dan çıkış ilk dokunuşla oluyor.

Sınamalardaki en önemli madde bu (`space-feel.test.ts`).

## Mimari

### Hesap sunucuda

`space-marks.ts`in sözleşmesi korundu: nota veritabanı ve benzerlik motoru
istemci paketine girmiyor. Her parfümün iki eksenli koordinatı sunucuda
hesaplanıp `SpaceMark.feel`e biniyor. İstemciye inen ek yük 44 × 2 float.

### Gözlenen aralığa normalleştirme

`characterVector()` ağırlıklı **ortalama** döndürüyor, toplam değil; 44 parfümün
değerleri −1…+1'in çok içinde kümeleniyor. Teorik aralığa oturtulsaydı kaydıracın
yolunun büyük kısmı ölü olurdu: topuz uca sürülür, hiçbir şey değişmez, kaydıraç
bozuk sanılırdı. `normalizeAxis` her ekseni gözlenen min–max'a yayıyor.

### Seçim kazanır

`space-draw.ts`te zaten bir sönme vardı: seçim yapılınca seçili + komşuları tam
parlaklıkta kalıyor, gerisi `DIM_ALPHA`ya iniyor. Kaydıraç sönmesi aynı kanalı
kullanıyor, dolayısıyla ilişkileri tanımlanmak zorundaydı.

**Kaydıraç sönmesi yalnızca seçim yokken uygulanıyor.** İkisi çarpılsaydı hem
seçilmemiş hem tarife uzak bir nokta iki kez söner, harita çamura dönerdi. Ayrıca
iki soru farklı ölçekte: kaydıraç geniş ("şuna benzer bir şey"), seçim dar ("bu
neye benziyor"). Bir noktaya basmak dar soruya geçmek; boşluğa basıp seçimi
kaldırmak geniş soruya dönmek.

Dip için ikinci bir sabit uydurulmadı ve çarpma değil **ara değer** kullanıldı
(`DIM_ALPHA + (full − DIM_ALPHA) × yakınlık`). Çarpma taban değerini de
ölçekleyeceği için kaydıraçla sönen nokta, seçimle sönenden daha karanlık olur ve
uzayda iki ayrı "sönük" seviyesi doğardı.

### Kaydıraç durumu ref'te

Kontrolsüz kaydıraç (`defaultValue`), değer React durumuna hiç girmiyor. Gerekçe
`EvolutionChart.tsx:31`'de zaten yazılı: tarayıcı topuzu React'ı beklemeden
sürüyor. Ekranda değişen şey tuval, DOM değil.

### Sahneyle ilişki

Kaydıraçlar yaklaşma sahnesi boyunca yok, varışta giriş metniyle birlikte
geliyorlar. `use-approach-scene`in `paintScene`i üçüncü bir katman olarak boyuyor.

⚠️ Opaklık tek başına yetmiyor: opaklığı 0 olan bir `<input>` hâlâ sekmeyle
odaklanılabilir ve sahnenin ortasında klavye kullanıcısını görünmez bir kontrole
düşürürdü. `inert` da aynı yerden yazılıyor.

## Kalibrasyon — ekranda bulunan hata

İlk sürüm yakınlığı **mutlak uzaklıkla** ölçüyordu ve tarayıcıda kırıldı:

"Sıcak ve kirli" birim karenin köşesi, oysa parfümler ortada kümeleniyor. Köşeye
en yakın parfüm bile erişimin dışında kalıyor, dolayısıyla ekrandaki **her nokta
dibe iniyordu** — uzay cevap vermek yerine tümden sönüyordu.

Çözüm: ölçü mutlak uzaklık değil, **en iyi eşleşmeye olan fark** (`feelAnchor`).
Böylece en yakın olan nerede olursa olsun tam parlaklıkta; uzayın her tarife
verecek bir cevabı var.

Ardından iki sabit 44 parfümün gerçek dağılımına karşı tarandı. Gerilim şuydu:
köşe tariflerde veri uzak (az parlak), orta tarifte herkes yakın (hepsi parlak).
Erişimi genişletip eğriyi sertleştirmek ikisini ayırıyor.

Seçilen `FEEL_REACH = 0.7`, `FEEL_CURVE = 3.2` ile ölçülen dağılım:

| tarif | parlak (>0.5) | kademeli | dip (=0) |
|---|---|---|---|
| sıcak + kirli | 3 | 6 | 7 |
| soğuk + temiz | 8 | 11 | 1 |
| orta | 8 | 30 | 0 |
| sıcak + kirli + tırtıklı + yakın (4 eksen) | 8 | 8 | 0 |

Son satır ortalamanın işini gösteriyor: "…" ile iki eksen daha açmak cevabı
daraltmıyor, dağılım iki eksenlininkiyle aynı ölçekte kalıyor.

Elenenler: dar erişim uçta 36 noktayı dibe indiriyordu (ekran tümden sönüyordu);
doğrusal eğri ortada 38 noktayı parlatıyordu (kaydıraç hiçbir şey elemiyordu).

## Kaydıraç geometrisi — ikinci ekranda bulunan hata

İlk sürümde ikinci kaydıraç "çalışmıyor" göründü. Sebebi mekanizma değil,
geometriydi: `appearance:none` bir range input'ta 1 px'lik
`::-webkit-slider-runnable-track` kutunun dikey **ortasına değil üstüne**
oturuyor. Topuzu o rayın üstünde ortalamak için verilen negatif üst boşluk da
topuzun yarısını kutunun dışına taşırıyordu — gördüğün topuzun üst yarısı
tıklanamıyordu. İki kaydıraç alt alta olduğunda ıska aradaki 10 px'lik boşluğa
düşüyor ve kaydıraç ölü hissettiriyordu; birincide ıska tuvale gittiği için
sorun daha az fark ediliyordu.

Çözüm: ray tam yükseklikte ve saydam, hairline ise arkadaki kardeş bir çizgi.
Topuz kutunun tam ortasında duruyor, görünen yer ile tutulabilen yer birebir
örtüşüyor. Gerçek fareyle ölçüldü: her iki kaydıraç da satırın üstünden,
ortasından ve altından tutulabiliyor.

## Doğrulama

Üretim derlemesinde, tarayıcıda:

- Sahne sürerken kaydıraçlar yok ve `focus()` tutmuyor (`inert` çalışıyor).
- Varışta geliyorlar; **dokunulmadan önce bulut tamamen aydınlık.**
- "Sıcak + kirli" sol alttaki kırmızı/turuncu kümeyi yakıyor; "soğuk + temiz"
  alttaki mavi (mineral/aldehitli) noktayı ve açık tonları. İki tarif belirgin
  biçimde farklı bölgeler veriyor — anlamsal olarak da doğru.
- Nokta seçilince vurgu devralıyor: seçili + üç komşusu tam parlak, kaydıraç
  sönmesi üstlerine binmiyor. ("Soğuk + temiz" derken Velvet Iris çıkıyor.)
- Boşluğa basınca kaydıraç cevabı geri geliyor.
- `/?mark=` ile varışta kaydıraçlar dokunulmamış, harita yalnızca seçim kuralıyla
  sönük.
- Konsol temiz.

`space-feel.test.ts` 12 sınama; lint, tsc ve build yeşil.

## Kapsam dışı

- "…" açılımının geri alınabilmesi (karar ②).
- Kaydıraç durumunun adrese yazılması — `?mark=` ile parfüm paylaşılabiliyor ama
  tarif paylaşımı istenmedi. İstenirse ayrı iş.
- Metin yolunun kaydıraça karşılık vermesi (karar ⑤).
