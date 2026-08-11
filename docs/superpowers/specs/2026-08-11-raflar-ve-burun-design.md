# Raflar + Burun Raporu — tasarım

**Tarih:** 2026-08-11 · **Durum:** uygulandı (`feat/raflar-ve-burun`)

## Neden

Sahip Patron katmanını kurarken üç "basit" özelliği reddetmişti (*"bunlar çok
basit kaçıyor, bunları zaten eklememiz lazım... ben almazdım"*) ve ikisini
**ücretsiz** yapmaya karar vermişti. Bugünkü isteği: *"site biraz daha dolgun
gözüksün, çok da ağzına kadar değil."*

Sorun somuttu: üyeliğin tek işi Top 4'tü. Dört parfüm bir profil için yeterli
ama bir portre için değil — site kişi hakkında dört şey biliyor ve söyleyecek
bir cümlesi yok.

## Ana karar: iki özellik tek bir şey

Raflar raporun **verisi**. Ayrı sırayla yapılsalardı rapor dört parfümle doğar
ve zayıf çıkardı; birlikte yapılınca yirmi parfümlük gerçek bir portre oluyor.

```
kunye [bende var|denedim|istiyorum] ──► shelf ──┬──► /u/ad/shelf
Top 4 ──────────────────────────────► top_four ─┼──► /u/ad/nose  (rapor)
                                                 └──► uzayda halka ("sahibim")
```

## Sahibin verdiği kararlar

| Soru | Karar |
|---|---|
| Kaç raf | Üç: sahibim · denedim · listemde |
| Görünürlük | Herkese açık; profilin gizleme anahtarı aynen geçerli |
| Yerleşim | Profilde özet satırı, tamamı ayrı sayfada |
| Uzayda | Evet — sahip olunanlar ince halkayla |

## Kararlar ve gerekçeleri

**① Bir parfüm tek rafta.** `unique(user_id, perfume_id)`; `kind` anahtara
dahil değil. Üç raf tek bir ilişkinin birbirini **dışlayan** hâlleri, etiket
değil — "hem sahibim hem listemde" anlamsız bir cümle. Rafta gezinmek bu yüzden
`insert` değil `update`.
*Reddedilen:* çok etiketli raf. Rapor aynı parfümü iki kez sayardı.

**② Yapay üst sınır yok.** Benzersizlik kısıtı + "parfüm veride var mı"
denetimi rafı katalog boyuna kilitliyor (bugün 52). Kompozisyonlardaki
`MAX_SAVED_COMPOSITIONS` gibi bir sayı gerekmiyor: orada içerik kullanıcıdan
geliyordu, burada kapalı bir listeden seçiliyor.

**③ Rapor "listemde"yi okumuyor.** İstek listesi ne kokladığını değil ne
istediğini anlatır; portreye karıştırmak raporu yalancı yapardı. Ama öneriden
düşüyor — zaten bildiğin şeyi önermek boş.

**④ Top 4 çift ağırlık.** Top 4 bir **iddia**, raf bir **kayıt**; yirmi raf
kaydı özenle seçilmiş dördü boğmamalı. Sınama ölçüyor.

**⑤ En az üç parfüm.** Tek parfümle rapor "sen %100 bu parfümsün" der — bilgi
değil papağanlık; ikiyle "genişlik" ve "yabancı" satırlarının anlamı yok.
Altında kilitli kapı değil **davet** çiziliyor, kaç tane kaldığı yazıyor.

**⑥ Uzaydaki halka renksiz ve yalnız "sahibim" rafına.** Sitede renk = koku
ailesi; aile renginde bir halka noktanın parçası gibi görünür, başka renkte bir
halka olmayan bir aile iddia eder. İmleç tozundaki kararın aynısı. Üç raf için
üç halka biçimi ise kimsenin okumayacağı bir lejant olurdu.
Halkanın opaklığı **noktanınkinden türüyor**: sabit olsaydı seçim yapıldığında
sönen bir noktanın halkası parlak kalır, harita "şu, şuna benziyor" derken
alakasız bir noktayı işaret ederdi.

**⑦ `/api/shelf` tek uç, iki tüketici** (künye düğmeleri + uzay halkaları).
Server Action değil: bu bir GET ve depodaki "her action ilk işi oturumu
doğrular" kuralı okuma için delinmemeli. Girişsizde **401 değil boş liste** —
uç uzayın açılışında da çağrılıyor ve ziyaretçilerin çoğu girişsiz; 401 her
ziyarette konsolu kırmızı yakar, gerçek arıza o gürültüde kaybolurdu.
`private, no-store` pazarlık dışı: paylaşımlı bir önbellek birinin rafını
başkasına servis ederdi.

**⑧ Adres segmentleri Ingilizce** (`/shelf`, `/nose`). Sitenin bütün rotaları
Ingilizce; `k` tek istisna ve tekrarlanmadı.

## Yeni motor yazılmadı — dördüncü tekrar

`composition.ts`teki `asPerfume` numarası: kişinin parfümlerinin notaları tek
bir sentetik parfümde birleşince `similarity`, `familyVector`,
`characterVector` ve `normalizeAxis` hiç değişmeden çalışıyor. İkinci bir ölçü
açmak, kişinin burnunu sitenin 52'sinden **farklı bir cetvelle** ölçmek olurdu.

**Güzel bir garanti:** birleşik burnun karakter vektörü, okunan parfümlerin
karakter vektörlerinin **dışbükey bileşimi** — `noseOf`un ağırlıkları
sadeleşince görülüyor (`Σ scale·W·charVec / Σ scale·W`). Dolayısıyla hiçbir
eksende onların dışına çıkamaz ve 52'nin cetveline eklenmesi ölçeği kaydırmaz.
Sınama tutuyor: bozulursa rapor kişiye koleksiyonunda hiç olmayan bir uç
karakter atfeder — sessizce ve inandırıcı biçimde.

## Ölçülen hatalar

**Sıralama.** Kayan nokta toplaması birleşme özelliği taşımıyor: rafı ters
sırayla okumak eksen değerini `0.6685685291879153` yerine `…152` yapıyordu.
Zararsız görünüyor ama raf "yeniden eskiye" okunduğu için kişi bir parfümü
çıkarıp geri koyduğunda raporu sessizce başka bir sayı gösterirdi. Kimlikler
`knownIds()`te sabit sıraya sokuluyor; alfabetik olması keyfî, **kararlı**
olması değil.

**Sınamanın kendisi yanlıştı.** `space-draw` sınamasında sahte görünüm alanı
`minX/maxX` taşıyordu ama `Viewport` `halfX/halfY` istiyor; opaklık NaN
ölçülüyordu ve "NaN < NaN" dışındaki üç sınama yeşil görünüyordu. **Vitest tip
denetlemiyor** — bu depoda ikinci kez öğrenildi. Yardımcıya dönüş tipi yazıldı.

**Sayfa sayısı.** Statik sayfa sayısı değişmedi (396). Derlemenin "generating
static pages" sayacı 405→406 çıktı ve fark tam olarak yeni `/api/shelf` rota
işleyicisi; dinamik **sayfalar** o sayaca hiç girmiyor (Faz 4 iki rota ekledi,
sayı değişmedi). Künye sayfaları ● olarak kaldı.

## Dağıtım sırası — dikkat

⚠️ **Göç koddan ÖNCE gitmeli.** `publicProfile` artık `shelf` tablosunu
okuyor; tablo yokken kullanıcısı olan bir kurulumda profil sayfası 500 verir.
(Bu dalda ölçülmedi çünkü veritabanı boştu — kullanıcı yokken `publicProfile`
rafa hiç ulaşmadan `null` dönüyor.)

## Kalan

Uçtan uca **tarayıcı doğrulaması yapılmadı**: canlı veritabanında hiç kullanıcı
yok ve `shelf` tablosu henüz uygulanmadı. Anonim yollar doğrulandı (uzay,
künye, 404'ler, uç başlıkları, 320 px yerleşim). Girişli akışın ekranda
görülmesi sahibin bir hesap kurmasını bekliyor.
