# Künye — Tasarım (yol haritası ④, ikinci yarı)

## Sorun

④ ikiye ayrılmıştı. Komşular yapıldı; **künye** ertelendi ve gerekçesi veriydi:
44 parfümün **23'ünde parfümör, 18'inde yıl** yoktu (sayım veri dosyalarından
yapıldı, yorumdaki iddiaya güvenilmedi). Yarısı boş bir künye sayfayı eksik
gösterirdi.

Bu tur veriyle başladı, tasarımla bitti.

## Veri

Eksik 24 kalem sahibe liste hâlinde verildi ve **elle** dolduruldu. Sonuç:

| | |
|---|---|
| Yıl | **44 / 44** |
| Parfümör | **42 / 44** |

Kalan iki parfümörü marka **hiç açıklamadı** — arayıp bulunamadığı için değil:

- `comptoir-sud-pacifique-vanille-abricot`
- `spirit-of-dubai-ajyal`

İkisinin de veri dosyasında, `perfumer` alanının yokluğunun bir olgu olduğunu
söyleyen bir yorum duruyor. Amaç ileride birinin "eksik kalmış" sanıp tahminle
doldurmasını engellemek.

### Düzeltilen üç kalem

Liste yalnızca boşluk doldurmadı, üç çelişki de çıkardı:

| Parfüm | Eski | Yeni | Nasıl karara bağlandı |
|---|---|---|---|
| Vanille Abricot | — | 1994 | Liste 1993 ve 1994'ü birlikte söylüyordu; sahibe soruldu |
| Moonlight Patchouli | 2015 | 2016 | Kayıtla çelişti; sahip listeyi geçerli saydı |
| Lune Féline | 2019 | 2015 | Aynı |

## Karar — tamlığı tip koruyor

`Perfume.year`'ın `?`'si kaldırıldı, **zorunlu** oldu.

Sahibin kuralı netti: *künye ancak veri tamken yayınlanır.* Bunu derleme
zamanında garanti eden tek yer tip. Sınamayla da yapılabilirdi; tip seçildi çünkü
fazladan bir iş daha görüyor — künyede `year ? ... : null` gibi hiç
çalışmayacak dalların doğmasını da engelliyor.

`perfumer` **isteğe bağlı kaldı.** Bu kuralın gevşetilmesi değil, gerçeğin kabulü:
iki ad açıklanmamış. Zorunlu yapılsaydı o iki alana uydurma bir şey yazmak
gerekirdi.

### Açıklanmamış ikisi ne yapıyor

Sahibe üç seçenek sunuldu: satır düşsün / "açıklanmadı" yazsın / künye hiç
yayınlanmasın. Seçilen: **o iki sayfada satır yalnızca yıla düşüyor.**

Gerekçe: 42 sayfada `Aliénor Massenet, 2021`, 2 sayfada `1994`. Boşluk da yok,
uydurma da yok, "bilinmiyor" damgası da yok.

> Not: sahip daha önce, veri hiç dolmadan önce, "bilinmiyor yazsın" ve "o satır
> hiç görünmesin" seçeneklerinin ikisini de reddedip "hepsi dolana kadar
> yayınlanmasın" demişti. Veri gelince tablo değişti — 23 değil 2 boşluk kaldı —
> ve karar o yeni tabloyla yeniden alındı. Eski kararın iptali değil, ölçüm
> değişince tekrarı.

## Karar — yer ve biçim

Ekranda görülmeden seçilmedi. Geçici bir `/kunye-deneme` ekranı kuruldu, gerçek
parfüm sayfasının tipografisiyle üç yer ve üç biçim yan yana çizildi, ekran
görüntüsü sahibe sunuldu. Karar sonrası ekran silindi.

Her biçimin altına **parfümörü açıklanmayan vaka** da kondu: biçimin asıl sınavı
satır kısaldığında bozulup bozulmadığı.

| Konu | Karar | Elenen |
|---|---|---|
| Yer | **İsmin hemen altında**, küratör cümlesinin üstünde | Cümlenin altında · Sayfanın sonunda ayrı bölüm |
| Biçim | **`Aliénor Massenet, 2021`** | `2021 · Aliénor Massenet` · Etiketli iki satır |

Yer: künye kimliğin parçası. Adı okuyan göz burnu ve yılı da alıp sonra cümleye
geçiyor. ①'in "yalnızca duygu" kuralına bir ödün, bilinçli verildi.

Biçim: burun önde, yıl arkada. Parfümör yoksa satır `1994`'e düşüyor ve hiçbir
şey bozulmuyor — nokta ayracı seçilseydi de aynı olurdu, sahip insanı öne alan
sırayı seçti.

## Uygulama

Tek dosya: `src/app/parfum/[id]/page.tsx`. Ayrı bileşen açılmadı — iki alan,
sıfır durum, sıfır animasyon.

`EvolutionTimeline.tsx:55-56` aynı bilgiyi `/evrim`'de zaten yazıyor; o dosyaya
**dokunulmadı**. Orası doğrulama ekranı, kendi biçimi var.

## Doğrulama

1. `npm run build` yeşil — `year` zorunlu olduğu için build'in geçmesi 44/44
   verinin tam olduğunun kanıtı
2. `npm test` ve `npm run lint` bozulmamış
3. Künye üç parfüm sayfasında göründü: parfümörü olan, olmayan, ve uzun adlı
4. 375 px genişlikte satır taşmıyor
5. `/evrim` ve `/uzay` bozulmamış

## Bu işe dahil olmayanlar

- Parfümöre tıklayınca açılan "aynı burnun işleri" gezintisi — biçim engellemiyor,
  ama bu tur yapılmadı
- `ScentSpaceCanvas.tsx`'in 971 satırı
- Aşama 3 nota ansiklopedisi, çift dil
- Dalın `master`'a alınması
