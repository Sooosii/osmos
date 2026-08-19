# Gönderim akışı — günlük çalışma sayfası

> 🔓 **AÇILDI — 2026-08-18.** Şirket kararları verildi, evrak sahip tarafından
> halledildi, ilk mesaj (Nischengold) gitti.
>
> ⚠️ **Ama 15/gün ile BAŞLAMADI.** Ilk parti **10 mesaj**tı; sonra durulup
> okundu. Gerekçe: mesajın işe yaradığına dair kanıt yoktu ve yanlış bir metin
> 233 dükkânı geri dönülmez biçimde yakardı. Karar kuralı önceden yazılmıştı:
>
> | 10 mesajdan gelen cevap | ne yapılır |
> |---|---|
> | **≥2** (red bile olsa) | metin çalışıyor → 15/gün |
> | **1** | tek değişken değiştirilip 10 daha |
> | **0** | aynı metinle devam **edilmez** — önce gönderen hesap ve kanal gözden geçirilir |
>
> ✅ **KURAL KARŞILANDI (2026-08-19): iki dükkân cevap verdi**, yani metin
> çalışıyor ve parti boyu **15**. Cevaplar: `scentitude.com` WhatsApp numarası
> bıraktı · `nicheessence.com` kapı bekçisi yönetime iletti.
>
> ⚠️ **Bir üçüncü "cevap" SAYILMADI ve sebebi kuralın kendisini koruyor:**
> `perfume-parlour.pk` saniyeler içinde hazır bir karşılama mesajı döndü.
> Bot yanıtı, metnin işe yaradığına dair sıfır kanıt taşıyor; sayılsaydı
> "15/güne çık" kararı bir botun üstünde dururdu. Deftere `otomatik` diye
> yazılıyor ve sayaç yalnız `cevap|ilgilendi|red` sayıyor.
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
| `leadgen/data/ilk-parti.md` | **Günün partisi** — `parti-kur.mjs` üretiyor, defterden okuyup kendi başlığını yazıyor. Çalışılan dosya bu |
| `leadgen/data/gonderim-konsolu.html` | Aynı partinin tıklanabilir hâli — `parti-konsol` üretiyor |
| `leadgen/data/dm-listesi.md` | Tam DM listesi, güne bölünmüş. Temas edilenleri kendiliğinden atlıyor |
| `leadgen/data/outreach.csv` | 486 satır — DM ve mail, `kanal` sütunuyla ayrılmış |
| `leadgen/data/demo-adaylari.md` | Raflarında bizde de olan parfüm bulunan hedefler |
| `docs/b2b/nischengold-mesaj.md` | **Nischengold ayrı ele alınıyor**: demosu zaten canlı, mesajı Almanca ve DM ile gidiyor |
| `leadgen/data/leads_ranked.csv` | 735 aday, tam liste |

⚠️ **Mesaj dili artık üç: `tr` · `de` · `en`** (2026-08-19). Almanca ölçümle
eklendi: bilinen en büyük grup Almanya (39 DM hedefi) + Avusturya/Isviçre (8),
Türkçenin iki katından fazla. Ülke DE/AT/CH ise Almanca; ülke bilinmiyorsa
sayfa metnindeki Almanca sözcükler karar veriyor. Ölçüldü: **63 hedef**
Ingilizceden Almancaya geçti.

⚠️ **Parti havuzunun ölçütü değişti (2026-08-19).** Eskiden `urun_ortusmesi > 0`
şartı vardı ve havuzu 396 adaydan **42**'ye düşürüyordu. Şimdi şart
`product_count IS NOT NULL` — yani sayılmış, doğrulanabilir bir rakam
kurulabilen her dükkân listeye giriyor (**208**), örtüşme ise eleme değil
**sıralama** ölçütü. Gerekçe: mail eklemek boru hattına 34 yeni hedef
getiriyordu, bu satırı gevşetmek 166.

---


⚠️ **Listede parfüm satmayan 14 işletme var** — parfüm ŞİŞESİ toptancıları
(`erbaturglass.com`, `kozmedambalaj.com`, `hammaddeler.com`…). Elenmediler,
"kimse elenmiyor" kuralı duruyor; ama mesajları artık **sayı iddiası
taşımıyor**, nötr "dükkânınızı gezdim" cümlesiyle gidiyorlar. Yine de
göndermeden önce bakmaya değer: onlara satılacak bir şey olmayabilir.

⚠️ Beş mecra listeden **çıkarıldı** (apkpure.net, threads.com, snapchat.com,
gmail.com, faire.com) — hiçbiri parfüm işletmesi değildi.

## Günün akışı — beş komut

```bash
cd leadgen
node scripts/parti-kur.mjs 15     # partiyi kur (varsayılan 15)
node src/cli.ts parti-dogrula     # sayı iddialarını dükkânın kataloğuna karşı DENETLE
node src/cli.ts parti-konsol --sun # gönderim konsolunu aç → http://localhost:4500
node src/cli.ts takip             # 7+ gündür cevapsız kalanlar + tek cümlelik hatırlatma
```

**1. Partiyi kur.** Sıra örtüşmeye göre: örtüşmesi yüksek dükkân üstte, çünkü
"evet" derse teslim bir günde biter. Ölçülmemiş kayıtlar en sonda.

**2. `parti-dogrula` KOŞ — bu adım elle yapılmıyor artık.**
⚠️ Kural aynı: taslaktaki *"kataloğunuzdaki 235 parfümü saydım"* cümlesi
sayfada gerçekten olmalı. Değişen şey denetimin **araçla** yapılması: komut her
hedefin kataloğunu şimdi sayıp kayıttaki sayıyla karşılaştırıyor ve kayan
varsa **çıkış kodu 1** dönüyor.

⚠️ Bunun neden araca döndüğü ölçüldü: aynı denetim üç parti boyunca elde
tutulan geçici bir betikle yapıldı ve **her seferinde kayan sayı buldu**
(2. partide 1/10, 3. partide 3/10). Dördüncüde betik dört hedefte `NaN` bastı —
taslaklar Almanca çıkmıştı ve betiğin kalıbı yalnız Ingilizce biliyordu.
Araç bu yüzden metni ayrıştırmıyor, **kayıttaki sayıyı** gerçekle karşılaştırıyor;
o soru dilden bağımsız.

Kayan sayı çıkarsa: veritabanındaki `product_count` düzeltilir, sonra
`export` + `parti-kur` yeniden koşulur. Düzeltme dosyaya elle yazılmaz.

**3. Konsolu aç ve gönder.** Her kartta `Kanıtı aç` · `DM'i aç` ·
`Metni kopyala` · `gönderildi`.

⚠️ `DM'i aç` hesap arama adımını siliyor: `ig.me/m/<hesap>` doğrudan o kişinin
DM penceresini açıyor (ölçüldü: 302 ile `instagram.com/m/<hesap>`).

⚠️ Hitabı yine gözden geçir. Ad tuhaf duruyorsa hitabı tamamen düş — adsız
"Hi," robot gibi bir addan iyi. (Bu kural koda da girdi: `temizAd`.)

**4. Deftere yaz.** Konsolun altında işaretlediklerin için hazır komut duruyor;
kopyala, terminale yapıştır. Tek tek de yazılabilir:

```bash
node src/cli.ts temas <domain> gonderildi
```

Cevap gelince aynı komut: `cevap` · `ilgilendi` · `red` · `otomatik` · `elendi`.
⚠️ Bunun tek amacı **tekrarı önlemek**. Aynı kişiye ikinci kez aynı mesajı
atmak, hiç atmamaktan kötü.

⚠️ **`otomatik` ile `cevap` ayrı ve bu bilinçli.** Instagram karşılama mesajı
(perfume-parlour.pk'te oldu) yalnız "mesaj ulaştı, hesap canlı" diyor; metnin
işe yarayıp yaramadığına dair kanıt taşımıyor. `cevap` yazılsaydı karar
kuralının saydığı sayı bir botun üstünde dururdu.
⚠️ **`elendi`** hiç yazılmayacak dükkânı defterde tutuyor — gerekçesiyle, ve
o dükkân bir daha hiçbir partide çıkmıyor.

**5. Takip et — haftada bir.** `node src/cli.ts takip` yedi günü dolmuş ve
cevapsız kalan dükkanları, her birinin **kendi dilindeki** tek cümleyle basıyor.

⚠️ **Bu adım yeni ve bir boşluğu kapatıyor (2026-08-19).** Kural
`teklif.md`de yazılıydı ama otomasyonu yoktu ve sistem **tek atışlıktı**:
`temasKurulanlar()` tarihe hiç bakmıyor, yazılan dükkan bir daha hiçbir partide
çıkmıyordu. 36 dükkana yazıldı, hiçbiri bir daha hatırlanmadı — oysa
hatırlatma, cevap oranını yükselten en ucuz hamle.

⚠️ **Komut mesaj GÖNDERMIYOR** — yukarıdaki 5. maddenin kuralı burada da
geçerli. Listeyi ve metni basıyor, "Gönder"e insan basıyor, sonra deftere
yazılıyor. Deftere yazıldığı an dükkan listeden düşüyor: **iki hatırlatma yok**
kuralı böyle uygulanıyor, ayrı bir sütun tutulmadan.

⚠️ Konuşma başlamış dükkanlar listede **çıkmıyor** (`cevap`/`ilgilendi`/`red`/
`elendi`) — sıcak bir konuşmaya soğuk hatırlatma göndermek, hiç göndermemekten
kötü. `otomatik` ise hakkı yakmıyor: bot karşılamasını insan hiç görmedi.

**6. Günde 15'i geçme.** Botla atma. Instagram soğuk DM için API vermiyor;
otomatik gönderim hesabı kapattırır.

⚠️⚠️ **Gönderimi otomatikleştirme önerisi geldi ve REDDEDILDI (2026-08-19).**
Sahip "hesabımı sana vereyim, sen at" dedi. Parola alınmadı ve tarayıcı
oturumundan otomatik DM de atılmıyor. Gerekçe sayıyla: o hesap **396 hedefin
tek kapısı**; kapanırsa kaybedilen bir parti değil kanalın tamamı. Konsol
arama ve kopyalama adımlarını siliyor, **"Gönder"e insan basıyor** — sayfa da
bu yüzden hiçbir şeyi kendiliğinden açmıyor ve sıradakine geçmiyor.

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

⚠️ **Buradan sonrası `docs/b2b/kapanis.md`de:** teklif → VAT ID + notalar →
%50 → kurulum → teslim → %50 → yıllık rapor. O dosya "evet" anında doğaçlama
yapılmasın diye boşken yazıldı; ödeme talimatı bloğu ve ilk ödeme günü kontrol
listesi orada.

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
