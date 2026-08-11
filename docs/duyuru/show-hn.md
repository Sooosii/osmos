# Show HN

## Kural özeti (kaynaktan okundu, 2026-08-11)

- Başlık **"Show HN: "** ile başlamak zorunda.
- Gönderilen şey **denenebilir** olmalı — kayıt, e-posta, engel yok. ✅ Site
  bu şartı zaten karşılıyor: girmeden her şey açık.
- Blog yazısı, kayıt sayfası, liste, bülten **kabul edilmiyor**. ✅ Site
  gerçek bir şey.
- Başlıkta abartı, ünlem, site adı, sürüm numarası **yok**.
- ⚠️ **"Don't post generated text or AI-edited text."** Aşağıdaki yorum
  bu yüzden taslak değil **ham malzeme** — kendi cümlelerinle yazacaksın.
- Yayınlar yayınlamaz gönderinin altına **kendi yorumunu** bırak: hikâye ve
  "farkı ne" burada anlatılıyor.
- İlk 60 dakika kritik: yorumlara oradan cevap ver. Arkadaşlardan oy isteme.

**Zaman:** Salı–Perşembe, ABD sabahı = **16:00–19:00 TSİ**. O saatte bir
saat boş olacağın bir gün seç; gönderip ortadan kaybolmak en büyük hata.

## ✍️ Başlık adayları

Başlık biçim işi, kişisel anlatı değil — bunları olduğu gibi kullanabilirsin.

1. `Show HN: A map of 52 perfumes, drawn from what their notes share`
2. `Show HN: OSMOS – perfume as data, no photographs anywhere`
3. `Show HN: I mapped 52 perfumes by note similarity; no images, all canvas`
4. `Show HN: A scent map where position comes from shared notes`

**Öneri: 1.** Somut sayı taşıyor, ne olduğunu tek okumada anlatıyor, abartı
sıfır. 3 de iyi ama "I mapped" ile başlayan başlıklar biraz daha kişisel —
sen seç.

## 📋 İlk yorum için ham malzeme

**Bunu kopyalama.** Aşağıdakiler senin anlatacağın şeyin parçaları; kendi
cümlelerinle, kendi sıranla yaz. Kısa olsun — 5-8 cümle yeter.

**Neden yaptın (asıl kanca — buradan başla):**
- Parfüm yazısı ya pazarlama dili ya da "notaların listesi". İkisi de kokunun
  nasıl bir şey olduğunu anlatmıyor.
- Sen bunu görselleştirmek istedin: koku bir *zaman* olayı (açılıp değişip
  sönüyor) ve bir *akrabalık* olayı (bir koku başka bir kokuya benziyor).
- Bu iki şeyin ikisi de çizilebilir. Fotoğraf gerekmiyor.

**Ne yaptın:**
- 52 parfüm, 136 nota. Her nota iki sayı (tepe dakikası, yarı ömür) ve dört
  karakter ekseni taşıyor.
- Konum = üç kanalın (aile, karakter, paylaşılan nota) kosinüs uzaklığı,
  klasik MDS ile iki boyuta indirilmiş.
- Evrim eğrisi = yükseliş × sönüm; parfümün imzası notalarının toplamı.
- Sitede tek bir fotoğraf yok, grafik kütüphanesi de yok.

**Teknik, HN'in gerçekten ilgisini çekecek kısım:**
- Hesap sunucuda: benzerlik matrisi tarayıcıya hiç inmiyor.
- 394 sayfa statik üretiliyor.
- Elle ayarlanmış her sayı bir sınamayla tutuluyor (yörünge geometrisi,
  tram eşikleri, etiket yerleşimi) — tarayıcıda ayarlandılar, kayarsa
  sınama kırılıyor.

**Dürüstlük payı (mutlaka söyle, ilk yorumda):**
- Veri elle yazıldı, öznel. Fragrantica kazınmadı.
- Eğri bir model, ölçüm değil.
- 52 az; seçki büyüyor.

**Kapanış:** ne tür geri bildirim istediğini söyle — örneğin "harita
akrabalıkları doğru buluyor mu, sizin burnunuz ne diyor". Somut soru, "ne
düşünüyorsunuz"dan çok daha fazla yorum getirir.

## Gelecek sorular ve hazır cevaplar

| Soru | Cevap |
|---|---|
| "Veri nereden?" | Elle yazıldı; nota listeleri markaların yayınladığı piramitlerden, değerler ve cümleler benim. Öznel, saklamıyorum. |
| "MDS neden, UMAP/t-SNE değil?" | Klasik MDS global uzaklıkları koruyor; burada asıl mesele iki noktanın *arasındaki* mesafenin anlamlı olması. UMAP yerel kümeleri güzel ayırır ama uzaklıklar yorumlanamaz hâle gelir. |
| "Eğri gerçek mi?" | Model. Sitede de yazıyor; gerçek gelişim sıcaklığa, tene ve konsantrasyona göre kayıyor. |
| "Açık kaynak mı?" | Depo herkese açık ve okunabilir, lisans "tüm hakları saklı" — seçki ve tarifler özgün iş. |
| "Neden fotoğraf yok?" | Şişe fotoğrafı kokuyu anlatmıyor, markayı anlatıyor. Bir de: telif. |
| "Mobil?" | Çalışıyor — iki parmakla yakınlaştırma dahil (o kısım gerçek cihazda ayarlandı). |
| "Neden bu 52?" | Küratör seçkisi; katalog değil. Çoğu niche, birkaçı referans noktası. |

⚠️ Cevapları da **kendi cümlelerinle** yaz — bunlar not, replik değil.
