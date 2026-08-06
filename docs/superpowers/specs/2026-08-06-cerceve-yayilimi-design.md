# Çerçevenin Yayılımı — Tasarım

## Sorun

`ScreenFrame` bir sayfada duruyor: `/nota/[id]`. Oraya **örnek olarak** konmuştu —
biçim beğenilirse siteye yayılacaktı (`dfee6ad`).

Yayılmadığı sürece çerçeve bir kimlik değil, bir istisna. Nota sayfası ince bir
HUD'un içinde açılıyor; ondan bir tık ötedeki parfüm sayfası çıplak. İkisi aynı
ansiklopedinin iki yaprağı, ama iki farklı siteden gibi görünüyorlar.

## Kararlar

### ① Çerçeve belgelerin işareti; uzay çerçevesiz kalıyor

Yayılım **üç belge sayfasıyla** sınırlı: `/nota/[id]` (zaten var), `/parfum/[id]`
ve `/notalar`. Uzay (`/`) almıyor.

Sebep tek cümlelik bir kural: **çerçeve "bir belgenin içindesin" demek.** Uzay
belge değil, kapı — tam kanama tuval, kaydırmayacak bir yüzey, kendi katman dili.

Uygulamada da çakışıyordu ve çakışma üç yerden geliyor:

- `SpaceOverlays`in sol üst sütunu (giriş metni + kaydıraçlar, `left-6 top-6`)
  tam üst şeridin altına giriyor.
- Küratör cümlesi ve giriş şeridi (`bottom-0 p-6`) alt şeritle aynı bantta.
- Asıl mesele üçüncüsü: **yaklaşma sahnesinin bütün sözü "varışa kadar ekranda
  hiçbir şey yok".** `introRef` ve `feelRef` sahne boyunca opaklığı 0'da
  bekliyor. Çerçeve baştan görünseydi o sözü bozardı; sahneyle birlikte açılsaydı
  `use-approach-scene`e dördüncü bir görünürlük kanalı gerekirdi.

*Reddedilen:* uzayın da çerçeve alması (iki biçimde de). Sahibin kararı.

`/evrim` ve `/uzay` doğrulama ekranları da almıyor — onlar iç araç, siteye ait
sayfa değil. Daha önce "dokunulmayacak" diye karara bağlanmıştı.

### ② Çerçevedeki her sayı gerçek veri

`ScreenFrame.tsx`in yazılı kuralı: *"Yerini dolduracak gerçek veri yoksa alan boş
bırakılır."* Kaynak bileşendeki `LAT: 37.7749°` ve `FRAME: ∞` uydurmaydı.

İki yeni sayfanın ölçümleri sahibe ekran taslağı olarak gösterilip seçildi:

**`/parfum/[id]`**

| yer | içerik | kaynak |
|---|---|---|
| sol üst | `OSMOS · NOTALAR` | `OSMOS` bağlantısı `?mark=` taşıyor |
| sağ üst | `AİLE ODUNSU` `YIL 2020` `NOTA 12` | `dominantFamily(familyVector())`, `perfume.year`, `perfume.notes.length` |
| sol alt | `PARFÜM 007/52` | `PERFUMES` içindeki sıra |
| sağ alt | `ORTO PARISI` | `perfume.brand` |

**`/notalar`**

| yer | içerik | kaynak |
|---|---|---|
| sol üst | `OSMOS` | |
| sağ üst | `ÜST 41` `KALP 64` `DİP 31` | `BANDS` |
| sol alt | `PALET 136` | `NOTES.length` |
| sağ alt | `112 KULLANIMDA` | **yeni hesap**, aşağıda |

*Reddedilen:* parfüm sayfasında sağ alta piramit dağılımı (`Ü4 · K5 · D3`) veya
`curated` bayrağı; dizinde sağ alta `15 AİLE` veya `52 PARFÜM`.

### ③ "Kullanımda" yeni bir gerçek, süs değil

Dizinin sağ altındaki sayı sayfanın hiçbir yerinde yazmıyor: **136 notanın kaçı
52 parfümün en az birinde geçiyor.**

Yazılmaya değer olmasının sebebi, sayfanın zaten savunduğu şeyi rakamla
göstermesi: *"Ansiklopedi bir nota sözlüğü; kullanım listesi değil"*
(`note-marks.ts`, boş yörünge dalı). Palet ile seçki arasındaki fark bir cümle
olarak duruyordu; artık bir sayı olarak da duruyor.

Hesap `note-marks.ts`e **saf bir fonksiyon** olarak giriyor — nota türevi veri
zaten orada yaşıyor ve modül sunucu tarafında:

```ts
export function countUsedNotes(notes, perfumes): number
```

Kesişim sayılıyor, `Set` boyutu değil: parfüm verisi palette olmayan bir
`noteId`ye işaret etseydi `Set` onu da sayardı ve ekrandaki sayı 136'yı aşabilirdi.

### ④ Sayfa kendi navigasyonunu çerçeveye bırakıyor

`/notalar` ve `/parfum/[id]`in tepesinde birer `<nav className="pt-10">` var,
içinde tek bir `OSMOS` bağlantısı. Çerçeve geldiğinde ikisi **siliniyor**:
aynı bağlantı çerçevenin sol üstünde, ve iki kere durursa hangisinin gerçek
olduğu belirsizleşir.

Boşluklar nota sayfasının desenine hizalanıyor: çerçeve içeriğe `pt-16 pb-24`
veriyor, sayfa `pb-32`sini bırakıyor, `header` `pt-14 sm:pt-20` yerine
`pt-8 sm:pt-14`e iniyor.

`?mark=` korunuyor. Parfüm sayfasının `OSMOS` bağlantısı uzayı o parfüm seçili
açıyor; çerçeveye taşınırken bu düşerse tarayıcının geri tuşuyla bağlantı
farklı yerlere giderdi.

### ⑤ Aile adı Türkçe büyük harfe çevriliyor, `toUpperCase()` ile değil

`'Çiçeksi'.toUpperCase()` → `ÇIÇEKSI`. Noktalı `i` noktasız `I` oluyor ve 15
ailenin dokuzunda bozuk yazı çıkıyor. `toLocaleUpperCase('tr')` kullanılıyor.

Marka **kullanmıyor** ve bu bilinçli: markalar Latin adlar, `'Diptyque'` Türkçe
kuralıyla `DİPTYQUE` olurdu. Mevcut `perfume.brand.toUpperCase()` yerinde kalıyor.

## Kapsam dışı

- `ScreenFrame`in kendisinde değişiklik yok. Bu iş bir yayılım; bileşen olduğu
  gibi kullanılıyor.
- Uzay, `/evrim`, `/uzay` — ①.
- Çift dil, açılış sahnesi, `?feel=`in URL'de taşınması: ayrı işler.

## Sınama

- `note-marks.test.ts` (yeni): `countUsedNotes` — hiç kullanılmayan nota, tek
  parfümde geçen nota, aynı notayı içeren iki parfümün iki kez saymaması,
  palette olmayan `noteId`nin sayıya girmemesi.
- Gerçek veriyle: sonuç `0 < n ≤ NOTES.length`.
- `npm run build` · `npm run lint` · `npm test` yeşil.
- Ekranda: `/notalar`, `/parfum/<id>` ve regresyon için `/nota/bergamot`.
