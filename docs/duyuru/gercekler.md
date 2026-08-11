# Gerçekler — bütün duyuru metinlerinin kaynağı

⚠️ **Buradaki her sayı koddan sayıldı** (yeniden sayım: 2026-08-12). Duyuruda bunların
dışında bir rakam kullanma; "yüzlerce nota", "binlerce kombinasyon" gibi
şişirmeler ilk yorumda çürütülür ve bütün gönderinin güvenilirliğini alır.
Veri değişirse (parfüm eklenince) bu dosya yeniden sayılır.

## Sayılar

| Ne | Kaç |
|---|---|
| Parfüm | **52** (hepsi küratörlü, hepsinin kendi cümlesi var) |
| Marka | **44** |
| Yıl aralığı | **1994–2025** |
| Nota | **136** |
| Parfüm başına ortalama nota | **9.4** |
| Üretilen sayfa | **396** (iki dil dahil; hesap sayfaları hariç hepsi statik) |
| Sınama | **498** |
| Koku ailesi | **15** |
| Karakter ekseni | **4** (sıcaklık, doku, temizlik, yakınlık) |

## Doğru olan iddialar (hepsi savunulabilir)

- **Sitede hiç fotoğraf yok.** Ekrandaki her şey veriden çiziliyor: canvas
  ve SVG. Şişe görseli, marka logosu, stok fotoğraf — hiçbiri yok.
- **Grafik kütüphanesi yok.** Evrim eğrisi, uzay haritası, yörüngeler:
  hepsi elle yazıldı.
- **Hesap sunucuda kalıyor.** Benzerlik matrisi ve izdüşüm tarayıcıya hiç
  inmiyor; istemciye yalnızca sonuç gidiyor (ad, renk, konum, derinlik).
- **İki dilli**, İngilizce kökte, Türkçe `/tr` altında.
- **Neredeyse tamamı statik.** 396 sayfa derlemede üretiliyor. İstek başına
  çizilen tek şey kişiye ait olanlar: `/settings`, `/studio` ve `/u/...`.
- **Tarayıcıdan üçüncü tarafa istek yok.** Tek sinyal sitenin kendi çerezsiz
  analitiği; giriş, raf ve kompozisyon uçlarının hepsi aynı köken.
- **Hesap isteğe bağlı.** Girişsiz gezinti hiçbir şey saklamıyor — çerez yok,
  hesap yok, takip yok.
- **Renk = koku ailesi**, sitenin her yerinde aynı; birkaç sayfa sonra
  kod okunur hâle geliyor.

## Hesap açanın gördüğü (isteğe bağlı katman)

Duyuruda öne çıkarılacak şey harita; bunlar "bir de şu var" satırı olarak
kullanılabilir, başlık olarak değil.

- **Top 4** — profilde dört parfüm ve onlardan türeyen bir imza çizimi.
  Fotoğraf yok, profil resmi bile yok: kimlik işareti veriden doğuyor.
- **Raflar** — sahibim / denedim / istiyorum.
- **Burun raporu** — raflardan okunan portre: baskın aileler yüzdeyle, dört
  eksendeki yer, koleksiyonun genişliği, aradaki yabancı, ve sıradaki beş
  öneri. Aynı benzerlik motoru; kişinin parfümleri tek bir sentetik parfümde
  birleştirilip 52'nin cetveliyle ölçülüyor.
- **Kompozisyon aracı** — 136 notadan kendi parfümünü kur; site evrim
  eğrisini çiziyor ve haritada en yakınları söylüyor. Üç notaya kadar
  ücretsiz.

## Yöntem — "bu nasıl hesaplandı" sorusunun dürüst cevabı

**Uzaydaki konum:** her parfüm üç kanaldan okunuyor — koku ailesi ağırlıkları,
karakter (dört eksen) ve paylaşılan notalar. Üçünün birleşimi üzerinde kosinüs
uzaklığı hesaplanıp iki boyuta indiriliyor: önce klasik MDS, sonra **SMACOF**
ile düzeltme. Nokta boyutu üçüncü bileşen (derinlik).

⚠️ SMACOF adımı süs değil ve sorulursa anlatılacak iyi bir hikâye: klasik MDS
tek başına yerel yapıyı eziyordu — gerçek uzaklığı 0.29 olan iki parfümü
haritada 0.007'ye yapıştırıyordu (%3). Ölçüldü ve düzeltildi.

**Evrim eğrisi:** her notanın iki sayısı var — tepe dakikası ve yarı ömür.
Eğri `yükseliş × sönüm`: `(1 − e^(−t / (tepe/k))) × 0.5^(t / yarıömür)`.
Parfümün imzası, notalarının ağırlıklı toplamı.

⚠️ **Bu bir ölçüm değil, model.** Sitede de böyle yazıyor (çizelgenin altındaki
uyarı). Duyuruda da böyle söyle — "gerçek gelişim sıcaklığa, tene ve
konsantrasyona göre kayar". Bunu kendin söylersen dürüst görünürsün;
başkası yakalarsa savunmaya düşersin.

## En sert soru ve dürüst cevabı

> **"Veri nereden? Fragrantica'dan mı kazıdın?"**

Hayır. Nota listeleri markaların kendi yayınladığı piramitlerden; **notaların
uçuculuk ve karakter değerleri, küratör cümleleri ve seçkinin kendisi elle
yazıldı** — yani öznel ve bunu saklamıyorum. Güçlü yanı da bu: kimsenin
veri setinde bulunmayan bir okuma. Zayıf yanı da bu: tek kişinin burnu.

⚠️ Bu cevabı hazır tut, çünkü **ilk yorumlardan biri kesinlikle bu olacak.**
"Elle yazdım, öznel, kaynağı benim" demek burada zayıflık değil güç: veri
kazıyan yüzlerce site var, elle küratörlenen yok.

## Zayıf noktalar — önce sen söyle

Duyuruda bunları kendin söylemek, birinin bulup yazmasından her zaman iyi:

- **52 parfüm az.** Doğru. Amaç katalog değil, okunabilir bir seçki; yenisi
  ekleniyor.
- **Parfümör 49/52.** Üçünde marka burnu açıklamadı; arandı, bulunamadı —
  uydurulmadı, "bilinmiyor" da yazılmadı, satır yalnızca yılı gösteriyor.
- **Lisans "tüm hakları saklı".** Kod okunabilir ama serbest değil. HN'de
  bu soru gelir; cevabı hazır olsun: seçki, tarifler ve ölçümler özgün iş.
  (Bunu değiştirmek istersen ayrı bir karar — söyle, konuşalım.)
- **Model, ölçüm değil** (yukarıda).

## Bağlantılar

- Site: https://osmos.me
- Depo: https://github.com/Sooosii/osmos
- Besleme: https://osmos.me/feed.xml

## Yığın

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · TypeScript ·
Vitest. Çizim canvas ve SVG.
