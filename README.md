# OSMOS

Kokuyu okunur bir şey yapma denemesi. 52 parfüm ve 136 nota; hiçbir yerde
fotoğraf yok, her şey veriden çiziliyor.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 195 sayfa, tamamı statik
npm test        # vitest
npm run lint
```

## Sayfalar

| adres | ne |
|---|---|
| `/` | **Koku uzayı** — sitenin kapısı. 52 parfüm, yerleri nota akrabalığından hesaplanmış bir düzlemde. Sürükle, yakınlaş, bir noktaya dokun. Kaydıraçlarla hisle de arayabilirsin ve tarif adreste taşınıyor: `?feel=0.9,,0.2` |
| `/parfum/[id]` | Parfümün kendi sayfası: künye, dönen evrim imzası, notaları, uzaydaki komşuları |
| `/notalar` | 136 malzemenin dizini, uçuculuk bandına göre |
| `/nota/[id]` | Notanın sayfası: ölçümleri ve onu içeren parfümlerin dönen takımyıldızı |
| `/evrim`, `/uzay` | Doğrulama ekranları — iç araç, siteye ait sayfa değil |

## Veri

Üç dosya kümesi, hepsi `src/data/` altında elle yazılmış:

- **`perfume-sets/`** — 52 parfüm. Her birinin notaları katman (üst/kalp/dip) ve
  ağırlıkla birlikte; ayrıca marka, yıl, parfümör.
- **`note-sets/`** — 136 nota, uçuculuk bandına göre üç dosyada. Her notanın
  aile ağırlıkları, uçuculuğu (tepe dakikası + yarı ömür) ve dört karakter ekseni
  var: sıcaklık, doku, temizlik, yakınlık.
- **`families.ts`** — 15 koku ailesi ve renkleri. **Renk = aile**, sitenin her
  yerinde; kullanıcı birkaç sayfa gezdikten sonra kodu çözebiliyor.

`types.ts` şemanın tamamını ve her alanın hangi gösterimi sürdüğünü anlatıyor.

## İki kural

**① Hesap sunucuda kalıyor.** Benzerlik matrisi, izdüşüm ve nota veritabanı
tarayıcıya hiç inmiyor; istemciye giden şey yalnızca sonuç — ad, renk, ağırlık,
derinlik. `space-marks.ts` ve `note-marks.ts` bu sözleşmenin iki ucu.

**② Elle ölçülmüş her sayıyı bir sınama koruyor.** Yörünge geometrisi, tram
eşikleri ve etiket yerleşimi tarayıcıda tek tek ayarlandı; kamera açısı veya
yarıçaplar değişirse sınamalar kırılıyor. Saf modüller (`src/lib/`) React, DOM ve
canvas tanımıyor, yanlarında kendi sınamalarıyla duruyorlar.

## Kararların yeri

Her özelliğin niçin öyle olduğu `docs/superpowers/specs/` altında, ve reddedilen
seçenekler de orada yazılı. Kodun içindeki yorumlar da aynı işi yapıyor: ne
yaptığını değil, **neden öyle olduğunu** ve nelerin denenip elendiğini anlatıyorlar.

## Yığın

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · TypeScript ·
Vitest. Çizimler canvas ve SVG; harici bir grafik kütüphanesi yok. Site tamamen
statik üretiliyor ve çalışma anında dışarıya hiçbir istek atmıyor.
