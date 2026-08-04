# Uzaydaki Komşular — Tasarım (yol haritası ④, birinci yarı)

## Sorun

Parfüm sayfası ①②③ ile bitiyor: isim + küratör cümlesi, evrim imzası, "← uzaya dön".
İmzayı okuyup **"buna benzeyen ne var?"** diyen kişinin bugün tek seçeneği uzaya
dönüp noktayı yeniden bulmak. Sayfa o dürtüyü karşılıksız bırakıyor.

Yol haritasının ④'ü (künye + uzaydaki komşular) bir kez ertelenmişti. Gerekçe
`page.tsx:20`'de yazılı ve sayılarak doğrulandı: 44 parfümün **23'ünde parfümör,
18'inde yıl** bilgisi yok. (Sayım veri dosyalarından yapıldı, yorumdaki iddiaya
güvenilmedi.)

Sahip ④'ü ikiye ayırdı:

- **Künye ertelendi** — veri elle doldurulduktan sonra ayrı bir tasarım turu.
  Bu spec'in kapsamında değil.
- **Komşular şimdi** — komşu verisi 44 parfümün hepsinde tam; eksik veri sorunu
  bu yarıda hiç doğmuyor.

## Karar

Parfüm sayfasına, imzanın altına, **uzayın o bölgesinden kırpılmış küçük bir harita
parçası** geliyor. Sıralı liste değil: sitenin dili harita, komşuluğu söylemek
yerine göstermek gerekiyor.

| Konu | Karar | Nasıl seçildi |
|---|---|---|
| Biçim | Harita parçası | Üç seçenek (liste / liste+gerekçe / parça) sunuldu |
| İşlev | Adlar yazılı, tıklanınca o parfüme gidiyor | Doğrudan seçildi |
| Konum kaynağı | Ölçülüp karar verilecek — aşağıya bak | "Önce ölçelim, sonra karar" |
| Komşu sayısı | **5** | Aşağıda gerekçesi |

Beş, sabitlenmiş bir sayı değil bir başlangıç: `nearestNeighbors`'ın `count`
parametresi zaten var, değiştirmek tek satır. Beşle başlanıyor çünkü etiket
çakışması nokta sayısıyla birlikte hızla artıyor ve bu parçanın alanı küçük.
Etiket ölçümü (Doğrulama 6) taşma gösterirse sayı düşürülecek — pencereyi
büyütmek değil, çünkü pencere büyüdükçe kırpma "yakın komşuluk" olmaktan çıkıp
uzayın geneline dönüşür.

## Çözülmemiş gerilim — ölçüm kapatacak

`nearestNeighbors` **benzerliğe** göre sıralıyor. `projectToSpace` ise üç bileşenden
ikisini ekrana koyuyor, üçüncüsü `depth`'e gidiyor (`similarity.ts:339`). Yani "en
benzer beş" ile "haritada en yakın görünen beş" aynı küme olmak zorunda değil.

Harita parçası bu farkı **görünür kılar**: yan yana çizilmiş ama komşu sayılmayan
bir nokta, ya da uzakta duran bir "komşu" çıkabilir. Liste seçilseydi fark gizli
kalırdı; parça seçildiği için gizlenemiyor.

Karar kuralı sonucu görmeden yazıldı ki sonradan eğilip bükülmesin:

- ortalama örtüşme **≥ 4/5** → gerçek uzay konumları, kırpılmış
- ortalama örtüşme **< 4/5** → fark büyüklüğüyle birlikte sahibe sunulur; varsayılan
  öneri yine gerçek konumlar, çünkü iki ekranın aynı şeyi farklı göstermesi bu
  projede daha ağır bir kusur

## Mimari

Üç parça, her biri tek işli:

**`src/lib/neighbor-map.ts`** — saf geometri. `space-approach.ts` ve
`evolution-loop.ts` ile aynı sözleşme: React, DOM, SVG bilmiyor, hiçbir şey import
etmiyor. Vitest'te `@/` takma adı olmadığı için bu şart gevşetilemez. Sorumluluğu:
kırpma penceresi, uzay koordinatlarından ([−1,1] karesi) parça koordinatlarına
ölçekleme, etiket yerleşimi ve çakışma çözümü.

**`src/components/NeighborMap.tsx`** — `'use client'` **yok**, sunucu bileşeni.
Gereken tek etkileşim gezinme; onu `next/link` veriyor, vurgu durumları saf CSS.
Böylece 44×44'lük benzerlik motoru istemci paketine inmiyor — `space-marks.ts:11-13`
kuralı.

**`src/app/parfum/[id]/page.tsx`** — `nearestNeighbors` ve `projectToSpace` burada,
sunucuda çağrılıyor; sonuç düz veri olarak bileşene geçiyor.

### Çizim kuralları

- Nokta rengi `dominantFamily → getFamily().color` zincirinden. Sayfanın tepesindeki
  ışıkla **aynı kaynak**; ikinci bir renk yolu açılmıyor (`page.tsx:24-27`).
- Merkez parfüm ayırt edilir ama tıklanmaz — zaten oradasın.
- Adlar gerçek `<text>`, kırpılmıyor. `ScentSpaceCanvas.tsx:216` ve imza aynı kararı
  zaten verdi. Uzun adların yeri ölçülerek ayrılacak: imzada `LABEL_WIDTH` tahminle
  56 konmuş, gerçek adlarla 84'e çıkmak zorunda kalınmıştı.
- **Pencereye düşen komşu-olmayan noktalar da çiziliyor**, sönük ve etiketsiz.
  Yoksa kırpma yalan söyler: gerçek haritada orada duran bir nokta parçada yokmuş
  gibi görünür. Kırpmanın dürüst olmasının şartı bu.

### Erişilebilirlik

SVG `role="img"` ve komşuları sayan bir `aria-label`. Bağlantılar gerçek `<a>`
olduğu için klavyeyle gezilebiliyor — imzadaki `prefers-reduced-motion` ödünü gibi
bir taviz burada gerekmiyor, çünkü parça hareket etmiyor.

## Sınama

`src/lib/neighbor-map.test.ts` — saf modülün sınamaları: pencere bütün noktaları
kapsıyor mu, ölçekleme uçlara oturuyor mu, çakışan iki etiket gerçekten ayrılıyor mu.

Bileşen ve E2E sınaması kapsam dışı: projede altyapısı yok. Bileşen tarayıcıda
ölçülerek doğrulanıyor (aşağıda).

## Doğrulama

1. `npm run build`, `npm test`, `npm run lint` yeşil (lint'in 2 hatası
   `ScentSpaceCanvas.tsx`'te ve bu dalın işi değil; 2'yi geçerse bizim işimiz)
2. Bir komşuya tıkla → doğru parfüm sayfası açılıyor
3. Açılan sayfanın parçasında **eski parfüm görünüyor** — komşuluk simetrik değil
   ama yakınlık bir kenar; görünmüyorsa pencere dar
4. Parçadaki renkler `/uzay`'daki aynı parfümlerin renkleriyle birebir
5. Gerçek konumlar seçildiyse: göreli diziliş `/uzay` ile uyuşuyor (üç parfümde)
6. En uzun adda etiket taşmıyor/çakışmıyor — `getBBox()` ile ölçülerek, gözle değil
7. 375 px genişlikte okunur
8. Konsol: dört sayfada da 0 hata / 0 uyarı

## Bu işe dahil olmayanlar

- **Künye** — veri doldurulduktan sonra ayrı tur
- `ScentSpaceCanvas.tsx`'in 971 satırı; parça onu kullanmıyor, yeni ve küçük bir SVG
- Kalan dört ertelenmiş minör
- Aşama 3 nota ansiklopedisi, çift dil
- Dalın `master`'a alınması
