# Türkçeye Geçiş — Tasarım (Faz 2)

## Sorun

Faz 1 (`53a6e6f`) siteyi İngilizce yaptı ve bugüne kadarki bütün Türkçeyi
`src/i18n/tr.ts`'e taşıdı. Sahibin isteğinin ikinci yarısı ödenmemiş duruyor:

> *"olmadı isteyen çevirsin diye bi yerde, normal diğer sitelerde nasıl bi yerde
> duruyorsa artık, bi yer olsun şuanki türkçeye çevirebilsin."*
> *"türk biri türkçeye rahatça nasıl geçebilir onu bana hallet."*

Bugün o yol **yok**: metin hazır, kapı yok. `tr.ts` dolu ve tip düzeyinde
denetleniyor ama ekrana çıkmasının hiçbir yolu bulunmuyor.

## Ölçüm — İ tuzağı gerçek, ama üç satır

Faz 1 spec'i şunu yazmıştı: *"Türkçe sayfaya `lang="tr"` yazıldığı an tarayıcı
Türkçe büyütme kuralına geçer ve CSS `uppercase` i→İ üretir; çözüm gerçek
tarayıcıda ölçülmeden seçilmemeli."* Ölçüldü — Chromium, dev sunucusu, ekran
görüntüsü:

| durum | ekranda |
|---|---|
| **A** `lang="tr"` + CSS `uppercase` | **İCİN KADİFE İRİS İNCİR** |
| **B** `lang="en"` + CSS `uppercase` | ICIN KADIFE IRIS INCIR |
| **C** dış `lang="tr"`, öğede `lang="en"` | ICIN KADIFE IRIS INCIR |
| **D** `lang="tr"`, metin zaten BÜYÜK yazılı | ICIN KADIFE IRIS INCIR |

Üç sonuç birden çıktı: tuzak gerçek (A), öğe düzeyinde `lang` onu geçersiz
kılıyor (C), ve büyük harfli metin Türkçe kuralı altında da güvenli (D) —
çünkü Türkçe eşleme yalnızca küçük `i`→`İ` yönünde çalışıyor, büyük `I` olduğu
gibi kalıyor.

Sonra deliğin büyüklüğü sayıldı: depoda CSS `uppercase` **yalnızca üç yerde**
var — `AstronotIntro.tsx` (astronot ipucu), `intro.css` (perde ipucu),
`NoteMeasures.tsx` (ömür şeridi uç etiketleri). Ekranda büyük görünen her şey
(`FAMILY`, `EVOLUTION`, `TOP`, `PALETTE`) sözlükte zaten büyük harfle yazılı,
yani D'nin kapsamında ve güvenli.

**Korkulan şey üç satıra indi.**

## Kararlar

### ① `/` İngilizce, `/tr` Türkçe — hatırlama yok

Adres neyse o. Çerez yok, oturum bayrağı yok, tarayıcı diline bakan yönlendirme
yok. Türkçeye geçen kişi gezdikçe Türkçede kalıyor çünkü bağlantılar dili
taşıyor; yarın tekrar gelirse bir tık.

*Reddedilen:* çerezle hatırlama. Üç bedeli var ve üçü de Faz 1'de zaten
reddedilmiş şeyler: paylaşılan bir İngilizce link o kişide Türkçe açılırdı, kök
bir sayfa olmaktan çıkıp yönlendirmeye dönerdi, ve açılış kapısı — sitenin yüzü
— bir gidiş dönüşün arkasına düşerdi.

*Reddedilen:* oturum boyunca hatırlama. Bağlantılar dili zaten taşıdığı için
hiçbir şey eklemez, yalnızca bir katman daha olurdu.

### ② `app/[lang]/` + proxy yeniden yazımı

Bütün sayfalar `src/app/[lang]/` altına taşınıyor; `app/[lang]/layout.tsx` kök
düzen oluyor ve `<html lang={lang}>` artık dinamik. `src/proxy.ts` tek iş
yapıyor: adres `/tr` ile başlıyorsa dokunmuyor, başlamıyorsa içeriden `/en/...`e
**yeniden yazıyor**. Adres çubuğunda `/en` hiç görünmüyor.

Bu Next 16'nın kendi rehberinin yolu
(`node_modules/next/dist/docs/01-app/02-guides/internationalization.md`). Faz
1'de reddedilmemişti, ertelenmişti — tek dil varken kurulacak makinenin
kullanıcısı yoktu.

`generateStaticParams` iki dili birden üretiyor: 136×2 nota + 52×2 parfüm +
sabitler ≈ **390 sayfa**.

*Reddedilen:* iki ayrı ağaç (`app/(en)/` + `app/tr/`). Proxy'siz ve sihirsiz
ama her sayfa iki dosya olurdu ve iki dosya zamanla ayrışır. Bu depoda "aynı
veriye iki ad" şikâyeti bir kez yaşandı.

⚠️ `app/` kökünde artık `page` ya da `layout` kalmıyor. Eşleşmeyen adresler
için üst düzey bir `not-found` gerekip gerekmediği uygulamada ölçülecek —
bugün derleme `/_not-found` üretiyor ve o davranış korunmalı.

### ③ Sözlük istemciye `LocaleProvider` ile iniyor

Sunucu bileşenleri `getDict(lang)` çağırıyor. İstemci bileşenleri
`useDict()` kancasını kullanıyor.

Bu, Faz 1'de **bilerek alınan borcun faturası**. O gün istemci bileşenleri
`EN`i doğrudan import etti çünkü tek dil varken bağlam kurmak kurulmuş ama
kullanılmayan bir makineydi; borç spec'e yazıldı ve bugün ödeniyor.

Sözlüğü okuyan **20 dosya** var ve üç gruba ayrılıyorlar:

- **9 istemci dosyası** — `import { EN }` yerine `const t = useDict()`.
  Altısı `'use client'` işaretli (`AstronotIntro`, `EvolutionChart`,
  `EvolutionSignature`, `IntroOverlay`, `NoteOrbit`, `ScentSpace`); üçü
  **bilerek işaretsiz** ve yine de istemci (`SpaceOverlays`,
  `SpaceFeelSliders`, `SpaceKeyboardList` — sınırı `ScentSpaceCanvas` çiziyor,
  gerekçe dosyalarının kendi başlıklarında).
- **9 sunucu dosyası** — altı sayfa `params.lang`ten `getDict(lang)` çağırıyor;
  `Neighbors`, `NoteMeasures` ve `PerfumeNotes` sözlüğü sayfadan **prop olarak**
  alıyor (dili bilmelerinin başka yolu yok ve olmamalı).
- **2 saf modül** — `evolution-loop.ts` ve `note-measures.ts`; ikisi de zaten
  varsayılanlı sözlük parametresi taşıyor, çağıranlar artık doğrusunu geçiyor.

Yan iş: `AXES` şu an `EN.axes`'ten türeyen bir **sabit**. İki dilde sabit
olamaz; `axesFor(dict)` fonksiyonuna dönüyor. `axisWord`, `formatDuration` ve
`phaseLabel` zaten varsayılanlı birer sözlük parametresi taşıyor — Faz 1'de tam
bugün için konmuşlardı ve imzaları değişmiyor.

### ④ Değiştirici: köşede `EN|TR`

Sahip üç seçenek arasından bunu seçti: her sayfada, hep aynı yerde, sitenin
kendi mikro-tipografisinde. Aktif olan parlak, öbürü sönük.

*Reddedilen:* ilk ziyarette beliren şerit ("Türkçe oku →"). En keşfedilebilir
olanıydı ama sitenin sessizliğine bir istisna açardı; OSMOS'un dili saç teli
inceliğinde çizgiler, açılır şerit değil.

Yeri:
- **Belge sayfaları** — `ScreenFrame`'in üst şeridi, ölçümlerin sağında.
- **Uzay** — sağ üst köşe. Yaklaşma sahnesi boyunca yok, varışta giriş metniyle
  aynı anda beliriyor: "sahne boyunca ekranda kontrol olmaz" kuralı
  (`SpaceOverlays`, kaydıraçlar) burada da geçerli.

⚠️ **`?mark=` ve `?feel=` korunmak zorunda.** Uzayda bir parfüm seçiliyken ya
da kaydıraçlar ayarlıyken dile geçen kişi durumunu kaybetmemeli. Adres
parametreleri olduğu gibi taşınıyor ve bu ayrıca sınanıyor — unutulması kolay,
fark edilmesi zor bir kayıp.

### ⑤ CSS `uppercase` sitede tamamen yasaklanıyor

Üç yer JS `toUpperCase()`a dönüyor. Bu bir icat değil: parfüm künyesinde aynı
karar yazılı duruyor (`toLocaleUpperCase('tr')` bir kez denendi ve devrildi).

Sonra kural sınamaya bağlanıyor: **kaynak ağacında `text-transform: uppercase`
ve Tailwind `uppercase` sınıfı sıfır kez geçer.** D ölçümü sayesinde sözlükteki
büyük harfli metinlerin güvenli olduğunu biliyoruz, yani daha gevşek bir kural
da işe yarardı — ama tek kural iki kuraldan iyi ve bu kural gözle denetlenebilir.

### ⑥ `src/i18n/locale.ts` — saf modül

`isLocale`, `withLocale(locale, path)`, `stripLocale(path)`, ve adres
parametrelerini koruyan `switchPath(pathname, search, target)`. React, DOM,
Next bilmiyor; `space-feel-url.ts` ile aynı sözleşme, aynı sebeple: değiştirici
bileşeni sınanamaz, bu modül sınanabilir.

## Sınamalar

**① `locale.ts` saf sınamaları.** Önek ekleme/atma, çift önek olmaması
(`/tr/tr/...`), kök durumu (`/` ↔ `/tr`), ve **parametre koruma**
(`/?mark=x&feel=0.7` → `/tr?mark=x&feel=0.7`).

**② CSS `uppercase` bekçisi.** Kaynak ağacında sıfır eşleşme.

**③ Sözlük bütünlüğü** — Faz 1'den, olduğu gibi kalıyor.

**④ Kaçak Türkçe avcısı** — Faz 1'den. `src/i18n/tr.ts` muaf olmaya devam
ediyor; artık gerçekten kullanılıyor olması muafiyeti değiştirmiyor.

Mevcut 184 sınama yeşil kalmalı. `note-measures.test.ts` `AXES` yerine
`axesFor(EN)` çağıracak — beklentileri değişmiyor, yalnızca çağrı biçimi.

## Yapı

| dosya | iş |
|---|---|
| `src/i18n/locale.ts` | **yeni.** Saf: önek ekle/at, parametre koru |
| `src/i18n/locale.test.ts` | **yeni.** |
| `src/i18n/dict.ts` | **yeni.** `getDict(locale)`, `LOCALES`, `type Locale` |
| `src/i18n/LocaleProvider.tsx` | **yeni.** İstemci bağlamı + `useDict()` |
| `src/proxy.ts` | **yeni.** Öneksiz yolları `/en/...`e yeniden yazar |
| `src/components/LangSwitch.tsx` | **yeni.** `EN\|TR` |
| `src/app/[lang]/**` | bütün sayfalar taşınıyor |
| `src/lib/note-measures.ts` | `AXES` → `axesFor(dict)` |
| metin taşıyan istemci bileşenleri | `import { EN }` → `useDict()` |
| `AstronotIntro`, `intro.css`, `NoteMeasures` | CSS `uppercase` → `toUpperCase()` |

## Kapsam dışı

- `hreflang` / `alternates.languages` — SEO işi, ayrı ve küçük.
- Veri RSC yüküne iki dil birden iniyor. Faz 1'de not edilmişti; artık iki dil
  de gerçekten kullanıldığı için israf da sayılmaz. Dokunulmuyor.
- Üçüncü bir dil. Sözlük şekli buna hazır ama bugün istenmiyor (YAGNI).

## Açık uçlar

- Değiştiricinin uzaydaki yeri ekranda görülüp onaylanacak: sağ üst köşe
  boş duruyor ama yaklaşma sahnesinde kameranın gittiği yön oraya bakıyor.
  Sahibin kuralı geçerli — göster, sonra sor.
- `proxy.ts` ile statik üretimin birlikte çalıştığı derlemede doğrulanacak:
  yeniden yazma önceden üretilmiş bir yola düşüyor, ama bu ölçülmeden
  "çalışıyor" denmeyecek.
