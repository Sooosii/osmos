# İngilizce Birincil — Tasarım

## Sorun

`types.ts:32` yıllardır *"Site EN birincil, TR ikincil"* diyor ve bu doğru
değil: ekranın %100'ü Türkçe. Veri baştan iki dilli yazıldı (`{en, tr}`, 52
parfüm + 136 nota dolu) ama ekran hep `.tr` ucundan okudu.

Sahibin isteği: *"site birebir aynı kalsın sadece ana dil kök dil türkçe yerine
ing olsun global olsun diye diyorum."* Yani mesele çeviri değil **erişim** —
sitenin kendisi değişmiyor, konuştuğu dil değişiyor.

İkinci bir istek de var ve bu turun dışında kalıyor: *"olmadı isteyen çevirsin
diye bi yerde, normal diğer sitelerde nasıl bi yerde duruyorsa artık, bi yer
olsun şuanki türkçeye çevirebilsin."* Sahip önce İngilizceyi ekranda görmek
istedi; düğme Faz 2.

Kütüphane kararı sıfırdan veriliyor: `next-intl` temizlik turunda silindi
(`fc1517f`), yani "zaten kurulu, onu kullanalım" varsayılanı yok.

## Kararlar

### ① Kütüphane yok, `[lang]` yok, proxy yok

Faz 1'de ekranda **tek dil** var. İki dilli bir yönlendirme katmanı kurmak
bugün hiçbir şeye hizmet etmez.

*Reddedilen:* `app/[lang]/` + `src/proxy.ts` yeniden yazımı (Next 16'nın kendi
rehberinin yolu, `01-app/02-guides/internationalization.md`). Doğru çözüm ama
yanlış zaman: kurulacak makinenin tek kullanıcısı Faz 2 ve Faz 2 henüz
onaylanmadı.

*Reddedilen:* `/en` görünür olsun, `/` oraya yönlensin. Kök artık site değil bir
yönlendirme olurdu ve açılış kapısı — sitenin yüzü — bir gidiş-dönüşün arkasına
düşerdi.

*Reddedilen:* tarayıcı diline bakıp Türk ziyaretçiyi ayırmak. Sahibin sözü
"direkt İngilizce olsun"; kök herkese aynı açılır.

### ② Metin `src/i18n/`'e taşınıyor — Türkçesi kaybolmadan

`en.ts` sözlüğün şeklini tanımlar (`export type Dict = typeof EN`). `tr.ts`
bugünkü Türkçe cümleleri **olduğu gibi** devralır ve `Dict` olarak imzalanır:
bir anahtar eksik kalırsa derleme kırılır.

Bu numara depoda zaten yerleşik — `Note.description` ve `Perfume.year` tam da bu
yüzden isteğe bağlı değil: veri bütünlüğünü sınamaya değil **tipe** bekletmek.

⚠️ `tr.ts` bu turda ekranda hiç görünmüyor. Ölü kod değil, **beklemede**: Faz
2'nin bütün metin işi orada hazır duracak.

*Reddedilen:* dizeleri bulundukları yerde İngilizceye çevirmek. En küçük diff bu
olurdu, ama bugünkü Türkçe yalnızca git geçmişinde kalırdı — ve Faz 2 zaten
yazılmış cümleleri ikinci kez yazmak zorunda kalırdı.

⚠️ `EN` **`as const` ile yazılmamalı.** O durumda `typeof EN` her değeri kendi
dize sabitine daraltır ve `tr.ts` hiçbir anahtarı tutturamaz. Şekil `string`
kalmalı; zorunluluk anahtarlarda, değerlerde değil.

### ③ Sözlük doğrudan `import` ediliyor

Sunucu bileşenleri de istemci bileşenleri de `EN`i doğrudan içeri alır. Tek dil
varken sözlüğü sunucudan aşağı bileşen bileşen prop olarak taşımak, kurulmuş ama
kullanılmayan bir makinedir.

⚠️ Bu Faz 2'de değişecek: iki dil olduğu an bir `LocaleProvider` + kanca gerekir
ve metin taşıyan her istemci bileşeninde birer satır değişir. Fiyat bilinerek
ödeniyor, sürpriz değil.

### ④ Yollar İngilizceleşiyor

| bugün | sonra |
|---|---|
| `/parfum/[id]` | `/perfume/[id]` |
| `/notalar` | `/notes` |
| `/nota/[id]` | `/note/[id]` |
| `/evrim` | `/evolution` |
| `/uzay` | `/space` |

`git mv` ile, dosya içerikleri aynen. Bedeli sıfır: site hiçbir yere
yayınlanmadı, uzak depo bile yok — kırılacak dış bağlantı mevcut değil.

`?mark=` ve `?feel=` parametreleri aynen kalıyor. Adres durumu ve açılış
kapısının oturum bayrağı (`acilis-oturum.ts`) yola değil oturuma bağlı, ikisi de
etkilenmiyor.

### ⑤ Veri okumaları `.en`e dönüyor — bu bir çeviri değil

**15 yerde, 10 dosyada** `.tr` okunuyor: `note-marks.ts` (2), `space-marks.ts`,
`uzay/page.tsx`, `notalar/page.tsx`, `nota/[id]/page.tsx` (2, ikisi de
`generateMetadata`), `parfum/[id]/page.tsx` (3), `EvolutionTimeline`,
`EvolutionSignature` (2), `EvolutionChart`, `PerfumeNotes`.

Karşılıkları zaten yazılı ve iyi yazılı — küratör cümleleri ve nota tarifleri
kaynağından İngilizce kuruldu, Türkçesi onların yeniden yazımı:

```
en: 'A rose left too long in a room full of smoke — sweet, medicinal, unwilling to leave.'
tr: 'Dumanla dolu bir odada fazla kalmış bir gül — tatlı, tıbbi, gitmeye niyetsiz.'
```

Yani 52 küratör cümlesi + 136 nota adı + 136 tarif bu turda **yazılmıyor**,
yalnızca doğru uçtan okunuyor.

### ⑥ Perdenin metni dosyanın dışına çıkıyor

`public/intro.js` üç Türkçe dize taşıyor: `'osmos'`, `'… parfüm, nota
akrabalığından doğan bir harita'` ve `'yaklaşmak için kaydır'`.

Dosyanın kendi geleneği var — `window.OSMOS_INTRO_POINTS`,
`window.OSMOS_INTRO_DISABLE`. Aynı geleneğe `window.OSMOS_INTRO_TEXT`
ekleniyor, `IntroOverlay` sözlükten dolduruyor. Yedek değerler dosyada kalıyor:
`intro.js`in başındaki kullanım notu onu "drop-in, framework agnostic" diye
tanımlıyor ve tek başına da çalışmaya devam etmeli.

Dosyanın yapısına dokunulmuyor — çerçeve yayılımı turunda konan sınır
(`IntroOverlay`: *"intro.js'e dokunulmuyor, bu iş bağlayıcı katmanın işi"*)
burada da geçerli; eklenen tek şey kendi sözleşmesine bir alan.

### ⑦ Sesi veri belirliyor: sergi etiketi

Kısa, somut, süssüz; uzun tire serbest, pazarlama dili yok. Sahip üç ses
arasından bunu seçti.

```
GIRIS METNI    52 perfumes, placed by what their notes share.
               Drag, zoom, touch a point.
GIRIS SERIDI   KEEP SCROLLING
KUNYE          HOUSE / YEAR / FAMILY
BASLIK         OSMOS — a map of niche perfume
```

Gerekçe: küratör cümleleri zaten bu sesle yazılmış. Arayüz başka bir ağızdan
konuşursa sayfa iki sesli olur.

*Reddedilen:* daha edebi kayıt (*"Fifty-two perfumes, arranged by the kinship of
their notes. Drift, draw closer, touch a light."*) — uzay sahnesine yakışıyor
ama ipuçları "ne yapacağım" sorusuna geç cevap veriyor.
*Reddedilen:* düz işlevsel kayıt (*"Drag to move, scroll to zoom, click a
point."*) — en anlaşılırı, ama küratör cümlelerinin yanında kuru kalıyor.

### ⑧ İ kuralı bedavaya korunuyor — ve çiviye vuruluyor

`<html lang="en">` aynen kalıyor. Bu bir tesadüf değil, yazılı bir karardı
(`parfum/[id]/page.tsx:70`, `AstronotIntro.tsx:412`): CSS'in `uppercase`
dönüşümü belgenin diliyle çalışır ve `lang="en"` altında i→I üretir.

⚠️ **Faz 2'nin en büyük tuzağı burada.** Türkçe sayfaya doğru olan `lang="tr"`
yazıldığı an tarayıcı Türkçe büyütme kuralına geçer ve `uppercase` i→İ üretir —
sahibin *"İ bunu görmiyim"* kuralı bütün sitede birden çöker. Faz 1 bu duvara
değmiyor (Türkçe sayfa yok), ama Faz 2 buraya çarpmadan geçemez ve çözümü
gerçek tarayıcıda ölçülmeden seçilmemeli.

Faz 1 kuralı ayrıca ileriye çiviliyor: aşağıdaki iki sınama, "site tamamen
İngilizce" iddiasını ölçülebilir bir şeye çeviriyor.

## Sınamalar

**① Sözlük bütünlüğü.** `tr.ts` ile `en.ts` aynı anahtar kümesine sahip ve
hiçbir değer boş dize değil. Şekli tip zaten zorluyor; sınama tipin
göremediğini (boş dize, unutulmuş yer tutucu) yakalıyor.

**② Kaçak Türkçe avcısı.** `src/**/*.{ts,tsx,css}` ve `public/*.js` taranır,
yorumlar (`//`, `/* */`) çıkarılır, geriye Türkçeye özgü harf (ç ğ ı ö ş ü ve
büyükleri) kalırsa sınama kırılır.

Muaf tutulanlar ve nedenleri:
- `src/data/**` — TR metin orada tasarım gereği duruyor
- `src/i18n/tr.ts` — bekleyen Türkçe sözlüğün evi
- `*.test.ts` — sınamaların kendi metinleri

⚠️ Tarayıcı **yorumları atlar ama dizeleri okur**; satır içi `//` içeren bir
dize (URL gibi) o satırın kalanını gizleyebilir. Bu yön güvenli: eksik yakalar,
yanlış yakalamaz.

**③ `.tr` okuması kalmadı.** `src/` içinde `src/data/**` ve `src/i18n/` dışında
`.tr` alan erişimi yok. ② bunu göremez — `.tr` içinde Türkçe harf yoktur.

Mevcut 178 sınama yeşil kalmalı. Yol adı değişiklikleri sınamalara dokunmuyor:
sınananlar saf modüller, hiçbiri rota bilmiyor.

## Yapı

| dosya | iş |
|---|---|
| `src/i18n/en.ts` | ekranın sözlüğü; şekli tanımlar (`type Dict`) |
| `src/i18n/tr.ts` | bugünkü Türkçe, `Dict` olarak imzalı, beklemede |
| `src/i18n/i18n.test.ts` | sözlük bütünlüğü + kaçak Türkçe avcısı + `.tr` denetimi |
| `src/app/{perfume,notes,note,evolution,space}/` | `git mv` ile yeni adlar |
| `public/intro.js` | `OSMOS_INTRO_TEXT` alanı, yedekleriyle |
| `src/components/IntroOverlay.tsx` | metni sözlükten perdeye geçirir |

## Ölçülen büyüklük

Yorum dışı, Türkçeye özgü harf geçen **299 satır / 27 dosya**. En yoğunları:
`SpaceFeelSliders` (42), `nota/[id]/page.tsx` (40), `SpaceOverlays` (35),
`app/page.tsx` (30), `notalar/page.tsx` (23), `note-measures.ts` (16),
`NoteMeasures` (15).

Bu bir üst sınır değil alt sınır: Türkçe harf içermeyen dizeler (`KESKIN`,
`DIP`, `PARFUM`) sayıma girmiyor. Gerçek dize listesi plan aşamasında
çıkarılacak.

## Kapsam dışı — Faz 2

- Köşedeki dil değiştirici ve `/tr` adresleri
- `LocaleProvider` + kanca (③'ün ödediği borç)
- `hreflang` / `alternates.languages`
- `lang="tr"` altında `uppercase` sorunu (⑧'deki tuzak)
- README Türkçe kalıyor — ekran değil

## Açık uçlar

- `types.ts:32`'deki *"Site EN birincil"* yorumu Faz 1 bitince ilk kez doğru
  olacak; yine de gözden geçirilmeli — artık "birincil" değil "tek" diyor.
- Nota ve parfüm sayfalarının `generateMetadata`sı İngilizceye dönüyor; `title`
  şablonundaki `— nota · OSMOS` gibi ayraçlar sözlüğe girmeli, yoksa Faz 2'de
  kaçak Türkçe olarak geri bulunurlar.
