# Paylaşım Katı — Tasarım

## Sorun

Site iki dilli, telefonda çalışıyor ve 387 sayfa üretiyor — ama dışarıya
görünmüyor. Üç eksik var ve üçü de yayının önkoşulu:

- **Paylaşım görseli yok.** Bir parfüm linkini WhatsApp'a ya da X'e attığında
  boş kart çıkıyor. Bu sitede özellikle can sıkıcı: her parfümün zaten veriden
  hesaplanmış bir rengi ve nota paleti var, görsel üretilebilir durumda.
- **`sitemap` yok.** Arama motoru 387 sayfayı kendi başına bulamaz.
- **`hreflang` yok.** Google `/notes` ile `/tr/notes`in aynı sayfanın iki dili
  olduğunu bilmiyor; ikisini rakip iki sayfa sayıyor.

Sahip bu turu "yayına çıkmadan önce sitenin paylaşılmaya hazır olması" diye
seçti. Yayının kendisi (uzak depo, barındırma, alan adı) ayrı bir iş.

## Ölçülen kısıt — Satori

`next/og`un `ImageResponse`'u **Satori** ile çalışıyor: flexbox ve CSS'in bir
alt kümesi. **Tuval yok.** Yani sitenin kimliğini kuran üç şey — tram dokusu
(`dither-field.ts`), dönen yörünge (`note-orbit.ts`) ve evrim imzası — paylaşım
görseline olduğu gibi taşınamıyor.

Taşınabilen: renk, gradyan, tipografi ve dikdörtgen. Tasarım bu sınırın içinde
kuruldu; hiçbir parçası "sonra çizeriz" değil.

## Kararlar

### ① Görsel: aile ışığı + imza satırı

Sahip üç yön (aile ışığı / nota noktaları / evrim çubukları) ve ardından iki
ince ayar arasından seçti — **karma: A'nın sakinliği, B'nin noktaları, noktalar
künyenin hemen altında.**

İskelet, yukarıdan aşağı:

```
  (aile renginde radyal ışık, üstten iner)

  DIOR                          ← marka, ince, aralıklı
  Oud Ispahan                   ← isim, büyük, hafif
  François Demachy, 2012        ← künye
  ● ● ● ● ● ●                   ← imza satırı: notalar
                        OSMOS   ← sağ alt
```

*Reddedilen:* yalnız aile ışığı (A) — her parfüm birbirine benzerdi, ayıran tek
şey renk olurdu. *Reddedilen:* evrim çubukları (C) — en çok şey söyleyen kart
ama kalabalık, ve küçük önizlemede çubuklar incelip kayboluyor. *Reddedilen:*
noktaların alt kenara inmesi — şerit hissi güzeldi ama künyeyle bağı kopuyordu.

**Nokta kuralları:** rengi baskın koku ailesi, boyu kompozisyondaki ağırlığı —
haritadaki noktalarla **aynı palet, aynı mantık**. En fazla altı nota,
ağırlıktan hafife; kalanı sessizce düşüyor. İkinci bir renk kaynağı açılmıyor:
zincir `familyVector → dominantFamily → getFamily().color`, sitenin her yerinde
olduğu gibi.

**Nota sayfalarında aynı iskelet:** ışık notanın baskın aile rengi, isim
notanın adı, künye satırı yerine bandı ve tepe dakikası, noktalar ise o notayı
taşıyan parfümlerin renkleri — yörüngenin durağan hâli.

**Ana sayfa, dizin ve doğrulama ekranları** için tek sabit kart: ışık yok, isim
`OSMOS`, altında sitenin kendi cümlesi.

### ② Görseli besleyen şey saf bir modül

`src/lib/share-marks.ts`: parfümden nokta listesi, notadan taşıyıcı renkleri.
React, DOM ve `next/og` tanımıyor — `note-marks.ts` ve `space-marks.ts` ile aynı
sözleşme ve aynı gerekçe: `opengraph-image.tsx` sınanamaz, bu modül sınanabilir.

`opengraph-image.tsx` yalnızca çiziyor; hangi noktaların çizileceğine dair tek
bir karar taşımıyor.

### ③ `sitemap.ts` hreflang'i de üretiyor

`src/app/sitemap.ts` 387 sayfanın hepsini iki dilde listeliyor. Next'in
`alternates.languages` alanı doğrudan hreflang üretiyor — ayrı bir iş değil,
sitemap'in içinden geliyor
(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`).

### ④ hreflang sayfaların kendisinde de

Her `generateMetadata`ya `alternates.languages` ekleniyor ki
`<link rel="alternate" hreflang>` etiketleri sayfada da dursun. Sitemap tek
başına yeterli sayılmıyor; iki kaynak da standart.

### ⑤ Adres bir çevre değişkeninden

Sitemap mutlak adres istiyor ama alan adı henüz yok. `NEXT_PUBLIC_SITE_URL`,
varsayılanı `http://localhost:3000`. Aynı değer köke `metadataBase` olarak da
konuyor — paylaşım görsellerinin mutlak adresi oradan çözülüyor.

⚠️ Varsayılan **bilerek `localhost`**: uydurma bir alan adı yazmak, yayına
çıkıldığı gün kimsenin fark etmeyeceği yanlış bir sitemap üretirdi. Yanlış
adres sessizce çalışır; eksik adres çalışmaz ve fark edilir.

### ⑥ `robots.ts`

Her şeye izin, sitemap'i işaret ediyor. Gizlenecek bir şey yok.

## Sınamalar

**① Nokta çıkarma.** En fazla altı nokta; sıra ağırlıktan hafife; altıdan az
notası olan parfüm eksik değil kısa liste veriyor; hiç taşıyıcısı olmayan nota
boş liste veriyor (nota sayfalarının %100'ü dolu değil — palet ile kullanım
listesi ayrı şeyler, `note-marks.ts`te yazılı).

**② Renk zinciri tek.** Bir parfümün imza satırındaki baskın rengi, haritadaki
noktasının rengiyle aynı çıkıyor. İkinci bir kaynak açılmadığının sınaması.

**③ Sitemap bütünlüğü.** Her girdide iki dilin de alternatifi var; toplam URL
sayısı üretilen sayfa sayısıyla tutuyor; adres `NEXT_PUBLIC_SITE_URL`i
gerçekten dinliyor.

Mevcut 201 sınama yeşil kalmalı.

## Yapı

| dosya | iş |
|---|---|
| `src/lib/share-marks.ts` | **yeni.** Saf: parfümden/notadan nokta listesi |
| `src/lib/share-marks.test.ts` | **yeni.** |
| `src/lib/site-url.ts` | **yeni.** Saf: taban adres, çevre değişkeninden |
| `src/app/sitemap.ts` | **yeni.** 387 sayfa × 2 dil + hreflang |
| `src/app/robots.ts` | **yeni.** |
| `src/app/[lang]/opengraph-image.tsx` | **yeni.** Sabit kart |
| `src/app/[lang]/perfume/[id]/opengraph-image.tsx` | **yeni.** |
| `src/app/[lang]/note/[id]/opengraph-image.tsx` | **yeni.** |
| `src/app/[lang]/layout.tsx` | `metadataBase` |
| altı sayfanın `generateMetadata`sı | `alternates.languages` |

## Kapsam dışı

- **`twitter-image` ayrı dosya olarak yazılmıyor.** X zaten `og:image` okuyor;
  ikinci bir kart üretmek aynı görselin iki kopyası olurdu.
- **README'nin İngilizceye çevrilmesi** — yayın turunda, deponun kapısı olarak.
- **Yayının kendisi**: uzak depo, barındırma, alan adı. Hesap açmak ve alan adı
  almak sahibin işi.

## Açık uçlar

- Görsel ekranda görülüp onaylanacak. Satori'nin yazı tipi işleme biçimi
  tarayıcınınkiyle birebir aynı değil; harf aralıkları ve ağırlık ekranda
  kontrol edilmeden "bitti" denmeyecek.
- `NEXT_PUBLIC_SITE_URL` yayın gününe kadar `localhost` kalıyor. Sitemap o güne
  kadar doğru değil ve doğru olması da beklenmiyor.
