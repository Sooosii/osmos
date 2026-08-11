# Ölçüm ve Künye Satırı — Tasarım

Tarih: 2026-08-11 · Sahip ekranda görüp onayladı ("baktım guzel olmus")

## Sorun

Site yayında ama para yol haritasının (bu oturumda sahiple kurulan plan)
iki önkoşulu yoktu:

1. **Ziyaretçiyi gören göz yok.** Bilerek — "dışarı istek atmaz" ilkesi.
   Ama hiçbir gelir kanalı ölçümsüz yönetilemez; hangi sayfaya kaç kişi
   geliyor bilinmeden affiliate de duyuru da körlemesine olur.
2. **"Peki bunu nereden alırım?" sorusunun cevabı yok.** Parfüm sayfası
   duyguyu, veriyi, komşuları anlatıyor; isteyen ziyaretçiyi eli boş
   bırakıyor. Cevabın bağlantısı komisyon da kazandırabilirdi (affiliate).

## Kararlar

Yerleşim kararı sahibe üç seçenekle soruldu, biçim ekranda görülüp onaylandı.

### ① Ölçüm: Vercel Analytics, ilkenin bilinçli tek esnemesi

Çerezsiz; komut dosyası da sinyal de sitenin kendi adresinden
(`/_vercel/insights/...`), üçüncü tarafa istek yok. Sahibe üç yol soruldu:
yalnız Search Console (Google dışı kaynaklarda körlük) ve Cloudflare önü
(DNS taşıma ister, veri kaba) reddedildi.

⚠️ `_vercel` proxy eşleyicisinin **dışında** olmak zorunda. İçeride kalsa
dil önekiyle `/en/_vercel/...`e yazılır, 404 döner ve ölçüm **sessizce**
ölür — panel boş kalır, hata görünmez. Bu bir uzantı istisnası değil,
`_next` ile aynı sınıf: platformun kendi yolu. Sınama güncellendi
(`sinirlar.test.ts`).

⚠️ Kod tek başına yetmez: Vercel panelinde Web Analytics açılmalı (sahibin
işi). Açılmadan komut dosyası 404 döner.

### ② Satır künyede, alçak sesle

Sahip üç yerleşimden **künyeyi** seçti ("kesin künyede"): sayfa sonu
(önerilendi) ve ekrana hiç girmemesi reddedildi. Künyenin girişi "sadece
duygu" diye tasarlanmıştı; sahip ticaretin oraya girmesini bilerek kabul
etti — görünürlük tıklama demek, tıklama komisyon.

Sözcükler bilerek alçak sesli: "buy now" değil **"where to find"** — künye
kimlik anlatır, satış bağırmaz. Parfümör satırından bir ton sönük
(`text-white/40`), satıcılar `·` ile ayrılıyor, ok `↗` dışarı çıkışı
söylüyor. Türkçesi küçük harf "nerede bulunur"; büyütülürse noktasız I
kuralı geçerli.

⚠️ `rel="sponsored nofollow noopener"` pazarlık dışı: komisyonlu bağlantının
arama motoruna beyanı `sponsored`; yoksa cezası siteye yazar.

**Dipnot** sayfanın en altında, geri dönüş bağlantısının üstünde, en sönük
gride (`text-white/30`): "links may earn a commission". Yasal beyan —
söylenmek zorunda, bağırmak zorunda değil. Yalnızca satırı olan sayfada.

### ③ Veri: `retailers` isteğe bağlı, boşken satır hiç yok

`Perfume.retailers?: readonly Retailer[]` — alan yokken ya da boşken künye
bugünkü hâlinde. Bugün tek örnek sayfa var (`dior-oud-ispahan`, düz Amazon
araması): satıcı ürün adresleri **elle uydurulmuyor**, çünkü FragranceNet
ve benzeri robota kapalı (HTTP 403, ölçüldü) ve doğrulanamayan adres kırık
çıkabilir. Affiliate hesapları açıldığında derin bağlantıları satıcının
kendi paneli üretecek ve 52 parfüm topluca dolacak.

Kapı `retailers.test.ts`te: her bağlantı `https://` ve adlı, aynı sayfada
aynı satıcı iki kez yok. Kırık bağlantı sessizce kırık kalır — derleme
geçer, sayfa çizilir, yalnızca ziyaretçi kaybolur; şemayı tip tutamadığı
için sınama tutuyor.

## ⚠️ Sonradan devrilen karar: arama bağlantısı (2026-08-11, aynı gün akşamı)

③'teki "bugün tek örnek sayfa var (`dior-oud-ispahan`, düz Amazon araması)"
kararı **ölçülerek geri alındı.** Gerçek tarayıcıda üç parfümle denendi:

| Arama | Amazon'un döndürdüğü |
|---|---|
| Dior Oud Ispahan | Versace Pour Homme Oud Noir, Lattafa — **klonlar** |
| Orto Parisi Megamare | RASASI Shuhrah, Jo Milano — alakasız |
| Bogue Maai | hiç sonuç yok |

Yani arama bağlantısı işe yaramaz değil, **yanıltıcıydı**: küratörlü bir
parfümü arayan ziyaretçiyi klonuna gönderiyordu. Sitenin bütün değeri dürüst
seçki olduğu için bu, sayfadaki en pahalı hataydı — üstelik komisyon da
getirmiyordu (affiliate kimliği henüz yok, kazanç sıfır).

**Yeni durum:** hiçbir parfümde `retailers` yok, satır hiç çizilmiyor,
komisyon dipnotu da görünmüyor. Tasarım, i18n metinleri, sınamalar ve
künyedeki yer **aynen duruyor** — sahibin "kesin künyede" kararı geçerli,
değişen tek şey verinin ne zaman gireceği. Affiliate panelleri **ürün
sayfasına** derin bağlantı üretince 52 parfüm topluca dolacak.

Ders sınamaya yazıldı (`retailers.test.ts`): arama biçimli adresler
(`?k=`, `/s?`, `/search`) reddediliyor. Arama bağlantısı ucuz ve cazip —
52 parfümü tek satırla "doldurur"; kapı bu yüzden kondu.

## Reddedilenler

- **Banner/display reklam, pop-up, bülten modali** — sahibe "gerekeni yap"
  seçeneği sunuldu, zarif dokunuşu seçti; bunlar tanım gereği dışarıda.
- **Fiyat göstermek** — satıcı API'si ister, o da çalışma anında dış istek
  demek; ilkeye aykırı. Düz bağlantı kaldı.
- **Sayfa sonunda ayrı bölüm** — önerilen buydu ("isterim" anında karşına
  çıkar), sahip künyenin görünürlüğünü seçti.
- **FragranceNet'e tahmini adres** — doğrulanamadı, konmadı.

## Bu turda ayrıca

README'nin "makes no outbound request at runtime" cümlesi dürüstçe
güncellendi: üçüncü tarafa istek yok, tek sinyal kendi çerezsiz analitiği.
