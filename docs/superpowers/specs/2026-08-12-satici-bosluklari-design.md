# Satıcı Boşlukları — Tasarım

Tarih: 2026-08-12 · Sahip yönü seçti ("veri boşlukları"), yoğunluk kararını
verdi ("bağla, ikisini de")

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

**34/52 → 47/52 · 42 → 54 bağlantı.** 13 yeni satır, hepsi tek tek açıldı.

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

### Yazılmadı (5) — arandı, yok

Bu bölüm asıl çıktı: aynı iş bir daha yapılmasın.

- **`serge-lutens-tubereuse-criminelle`** — markanın US mağazası 234 ürün,
  EU mağazası 280 ürün; ikisinde de "tubereuse/criminelle" geçen tek ürün yok.
  Luckyscent Serge Lutens'i **hiç taşımıyor** (marka dizininde yok, `/brands/
  serge-lutens` 404). FragranceX'te marka var ama 9 ürün, bu değil.
- **`m-micallef-gntonic`** — markanın alan adı bulunamadı:
  `micallef-parfums.com` çözülmüyor, `parfums-micallef.com` bağlantıyı
  reddediyor, `micallef.fr` **parfümle ilgisi olmayan bir Linux blogu**.
  FragranceX M. Micallef taşıyor (15 ürün) ama GNTONIC yok.
- **`city-rhythm-miami-tropical-confessions`** — Luckyscent'in marka dizininde
  "City Rhythm" **yazıyor** ama bağlantısı (`/brands/city-rhythm`) **404**:
  dizin bayat. `cityrhythm.com` ise bir orkestra/parti grubu, parfüm markası
  değil.
- **`royal-crown-nocturna`** — `royalcrown.it` kökü bozuk bir yönlendirmeye
  düşüyor ("Supplied countryName is invalid"). Luckyscent ve FragranceX
  markayı taşımıyor.
- **`aaron-terence-hughes-oud`** — markanın kendi Shopify mağazasında
  **tek bir ürün** var (Gin Sling); Oud satılmıyor.

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
- `npm run lint` — sessiz
- `npm run build` — **510 sayfa 510 kaldı**; satıcı alanı rota üretmiyor
