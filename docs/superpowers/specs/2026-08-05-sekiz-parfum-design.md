# Sekiz Parfüm — Tasarım (sahibin rafı uzaya giriyor)

## Sorun

Uzayda 44 parfüm var ve hepsi küratör kararıyla seçildi: kimi benzerlik motorunun
kontrol noktası (`curated-a.ts:5`), kimi haritanın soğuk ucunu doldurmak için
(`fillers.ts:5`). Hiçbiri "sahibin elinde olduğu için" orada değil.

Sahibin rafındaki sekiz parfüm haritada yok. Bu bir eksiklik değil — kimse söz
vermemişti — ama uzayın kendi kurucusunun kokularını göstermemesi tuhaf.

Ansiklopediden önce gelmesinin tek ve somut bir sebebi var: **sekiz parfüm
veritabanında olmayan on bir nota getiriyor.** Önce 125/125 tarifi yazıp sonra
on bir nota eklemek, taze biten ansiklopediyi delmek olurdu. Bu iş bittiğinde
ansiklopedinin hedefi 136 nota oluyor ve on birinin tarifi zaten yazılmış.

## Kararlar

### ① İşaret yok — bunlar sıradan parfümler

Sekizi kendi dosyalarında duruyor (`curated-f.ts`) ama veri ve ekran düzeyinde
diğer 44'ten ayırt edilemiyorlar. Künye, küratör cümlesi, uzaydaki nokta, komşu
takımyıldızı — hepsi aynı.

`Perfume`'a yeni alan eklenmedi ve bu kararın kendisi. Site bir koku haritası,
bir koleksiyon vitrini değil; "kimde var" sorusunu ziyaretçi sormuyor ve
cevaplamak haritaya ziyaretçi için anlamsız bir eksen ekler. Bir kez alan
açılsaydı her ekranın (uzay, parfüm sayfası, komşular) onunla ne yapacağına karar
vermesi gerekirdi.

*Reddedilen:* uzayda ince bir işaret (nokta çevresinde halka) — "bunlar bende
var" haritada okunurdu ama şemaya yeni bir anlam ekseni girerdi. Ayrı bir
`/koleksiyon` sayfası — harita temiz kalırdı, ama ansiklopedi zaten üçüncü rotayı
getiriyor ve dördüncüsü gezinmeyi dağıtırdı.

### ② Nota listesi olgusal, ağırlık bizim okumamız

`curated-a.ts:19` bu ayrımı zaten yazmıştı; burada sınandı ve tutuldu.

Sahip sekiz parfümün künyesini ve **kendi izlenimini** verdi. İzlenimler küratör
cümlesinin hammaddesi oldu — nota listesinin değil. Listeler yayınlanan kaynaklardan
çıkarıldı.

Üç yerde sahibin verdiği yıl kaynakla çelişti: Mandarina Corsica 2015→**2018**,
Every Storm a Serenade 2016→**2015**, Moonmilk 2016→**2017**. Kaynak esas alındı;
`year` künyede ekrana çıkan olgusal veri ve satın alma yılı çıkış yılı değil.

İki parfümör boşluğu araştırma kapattı: Blanche Bête → **Louise Turner**,
Moonmilk → **Tomas Hempel** (sahip "Stora Skuggan" demişti; o ev adı, burun değil).
Long Board'ın parfümörü bulunamadı ve **boş bırakıldı** — `types.ts:126`'nın
kararı burada üçüncü kez uygulanıyor: uydurma yok, "bilinmiyor" yazısı yok, satır
tek başına yıla iniyor.

⚠️ **Bir yerde sahibin burnu kaynakla çelişti ve kaynak kazandı.** Sahip Gong için
"alttan gelen ud" demişti; yayınlanan listede ud yok, guaiac odunu var. Guaiac
udun dumanlı-tıbbi tarafını verdiği için sahibin aldığı his de açıklanmış oluyor.
Sahibe soruldu, onayladı. Düşük ağırlıklı bir `oud` eklemek de tartışıldı ve
elendi: olgusal veriye bizim yorumumuz karışırdı ve 44 parfümde bu hiç yapılmadı.

### ③ Molekül adları karışık ele alınıyor

Yayınlanan listelerde malzeme adı olmayan girdiler var: ticari molekül adları
(`hedione`, `maltol`, `calone`, `mahonial`, `mystikal`), içki/içecek adları
(`gin`, `tonic water`) ve akort adları (`dorayaki`, `suntan lotion`).

Kural: **ayırt edici karakteri olan kendi notası olur; sadece var olan bir
malzemenin molekül ya da ticari adı olan ona eşlenir.** Çift kayıt açılmıyor.

Eşlenenler:

```
hedione   → jasmine        (yasemin molekülü; parfümde yasemin zaten listede)
maltol    → sugar          (yanık şeker molekülü)
calone    → marine         (marine notasının ta kendisi)
gin       → juniper        (ardıç damıtığı)
mahonial  → lily-of-the-valley  (müge aldehiti — müge zaten ekleniyor)
tonic water → bitter-orange     (kinin acılığı)
Mysore sandalwood → sandalwood
damask rose → rose
Baltic sea mist → marine + sea-salt
```

Kendi notası olanlar arasında ikisi sınırda: `mystikal` (Givaudan captive) ve
`dorayaki` (Japon kekinin akordu). Emsal veritabanında zaten var — `ambroxan` ve
`cashmeran` da soyut/ticari molekül olarak duruyor — ve ikisi de kokusu tarif
edilebilir şeyler. `dorayaki` ayrıca Gong'un ad veren akordu; `sugar + almond`a
indirgemek parfümün kimliğini silerdi.

### ④ Yeni notaların tarifleri şimdi yazılıyor

On bir yeni notanın `description` alanı boş bırakılmıyor, iki dilli dolduruluyor.

Bu, ansiklopediden önce ansiklopedi işi yapmak gibi görünüyor ama tersi doğru:
notayı yazarken karakterini, ailesini ve uçuculuğunu zaten kararlaştırıyoruz —
tarif o kararın cümleye dökülmüş hâli. Altı ay sonra dönüp "bu neydi" diye
bakmak, şimdi yazmaktan pahalı.

Üslup `top.ts:9`'un söz verdiği gibi kurulu ve aynen izleniyor: tek cümle,
duyusal, karşılaştırmalı; pazarlama dili yok. TR birebir çeviri değil, yeniden
yazım.

## Kilit kısıt: sekiz parfüm 44'ün de yerini oynatıyor

En kolay atlanacak madde bu.

`space-feel.ts`in `normalizeAxis`i her ekseni **gözlenen** min–max'a yayıyor,
teorik −1…+1'e değil (gerekçe orada yazılı: `characterVector` ortalama döndürdüğü
için değerler dar bir bantta kümeleniyor ve teorik aralığa oturtmak kaydıracın
yolunun büyük kısmını öldürürdü).

Gözlenen aralık havuza bağlı. Havuza sekiz parfüm girince **var olan 44'ün `feel`
değerleri de kayıyor** — yeni parfüm bir eksende uca oturursa o eksen yeniden
ölçekleniyor ve eski noktalar ortaya doğru sıkışıyor.

Aynı şey `FEEL_REACH = 0.7` / `FEEL_CURVE = 3.2` için de geçerli. İki sabit 44
parfümün gerçek dağılımına karşı taranarak seçilmişti ve kaydıraç spec'inde bir
tablo bırakmıştı. **Tarama 52 ile tekrarlanmadan sabitlerin hâlâ tuttuğu
bilinemez.**

## Mimari

Yeni modül yok, yeni tip yok, yeni rota yok. Değişen tek şey veri ve —
gerekiyorsa — iki sabit.

### Veri nereye giriyor

Notalar bandına göre üç dosyaya bölünüyor (`note-sets/`); bandı `volatility`
belirliyor, dosya seçimi ondan çıkıyor. Parfümler `perfume-sets/curated-f.ts`e —
harf sırası devam ediyor ve dosya yorumu grubun ne olduğunu yazıyor.

`perfumes.ts` ve `notes.ts` toplayıcıları değişmiyor, yalnızca bir import
alıyorlar. İkisindeki yükleme denetimleri (kimlik çakışması, bilinmeyen nota
referansı) bu işin bedava sınaması: yanlış yazılmış tek bir nota kimliği
derlemeyi anında düşürüyor.

### Ölçüm koddan ayrı

Kalibrasyon taraması üretim koduna girmiyor; tek seferlik bir ölçüm ve sonucu
`space-feel.ts`in doc yorumundaki tabloya yazılıyor. Sabitler değişmezse tablo
yine güncelleniyor — çünkü tablonun işi sabitleri savunmak ve 44'e ait bir tablo
52 parfümlü bir uzayı savunamaz.

## Doğrulama

- `npm test`, `npm run lint`, `npm run build` yeşil.
- Tarayıcıda, üretim derlemesinde:
  - 52 nokta çiziliyor; giriş metnindeki sayı da 52 diyor (`page.tsx:64`
    `PERFUMES.length` okuyor, elle yazılmıyor).
  - Sekizinin de sayfası açılıyor: künye, evrim imzası, komşular. Long Board'da
    künye satırı tek başına yıla iniyor.
  - Kaydıraçlar: "sıcak + kirli" ile "soğuk + temiz" hâlâ belirgin biçimde farklı
    bölgeler veriyor; hiçbir tarifte ekran tümden sönmüyor, hiçbirinde her şey
    parlamıyor.
  - `/uzay` kontrol noktaları yeşil: Nasomatto çifti yakın, kirli uç bir arada,
    Not a Perfume yalnız.
  - Konsol temiz.
- Kümelenme ölçülüyor. Küratör listesi bilerek dengelenmişti; sekizi bir yöne
  yığılırsa harita o yöne kayar. **Bu bir karar değil, bir gözlem** — ölçülüp
  sahibe söyleniyor.

## Kapsam dışı

- **Nota ansiklopedisi ve `/nota/[id]` rotası** — sıradaki iş, kendi spec'iyle.
  Bu işten çıkan on bir tarif ona peşin sayılıyor.
- **Çift dil.** `next-intl` bağımlılıklarda duruyor ama hiç kullanılmıyor; ekran
  tamamen `.tr`'ye sabit. `types.ts:32` "Site EN birincil" diyor — tutulmamış bir
  söz, ama bu işin parçası değil.
- Sahibin kalan parfümleri. Sekizle kapatıldı; sonra eklemek kolay, ama
  kalibrasyon o zaman ikinci kez ölçülür.
