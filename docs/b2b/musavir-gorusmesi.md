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

> Cevap:

**2.** **Hizmet ihracatı kazanç indirimi %100** (Cumhurbaşkanı Kararı 11257,
30 Nisan 2026 RG) bu işe uygulanıyor mu, beyanda nereye yazılıyor? Şirketin
**babama ait** olması bir fark yaratıyor mu?

> Cevap:

**3.** Şirkete **NACE 62.01** eklemek bu iş için yeterli mi? Tek başına hem 302
istisnasını hem %100 indirimi karşılıyor mu, yoksa tasarım kodu (**74.10**) da
gerekir mi?

> Cevap:

**4.** ⚠️ **Işi ben yapıyorum ama şirket babamın.** Bu yapıda benim bir ücret /
huzur hakkı almam gerekir mi, yoksa gelir tamamen şirkette mi kalır? Ileride
kendi şirketime geçersem bugünkü yapı bir sorun çıkarır mı?

> Cevap:

**5.** Tahsilatı **şirketin EUR hesabına SWIFT** ile almak en temiz yol mu?
**Ihracat bedelinin yurda getirilmesi** ve varsa **bozdurma** yükümlülüğü bu
tutarlarda (birkaç yüz euro) pratikte nasıl işliyor?

> Cevap:

**6.** **%50 peşin / %50 teslimde** çalışırken fatura ne zaman kesilir —
peşinatta mı, teslimde mi, ikiye bölünerek mi? Peşinat alındığında henüz hizmet
verilmemiş oluyor, bu bir sorun mu?

> Cevap:

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

---

## D. YURT IÇI müşteri — 2026-08-20'de açıldı, cevabı YOK

Istanbul ölçümü üç uygun dükkân buldu (`docs/b2b/istanbul-olcumu.md`) ve
sahibin kararı fiyatın **aynı kalması**, TL karşılığıyla verilmesi. Ama yurt içi
satış, bugüne kadar hazırlanan her şeyden **farklı** bir fatura demek:

⚠️ **Yukarıdaki A ve B bölümlerinin tamamı hizmet İHRACATI varsayıyor.** Yurt
içi müşteride istisna 302 de, §13b satırı da geçersiz.

**D1 — KDV.** Yurt içi müşteriye kesilen faturada KDV **%20** uygulanıyor,
değil mi? Istisna 302 (hizmet ihracatı) burada kullanılamaz diye anlıyorum —
doğru mu?

> Cevap:

**D2 — Para birimi.** Fiyat €490 olarak belirlendi ama müşteri Türkiye'de
yerleşik. **32 sayılı Karar'ın 2018 değişikliği** yerleşikler arasındaki
sözleşmelerde döviz kısıtı getiriyor. Bu iş için sözleşme ve fatura **TL**
olmak zorunda mı, yoksa dövize endeksli düzenlenebilir mi?

> Cevap:

⚠️ Bunun sonucu var: TL sabitlenirse **yıllık ücret enflasyonla eriyor.**
Cevaba göre teklifte "yıllık ücret her yenilemede güncellenir" satırı
yazılacak — ya da dövize endeksleme mümkünse o yazılacak.

**D3 — Tahsilat.** Yurt içinde SWIFT yok, aynı gün EFT/havale. Paranın yine
**babanın şirketinin** hesabına girmesi gerekiyor; yurt içi satışta bunun
ek bir şartı var mı?

> Cevap:

**D4 — Fiyat.** Müşteriye söylenecek rakam: **27.500 TL + KDV** kurulum
(20 parfüme kadar) ve **16.500 TL/yıl**. KDV dahil mi hariç mi yazmak
zorundayız — perakende bir işletmeye kesilen hizmet faturasında hangisi
doğru?

> Cevap:

---

## Dönünce ne olacak

A1 ve A2 bitince **teklif gönderilebilir hâle geliyoruz.** Ilk DM zaten serbest
(fatura doğurmuyor); kapanması gereken tek şey teklif–fatura tarafı.

**Kaynak:** `docs/b2b/sirket-ve-fatura.md` — her sayının yanında gerekçesi ve
durumu yazılı. ⚠️ O belge **danışmanlık değil**, karar verilebilir hâle
getirilmiş bir çalışma kâğıdı; müşavirin dediği üstün.
