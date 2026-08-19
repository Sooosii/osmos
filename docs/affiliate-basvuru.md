# Affiliate başvuruları — ne, nereye, hangi metinle

**Durum (2026-08-19, yeniden sayıldı):** alan adı alındı (`osmos.me`), satıcı
satırı **150 parfümün 72'sinde** çalışıyor (80 bağlantı) ama **hiçbiri komisyon
getirmiyor**. Bu belge o boşluğu kapatmak için.

⚠️ **Önceki hâli 52/52 diyordu ve bayatlamıştı.** Katalog 52'den 150'ye
çıkarken satıcı satırı 72'de kaldı; yani "her parfümde var" artık doğru değil
ve başvuru metninde de iddia edilmiyor. Kalan 78 parfüm, bağlantısı
girildikçe kapanacak açık iş.

⚠️ O turda ölçülen ve buraya bakan iki şey:
**FragranceX ve Notino robota kapalı değil** — gerçek tarayıcıda açılıyorlar,
yani panel geldiğinde derin bağlantı üretmek kolay olacak. Ve 80 bağlantının
gerçek bileşimi: **markanın kendi mağazası 49**, **Luckyscent 27**,
**Scent Split (dekant) 4**. Yani komisyon ihtimali olan tek kalem henüz
hiçbiri — Luckyscent'in programı yok, marka mağazalarının çoğunda da yok,
Scent Split ölçülmedi.

## ⚠️ Önce düzeltme: Luckyscent'in programı YOK

Bu depoda bir süre "Luckyscent affiliate programı var, hesap açılınca eldeki
bağlantılar komisyonlanır" diye yazdım — **yanlıştı, doğrulanmadan
söylenmişti.** Ölçüldü: `luckyscent.com/affiliate` 404 ve hiçbir ağ (CJ,
Awin, Rakuten, Pepperjam) onları listelemiyor.

Eldeki ~20 Luckyscent bağlantısı boşa gitmedi — okuru gerçekten doğru yere
götürüyorlar ve satır onlarsız hiç çizilmiyordu. Ama para yolu değiller.

## Asıl gerilim

Bu kataloğu taşıyan niş satıcıların çoğunda program yok (Luckyscent, Osswald,
Fumerie, Bloom). Programı olanlar ise ağırlıkla designer taşıyor. Örtüşme
sıfır değil — FragranceX'in Nasomatto ve Orto Parisi taşıdığı görüldü — ama
150'nin tamamını kapatmıyor.

**Sonuç: satır iki işi ayrı ayrı yapacak.** Her parfümde dürüst bir "nerede
bulunur" (marka mağazası / Luckyscent), ve mümkün olan yerde komisyonlu bir
ikinci bağlantı.

## Hangi program, hangi sırayla

| # | program | komisyon | çerez | ağ | neden |
|---|---|---|---|---|---|
| 1 | **FragranceX** | %8–12 | 45 gün | Commission Junction | En yüksek komisyon, en uzun çerez, niş tarafa giriyor |
| 2 | **Notino** | %10 | 7 gün | Awin | Avrupa'da güçlü, 27 ülke |
| 3 | Amazon Associates | %3–4 | 24 saat | kendi | Onayı kolay; ⚠️ niş parfümde klon riski yüksek |
| — | FragranceNet | %1–5 | 10 gün | Rakuten | Komisyon çok düşük, sona bırakılabilir |

## ⚠️ Bağlantıları BEN tahmin etmeyeceğim

FragranceX robota **403** veriyor, yani ürün sayfalarını açıp doğrulayamıyorum
— Jo Malone, Frédéric Malle, MiN New York ve Dior'da olduğu gibi.

Bu depoda kural şu ve bir kez pahalıya öğrenildi: **doğrulanmamış bağlantı
yazılmaz.** Bir Amazon *araması* konmuştu ve ziyaretçiyi parfümün klonuna
gönderiyordu (Dior Oud Ispahan → Versace/Lattafa).

Neyse ki gereği de yok: **affiliate paneli derin bağlantıyı kendisi üretiyor**
— doğru ürün adresi + izleme parametresi, tek yerden. Onay geldiği gün panelden
alınan adresler `retailers` alanına girer ve satır aynı gün para kazanmaya
başlar.

## ⚠️ SIRA UYARISI: trafiksiz başvuru reddediliyor

CJ'nin yayıncı kabul ölçütlerinde açıkça yazıyor: başvurular **düşük trafik**
ve **çok yeni site** sebebiyle reddediliyor. OSMOS bugün tam olarak o
tanıma giriyor — alan adı bir günlük, duyuru hiç yapılmadı, ziyaretçi
neredeyse yok.

**Bu yüzden önerilen sıra:**

1. **Önce duyuru dalgası** — Show HN, r/InternetIsBeautiful, Product Hunt, X.
   Paket `docs/duyuru/`de hazır ve artık gerçek bir alan adı var.
2. **Bir hafta sonra başvuru** — elinde gerçek bir ziyaretçi sayısı olur ve
   "launching" yerine rakam yazarsın.

Ters sırada gidilirse red gelebilir ve bazı ağlarda yeniden başvurmak için
beklemek gerekiyor. Yine de bugün başvurmak isteniyorsa: **Awin'den başla**
(incelemesi daha yumuşak), CJ'yi trafik geldikten sonra dene.

## Nereden başvurulur

| ağ | adres | ücret | not |
|---|---|---|---|
| **Awin** (Notino) | `ui.awin.com/publisher-signup/en/awin/step1` | **5 $ depozito** | İade ediliyor: onaydan sonra hesaba geçiyor, ilk komisyon ödemesinde geri alınıyor. Kart doğrulaması için. |
| **CJ** (FragranceX) | `signup.cj.com` | ücretsiz | Vergi bilgisi ve gerçek ad/işletme bilgisi istiyor. Onay birkaç gün. Ağa girdikten sonra **her reklamverene ayrı** başvuruluyor. |
| Amazon Associates | `affiliate-program.amazon.com` | ücretsiz | ⚠️ **180 günde 3 satış** şartı var; tutmazsa hesap kapanıyor. Trafiksizken açmak riskli. |

⚠️ **Hesap açmayı ben yapamıyorum** — vergi ve ödeme bilgisi giren işlemler.
Adım adım tarif ederim, tıklayan sen olursun.

## Başvuruda soracakları ve cevapları

Ağlar (CJ, Awin) şu bilgileri istiyor. Hazır cevaplar:

**Site adresi:** `https://osmos.me`

**Site türü:** Content / editorial — niche fragrance discovery

**Aylık ziyaretçi:** Yeni site (yayına yeni girdi). ⚠️ Rakam **uydurma**;
"launching" ya da gerçek sayıyı yaz. Şişirilmiş rakam onay sonrası denetimde
hesabı kapattırıyor.

**Trafik kaynağı:** Organic search, Reddit / Hacker News / Product Hunt
launch, direct.

**Tanıtım yöntemi:** Editorial product pages with contextual text links. No
coupon/deal content, no paid search on brand terms, no email blasts.

### Başvuru metni (İngilizce, kopyala-yapıştır)

> OSMOS is a map of niche perfumery: 150 fragrances placed on a plane by the
> kinship of their notes, with a hand-built encyclopaedia of 158 raw
> materials behind it. Every perfume has its own page — house, year,
> perfumer, an animated evolution curve built from volatility data, and its
> nearest neighbours in scent space.
>
> The site is editorial, not a deal site. There are no coupons, no price
> comparisons and no display advertising. Where a perfume can be bought, the
> page carries a single quiet line of text links marked `rel="sponsored"`,
> below the credits, with a commission disclosure in the footer.
>
> The audience is people looking for a specific niche fragrance they have
> read about — high purchase intent, low volume. I would link to product
> pages only, never to search results, because sending a reader to the wrong
> bottle is worse than not linking at all.
>
> The site is open source and the data is written by hand:
> https://github.com/Sooosii/osmos

### ⚠️ Amazon Associates'e özel iki kural

- **Aynı tıklamadan iki programdan komisyon almak yasak.** Yan yana satıcı
  listelemek serbest, ama tek bağlantıya iki parametre konmaz.
- **Ürün fotoğrafı ve satıcı logosu KOYULMAZ** — telif oradan doğar. Sitede
  zaten hiç fotoğraf yok; metin bağlantısı güvenli.

## Onay geldiğinde bende olanlar

1. Panelden ürün adresleri alınır (tahmin yok, panel üretir).
2. `retailers` alanına eklenir — veri şekli hazır, kod değişmiyor.
3. `rel="sponsored nofollow noopener"` zaten var; komisyon dipnotu zaten var.
4. Sınama arama biçimli adresleri reddetmeye devam eder.
