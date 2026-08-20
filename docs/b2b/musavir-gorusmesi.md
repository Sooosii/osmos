# Müşavir görüşmesi — yanına al

> Bu sayfa **müşavire okunmak** için yazıldı. Karar sorulmuyor; verilmiş
> kararlar doğrulatılıyor. Cevabı farklı çıkarsa karar değişir.

---

## 60 saniyede iş — müşavire önce bunu anlat

- Yurt dışındaki **parfüm dükkânlarına**, kendi ürün katalogları üzerinde
  çalışan bir **web uygulaması** kuruyorum (koku haritası + kendi alt alan
  adlarında yayın + yıllık barındırma).
- **Müşteri yurt dışında.** Ilk aday **Almanya** (Konstanz'da bir dükkân);
  sonraki hedefler Ingiltere, Kanada, BAE.
- **Fiyat:** €490 kurulum + €290/yıl. **Tahsilat: %50 peşin, %50 teslimde.**
- **Fatura babamın şirketinden** kesilecek. Kendi şahıs şirketimi açmıyorum.
- **Para** babamın şirketinin **EUR hesabına SWIFT** ile gelecek. ✅ Hesap hazır.
- Ben 29 yaşın altındayım (genç girişimci istisnası konusu, ama kendi şirketim
  olmadığı için şimdilik gündemde değil).

---

## A. Yaptırılacak iki işlem

### A1 — NACE **62.01** (bilgisayar programlama) faaliyet kodu eklensin

Neden: 2026'da e-faturadaki oran/istisna, mükellefin faaliyet koduyla uyumlu
olmak zorunda. Kod yoksa fatura reddedilebilir ya da istisna kabul görmez.

Sor: *Ne kadar sürer? Ana kod mu yan kod mu olmalı? Şirketin mevcut
faaliyetleriyle çakışır mı?*

### A2 — e-Fatura tarafı **gerçek müşteri gelmeden** bir kez denensin

EUR cinsinden, **KDV %0**, **istisna kodu 302 (hizmet ihracatı)** ile bir taslak
fatura oluşturulup kaydedilsin.

Neden: ilk gerçek faturayı müşteri beklerken öğrenmek istemiyorum.

Sor: *Şirket zaten e-Fatura mükellefi mi? Hangi portal/entegratör kullanılıyor,
302 istisnası orada seçilebiliyor mu?*

---

## B. Altı soru — olduğu gibi sorulabilir

**1.** Yurt dışındaki bir şirkete verilen **yazılım hizmeti** için e-faturayı
**KDV %0, istisna kodu 302** ile kesmek doğru mu? Fatura tanımına ne yazmalıyım
(*harita kurulumu + katalog verisinin işlenmesi + barındırma*)?

> Cevap: ✅ **DOĞRU.** KDV %0 + istisna 302 ile kesilecek.

**2.** **Hizmet ihracatı kazanç indirimi %100** (Cumhurbaşkanı Kararı 11257,
30 Nisan 2026 RG) bu işe uygulanıyor mu, beyanda nereye yazılıyor? Şirketin
**babama ait** olması bir fark yaratıyor mu?

> Cevap: ✅ **UYGULANIYOR.** Babanın şirketi olması engel değil.

**3.** Şirkete **NACE 62.01** eklemek bu iş için yeterli mi? Tek başına hem 302
istisnasını hem %100 indirimi karşılıyor mu, yoksa tasarım kodu (**74.10**) da
gerekir mi?

> Cevap: ✅ **YETERLİ. Tasarım koduna (74.10) gerek yok.**

**4.** ⚠️ **Işi ben yapıyorum ama şirket babamın.** Bu yapıda benim bir ücret /
huzur hakkı almam gerekir mi, yoksa gelir tamamen şirkette mi kalır? Ileride
kendi şirketime geçersem bugünkü yapı bir sorun çıkarır mı?

> Cevap: ✅ **HUZUR HAKKI ALINIR.** Gelir tamamen şirkette bırakılmıyor.

**5.** Tahsilatı **şirketin EUR hesabına SWIFT** ile almak en temiz yol mu?
**Ihracat bedelinin yurda getirilmesi** ve varsa **bozdurma** yükümlülüğü bu
tutarlarda (birkaç yüz euro) pratikte nasıl işliyor?

> Cevap: ✅ **EVET, EN TEMİZ YOL.**

**6.** **%50 peşin / %50 teslimde** çalışırken fatura ne zaman kesilir —
peşinatta mı, teslimde mi, ikiye bölünerek mi? Peşinat alındığında henüz hizmet
verilmemiş oluyor, bu bir sorun mu?

> Cevap: ✅ **PEŞİNATTA kesilir.**

---

## C. Almanya'ya özel — faturada olması gereken satır

Alman müşteriye kesilen faturada:

> **Steuerschuldnerschaft des Leistungsempfängers** (reverse charge, §13b UStG)

Anlamı: KDV'yi alıcı kendi beyanında hem borç hem indirim gösteriyor, ona net
yük yok. Bu satır olmadan Alman muhasebeci faturayı geri çevirebilir.

⚠️ Bunun için **alıcının VAT ID'si** gerekiyor — teklif aşamasında isteniyor,
fatura kesilirken aranmıyor.

Sor: *Bu satırı e-Fatura'da nereye yazıyoruz — açıklama alanına mı, ayrı bir
not olarak mı?*

> Cevap: ✅ **AÇIKLAMA ALANINA.**

> ⚠️ **Ek cevap — faturadaki unvan:** *"ad yazılmaz, şirketin adı yazılır."*
> Yani faturada ne **OSMOS** ne de **Soroush Sehat** geçiyor; kesen tüzel
> kişinin (babanın şirketi) yasal unvanı yazılıyor. `teklif.md`deki unvan
> satırı bunu zaten açıklıyor: hizmet OSMOS adıyla sunuluyor, fatura
> şirket tarafından kesiliyor — müşteri bunu **teklif aşamasında** öğreniyor,
> fatura anında değil.

---

## D. YURT IÇI müşteri — 2026-08-20'de açıldı, ✅ D1-D4 cevaplandı (D5 hariç)

Istanbul ölçümü üç uygun dükkân buldu (`docs/b2b/istanbul-olcumu.md`) ve
sahibin kararı fiyatın **aynı kalması**, TL karşılığıyla verilmesi. Ama yurt içi
satış, bugüne kadar hazırlanan her şeyden **farklı** bir fatura demek:

⚠️ **Yukarıdaki A ve B bölümlerinin tamamı hizmet İHRACATI varsayıyor.** Yurt
içi müşteride istisna 302 de, §13b satırı da geçersiz.

**D1 — KDV.** Yurt içi müşteriye kesilen faturada KDV **%20** uygulanıyor,
değil mi? Istisna 302 (hizmet ihracatı) burada kullanılamaz diye anlıyorum —
doğru mu?

> Cevap: ✅ **UYGULANIYOR** — yurt içinde KDV %20. İstisna 302 burada geçersiz.

**D2 — Para birimi.** Fiyat €490 olarak belirlendi ama müşteri Türkiye'de
yerleşik. **32 sayılı Karar'ın 2018 değişikliği** yerleşikler arasındaki
sözleşmelerde döviz kısıtı getiriyor. Bu iş için sözleşme ve fatura **TL**
olmak zorunda mı, yoksa dövize endeksli düzenlenebilir mi?

> Cevap: ✅ **TL ZORUNLU** — hem sözleşme/fatura TL olacak, hem **para TL olarak gelecek.**

⚠️ Bunun sonucu var: TL sabitlenirse **yıllık ücret enflasyonla eriyor.**
Cevaba göre teklifte "yıllık ücret her yenilemede güncellenir" satırı
yazılacak — ya da dövize endeksleme mümkünse o yazılacak.

**D3 — Tahsilat.** Yurt içinde SWIFT yok, aynı gün EFT/havale. Paranın yine
**babanın şirketinin** hesabına girmesi gerekiyor; yurt içi satışta bunun
ek bir şartı var mı?

> Cevap: ✅ **EK ŞART YOK.**

**D4 — Fiyat.** Müşteriye söylenecek rakam: **27.500 TL + KDV** kurulum
(20 parfüme kadar) ve **16.500 TL/yıl**. KDV dahil mi hariç mi yazmak
zorundayız — perakende bir işletmeye kesilen hizmet faturasında hangisi
doğru?

> Cevap: ✅ **KDV DAHİL yazılacak.**

---

**D5 — Ticari e-posta / İYS.** Yurt içindeki bir **işletmeye** (tacir ya da
esnaf) soğuk ticari e-posta gönderebilir miyim? 6563 sayılı kanun ve Ticari
Iletişim Yönetmeliği'nde tacir/esnaf için **önceden onay istisnası** olduğunu
okudum ama emin değilim. **İYS (Ileti Yönetim Sistemi) kaydı** benim için
zorunlu mu — gönderen babanın şirketiyse ne değişir?

> Cevap: ⏳ **CEVAP ALINMADI** — sahip bu soruyu işaretlemedi. Mail kanalı henüz onaylı değil, ama 20 Ağustos'ta iki mail zaten gitti.

⚠️ **Bunun kanal sırasına doğrudan etkisi var.** Almanya'da aynı soru
ölçülmüştü (UWG §7 izinsiz ticari e-postayı B2B'de bile yasaklıyor) ve
sonuç "önce DM" kuralı oldu. Türkiye için cevap gelene kadar aynı ihtiyat:
**önce Instagram DM**, e-posta yalnız DM cevapsız kalırsa ve tek seferlik.

⚠️ Instagram DM'in bu kapsamda olup olmadığı da ayrıca sorulacak —
"ticari elektronik ileti" tanımı SMS/e-posta/arama sayıyor, sosyal medya
özel mesajı için durum açık değil.

---

## ✅ CEVAPLAR GELDİ (2026-08-20) — ve iki tanesi rakam değiştirdi

On üç sorunun on üçü cevaplandı. Ham cevaplar yukarıda kendi satırlarında;
burası **ne değiştiğini** yazıyor.

### ⚠⚠ D4 + D2 birlikte fiyatı yeniden yazdırdı

Müşavir *"KDV dahil yazılacak"* dedi; oysa 27.500 TL kararı **"+ KDV"** diye
alınmıştı. Sahibin kararı: **net korunacak.**

| | eski (karar) | **yeni (müşteriye söylenen)** | sana kalan net |
|---|---|---|---|
| kurulum | 27.500 TL + KDV | **33.000 TL** (KDV dahil) | 27.500 TL |
| yıllık | 16.500 TL + KDV | **19.800 TL** (KDV dahil) | 16.500 TL |

⚠️ **Müşteri için bu bir zam DEĞİL.** Hedeflerin üçü de KDV mükellefi
işletme, yani KDV'yi indiriyorlar — 33.000 TL KDV dahil, onlara
"27.500 + KDV" ile **birebir aynıya** mal oluyor. Rakam büyüdü, maliyet
değişmedi.

✅ **Hiçbir rakam taahhüt edilmemişti** — 20 Ağustos'ta giden üç mesajın
(2 mail + 2 DM) hiçbirinde fiyat geçmiyordu, ölçüldü. Yani bu değişiklik
kimseye açıklanmıyor.

### D2 — yıllık ücret artık eriyor, teklifte satırı var

Para birimi **TL zorunlu** ve tahsilat da TL. Yani yıllık ücret dövize
bağlanamıyor ve enflasyonla eriyor. Sahibin kararı (*"TL ile olduğu için
güncelleme olsun"*): teklifte

> *"Yıllık ücret ilk yıl sabittir; sonraki yıllarda yenileme tarihindeki
> geçerli fiyat üzerinden yenilenir."*

⚠️ Formül ve endeks bilerek YOK: TÜFE endekslemesi muhtemelen serbest ama
doğrulanmadı, ve formülsüz satır hem hukuki soru doğurmuyor hem eli serbest
bırakıyor.

### Öbek öbek kalan sonuçlar

- **B4 → sahibe iş çıktı:** *"huzur hakkı alınır."* Gelir tamamen şirkette
  bırakılmıyor. Tutarı ve sıklığı müşavirle ayrıca kurulacak.
- **B6 → fatura PEŞİNATTA kesiliyor.** %50/%50 tahsilat duruyor ama fatura
  başlangıçta çıkıyor. `teklif.md`in ödeme satırı bunu söylemeli.
- **B3 → 74.10 hiç gerekmiyor.** Tek kod 62.01; fatura tanımı yazılım
  dilinde kalacak, "tasarım" öne çıkarılmayacak.
- **A1 → 62.01 YAN kod olarak işlendi** (ana kod değil). Fatura tanımının
  kodla uyumu bu yüzden daha da önemli.
- **C → faturada ad değil ŞIRKETİN unvanı.** Ne OSMOS ne Soroush Sehat;
  müşteri bunu **teklif aşamasında** öğreniyor.

### ⏳ TEK CEVAPSIZ: D5 — İYS / soğuk ticari e-posta

**İşaretlenmedi.** Mail kanalı henüz onaylı değil ve **20 Ağustos'ta iki
mail zaten gitti** (noirparfum.com, homeofscents.com.tr — ikisi de teslim
edildi). Bu tek soru geriye dönük; bir sonraki görüşmede sorulacak.

---

## Dönünce ne olacak

A1 ve A2 bitince **teklif gönderilebilir hâle geliyoruz.** Ilk DM zaten serbest
(fatura doğurmuyor); kapanması gereken tek şey teklif–fatura tarafı.

**Kaynak:** `docs/b2b/sirket-ve-fatura.md` — her sayının yanında gerekçesi ve
durumu yazılı. ⚠️ O belge **danışmanlık değil**, karar verilebilir hâle
getirilmiş bir çalışma kâğıdı; müşavirin dediği üstün.
