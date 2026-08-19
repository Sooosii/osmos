# Istanbul ölçümü — yüz yüze kanal açılsın mı

**Tarih:** 2026-08-20 · **Sonuç: KANAL AÇILIYOR** (eşik 3, bulunan 3)

**Ilgili:** `gonderim-akisi.md` (Türkiye neden sıraya girmemişti) · `teklif.md`
(nota şartı) · `kapanis.md` (cevaptan sonrası)

---

## Neden ölçüldü

Sahibin açabildiği tek yüksek dönüşümlü kanal yüz yüze, ve o yalnız Istanbul'da
mümkün (Almanca konuşma yok, telefon yalnız Türkçe). Ama depo Türkiye'yi bir kez
ölçüp elemişti: *"68 Türk hedefinin katalog örtüşmesi sıfır, yalnız 6'sı
Shopify."*

⚠️ **O eleme kararı KIRIK bir ölçümle verilmişti.** Örtüşmeyi hesaplayan kod
dükkânın `products.json`unu tek sayfa (250 ürün) okuyordu; gerisi hiç
görülmüyordu. Sayfalama düzeltildiğinde havuzun tamamında örtüşme ikiye
katlandı (≥10 örtüşen dükkân 6'dan 63'e). Yani Türkiye'yi eleyen sayı da
şüpheliydi ve yeniden bakmak gerekiyordu.

---

## Ölçüt (önceden yazılmıştı, sonuca göre değiştirilmedi)

Bir dükkân şu üçünü birden karşılıyorsa sayılıyor:

1. **Istanbul'da fiziksel mağaza** — kapısından girilebilmeli, yüz yüze kanalın
   tamamı buna dayanıyor.
2. **Online katalog** — ürünlerin adresi olmalı; harita her yolu müşterinin
   kendi ürün sayfasında bitiriyor.
3. **Yayınlanmış nota piramidi** — ⚠️ pazarlık dışı: notası olmayan parfüm
   haritada **var olamıyor**, konum notalardan hesaplanıyor (`teklif.md`).

**Karar kuralı:** ≥3 uygun dükkân → kanal açılır · <3 → kanal kapanır, bir daha
açılmaz.

---

## Sonuç

| dükkân | fiziksel mağaza | katalog | nota piramidi | sonuç |
|---|---|---|---|---|
| **NOIR Parfüm** | Rumeli Cad. 42/C, Nişantaşı | Shopify · 250 kayıt (220 parfüm) | ✅ **190 üründe**, yapılandırılmış | **UYGUN** |
| **Parfumane** | Nişantaşı · Kapalıçarşı · Galata | WooCommerce · 94+ ürün | ✅ Üst/Orta/Alt Nota | **UYGUN** |
| **Home of Scents** | Mall of Istanbul (2. kat) · Akasya Acıbadem | Ideasoft | ✅ Koku Piramidi + koku ailesi | **UYGUN** |
| Niche House (`nisparfum.com`) | adres yok, yalnız WhatsApp | Wix · dekant | ❌ düz anlatım, piramit yok | elendi |
| La Déesse | ❌ kapandı (2022'de NeoBloom'a döndü, çevrimiçi) | — | — | elendi |
| Parfüm Tasarım Atölyesi / NeoBloom | ofis, mağaza değil | Beymen üzerinden | ❌ | elendi (dükkân değil) |
| Dadya Parfüm | mağazası var | Ticimax | ⚠️ ölçülemedi | belirsiz |

### Örnekler (ölçülen, alıntılanan)

**NOIR** her parfümde ayrı başlıklarla veriyor — çoğu dükkândan **zengin**:
> KOKU HANGİ NOTALARLA BAŞLAR? Mandarin Orange, Bergamot, Grapefruit
> KOKU HANGİ NOTALARLA GELİŞİR? Orange Blossom, Raspberry, Black Currant
> KOKU HANGİ NOTALARLA KAPANIR? Marshmallow, Whipped Cream, Musk

Üstüne kalıcılık, yayılım, mevsim ve günün vakti alanları da var.

**Parfumane:**
> Üst Nota: Bergamot, Gül · Orta Nota: İris, Sedir, Yasemin · Alt Nota: Misk

**Home of Scents:**
> Koku Ailesi: Meyveli, Tatlı · Koku Piramidi — Üst/Orta/Alt Notalar

---

## ⚠️ Ölçüm sırasında yapılan hata — yazılı kalsın

Home of Scents önce **elendi**: ana sayfası okundu, nota görülmedi, "yok"
denildi. Yanlıştı — nota **ürün sayfasında** duruyor, listeleme sayfasında
değil. Ürün sayfası açılınca tam piramit çıktı.

Ders: bir dükkân "notası yok" diye elenmeden önce **ürün sayfası** açılacak.
Ana sayfa listelemesi bu soruya cevap vermiyor ve tek başına bir hedefi
kaybettiriyordu.

---

## Hangi dükkâna önce gidilecek

**1. Home of Scents** — çünkü tek uygun aday **çok markalı** ve rafındaki
markalardan **7 parfüm zaten bizim kataloğumuzda**:

> Nishane EGE ΑΙΓΑΙΟ · Nishane Nanshe · Xerjoff Mamluk · Goldfield & Banks
> Bohemian Lime · Goldfield & Banks Ingenious Ginger · Van Cleef & Arpels
> Moonlight Patchouli · Jimmy Choo MAN ICE

Yani demo için veri girişi en az onda başlıyor. ⚠️ Bu **marka** örtüşmesi;
o parfümlerin gerçekten rafta olduğu ürün sayfasından doğrulanmalı (marka
örtüşmesi ürün örtüşmesi değil — 20 dükkânda ölçüldü, ortalama fark büyük).

**2. NOIR Parfüm** — kendi markası, yani **kendi verisinin sahibi**. Depo
kuralı: *"kendi evi olan marka, çok markalı dükkândan daha ucuz müşteri."*
Notaları zaten yayınlıyor, üstelik en yapılandırılmış biçimde. Örtüşme sıfır
(kendi kokuları), yani 20 parfümün 20'si girilecek — ama araştırma yok, veri
hazır.

**3. Parfumane** — üç ayrı mağaza, kendi koleksiyonu, notalar yayınlı.

---

## Açık kalan karar: fiyat

⚠️ **Bu ölçüm fiyat sorusunu yeniden açıyor ve kararı sahip verecek.**
€490 + €290/yıl bir Türk butiği için ağır; sahibin duran kararı ise
*"fiyat sabit, taviz yok"* (2026-08-19).

Iki şey aynı anda doğru:
- Fiyatı düşürmek, Avrupa/Körfez'de savunulan fiyatı zayıflatır.
- Yüz yüze kanalın tamamı fiyat yüzünden hiç açılmayabilir.

Plan bunu varsaymıyor; kanal açıldı, karar sorulacak.

---

## Kaynaklar

Ölçüm 2026-08-20'de yapıldı; adresler ve katalog sayıları o gün okundu.
Stok, mağaza ve katalog değişir — teklif öncesi tekrar bakılacak.
