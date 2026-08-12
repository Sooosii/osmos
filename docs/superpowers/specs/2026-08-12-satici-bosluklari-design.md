# Satıcı Boşlukları — Tasarım

Tarih: 2026-08-12 · Sahip yönü seçti ("veri boşlukları"), yoğunluk kararını
verdi ("bağla, ikisini de"), sonra boşluğu kapattırdı ("yeri boş kalmasın")

## Sorun

Künyedeki "nerede bulunur" satırı **34/52** parfümde çiziliyordu. Kalan 18'in
boş kalma sebebi iki kez yazılmıştı ama ikisi de dünyanın sınırı değil,
**getirmenin** sınırıydı:

1. Büyük evler robot isteğine **403** veriyor (Dior, Guerlain, Jo Malone,
   Frédéric Malle, Van Cleef, MiN New York; Serge Lutens ürün yerine katalog).
2. Luckyscent kalıbı (`/products/<parfüm>-by-<marka>`) niş markalarda tutuyor,
   büyük evlerde **404**.

Bu turda **gerçek tarayıcı** (Playwright/Chromium) kullanıldı. 403 diye bir şey
kalmadı: her sayfa açıldı, ürünün adı ekranda görüldü, öyle yazıldı.

⚠️ Ölçülen ve kayda değer: **Chrome eklentisi bağlı değildi**
(`list_connected_browsers` boş döndü). Playwright kendi Chromium'unu açtığı
için sahibin tarayıcısına hiç dokunulmadı — ve iş yine yapıldı.

## Sonuç

**34/52 → 52/52 · 42 → 59 bağlantı.** 18 yeni satır, hepsi tek tek açıldı.

İki turda yapıldı: önce normal satıcılar (13), sonra sahip "yeri boş kalmasın"
deyince kalan 5 (aşağıda).

### Bulundu (13)

| Parfüm | Satıcı | Ekranda görülen |
|---|---|---|
| `dior-oud-ispahan` | Dior | H1 "Oud Ispahan" |
| `guerlain-vanille-planifolia` | Guerlain | ⚠️ yoğunluk notu aşağıda |
| `jo-malone-myrrh-tonka` | Jo Malone London | Cologne Intense ürün sayfası, $228 |
| `frederic-malle-bigarade-concentree` | Frédéric Malle | "Bigarade Concentree \| Jean-Claude Ellena" |
| `van-cleef-moonlight-patchouli` | Van Cleef & Arpels | ⚠️ yoğunluk notu aşağıda |
| `serge-lutens-santal-majuscule` | Serge Lutens | "Santal majuscule \| FRAGRANCE" |
| `serge-lutens-muscs-koublai-khan` | Serge Lutens | "Muscs Koublaï Khan \| FRAGRANCE" |
| `lartisan-parfumeur-mandarina-corsica` | L'Artisan Parfumeur | "Mandarina Corsica Eau de Parfum 100ml" |
| `min-new-york-long-board` | MiN New York | "LONG BOARD · SCENT STORIES VOL.1/CH.02" |
| `jovoy-les-jeux-sont-faits` | Luckyscent | "Les Jeux Sont Faits by Jovoy Paris" |
| `parfums-delmar-yaringa` | Parfums d'Elmar | "Yaringa 60ML" |
| `argos-pour-femme` | Argos | "Argos Pour Femme" |
| `argos-triumph-of-bacchus` | Argos | "Argos Triumph of Bacchus" |

⚠️ Üçü **markanın kendi mağazasında yoktu**, başka kapıdan geldi: Jovoy
(kendi sitesinde arama tek sonuç veriyor, o da Discovery Kit) Luckyscent'ten;
Argos ikilisi ise markanın kendi mağazasında **vardı** ama daha önce aranmamıştı.

⚠️ Ayırt edilen varyantlar — hepsi bilerek **alınmadı**: Dior'un "Oud Ispahan
Esprit de Parfum"u, Argos'un "Triumph of Bacchus EXTRAIT"si, MiN'in sepete
eklenmiş `?attribute_pa_size=` adresi. Künye hangisini anlatıyorsa o yazıldı.

### Yoğunluk uyuşmazlığı — sahip karar verdi

İki parfümde marka artık **aynı ismi taşıyan farklı yoğunlukta** bir ürün
satıyor. Sahibe üç seçenekle soruldu, cevap: **"bağla, ikisini de"**.

- **Guerlain Vanille Planifolia** — künye 2021 EDP'sinin (Thierry Wasser);
  mağazada yalnız *Extrait 21* (US ve uluslararası, aynı kod `P014754`). Ama
  markanın kendi ana sayfası ona sadece "L'Art & La Matière VANILLE
  PLANIFOLIA" diyor.
- **Van Cleef Moonlight Patchouli** — künye 2016 EDP'sinin (Sonia Constant);
  mağazada yalnız *Le Parfum*, sayfası "reinvented … more intense version"
  diyor. Özgün EDP kataloğdan düşmüş (Collection Extraordinaire'in 24 ürünü
  tarandı).

Gerekçe her iki parfümün **verisinin yanına** yazıldı; bu bir gözden kaçma
değil, tartılmış karar — bir gün "yanlış ürün" diye silinmesin.

### İkinci tur: normal satıcıda olmayan 5

Sahip "yeri boş kalmasın, reklam olmasa da olur" dedi. Doğru cevap dolgu
değil **dekant** çıktı: üretimden düşmüş bir kokuyu gerçek bir insan zaten
oradan buluyor.

**Scent Split** (9.981 ürünü tarandı) beşin **dördünü** taşıyor:

| Parfüm | Adres |
|---|---|
| `serge-lutens-tubereuse-criminelle` | `/products/serge-lutens-tubereuse-criminelle-sample-decants` |
| `m-micallef-gntonic` | `/products/m-micallef-gntonic-sample-decants` |
| `city-rhythm-miami-tropical-confessions` | `/products/city-rhythm-miami-tropical-confessions-sample-decants` |
| `royal-crown-nocturna` | `/products/royal-crown-nocturna-sample-decants` |

⚠️ Satıcı adı **"Scent Split (decant)"** — sade "Scent Split" yazmak okura tam
şişe bekletirdi. Sayfa zaten "Original bottle not included … Scent Split
rebottles the genuine fragrance into smaller bottles" diyor. Adı sadeleştirmek
bu satırı yanıltıcı yapar.

⚠️ Tubéreuse Criminelle'in Scent Split sayfası **bağımsız bir doğrulama**
verdi: "The retail bottle of this fragrance is currently unavailable" — yani
markanın kataloğunda bulamayışımız gerçekten ürünün düşmesiymiş.

⚠️ Kanonik ana bilgisayar **`www.scentsplit.com`**; `scentsplit.com` oraya
yönleniyor. Veriye `www.`lu hâli yazıldı.

### Neden bulunamadıkları — kayıt

Aynı iş bir daha yapılmasın diye duruyor; hepsi ikinci turdan **önce** ölçüldü.

- **Tubéreuse Criminelle** — Serge Lutens'in US (234 ürün) ve EU (280 ürün)
  mağazalarında yok. Luckyscent markayı **hiç taşımıyor** (marka dizininde
  yok, `/brands/serge-lutens` 404). FragranceX'te marka var ama 9 ürün.
- **GNTONIC** — markanın alan adı bulunamadı: `micallef-parfums.com`
  çözülmüyor, `parfums-micallef.com` bağlantıyı reddediyor, `micallef.fr`
  **parfümle ilgisi olmayan bir Linux blogu**. FragranceX 15 ürün taşıyor,
  bu değil.
- **Miami Tropical Confessions** — Luckyscent'in marka dizininde "City Rhythm"
  **yazıyor** ama bağlantısı (`/brands/city-rhythm`) **404**: dizin bayat.
  `cityrhythm.com` ise bir orkestra/parti grubu.
- **Nocturna** — `royalcrown.it` kökü bozuk bir yönlendirmeye düşüyor
  ("Supplied countryName is invalid").
- **ATH Oud** — aşağıda, ayrı bir durum.

### `aaron-terence-hughes-oud` — sahip kararı, sitenin en zayıf halkası

Oud **hiçbir yerde satılmıyor**: Scent Split, The Perfumed Court (2.671),
MicroPerfumes (1.672), Luckyscent, FragranceX, Bloom Perfumery — hiçbirinde
marka bile geçmiyor. Markanın kendi Shopify mağazasında **tek ürün** var
(Gin Sling) ve o da **tükenmiş**.

Sahibe üç seçenek sunuldu (dürüst bir cümle · markanın sitesi · boş bırak) ve
uyarı açıkça yazıldı: *"ziyaretçi tıklar, aradığını bulamaz."* Sahip yine de
**markanın kendi sitesini** seçti. Karar uygulandı.

Adres kökü değil **ürün listesi** (`/collections/all`): kök bir tanıtım
sayfası, liste markanın elindeki her şeyi tek bakışta gösteriyor — ziyaretçi
"Oud yok"u hemen anlıyor. Kök ayrıca aşağıdaki ana sayfa kapısına takılırdı ve
**kapı bu tek parfüm için gevşetilmedi**.

⚠️ Bu, sitedeki tek "ürüne gitmeyen" satıcı bağlantısı. Gerekçe verinin yanına
da yazıldı. Marka uyanırsa ürün sayfasıyla değiştirilecek.

## Yeni kapı: ana sayfa bağlantısı reddediliyor

`retailers.test.ts`e dördüncü sınama eklendi — arama kapısının kardeşi.
Adresin yolu yalnızca `/` olamaz.

Bu turda ölçülen **üç tuzak** bunu gerektirdi, üçü de "200 döndü" diye
yazılabilirdi: `artisanparfumeur.com` kökü ülke seçimi dayatıyor (ve seçim
JS'te, bağlantı yok — doğru adres `/us/en_US/…`), `royalcrown.it` kökü bozuk
yönlendirme, `micallef.fr` bambaşka bir site.

⚠️ Bilerek dar tutuldu: kategori/koleksiyon kalıbı **aranmıyor**. Shopify'ın
`/collections/<x>/products/<y>` biçimi meşru bir ürün adresi ve bir "kategori"
süzgeci onu yanlışlıkla reddederdi.

## Parfümör alanına dokunulmadı

`perfumer` 49/52 duruyor ve bu bir boşluk değil — gerekçe `src/data/types.ts`te
zaten yazılı. Bu tur onu **bağımsız olarak doğruladı**: MiN New York'un kendi
Long Board sayfası açıldı, burun adı **geçmiyor**. Aynı şekilde L'Artisan'ın
Mandarina Corsica sayfası "By Quentin Bisch" diyor — verimizde yazan isim,
yani o alanın kaynağı sağlam.

## Kapsam dışı

- **Affiliate parametreleri** — CJ/Awin açıldığı gün aynı adreslere eklenecek.
  Bu turda ölçülen: FragranceX ve Notino robota kapalı değil, **gerçek
  tarayıcıda açılıyorlar** — panel geldiğinde derin bağlantı üretmek kolay.
- ⚠️ Eldeki Luckyscent bağlantıları (bu turda +1) **hiçbir zaman komisyon
  getirmeyecek**: Luckyscent'in programı yok (ölçüldü, `088d538`).

## Doğrulama

- `npm test` — 47 dosya, **512 sınama** yeşil (yenisiyle birlikte)
- Çalışan sunucuda gözle: bağlantı kazanan künyede satır çiziliyor
  (`rel="sponsored nofollow noopener"`), iki dilde de
- `npm run lint` — sessiz
- `npm run build` — **510 sayfa 510 kaldı**; satıcı alanı rota üretmiyor
