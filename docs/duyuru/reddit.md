# Reddit

Kural metinleri **sahip tarafından getirildi** (2026-08-11) — Reddit benim
araçlarıma kapalı (`reddit.com` ve `old.reddit.com` ikisi de). Aşağıdakiler
o metinlerden okundu, tahmin değil.

---

## ⛔ r/fragrance — GÖNDERME. Kural açıkça yasaklıyor.

Alt forumun kendi kuralı, kelimesi kelimesine:

> **No Sales, Marketing, or Promotion** — *"No ads, marketing,
> self-promotion, sales, swaps, or giveaways are permitted. Don't recruit
> subscribers or followers to other subreddits or **personal websites**.
> Users must not have to click a link to see content, so post the entire
> text of any essay. (…) Do not post affiliate links."*

Bu "modlara sor, belki izin verirler" değil; **düz yasak.** Üstelik üç
ayrı yerden birden çarpıyoruz:

1. Kendi sitesini paylaşmak = self-promotion → yasak.
2. Kişisel siteye yönlendirme adıyla anılmış → yasak.
3. "Kullanıcı içeriği görmek için bağlantıya tıklamak zorunda kalmamalı" —
   OSMOS'un bütün olayı tıklanabilir, etkileşimli bir harita. Metne
   çevrilemez.

Ayrıca künyedeki satıcı satırı yüzünden **affiliate bağlantı yasağı** da
devrede: sitenin bir sayfasında komisyonlu bağlantı var ve bunu bulan biri
gönderiyi haklı olarak affiliate tanıtımı sayar.

**Önceki plandaki "önce modmail at" tavsiyesi geçersiz** — kural metnini
okumadan yazılmıştı. Kuralların bıraktığı tek kapı şu:

> *"If you wish to propose an AMA, message the mods."*

Yani teorik olarak modlara AMA önerebilirsin ("52 parfümü elle haritaladım,
sorun"). Ama gerçekçi ol: yeni bir hesabın kendi sitesi için AMA önerisi
neredeyse kesin reddedilir. **Tavsiyem: r/fragrance'ı listeden çıkar.**
Trafik kaynağı olarak değeri, ban riskine ve harcanacak zamana değmiyor.

⚠️ Bu kural yalnızca **gönderi** için. O toplulukta normal bir üye olarak
gerçek yorumlar yazman serbest ve zamanla değerli — ama linkini
serpiştirmek için değil.

---

## ✅ r/dataisbeautiful — birincil hedef, kurallara tam uyuyor

İlgili kurallar ve durumumuz:

| Kural | Durum |
|---|---|
| Gönderi nitelikli bir veri görselleştirmesi olmalı | ✅ MDS izdüşümü + eğri modeli |
| Görselleştirmenin **kaynak sayfasına doğrudan bağlantı** (görsele değil, tam sayfaya) | ✅ Sitenin kendisi kaynak sayfa |
| Kendi yaptıysan **`[OC]`** etiketi | ✅ Başlığa girecek |
| `[OC]` gönderisinde **veri kaynağı ve araçlar, ilk üst düzey yorumda** | ⚠️ Zorunlu — aşağıdaki malzeme tam bunun için |
| Diyagramda en az bir bilgisayar üretimi öge | ✅ Tamamı |
| Başlık **veriyi sade anlatmalı**, sansasyonel olmayacak (clickbait silinir) | ⚠️ Başlık seçimini bu belirledi |
| 1 ay içinde tekrar gönderim yok | Not al: bu kanal **tek atış** |
| Kişisel veri gönderileri yalnız pazartesi, ABD siyaseti yalnız perşembe | İkisi de bizi ilgilendirmiyor |

### ✍️ Başlık

Kural "veriyi sade anlat" dediği için şiirsel olanlar elendi
("A map of scent" gibi). Kalanlar:

1. `[OC] 52 perfumes mapped by note similarity — cosine distance over shared notes, scent family and character, reduced to 2D with classical MDS`
2. `[OC] 52 perfumes placed by how much their notes overlap (136 notes, MDS projection)`

**Öneri: 2.** Birincisi daha eksiksiz ama uzun; ikincisi hem sade hem
yöntemi söylüyor. İkisi de sansasyonel değil, sayı taşıyor, veriyi anlatıyor.

### 📋 Zorunlu ilk yorum — malzeme

Bu yorum **kural gereği**; yazmazsan gönderi silinir. Kendi cümlelerinle,
şu üç başlığı mutlaka geçir:

**Veri kaynağı:**
- Elle yazıldı, kazınmadı. Nota listeleri markaların kendi yayınladığı
  piramitlerden.
- Her notanın uçuculuk değerleri (tepe dakikası, yarı ömür), dört karakter
  ekseni ve koku ailesi ağırlıkları **benim tarafımdan** girildi — öznel.
- 52 parfüm, 136 nota, 44 marka, 1994–2025.

**Araçlar:**
- TypeScript; çizim canvas ve SVG ile elle yazıldı — **grafik kütüphanesi
  yok**. Next.js ile statik üretiliyor.
- Benzerlik ve MDS de elle yazılmış (hazır kütüphane değil).

**Yöntem:**
- Üç kanal — koku ailesi ağırlıkları, dört karakter ekseni, paylaşılan
  notalar → birleşik vektör → kosinüs uzaklığı → **klasik MDS** ile iki
  boyut. Nokta boyutu üçüncü bileşen.
- Evrim eğrisi: `yükseliş × sönüm`, notanın tepe dakikası ve yarı ömründen.
- **Sınır:** eğri bir model, ölçüm değil. Bunu kendin söyle.

### Bağlantı biçimi kararı

İki yol var, ikisi de kurala uygun:

- **Bağlantı gönderisi** (siteye doğrudan): "kaynak sayfaya doğrudan
  bağlantı" kuralına en temiz uyan yol. Etkileşimli olduğu için burada
  mantıklı.
- **Video/GIF gönderisi + ilk yorumda bağlantı:** Reddit'te görsel gönderiler
  bağlantı gönderilerinden çok daha fazla etkileşim alıyor.

⚠️ **Göndermeden önce alt forumun son gönderilerine bak:** etkileşimli
siteler bağlantı olarak mı yoksa video olarak mı geçmiş? Hangisi geçiyorsa
onu yap. Bu kanal tek atış (1 ay kuralı), yanlış biçim yüzünden silinmesi
pahalıya gelir.

---

## ⚠️ r/InternetIsBeautiful — iki gerçek engel var, karar sahibin

Kural metni sahip tarafından getirildi (2026-08-11). Çoğu madde bizim
lehimize, ama ikisi düşünmeden geçilecek gibi değil.

**Rahat geçtiklerimiz:**

| Kural | Durum |
|---|---|
| Kişisel bilgi isteyen site yasak (e-posta, hesap, bekleme listesi) | ✅ **Tam bizim tarifimiz** — kayıt yok, e-posta yok |
| Mağaza / ücretli / freemium yasak | ✅ Her şey bedava, kilitli özellik yok |
| Makale, video, görsel, galeri yasak | ✅ Etkileşimli site |
| Eklenti / indirme yasak | ✅ |
| Web oyunu, quiz yasak | ✅ |
| Benzersiz olmalı | ✅ Bunun benzeri yok |
| İş araçları (SEO, iş ilanı vb.) yasak | ✅ |

**① AI-Generated Content — asıl mesele bu:**

> *"submissions are not allowed if their primary content is produced by AI,
> or if AI is used to drive functionality"*

İki yarısı iki ayrı cevap veriyor ve dürüst olmak gerek:

- *"AI ile çalışan işlevsellik"* → **temiz, kesin hayır.** Sitede çalışma
  anında hiçbir yapay zekâ yok; hesap klasik MDS ve kapalı formüller,
  dışarıya istek bile atmıyor. Bu iddia savunulabilir ve kanıtlanabilir.
- *"birincil içerik yapay zekâ üretimi mi"* → **burada net değiliz.** Kod
  bir yapay zekâ asistanıyla yazıldı; nota tarifleri ve küratör cümleleri
  de bu oturumlarda birlikte üretildi. Seçki, ölçüler, bütün tasarım
  kararları ve reddedilenler sahibin — ama "hiç yapay zekâ değmedi"
  denemez.

⚠️ **Bu yüzden kural, "yorumlarsak geçeriz" diye geçilecek bir şey değil.**
Modun sorması hâlinde verilecek dürüst cevap şu: *"Sitede yapay zekâ
çalışmıyor; kodu bir asistanla yazdım, seçki ve tasarım kararları benim."*
Sahip bu cümleyi kamuya söylemekten rahatsızsa **oraya gönderilmemeli** —
sonradan ortaya çıkması, hiç göndermemekten çok daha pahalı.

**② 90/10 kuralı — bugün için pratik engel:**

> *"90% of your recent participation on Reddit should have nothing to do
> with a site you own or operate."*

Reddit hesabının geçmişi yoksa ya da yalnızca bu proje için açıldıysa
gönderi **kural gereği** kabul edilmiyor. Bu, beklemekle çözülen bir şey:
birkaç hafta gerçek katılım, sonra gönderi.

**Sonuç:** r/InternetIsBeautiful hemen bugünün kanalı değil. Sıraya
alınabilir, ama ① sorusuna sahibin vereceği cevap belirleyici.

### Öbür alternatifler (kuralları okunmadı)

- **r/SideProject** — yapan-kitle; kendi projeni paylaşmak burada beklenen
  davranış. Yapay zekâ yardımıyla yazılmış proje orada olağan.
- Teknik taraf: r/nextjs, r/webdev, r/creativecoding (canvas açısı).

Gitmeye karar verirsen kural metnini yapıştır, buraya işlerim.

---

## Ortak notlar

- Gönderileri **aynı gün atma**; arada 2-3 gün olsun (çapraz-spam sayılıyor).
- İlk saatlerde yorumlara cevap ver.
- Hesabın yeniyse önce birkaç gün gerçek yorum yaz; sıfır karmalı hesabın
  ilk gönderisi link olursa spam filtresine takılıyor.
- ⚠️ Hiçbir gönderide **künyedeki satıcı bağlantısından bahsetme.**
  Sorulursa dürüstçe söyle.
