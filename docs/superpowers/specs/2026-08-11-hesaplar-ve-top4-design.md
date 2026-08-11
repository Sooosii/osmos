# Hesaplar + Top 4 — Tasarım

Tarih: 2026-08-11 · Para yol haritasının **⑤** adımı (Faz 2.5)
Sahibin bu turdaki kararları ekranda soruldu ve aşağıda işlendi.

## Sorun

Site bugün tek yönlü: gelen bakar, gider. Geri gelmesi için bir sebebi yok
ve gördüğünü kimseye gösteremiyor. Yol haritasının teşhisi şuydu — hesaplar
doğrudan para getirmez, **çarpandır**: paylaşılan profil ziyaretçi, kayıt
onay kutusu e-posta listesi, geri dönen kullanıcı affiliate ve ürün satışı
üretir.

Letterboxd'un modeli birebir uyuyor: site herkese açık gezilmeye devam eder,
üyelik **isteğe bağlıdır**, ve üyeliğin ilk sürümü tek bir şey yapar —
**Top 4**.

## Sahibin kararları (bu turda, ekranda soruldu)

| Soru | Karar |
|---|---|
| Profil fotoğrafı? | **Hayır** — Top 4'ten üretilen görsel imza. *"Bir görelim, olmadı değiştiririz"* |
| Profilde ne var? | Kullanıcı adı + Top 4 + **tek satırlık kendi cümlen** |
| Ana site değişsin mi? | **Evet** — parfüm sayfasında "top 4'üme ekle". *"Site de görelim yani, tam olsun"* |

Yol haritasından gelen, daha önce onaylanmış kararlar: Google + e-posta/şifre
girişi · `/u/kullaniciadi` herkese açık + gizleme anahtarı · ilk sürüm yalnız
Top 4 (raflar/dilek listesi sonradan eklenebilecek şekilde kurulur) · kayıtta
isteğe bağlı e-posta onay kutusu · gizlilik sayfası + hesap silme · auth kodu
master'a girmeden **güvenlik gözden geçirmesi**.

## ① Mimari: statik olan statik kalıyor

Bu, sitenin bugüne kadarki en büyük yapısal değişikliği — ilk kez gerçek bir
veritabanı ve oturum var. Sınır bilerek dar tutuluyor:

| Bölge | Durum |
|---|---|
| `/`, `/perfume/*`, `/note/*`, `/notes` | **Statik kalıyor.** 394 sayfa aynen üretiliyor |
| `/signin`, `/u/[username]`, `/settings` | **Yeni**, dinamik |
| `/api/auth/[...all]` | **Yeni**, Better Auth'un kendi işleyicisi |

⚠️ **Parfüm sayfası statik kalmak ZORUNDA.** "Top 4'üme ekle" düğmesi sunucuda
oturum okumuyor: sayfa bugünkü gibi derlemede üretiliyor, düğme bir istemci
bileşeni ve oturumu tarayıcıda çözüyor. Sunucuda okusaydı 52×2 sayfa dinamiğe
düşerdi ve sitenin en büyük teknik iddiası ("hesap sunucuda, sayfalar statik")
sessizce ölürdü.

**Yığın:** Better Auth (Next'in kendi kılavuzunda listeli) + Drizzle ORM +
Neon Postgres. Oturum veritabanında, çerez yalnızca kimliği taşıyor.

⚠️ **Site bugün HİÇ çerez yazmıyor** ve bu bir övünme cümlesi olarak README'de
duruyor. Oturum çerezi bunu değiştiriyor — ama yalnızca **giriş yapan** için.
Girişsiz gezinti çerezsiz kalıyor ve metinler buna göre düzeltilecek; "çerez
yok" cümlesi "girişsiz gezinti çerezsiz"e dönüyor. Sessizce bırakılmayacak.

## ② Burun imzası — fotoğrafın yerine geçen şey

Sahibin kararı: profilde fotoğraf yok. Yerine **Top 4'ten türetilen bir
işaret**: dört parfümün aile renkleri ve nota yoğunluğundan çizilen, kişiye
özel ve **deterministik** bir desen.

- Saf modül: `src/lib/nose-signature.ts` — girdi dört parfüm kimliği, çıktı
  çizim tarifi (halkalar, açılar, renkler). React ve DOM tanımıyor, sınanır.
- Çizim **SVG**, canvas değil: sunucuda çiziliyor, paylaşım kartında da
  kullanılacak ve `next/og` (Satori) tuval tanımıyor — bu sınır paylaşım katı
  turunda ölçülmüştü, ikinci kez öğrenilmeyecek.
- Top 4 değişince imza değişir. Boş profilde imza da yok (dört boş halka
  değil, hiçbir şey).

Bu, Patron planındaki "burun imzası"nın ücretsiz hâli. Patron sürümü rengi
seçtirir; buradaki hâli veriden gelir.

## ③ Top 4

- Dört sıralı yuva. Eksik bırakılabilir (bir tane de olur).
- **Mini kart**: aile rengi + parfüm adı + marka + nota noktaları. Fotoğraf
  yok — sitenin geri kalanıyla aynı dil.
- **İki giriş yolu:** parfüm sayfasındaki düğme, ve profil düzenlemede arama.
- Aynı parfüm iki yuvada olamaz.

⚠️ **Sıra veride tutulacak** (`position` sütunu), dizinin sırasına
güvenilmeyecek: SQL sırasız döner ve "birinci parfümüm" bir iddiadır.

## ④ Profil — `/u/[username]`

İçerik: kullanıcı adı · tek satır cümle · imza · Top 4 · katılma yok
(sahip yalnız cümleyi seçti).

- **Herkese açık** varsayılan + `settings`te gizleme anahtarı. Gizliyken
  sayfa 404 döner — "gizli profil" sayfası bile göstermez, çünkü o da
  kullanıcının var olduğunu söyler.
- Kullanıcı adı: `a-z0-9_`, 3–20 harf, büyük/küçük duyarsız benzersiz.
  Rezerve liste (`signin`, `settings`, `api`, `u`, `admin`, `osmos`, `tr`,
  `en`, `notes`, `perfume`, `note`, `space`, `evolution`, `feed`).
- **Paylaşım kartı**: `/u/[username]/opengraph-image` — imza + Top 4'ün
  renkleri. Büyüme motoru bu: paylaşılan her profil siteye kapı.
- Sayfa `noindex` **değil** — açık profil bulunabilir olsun; gizli olan zaten
  404.

⚠️ Profil sayfası **dinamik** ve bu kaçınılmaz: içerik kullanıcıya ait ve
her an değişebilir. Sitemap'e girmiyor (kullanıcı listesi yayımlamak ayrı
bir karar ve alınmadı).

## ⑤ Dil

Bütün yeni ekranlar iki dilde ve `[lang]` altında: `/u/ad`, `/tr/u/ad`.
Sözcükler `src/i18n/en.ts` + `tr.ts`te — **ekran metni `src/data/` içinde
durmaz** kuralı geçerli, ve **noktalı büyük İ yasağı** yeni ekranlarda da
geçerli (mevcut sınama zaten tarıyor).

## ⑥ Proxy — sessiz tuzak

⚠️ `/api/auth/...` **değişken bir yol** ve bugünkü `ROOT_ASSETS` tam adres
eşleştiriyor (`/api/push` tek bir adres olduğu için çalışıyordu). Auth'un
işleyicisi altında sayısız alt yol var (`/api/auth/callback/google`,
`/api/auth/sign-in/email` …). Çözüm: `ROOT_ASSETS`in yanına **`ROOT_PREFIXES`**
(`/api/`) — önek eşleşen adres yeniden yazılmıyor.

Eşleyiciye `api`yi eklemek daha kolay görünüyor ama **denenmeyecek**: o zaman
`/api/...` proxy'ye hiç uğramaz ve "proxy'ye uğramayan adres `[lang]`e düşer,
kök düzen kırılır" deliği geri açılabilir. Bu delik bir kez ölçülüp
kapatılmıştı (`sinirlar.test.ts`); aynı yere ikinci kez düşülmeyecek.

⚠️ Auth'un çerezi **proxy'nin yeniden yazmasından etkilenmemeli**: yol
`/api/auth` altında sabit, dil öneki almıyor.

## ⑦ Güvenlik — master'a girmeden ayrı tur

Next'in kendi kılavuzundan alınan, bu işte geçerli olan kurallar:

- **Server Action'lar herkese açık uç sayılır**: her biri kendi yetki
  denetimini yapar. "Düğme görünmüyor" bir koruma değil.
- **Yetki denetimi veriye en yakın yerde** — tek bir erişim katmanı
  (`src/lib/dal.ts`), `React.cache` ile tekilleştirilmiş.
- **Düzende (`layout`) oturum denetimi YOK**: düzen gezinmede yeniden
  çizilmiyor, denetim sessizce atlanır.
- **Proxy'de veritabanı denetimi YOK**: proxy her rotada çalışıyor
  (önden getirilenler dahil), ve bizimki zaten dil katmanı.
- Dışarıya dönen her alan **DTO**'dan geçer: e-posta, oturum kimliği, hesap
  bağlantıları profil sayfasına asla çıkmaz.
- Better Auth'un **hız sınırı açık**; e-posta/şifre için doğrulama zorunlu.
- Kullanıcının yazdığı tek serbest metin **tek satırlık cümle**: uzunluk
  sınırı + satır sonu yok + React'in kendi kaçışı (HTML asla `dangerously`
  basılmaz).

## Reddedilenler

- **Profil fotoğrafı yükleme** — sahip reddetti; "sitede hiç fotoğraf yok"
  sözü README'de, duyuru metinlerinde ve Show HN kancasında yazılı. Üstüne
  depolama ve içerik denetimi işi açardı.
- **Katılma tarihi ve okunan parfüm sayacı** — sahibe soruldu, yalnız cümleyi
  seçti. Sonradan eklenebilir.
- **Oturumu parfüm sayfasında SUNUCUDA okumak** — 52×2 sayfayı dinamiğe
  düşürürdü. Düğme istemcide.
- **Profil listesi / keşif sayfası** — kullanıcı dizini yayımlamak ayrı bir
  karar; ilk sürümde yok.
- **Sitemap'e profiller** — aynı sebep.
- **Neon yerine Upstash** — abone kaydı için anahtar-değer yetiyordu, ama
  kullanıcı/Top 4/oturum ilişkisel veri; Postgres'in işi.

## Uygulamada değişenler ve ölçülenler (2026-08-11 akşamı)

Spec yazıldıktan sonra iş yapılırken çıkanlar — karar değiştiren her biri
burada, çünkü belgeyle kod ayrışırsa belgeye kimse güvenmez.

- **Dört ekran yerine tek `/settings`.** Kullanıcı adı, cümle, Top 4 ve silme
  aynı sayfada; dördü de "hesabımı yönetiyorum" eylemi ve aralarında gezinmek
  iki alan doldurmak için üç sayfa açmak demekti. Adı olmayan hesapta başka
  hiçbir şey gösterilmiyor.
- ⚠️ **Yinelenen kayıt hata DÖNMÜYOR** ve doğru olan bu: Better Auth
  e-posta sızdırmasını engellemek için sahte başarı dönüyor. Ölçüldü —
  veritabanında tek satır kalıyor, gerçek kullanıcının verisi değişmiyor,
  dönen nesne saldırganın kendi girdisi, saldırganın şifresiyle giriş
  çalışmıyor. Bedeli: giriş ekranı "bu adres kayıtlı" diyemiyor; karşılığı
  aynı ekrandaki "zaten hesabım var" bağlantısı.
- ⚠️ **Hesap silmede sert gezinme şart.** Silme sunucuda bitmişti ama
  tarayıcı `/settings`te kalıyordu: çerez gitmiş, istemci yönlendiricisinin
  önbelleği hâlâ giriş yapılmış hâli tutuyordu. `router.push` yerine
  `window.location`.
- ⚠️ **Paylaşım kartında imza `<svg>` DEĞİL, `<div>` daireler.** Satori
  JSX'e gömülü svg ağacını çizmiyor. Çizim iki yerde ayrı, **tarif tek**
  (`signatureOf`) — saf modülün baştan ayrılma sebebi buydu. İlk render'da
  noktalar yarı boyuttaydı: `dot.r` yarıçap, `div`in `width`i çap.
- ⚠️ **`auth` tembel tekil olmak zorunda.** `export const auth = betterAuth(…)`
  modül yüklenirken veritabanı bağlantısı istiyordu ve bu dosyayı dolaylı
  içeri alan her şeyi — 396 sayfanın üretimi dahil — `DATABASE_URL`e
  bağımlı kılıyordu.
- ⚠️ **Neon'da `neon_auth` şeması var** (Neon'un kendi kimlik ürünü), içinde
  bizimkilerle aynı adlı tablolar. Bizimkiler `public`'te. Şema süzmeyen bir
  sorgu ikisini birleştirip gösteriyor.
- ⚠️ **Resend, doğrulanmış alan adı olmadan yalnızca hesap sahibinin kendi
  adresine gönderiyor.** Yani alan adı alınana kadar canlıda sahipten başkası
  kayıt olamaz — bu, alan adını estetik bir tercihten önkoşula çeviriyor.
- **PGlite** (Postgres'in WASM sürümü) sınamalarda gerçek veritabanı olarak
  kullanıldı: göç dosyası gerçekten koşuyor. Kimlik kodunu taklitle sınamak
  sınamamakla aynı şey.

## Doğrulama

- Kayıt ol → gir → kullanıcı adı seç → Top 4 seç → cümle yaz → profili paylaş
  (kart görseli çıkıyor) → gizle (404 dönüyor) → hesabı sil; **hepsi iki
  dilde**, ekranda büyük İ yok.
- Girişsiz gezinti **bire bir aynı**: 394 sayfa hâlâ statik, çerez yazılmıyor,
  parfüm sayfasında düğme görünmüyor.
- Başka kullanıcının profilini düzenlemeyi dene → reddediliyor (uç düzeyinde,
  arayüzde değil).
- `npm test` + `npm run lint` + üretim derlemesi yeşil.
- Güvenlik turu yapıldı ve bulguları kapatıldı.
