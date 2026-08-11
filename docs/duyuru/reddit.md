# Reddit

⚠️ **Kural metinlerini doğrulayamadım** — Reddit benim araçlarıma kapalı
(2026-08-11, hem `reddit.com` hem `old.reddit.com`). Aşağıdaki kural notları
genel bilgi ve arama sonuçlarından; **göndermeden önce alt forumun kendi
kurallar sayfasını sen aç ve oku.** Yanlış bilgiyle gönderirsen ceza
gönderinin silinmesi değil, hesabın banlanması olabiliyor.

---

## ① r/dataisbeautiful — birincil hedef

**Neden buraya uygun:** görselleştirme + yöntem şeffaflığı isteyen bir
topluluk; OSMOS tam olarak bu.

**Kurallar (doğrula):**
- Başlıkta **`[OC]`** etiketi zorunlu (Original Content).
- `[OC]` gönderisinde **veri kaynağı ve kullanılan araç** belirtilmek
  zorunda — genelde ilk yorumda.
- Kendi yapmadığın görselleştirmeye `[OC]` denmez. ✅ Senin.

### ✍️ Başlık adayları

1. `[OC] 52 perfumes placed by what their notes share`
2. `[OC] I mapped 52 perfumes by note similarity — position is cosine distance, reduced with classical MDS`
3. `[OC] A map of scent: 52 perfumes, 136 notes, no photographs`

**Öneri: 2.** Bu toplulukta yöntemi başlığa koymak işe yarıyor; "MDS"
görünce durup bakan bir kitle var.

### 📋 Zorunlu ilk yorum için malzeme

Bu alt forumda ilk yorum **kural gereği** — kaynak ve araç yazılmak zorunda.
Kendi cümlelerinle şunları geçir:

- **Veri:** elle yazıldı. Nota listeleri markaların yayınladığı piramitlerden;
  uçuculuk değerleri (tepe dakikası, yarı ömür), dört karakter ekseni ve
  seçkinin kendisi bana ait. 52 parfüm, 136 nota.
- **Araç:** TypeScript, canvas ve SVG ile elle çizildi — grafik kütüphanesi
  yok. Next.js ile statik üretiliyor.
- **Yöntem:** üç kanal (aile ağırlıkları, karakter, paylaşılan notalar) →
  kosinüs uzaklığı → klasik MDS ile iki boyut. Nokta boyutu üçüncü bileşen.
- **Sınır:** eğri bir model, ölçüm değil. Değerler öznel.

⚠️ Bu topluluk yöntem sorularını sever ve zayıf noktayı bulur. Öznelliği
**kendin** söyle.

---

## ② r/fragrance — ikincil, ÖNCE MODLARA SOR

⚠️ **En riskli kanal.** Parfüm toplulukları kendi sitesini tanıtan yeni
hesaplara karşı çok sert; çoğu alt forumda kendi projesini paylaşmak
**mod onayına bağlı** ya da tamamen yasak.

**Yapılacak sıra:**
1. Kurallar sayfasını oku (self-promotion maddesi).
2. Yasaksa ya da belirsizse **modmail at** — "böyle bir şey yaptım,
   paylaşabilir miyim?" diye sor. Onay gelirse gönderiye "mod onayıyla"
   diye yaz.
3. Haftalık serbest paylaşım günü varsa (çoğunda var) oraya bırak.
4. Hesabın yeniyse önce birkaç gün gerçek yorum yaz. Sıfır karmalı bir
   hesabın ilk gönderisi link olursa spam sayılıyor.

**Ton:** burada teknikten çok **koku** konuş. Bu topluluk MDS'yi
umursamıyor; "Baraonda neye benziyor" umursuyor.

### 📋 Malzeme

- Parfüm yazısı ya pazarlama ya nota listesi; ikisi de kokunun nasıl bir şey
  olduğunu anlatmıyor — sen bunu çizmeyi denedin.
- 52 parfüm bir haritada, konumları paylaştıkları notalardan.
- Her parfümün açılıştan dibe kendi kendine dönen bir imzası var.
- Fotoğraf yok, satın alma baskısı yok, kayıt yok.
- **Soruyla bitir:** "haritanın komşulukları sizin burnunuza doğru geliyor
  mu, nerede yanılmış?" — bu topluluk fikrini söylemeyi sever ve bu soru
  gönderiyi tanıtımdan sohbete çevirir.

⚠️ Künyedeki satıcı bağlantısını **hiç anma**. Sorulursa dürüstçe söyle,
ama duyuruda geçerse gönderi anında "reklam" damgası yer.

---

## Ortak notlar

- İki gönderiyi **aynı gün atma** (çapraz-spam sayılır); arada 2-3 gün olsun.
- Yorumlara ilk saatlerde cevap ver.
- Türkçe alt forumlar (r/Turkey vb.) sonraya: önce İngilizce kanallar
  otursun.
