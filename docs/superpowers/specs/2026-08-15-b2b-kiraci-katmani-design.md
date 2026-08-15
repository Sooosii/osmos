# B2B kiracı katmanı — haritayı white-label satmak

**Tarih:** 2026-08-15 · **Dal:** `feat/b2b-kiraci-katmani`

## Neden

OSMOS bitmiş bir ürün ama geliri yok: tek musluk affiliate satırıydı ve o musluk
trafik olmadan akmıyor. Sahibin kararı ürünü **B2B satmak** — parfüm satan
işletmelere kendi katalogları, kendi markaları ve kendi adresleriyle çalışan bir
OSMOS kurmak.

Satılan şey bu belgenin konusu: **kiracı (tenant) katmanı.**

## Karar: tek depo, kiracı başına bir derleme

Aktif kiracıyı `NEXT_PUBLIC_TENANT` seçiyor. Çok kiracılı veritabanı yok,
yönetim paneli yok, çalışma anında kiracı çözümü yok.

**Reddedilen yollar:**

| Yol | Neden reddedildi |
|---|---|
| Veritabanı çok kiracılılığı (host → tenant) | Bugün 947 sayfa **statik**; kiracı çözümü çalışma anına taşınsaydı hepsi dinamiğe düşerdi. Sattığımız şeyin hızı ürünün kendisi. |
| Depo çatallamak (kiracı başına fork) | İkinci müşteride bakım iki katına çıkar, beşincide imkansızlaşır. |
| Müşterinin kendi kendine parfüm eklediği panel | YAGNI ve gelir karşıtı: veri işi satılan emeğin ta kendisi. |

Bedeli bilinerek kabul edildi: her kiracının katalogu her derlemenin paketinde
duruyor. Katalog müşterinin kendi sitesinde zaten açık bilgi olduğu için
gizlilik sorunu değil — ama rakip iki müşteri aynı anda varken hatırlanmalı.

## Dikiş: tek dosya

42 modül `@/data/perfumes`ten okuyor ve hepsi tek giriş noktasından geçiyor.
Kiracı katalogu `src/data/perfumes.ts` içinde bağlanıyor; **o 42 dosyanın
hiçbirine dokunulmadı.**

`src/data/osmos-catalog.ts` ayrıldı ki kiracı katalogları ana katalogu
okuyabilsin (`perfumes` → `tenants/catalogs` → `perfumes` döngüsü olmasın).

## Üç karar ve gerekçeleri

### ① Bilinmeyen kiracı kimliği PATLAR, varsayılana düşmez

Varsayılana düşmek şu demekti: değişkende bir harf hatası olan müşteri
derlemesi sorunsuz tamamlanır, yayına çıkar ve **müşterinin alan adı altında
OSMOS'un katalogunu** gösterir. Derleme zamanında gürültüyle durmak, canlıda
sessizce yanlış çalışmaktan iyi. `tenant.test.ts` tutuyor.

### ② Miras alınan satıcı bağlantıları KESİLİYOR

Ana katalogdaki 52 parfümün her birinde `retailers` dolu. Kiracı katalogu var
olan parfümlerden türetildiğinde o bağlantılar da geliyordu ve sonuç şu olurdu:
**müşterinin kendi koku haritası, künyenin altından rakiplerine bağlantı
verir.** Sayfa çalışır, harita güzel görünür, tek fark ziyaretçinin başka bir
dükkandan alışveriş yapmasıdır.

`deriveTenantCatalog` kesiyor. Kural: kiracının parfümü ya **kendi ürün
sayfasını** taşır ya hiçbir şey taşımaz; miras alınmış bağlantı üçüncü seçenek
değil, hatadır.

⚠️ Bu kusuru **sınama buldu**, gözden geçirme değil.

### ③ Kalibrasyon kiracının kendi kataloğunda — bedavaya geldi

`buildMarks` kaydıraç eksenlerini `feelUniverse`e göre yayıyor ve ana sayfa
oraya `PERFUMES`i geçiyor. Kiracıda `PERFUMES` zaten yalnızca onun katalogu
olduğu için eksenler kendi evreninde normalleşiyor.

Ana sitenin global cetveli uygulansaydı, dar bir seçki haritanın ortasında
küçük bir bulut hâlinde toplanır ve kaydıraçların yolunun büyük kısmı ölü
kalırdı. İki sınama tutuyor: uçlar 0 ve 1'e değiyor, **ve** ana sitenin evreni
ölçü olarak verildiğinde uçların kaybolduğu ayrıca ölçülüyor (kapının boş
çalışmadığının kanıtı).

## Markalama

`t.site.name` zaten yirmiden fazla yerde tek kaynaktı; sözlük giriş noktasında
bir kez markalanıyor (`dict.ts`). Ana sitede `isOsmos()` sözlüğü **nesne olarak**
döndürüyor, yani OSMOS'un çıktısı korunuyor.

⚠️ **`site.name`i ezmek YETMEDİ ve bunu ancak gerçek tarayıcı gösterdi.** Marka
yirmiden fazla BAŞLIK dizesinin içine de gömülüydü; kiracıda parfüm sayfası
sekmede *"Oud Ispahan — Dior · OSMOS"* yazıyordu. Ekranın hiçbir yerinde
görünmüyordu — yalnızca sekmede, yer iminde, paylaşılan bağlantıda ve arama
sonucunda.

Çözüm `brand.ts`: sözlüğün tamamını gezen saf bir geçiş. **Fonksiyonları da
sarıyor**, çünkü başlıkların çoğu fonksiyon (`(name, brand) => ...`) ve düz dize
değişimi onları atlardı. `brand.test.ts` sözlüğü gezip fonksiyonları çağırarak
sızıntı arıyor; kapının boş çalışmadığı da ölçülüyor.

## Özellik bayrakları

Kiracıda kapalı: hesaplar (Top 4, raflar, burun raporu, stüdyo, Patron),
bildirim, besleme. Açık: harita, künyeler, `/similar/[id]`, **nota
ansiklopedisi**, arama, paylaşım kartları.

⚠️ **Bağlantıyı gizlemek yetmiyor, rota da kapanmak zorunda** — `/signin`,
`/settings`, `/studio`, `/u/...` adresleri yerinde kalırdı ve arama motoru
onları dener. `requireAccounts()` (`lib/tenant-guard.ts`) sekiz sayfada
`notFound()` atıyor; kiracı derlemesinde `.meta` dosyalarında `"status": 404`
ölçüldü.

⚠️ Env'in yokluğuna güvenilmiyor: `NEXT_PUBLIC_ACCOUNTS_ENABLED` kiracı
projesinde zaten tanımsız olacak, ama ana projeden değişken kopyalayan biri
müşterinin sitesinde OSMOS'un giriş ekranını açardı. Kayıt karar veriyor.

## Doğrulama (yapıldı)

- **Regresyon:** master derlemesiyle karşılaştırıldı — aynı sayfa sayısı (947),
  üç örnek sayfada görünür metin ve 28 üstveri etiketinin tamamı birebir.
  ⚠️ **Baytlar aynı DEĞİL** ve bu iddia ölçmeden yapılmamalıydı: modül
  eklendiği için parça karmaları kayıyor, ayrıca `sitemap.xml` zaten her
  derlemede farklı (`site-map.ts:44` `new Date()` basıyor).
- **Kiracı derlemesi:** 419 sayfa; 407 HTML dosyasının hiçbirinde "OSMOS"
  geçmiyor; başlıklar iki dilde de kiracının adıyla.
- **Gerçek tarayıcı** (Playwright, 1440×900): kapı açılıyor, harita 18 noktayla
  çiziliyor, üst şeritte SELVA · SPACE 1/1 · yalnız SEARCH ve dil, künyede
  PERFUME 9/18, komşular kiracının kendi kataloğundan, **satıcı satırı yok**.
  Tek konsol hatası bilinen zararsız olan (Vercel Analytics'in yerel karşılığı).
- 601 sınama, lint sessiz.

## Yapılmayanlar (bilerek)

- **Varsayılan dilin kiracıya göre değişmesi.** Türk dükkanının sitesi bugün
  `/`de İngilizce açılıyor, Türkçesi `/tr`de. Teslim için gerekli ama
  `locale.ts`/`proxy.ts` bu deponun en kırılgan yeri — "her İngilizce sayfa bir
  404'e bağlanıyordu" hatası tam oradan çıkmıştı. Kendi turunu ve kendi
  commit'ini hak ediyor.
- Kiracıya özel vurgu rengi ve logo. Kayıtta yer var; ekranda karşılığı yok.
  Aile renklerinin markaya göre DEĞİŞMEYECEĞİ kararı yerinde duruyor (renk =
  koku ailesi).
- `/api/*` uçlarının kiracıda kapatılması. Görünür yüzey değil ama açık uç.
