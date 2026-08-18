# Gönderim akışı — günlük çalışma sayfası

> 🔓 **AÇILDI — 2026-08-18.** Şirket kararları verildi, evrak sahip tarafından
> halledildi, ilk mesaj (Nischengold) gitti.
>
> ⚠️ **Ama 15/gün ile BAŞLAMIYOR.** Ilk parti **10 mesaj**; sonra durup okunuyor.
> Gerekçe: mesajın işe yaradığına dair kanıt yok ve yanlış bir metin 233 dükkânı
> geri dönülmez biçimde yakar. Karar kuralı önceden yazıldı:
>
> | 10 mesajdan gelen cevap | ne yapılır |
> |---|---|
> | **≥2** (red bile olsa) | metin çalışıyor → 15/gün |
> | **1** | tek değişken değiştirilip 10 daha |
> | **0** | aynı metinle devam **edilmez** — önce gönderen hesap ve kanal gözden geçirilir |
>
> ✅ **Teslim engeli kalktı (2026-08-19):** kiracının `locales` dizisinde ilk
> yazılan dil artık öneksiz olan dil. Ölçüldü — `['tr','en']` kiracısında `/`
> Türkçe açılıyor, `/en/...` önekli, `/tr/...` kanoniğe 307. Bir Türk
> dükkânının sitesi artık kendi dilinde açılabiliyor.
>
> ⚠️⚠️ **Ama Türkiye SIRAYA GIRMEDI, ve sebebi ölçüldü.** Listede 68 Türkçe DM
> hedefi var; ölçülebilen 4'ünde **örtüşme sıfır** ve 68'in yalnız **6'sı
> Shopify** (boru hattı yalnız Shopify ölçebiliyor — WooCommerce'te marka alanı
> standart değil). Türkiye + Shopify kesişiminde duran iki dükkân
> `loccitane.com.tr` ve `eveshop.com.tr`: biri marka mağazası, öteki toplu
> perakende, ikisi de örtüşmesiz.
>
> **Okunuşu:** katalogumuz niş ve küratörlü; listedeki Türk dükkânları kitlesel.
> Engel teslim tarafındaydı ve kalktı, ama **talep tarafı hâlâ uluslararası niş
> ve dekant dükkânlarını gösteriyor.** Türkiye için önce ÖLÇÜLEBILIR hedef
> lazım (WooCommerce ölçümü ya da elle bakılmış bir liste).

**Kanal sırası:** Instagram DM → mail → telefon.
DM ilk sırada çünkü Almanya (en büyük bilinen hedef grubu, 57 dükkân) izinsiz
ticari e-postayı B2B'de bile yasaklıyor; DM o kuralın kapsamında değil.

---

## Parti nasıl kurulur — ölçümle, puanla değil

```bash
cd leadgen
node src/cli.ts demo-adaylari --sinir 150   # katalogları ölç (ücretsiz, dakikalar)
node src/cli.ts export                      # taslakları tazele
node scripts/parti-kur.mjs                  # data/ilk-parti.md
```

⚠️ **Sıra PUANA göre değil ÖRTÜŞMEYE göre.** Puan "iyi hedef mi" der; örtüşme
"evet derse kaç saatimi yer" der. Ölçüldü (2026-08-18): puan 188 dükkânda
birden 55, yani sıralama fiilen alfabetik. Nischengold da zaten puanla
bulunmadı — 20 dükkânın katalogu ölçülüp en iyisi seçildi.

⚠️⚠️ **Marka örtüşmesi TAM 1 olan dükkân değil PARFÜM EVİDİR** — örtüşen tek
marka kendisi. Segment sınıflandırıcısı bunları `butik-eticaret` diye
işaretliyor ve ayıramıyor. Ölçüldü: kuralın yakaladığı 13 kaydın 12'si
gerçekten ev (BDK Parfums, Nasomatto, Orto Parisi, Zoologist, Atelier Des Ors,
Marc Antoine Barrois, Carner Barcelona…). Bir eve "kataloğunuzun haritası"
satmak bambaşka bir konuşma: onda 15 parfüm var, seçki değil.

⚠️ **Marka örtüşmesi SIFIR ayrı bir durum, elenmiyor.** Dekantçıda Shopify'ın
`vendor` alanı parfüm evini değil dükkânın kendi adını taşıyor; ürün eşleşmesi
başlıktan geldiği için doğru. Bugünkü ilk onun dördü dekantçı.

---

## Elindeki liste

| Dosya | Ne var |
|---|---|
| `leadgen/data/dm-listesi.md` | **233 hesap**, güne bölünmüş (günde 15, ~16 gün). Her mesajın altında kanıt adresi ve hazır taslak. **45'i Türkçe** — dükkânın sayfası Türkçeyse mesaj da Türkçe |
| `leadgen/data/outreach.csv` | 486 satır — DM ve mail, `kanal` sütunuyla ayrılmış |
| `leadgen/data/demo-adaylari.md` | **7 hedef**: raflarında bizde de olan parfüm var |
| `docs/b2b/nischengold-mesaj.md` | **Nischengold ayrı ele alınıyor**: demosu zaten canlı, mesajı Almanca ve DM ile gidiyor |
| `leadgen/data/leads_ranked.csv` | 735 aday, tam liste |

---


⚠️ **Listede parfüm satmayan 14 işletme var** — parfüm ŞİŞESİ toptancıları
(`erbaturglass.com`, `kozmedambalaj.com`, `hammaddeler.com`…). Elenmediler,
"kimse elenmiyor" kuralı duruyor; ama mesajları artık **sayı iddiası
taşımıyor**, nötr "dükkânınızı gezdim" cümlesiyle gidiyorlar. Yine de
göndermeden önce bakmaya değer: onlara satılacak bir şey olmayabilir.

⚠️ Beş mecra listeden **çıkarıldı** (apkpure.net, threads.com, snapchat.com,
gmail.com, faire.com) — hiçbiri parfüm işletmesi değildi.

## Günün akışı (15 mesaj, ~40 dakika)

**1. Listeyi aç.** `dm-listesi.md` içinde o günün başlığı.

**2. Her mesajdan önce KANIT ADRESİNİ AÇ.**
⚠️ Bu adım atlanamaz. Taslaktaki cümle *"kataloğunuzdaki 235 parfümü saydım"*
diyorsa, o sayı sayfada gerçekten olmalı. Katalog değişmiş olabilir — liste
16 Ağustos'ta ölçüldü. **Sayı tutmuyorsa mesajı gönderme, atla.** İlk cevapta
yakalanan bir yanlış, o dükkânı temelli kapatır.

**3. Taslağı yapıştır, hitabı gözden geçir.** Ad tuhaf duruyorsa hitabı tamamen
düş — adsız "Hi," robot gibi bir addan iyi. (Bu kural koda da girdi: `temizAd`.)

**4. Attıktan sonra deftere yaz:**

```
cd leadgen
node src/cli.ts temas <domain> gonderildi
```

Cevap gelince aynı komut: `cevap` · `ilgilendi` · `red`.
⚠️ Bunun tek amacı **tekrarı önlemek**. Aynı kişiye ikinci kez aynı mesajı
atmak, hiç atmamaktan kötü.

**5. Günde 15'i geçme.** Botla atma. Instagram soğuk DM için API vermiyor;
otomatik gönderim hesabı kapattırır.

---

## "Evet, gönder" cevabı geldiğinde

Taslaktaki soru şu: *"ücretsiz bir örnek hazırlayıp linki göndereyim mi?"*
Yani demo **cevaptan sonra** kuruluyor. Sırası:

1. **Kataloğunu ölç.** Kaç parfümü bizim kayıtlarımızla örtüşüyor?
   `leadgen/data/demo-adaylari.md` yedi hedef için bunu zaten yapmış.
   ⚠️ Ölçüldü: yirmi dükkânda ortalama **3 parfüm**. "Demo bedava kurulur"
   varsayımı yanlış.
2. **Eksik parfümleri gir.** Ölçülen hız: **15-25 dakika/parfüm** (kaynak arama,
   158'lik nota dağarcığına eşleme, ağırlık yargısı, küratör cümlesi).
   ⚠️ Girişler `OSMOS_TENANT_ONLY`ye — `OSMOS_EXPANSION`a **değil.** Ana
   kataloğa girerse osmos.me'nin uzay renkleri kayıyor (bir kez oldu).
3. **Ürün adreslerini ELLE doğrula.** Otomatik eşleştirici dükkânın `Extrait`
   sürümünü seçiyor, bizim kayıtlarımız temel sürüm. Beşte beş yanlış çıkmıştı.
4. **Kiracı kaydını yaz** (`src/data/tenants/registry.ts`): `indexable: false`,
   kendi dilleri, kendi adı.
5. **Yayına al**, linki gönder.

---

## Mesajda ne var, ne yok

**Var:** kataloğundan **sayılmış** bir rakam · osmos.me · ne yaptığımız tek
cümlede · tek soru · çıkış kapısı (opt-out).

**Yok — ve bunlar bilerek yok:**
- ⚠️ **Aile şirketi adı geçmiyor.** Şirket var ama bu işle bağı yok; adı
  anılınca "bunun parfümle ne işi var" sorusunu doğurup güveni zayıflatır.
  Şirket yalnız **fatura** aşamasında konuşulur.
- ⚠️ **Uydurulmuş isim ve uydurulmuş sayı yok.** Kanıt satırı olmayan bir iddia
  boru hattında zaten yazılmıyor.
- ⚠️ **Münhasırlık sözü yok.** Aynı ürün ikinci müşteriye de satılır. Tek
  gönüllü kural: **aynı anda iki rakiple pazarlık yürütülmez.**

---

## Satarken söylenecekler

> 📄 **Gönderilecek hâli:** `docs/b2b/teklif.md` — aynı kararlar, müşteriye
> yollanabilir tek metin hâlinde (Ingilizce). Bu bölüm gerekçeleri tutuyor,
> o dosya metni.

**Ne satıyoruz:** siteyi değiştirmiyoruz, **kapı ekliyoruz.** Kiracı sitesinde
sepet yok, hesap yok; her yol müşterinin kendi ürün sayfasında bitiyor.
⚠️ "Site değişimi" olarak sunulursa ilk cümlede reddedilir.

**Üç gerekçe:** ① "hangisi bana göre" sorusunu insan olmadan cevaplıyor
② 13 üründen 27 aranabilir sayfa + ziyaretçi için 158 notalık ansiklopedi
③ kimsede yok.

⚠️ **Dürüst karşı argüman da söylenecek: bu satmıyor, satan yere besliyor.**

⚠️ **Sayfa sayısını şişirme.** "395 sayfa" demek yanlıştı: nota ansiklopedisi
her kiracıda birebir aynı ve bu yüzden kiracıda **noindex.** Doğru cümle:
*"13 ürününüz 27 aranabilir sayfaya çıkıyor, üstüne ziyaretçileriniz için
158 notalık ansiklopedi."*

**Fiyat:** €490 kurulum (20 parfüme kadar) + €290/yıl. **Kurucu fiyatı** —
ilk üç müşteri için, karşılığında referans ve geri bildirim.
Tahsilat %50 başlarken, %50 teslimde.

**Pakete dahil:** katalog girişi (20'ye kadar) · kendi markası · her parfümden
kendi ürün sayfasına dönüşüm bağlantısı · kendi alt alan adına yayın · bir
düzeltme turu.
**Dahil değil:** 20 üstü parfüm, yeni dil, özel tasarım.

⚠️ **Notaları müşteri verecek** — şart koşuluyor, fiyat düşmüyor. Satılan şey
veri girişi değil, harita. İstemek satışı güçlendiriyor.
⚠️ **Notası olmayan parfüm haritada var olamıyor** (konum notalardan
hesaplanıyor). Bu yüzden **kendi evi olan marka, çok markalı dükkândan daha
ucuz müşteri.**

---

## Demo kuralları (pazarlık dışı)

- **noindex** — `Tenant.indexable: false`, `robots.ts` okuyor.
- Sayfada **"resmi olmayan çalışma"** şeridi, kapatma düğmesi yok.
- **Talep edilirse aynı gün kaldırılır.**
- Kim yaptığını `osmos.me` bağlantısı söylüyor.

---

## Faturaya gelince

`docs/b2b/sirket-ve-fatura.md`. Özet: e-Fatura, KDV %0, istisna kodu 302,
Alman müşteriye reverse charge satırı, **alıcının VAT ID'sini teklif aşamasında
iste.**
