# Patron + Kendi Kompozisyonun — Tasarım

Tarih: 2026-08-11 · Para yol haritasının **Faz 4**'ü, sahibin itirazıyla
yeniden kuruldu.

## Sorun: ilk Patron planı satmazdı

Yol haritası Patron'u süslemeyle tanımlıyordu — takımyıldız zemini, ışık
rengi, rozet, ve **burun imzası**. İki şey bozdu:

1. **İmza ücretsiz çıktı.** Sahip profil fotoğrafını reddetti ve kimlik
   işareti olarak imza kondu (hesaplar turu). Patron'un ana cazibesi
   ücretsiz katmana geçti.
2. **Kalanı zayıftı.** Sahibe burun raporu / raflar / poster önerildi;
   cevabı: *"bunlar çok basit kaçıyor, bunları zaten eklememiz lazım, çok
   etkileyici bir şey olsun istiyorum öyle alsın millet, yoksa almazlar ki,
   ben almazdım bunlar için."*

Bu doğru bir itirazdı. Zayıf bir ücretli katman satmaz; üstelik cömertliği
çekiciliği olan bir sitede küçük düşürücü görünür.

**Burun raporu ve raflar ÜCRETSİZ özelliğe dönüştü** (para planında Faz 3.5).

## Karar: satılan şey süs değil, ARAÇ

**Kendi kompozisyonunu kur.** 136 notadan kendi parfümünü kuruyorsun; site
evrim eğrisini çiziyor, koku uzayında 52'nin arasına yerleştiriyor, en çok
neye benzediğini söylüyor, adını koyuyorsun ve kendi imzası + paylaşım kartı
çıkıyor.

⚠️ **Bu, "içerik satılmaz" kuralını bozmuyor**: 52 parfüm ve ansiklopedi
herkese açık kalıyor. Satılan, kişinin **kendi ürettiği** şeyin okunması.

⚠️ **Yeni motor YAZILMADI.** Taslak `Perfume` şeklini aldığı an `similarity`,
`evolutionAt` ve `projectToSpace` olduğu gibi çalışıyor (`composition.ts`).
İkinci bir benzerlik hesabı, kullanıcının parfümünü sitenin 52'sinden farklı
bir ölçüyle değerlendirmek olurdu — karşılaştırmanın bütün anlamı aynı ölçüde.
Sınama bunu tutuyor: var olan bir parfümün notaları girilince motor onu
%90+ ile kendisini buluyor.

## Sahibin kararları (bu turda, ekranda soruldu)

| Soru | Karar |
|---|---|
| Kapsam | **Önce süsleme+araç, ödeme sonra.** Tek `patron` bayrağı; bugün elle çevriliyor, Lemon Squeezy webhook'u trafik gelince aynı bayrağa bağlanır |
| Kilit | **Üç notaya kadar bedava, sonrası Patron.** *"İnsan denemeden ödemiyor"* |
| Kompozisyon | **Profilde yaşasın, kendi adresi olsun** (`/u/ad/k/slug`), birden çok olabilir |
| Yanında | Dönen takımyıldız zemini + hareketli imza (video kart) — ikisi de |

## ① Kilit: tattır, sonra iste

Herkes girip **üç notaya kadar** kompozisyon kurabiliyor; eğri çiziliyor,
uzaydaki konumu ve en yakın parfümler gösteriliyor. Dördüncü notada davet
çıkıyor.

⚠️ Sınır **sunucuda da uygulanıyor**, ekranda değil: kaydetme ucu Patron
olmayandan üçten fazla nota kabul etmiyor. Ekrandaki sınır bir kolaylık,
kapı değil — bu depoda bir kez öğrenilmiş bir ders (Server Action'lar
herkese açık uçtur).

## ② Veri

`composition` tablosu: `id`, `userId`, `slug`, `name`, `notes` (jsonb),
`createdAt`. `(userId, slug)` benzersiz.

⚠️ `notes` **jsonb** ve bu bilinçli: nota listesi kompozisyonun kendisi,
sorgulanacak bir ilişki değil. Ayrı tablo kurmak her okumada bir birleştirme
ve sıra derdi getirirdi — Top 4'te sıra sütunda tutuluyor çünkü orada sıra
bir *iddia*; burada nota sırası kompozisyonun içi.

⚠️ Okurken **her zaman doğrulanıyor** (`compositionError`): veriden bir nota
çıkarsa ya da eski bir kayıt bozuksa sayfa çökmüyor.

`user.patron` (boolean, varsayılan false) — bugün elle, yarın webhook.

## ③ Ekranlar

- `/studio` — kurma aracı. Nota arama, ağırlık kaydıracı, katman seçimi;
  canlı evrim eğrisi ve en yakın parfümler.
- `/u/[username]/k/[slug]` — kompozisyonun kendi sayfası, paylaşım kartıyla.
- Profilde **KOMPOZİSYONLARIM** bölümü.
- Patron süslemeleri: profilde dönen takımyıldız zemini + çerçevede rozet.

## Reddedilenler

- **Süsleme-only Patron** — sahip reddetti; sebebi yukarıda.
- **Burun raporu / raflar / poster'ı ücretli yapmak** — sahip *"zaten
  eklememiz lazım"* dedi; ücretsize alındı.
- **Tamamen kilitli araç** — denemeden kimse ödemez.
- **Kompozisyonu kaydetmemek** — paylaşılan her kompozisyon siteye kapı;
  büyüme tarafı en güçlü olan bu.
- **İkinci bir benzerlik hesabı** — karşılaştırmanın anlamı aynı ölçüde.
- **Ödeme altyapısını bugün kurmak** — sıfır ziyaretçi için Lemon Squeezy,
  webhook ve vergi ayarları. Bayrak hazır; o gün yalnızca çeviren değişir.

## Doğrulama

- Var olan bir parfümün notaları → motor onu kendisi olarak buluyor (%90+).
- Patron olmayan üç notayla kurabiliyor; dördüncüde davet çıkıyor **ve
  sunucu da reddediyor** (ekran atlanarak denendi).
- Kompozisyon kaydediliyor, profilde görünüyor, kendi adresinde açılıyor,
  paylaşım kartı çıkıyor.
- Girişsiz gezinti bire bir aynı; statik sayfa sayısı değişmiyor.
- `npm test` + lint + üretim derlemesi yeşil, ekranda büyük İ yok.
