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

## r/fragrance'ın yerine — alternatifler

Parfüm kitlesi kapandı, ama boşluğu dolduracak iki aday var. ⚠️ **İkisinin
de kurallarını okumadım** (Reddit kapalı) — gitmeye karar verirsen kural
metnini yapıştır, buraya işleyeyim.

- **r/InternetIsBeautiful** — "güzel/ilginç site" kitlesi; etkileşimli,
  ücretsiz, kayıtsız siteler tam oraya ait. r/fragrance'ın yerine en doğal
  aday, muhtemelen daha da çok trafik getirir.
- **r/SideProject** — yapan-kitle; kendi projeni paylaşmak burada beklenen
  davranış, yasak değil. HN'in yumuşak hâli.

Teknik taraf istersen ayrıca: r/nextjs, r/webdev (kendi tanıtım kuralları
var), r/creativecoding (canvas çizimi açısı).

---

## Ortak notlar

- Gönderileri **aynı gün atma**; arada 2-3 gün olsun (çapraz-spam sayılıyor).
- İlk saatlerde yorumlara cevap ver.
- Hesabın yeniyse önce birkaç gün gerçek yorum yaz; sıfır karmalı hesabın
  ilk gönderisi link olursa spam filtresine takılıyor.
- ⚠️ Hiçbir gönderide **künyedeki satıcı bağlantısından bahsetme.**
  Sorulursa dürüstçe söyle.
