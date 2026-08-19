# OSMOS — B2B müşteri adayı boru hattı

Parfüm e-ticaretlerini bulur, ölçer, puanlar ve kişiye özel açılış cümlesi
üretir. Amaç: OSMOS'un "benzer parfümler" widget'ını satabileceğimiz
dükkânların **doğrulanmış** listesi.

## Kurulum

Yok. Node 24 yeterli — bu projenin **hiçbir npm bağımlılığı yok**:
TypeScript'i Node kendi sıyırıyor, SQLite (`node:sqlite`), HTTP (`fetch`) ve
sınama koşucusu (`node:test`) gömülü geliyor.

```bash
node --version   # v24 ve uzeri olmali
```

## Kullanım

```bash
node src/cli.ts seed              # katalogdaki satici alan adlarini ekler (bedava)
node src/cli.ts topla --sonda     # Apify sondasi (~$0.07) — gercek donusumu olcer
node src/cli.ts topla --onayla    # Apify tam kadro (~$3.92) — ONAY SART
node src/cli.ts enrich            # her alan adini olcer (aga cikar, saatler surebilir)
node src/cli.ts enrich --sinir 5  # yalniz 5 tanesini olcer (deneme icin)
node src/cli.ts score             # puan + olcek tazeler (aga CIKMAZ)
node src/cli.ts export            # leads_ranked.csv + outreach.csv
node src/cli.ts report            # report.md
node src/cli.ts hepsi             # seed → enrich → score → export → report
node src/cli.ts takip             # 7+ gundur cevapsiz dukkanlar + tek cumlelik hatirlatma
node src/cli.ts takip --sinir 14  # esigi degistir (varsayilan 7 gun)
npm test                          # 148 saf sinama, aga cikmaz, para harcamaz
```

⚠️ **`takip` MESAJ GONDERMEZ** — listeyi ve metni basar, "Gonder"e insan basar,
sonra `temas <domain> gonderildi "hatirlatma"` ile deftere yazar. Deftere
yazildigi an dukkan listeden duser: **iki hatirlatma yok** kurali
(`docs/b2b/teklif.md`) boyle uygulaniyor — ayri bir "takip edildi" sutunu
tutulsaydi, deftere yazmayi unutan biri ayni kisiye ucuncu kez yazabilirdi.

⚠️ Konusma baslamis dukkanlar listede CIKMAZ (`cevap`/`ilgilendi`/`red`/
`elendi`). `otomatik` ise takip hakkini yakmaz: bot karsilamasini insan hic
gormedi.

⚠️ **`hepsi` Apify'i CAGIRMAZ.** Para harcayan tek adimin "hepsini yap"
komutuna gizlenmesi, yanlislikla harcamanin en kolay yolu olurdu. Toplama
her zaman ayri ve acikca istenir.

Çıktıların hepsi `data/` altına düşer.

## ⚠️ `data/` klasörü depoya GİRMEZ

Depo herkese açık. `data/` ve bütün `*.csv`/`*.db` dosyaları `.gitignore`da.
Toplanan iş e-postaları oraya düşerse geri alınamaz. **Kod depoda, veri değil.**

## Ölçüm kuralları

| kural | nerede |
|---|---|
| Kanıtsız cümle yazılmaz | `export/outreach.ts` — açılış cümlesi yalnız `evidence` satırından kurulur |
| "Bakılmadı" ≠ "yok" | `types.ts` üçlü mantık; ölçülmemiş siteye +20 verilmez |
| Otomatik mail yok | taslak üretilir, gönderim yok |
| Yalnız kamuya açık iş adresi | `enrich/contact.ts` — kişi adı taşıyan kutular seçilmez |
| Aynı sunucuya 2,5 sn'de bir | `net/fetch.ts` — ağa çıkan tek kapı |
| robots.txt'e uyum | `net/robots.ts` |
| Bütçe tavanı onayla bile aşılmaz | `apify/butce.ts` |

## Puanlama

e-posta **+30** · Shopify **+20** · ürün sayısı 30-500 **+20** ·
benzer-ürün özelliği **yok +20** · Instagram **+10**

## Apify — para

`.env.local` dosyasına `APIFY_TOKEN=…` yazmak yeterli (dosya git dışında).

| | |
|---|---:|
| tam kadro bir koşu | **$3.92** |
| sonda | **$0.07** |
| ücretsiz aylık kredi | **$5.00** |
| cepten çıkan | **$0.00** |

Ücretsiz planda kredi bitince Apify koşuları **durdurur**, borçlandırmaz —
sürpriz fatura yok.

**Bütçe kapısı** (`apify/butce.ts`): tek çalıştırma tavanı **$1.50**, aylık
tavan **$5.00**. Tavanı aşan iş `--onayla` verilse **bile** reddedilir; bayrak
komut geçmişinden tekrar çağrılabildiği için. Harcama `spend` tablosuna
Apify'ın kendi kullanım ucundan **ölçülerek** yazılır, hesaplanarak değil.

Seçilen actor'lar ve ölçülen ücretleri: `apify/actors.ts`.

## Kimse elenmiyor

Sahibin kararı: *"5000'den 10 tane mesaj alırsın, 1000'den 1; ne kadar çok o
kadar iyi."* Büyük parfüm evleri de listede kalıyor; `olcek` sütunu yalnız
bilgi, filtre değil. `apify/kanallar/eleme.ts` yalnız **satılamayacak** yerleri
eliyor: Wikipedia/Reddit gibi işletme olmayanlar ve Amazon/Trendyol gibi
widget gömülemeyen pazar yerleri.

## ⚠️ Bilinen sınır: JavaScript ile basılan bloklar

Ölçüm sunucudan gelen HTML'e bakıyor, tarayıcının çizdiği sayfaya değil.
Öneri bloğunu sonradan JavaScript ile basan bir tema burada "yok" görünür.

`benzer_urun = yok` demek **"sunucudan gelen ürün sayfasında iz yok"** demek;
"ziyaretçi hiçbir öneri görmüyor" demek değil. Bu yüzden `outreach.csv` her
satırda `kanit_url` taşıyor — **mektup gitmeden önce o adres gerçek tarayıcıda
açılıp gözle doğrulanacak.**

Ölçülmüş örnek: marcantoinebarrois.com sayfasında "You may also like" dört
kez geçiyor ama dördü de bir sepet/ödeme upsell uygulamasının JSON ayarında.
Ürün sayfasında blok yok; satın alma akışında upsell var. Ham HTML'de düz
arama bunu yanlış okur.
