# Sınırlar ve Son Cila — Tasarım

## Sorun

Site 390 sayfa üretiyor, iki dilli, paylaşılmaya hazır. Ama **yolun bittiği
yerlerde sitenin dünyasından çıkıyordu.** Yayın sahibin kararıyla ertelendi
("yayınlamak istemiyorum şuanlık, site projem tam bitsin"), yani bu tur
tamamen cilaya ayrıldı. Bulunan altı eksik:

- **404 yarımdı.** Eşleşmeyen adresler bizim sayfamızı gösteriyordu ama HTTP
  **200** dönüyordu (soft 404); var olmayan parfüm/nota kimlikleri ise doğru
  404 dönüp Next'in **çıplak** ekranını gösteriyordu.
- **Hata ekranı hiç yoktu.** Bir şey patlarsa ziyaretçi Next'in varsayılanını
  görüyordu.
- **Site Arial'la çiziliyordu** ama her sayfada iki Geist dosyası indiriliyor
  ve hiç kullanılmıyordu.
- **Telefonda üst çubuk** cihazın varsayılan renginde kalıyordu; **ana ekrana
  eklenen site** adsız ve renksiz açılıyordu.
- **Klavyeyle gezenin odağı** kaydıraçta hiç görünmüyordu.
- **`/space` ve `/evolution`** sekmede birbirinden ayırt edilemiyordu.

## Ölçülen kısıt — kök düzen bir dinamik segmentte

Bu turun bütün mimari kararları tek bir gerçeğe dayanıyor: kök düzenimiz
`app/[lang]/layout.tsx`, yani **üst düzey bir dinamik segmentte**. Next'in
kendi belgesi bu yapıyı `global-not-found`un iki gerekçesinden biri olarak
sayıyor (`03-file-conventions/not-found.md`).

Sonucu ölçüldü (üretim derlemesi, işaretle — hangi dosyanın çizdiği ayırt
edilerek): `[lang]/not-found.tsx` **hiçbir durumda çalışmıyor.** Ne eşleşmeyen
adreste, ne de eşleşen bir rotada `notFound()` atıldığında. Her iki hâl de
`global-not-found.tsx`e düşüyor.

## Kararlar

### ① Haritada olmayan adres: tek dosya, gerçek 404

`app/global-not-found.tsx` + `experimental.globalNotFound`. Sayfa düzeni
atlıyor, o yüzden `<html>`, `<body>`, yazı tipi ve `globals.css` orada elle
kuruluyor. Dil `params`tan gelemiyor (ortada eşleşen rota yok): `proxy.ts`
gelen yolu `PATH_HEADER`a yazıyor, `request-locale.ts` okuyor.

*Reddedilen:* `[lang]/not-found.tsx` — ölçüldü, hiç çalışmadı; dosya silindi ve
bir sınama geri gelmesini engelliyor. *Reddedilen:* yakalayıcı rota
(`[...bulunamadi]/page.tsx`) 404 arayüzünü doğrudan çiziyordu — **görüntüsü
doğruydu ama HTTP 200 dönüyordu.** Soft 404 kabul edilmedi.

Bilinmeyen kimlik için `dynamicParams = false`: uydurma kimlik rotaya hiç
girmiyor. Ölçüldü — bu satır olmadan da ekranda doğru sayfa çıkıyor, fark
maliyette (sunucu her uydurma adres için sayfayı boşuna çiziyor).

### ② Proxy: uzantıya değil, ada bakan liste

Eşleyicideki `.*\..*` istisnası bir delikti: `/wp-login.php`, `/foo.js`,
`/random.txt` proxy'ye hiç uğramadan `[lang]`e düşüyor ve **kök düzenin attığı
`notFound()`** yüzünden `<html id="__next_error__">` gösteriyordu. Kök düzenin
attığı çağrıyı hiçbir sınır saramaz — düzenin kendisi kırılıyor.

Artık kökte duran gerçek varlıklar `ROOT_ASSETS`te ada ada sayılı; eşleyicinin
dışında yalnızca `_next` var. Yeni bir kök varlık eklendiğinde listeye de
yazılmalı — yazılmazsa **sessizce** kaybolur.

### ③ Bir şey kırıldığında: iki dosya, iki olay

`[lang]/error.tsx` sayfanın ve altındaki düzenlerin hatasını, `global-error.tsx`
kök düzenin **kendi** hatasını karşılıyor. Görünen şey tek yerde: `ErrorBody`,
`NotFoundBody` ile aynı biçimde (siyah zemin, sönük OSMOS, tek cümle, çıkışlar
— artı "tekrar dene").

Ölçülen iki sınır:

- Sunucuda çizim patlarsa Next boş bir kabuk gönderiyor ve ekran ancak
  tarayıcıda, hidrasyondan sonra beliriyor (durum kodu 500). JavaScript
  kapalıysa ziyaretçi boş sayfa görür.
- Kök düzen **sunucuda** patlarsa hiçbir şey yakalayamıyor: düz metin
  "Internal Server Error". Sınır bileşeni olmanın sınırı bu — kök düzen bu
  yüzden sade kalmalı.

Yeniden deneme `unstable_retry` ile, `reset` ile değil (Next 16 belgesinin
önerisi; `reset` içeriği yeniden getirmiyor).

### ④ Yazı tipi: inen dosya kullanılsın

`globals.css`teki `body { font-family: Arial, ... }` create-next-app'ten
kalmaydı. Sahip iki seçenek arasından **Geist'e geçmeyi** seçti (öbürü Geist'i
atıp Arial'da kalmaktı). Geist Mono tamamen düştü: tuvaldeki yazılar (astronot
dokusu, yörünge etiketleri) bilerek kendi sistem monospace yığınlarını
çağırıyor, o dosya hiç kullanılmayacaktı.

### ⑤ Telefon: çubuk rengi, manifest, 512 simge

`themeColor` **üç yerde ayrı ayrı** yazılıyor çünkü üçü de kök düzeni
atlayabiliyor: düzen, `global-not-found` ve `global-error`. Sonuncusu istemci
bileşeni olduğu için `viewport` dışa aktarımı çalışmıyor, `<meta>` elle
yazılıyor (`<title>` ile aynı sebep).

Manifest tek dilli ve bu bilerek: manifest bir tane, sitenin birincil dili
İngilizce. `display: standalone` — sitenin kendi çıkışları her sayfada var.

Android 512 piksellik simge bekliyor. *Reddedilen:* `icon.tsx`e
`generateImageMetadata` ile çok boyut vermek — adresler `/icon/0` oluyor ve
`ROOT_ASSETS` tam adres eşleştirdiği için hepsi 404 dönerdi. Sabit adresli ayrı
bir rota (`/icon-512`) hem listeye yazılabiliyor hem manifest'te okunur duruyor.
*Reddedilen:* simgeyi `maskable` işaretlemek — maske kenarda güvenli boşluk
ister, üç noktamız kareyi dolduruyor ve kesilirlerdi.

Simge çizimi bu turda tekile indi (`lib/logo-image.tsx`): üç rota aynı kareyi
basıyor.

### ⑥ Klavye odağı ve ⑦ taslak başlıkları

`:focus-visible` tek yerden, genel (`globals.css`): yeni bir düğme eklendiğinde
kimsenin bir şey hatırlaması gerekmiyor. `:focus` DEĞİL — fareyle tıklayana
halka çıkmasın diye. `EvolutionChart`teki `outline-none` kalktı.

`/space` ve `/evolution` artık "Uzay taslağı · OSMOS" ve "Evrim taslağı ·
OSMOS", iki dilde.

## Ölçümler

Hepsi üretim derlemesinde (`next build` + `next start`), tarayıcıda
doğrulandı:

| Adres | Beklenen | Ölçülen |
|---|---|---|
| `/notes`, `/tr/notes`, parfüm, nota | 200 | 200 |
| `/yok`, `/tr/yok`, `/de/notes` | 404 + sitenin sayfası | ✅ doğru dilde |
| `/perfume/yok`, `/tr/note/yok` | 404 + sitenin sayfası | ✅ doğru dilde |
| `/wp-login.php`, `/foo.js`, `/random.txt`, `/favicon.ico` | 404 + sitenin sayfası | ✅ |
| `/de.x/notes` (eskiden çıplak belge) | 404 + sitenin sayfası | ✅ |
| sayfa patlarsa | 500 + hata ekranı | ✅ (hidrasyondan sonra) |
| kök düzen istemcide patlarsa | hata ekranı | ✅ doğru dilde ve başlıkta |
| `manifest.webmanifest`, `/icon-512` | 200 | ✅ head'de bağlı |
| `intro.js`, `robots.txt`, `sitemap.xml`, `icon`, `apple-icon`, og görselleri | 200 | ✅ |
| `/en/notes` | kanonik yönlendirme | 307 → `/notes` |

237 sınama yeşil, lint sessiz, 392 sayfa.

## Geriye kalan

`NEXT_PUBLIC_SITE_URL` hâlâ `localhost` — bilerek. Yayın günü değişecek tek
satır `lib/site-url.ts`te.
