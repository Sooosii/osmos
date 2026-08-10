# Üç Açık Uç — Tasarım

## Sorun

Site bitmiş görünüyordu ama üç uç açıktı ve üçü de "bakılmadı" durumundaydı:
**erişilebilirlik** hiç ölçülmemişti, **sayfa ağırlıkları** hiç ölçülmemişti,
ve **parfümör verisindeki** üç boşluktan birinin gerekçesi "bakılmamış"tı.
Sahip üçünü de bitirmeyi istedi.

## Ölçümler ve kararlar

### ① Erişilebilirlik — beklenenden iyi çıktı, ama iki gerçek bulgu verdi

Ekran okuyucunun gördüğü ağaç (üretim derlemesi) sanılandan çok daha iyi:
tuvaller `img` rolünde ve **anlamlı alternatif metinleri** var ("Paçuli
notasını içeren 10 parfüm…", "Baraonda evrim imzası: …"), uzaydaki her parfüm
noktası adı olan bir **düğme**, karakter eksenlerinin altında `sr-only`
karşılıkları duruyor ("hafif sıcak", "keskin"), başlık düzeni ve yer imleri
(`main`, `nav`, `h1`, `h2`) yerli yerinde. Bu turda eklenecek bir şey çıkmadı.

**Bulgu 1 — dil sızıntısı (hata).** `/tr/perfume/...` sayfasında evrim
imzasının üstündeki satır İngilizce yazıyordu. İlk kare doğruydu, çizim
döngüsünün ikinci karesi üstüne yazıyordu: `phaseLabel` ve `formatDuration`
sözlüksüz çağrılıyordu ve **varsayılanları İngilizce**. Dosyanın kendi yorumu
bunu uyarmıştı bile.

⚠️ Bu hatayı mevcut hiçbir kapı göremezdi: derleme geçiyor (varsayılan var),
lint susuyor, kaçak Türkçe avcısı da göremiyor — **kaynakta Türkçe metin yok,
çalışma anında İngilizce metin var.** Yeni sınama sözlük alan üç fonksiyonun
tek argümanla çağrılmasını yakalıyor ve **önce kırılarak** doğrulandı.

**Bulgu 2 — kontrast (tasarım kararı).** Bilgi taşıyan birkaç yazı WCAG'in
4.5 eşiğinin altındaydı: marka adları ve bant etiketi **2.09**, pasif dil
bağlantısı **2.53** (tıklanabilir bir şey), alt sayaç **3.10**, bölüm
etiketleri **3.71**, ve kıl payı altında kalan **4.49**'luk kademe.

Sahip iki hâli ekranda gördü ve "yükselt" dedi ("beğenmezsem geri dönebiliriz"
kaydıyla). Sitenin en sönük yazı kademesi **/50** oldu; üst kademeler (/55,
/60, /70) olduğu gibi duruyor, yani hiyerarşi korundu, yalnızca en alt basamak
yükseldi. *Dokunulmayan yedi yer:* ayraçlar (`·`, `|`), `ScreenFrame`in ince
çizgisi ve açılış kapısının ipucu — ilk üçü metin değil süs, sonuncusu sahibin
ekranda ayrıca onayladığı bir sahne. Karar tek commit'te, `git revert` ile
döner.

### ② Sayfa ağırlıkları — bir sayfa ayrıksı çıktı

Üretim derlemesinde ölçüldü (gerçek aktarım boyutları):

| Sayfa | Önce | Sonra |
|---|---|---|
| `/notes` | 421 KB / 154 istek | **269 KB / 32 istek** |
| `/perfume/[id]` | 294 KB / 41 istek | değişmedi |
| `/space` | 242 KB / 20 istek | değişmedi |

Sebep: Next görüş alanına giren her bağlantıyı önden getiriyor ve nota
dizininde 136 bağlantı var — açılışta **131 istek / 165 KB**, ziyaretçinin bir
ya da iki notaya girdiği bir sayfada. `prefetch={false}` yalnızca o dizinde.

*Reddedilen:* prefetch'i her yerde kapatmak — parfüm sayfasındaki 16 istek
(25 KB) komşulara geçişi anında yapıyor ve bedeli küçük. Ölçüm ayrıksı olanı
gösterdi, kural değil.

### ③ Parfümör boşluğu — "bakılmamış" bitti

`min-new-york-long-board` uzun süre "bakılmamış" diye duruyordu ve bu fark
doldurma iznini belirliyordu. Bakıldı: üç ayrı arama hiçbir isim vermedi;
Fragrantica, Parfumo, Basenotes ve markanın kendi sayfası doğrudan okumaya
kapalı (HTTP 403), markanın koleksiyon metni yalnızca "Grasse'ta üretildi"
diyor. Üçü de artık aynı yerde: **arandı, açıklanmamış.**

Alan için kaynak kuralı yazıldı: doldurulacaksa **markanın kendi yayını**
olmalı. Veri tabanlarındaki burun bilgisi kullanıcı katkısı; hiçbir kayıt
yokken çıkan bir isim doğrulanmış değil, tahmindir.

## Sonuç

238 sınama yeşil, lint sessiz, 392 sayfa. Erişilebilirlik eşiğinin altında
kalan tek şey ayraçlar; kodda `TODO` yok, bayat "geçici" notu yok.
