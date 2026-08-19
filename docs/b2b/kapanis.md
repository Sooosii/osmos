# Kapanış — cevap geldikten sonra ne oluyor

**Ilgili:** `teklif.md` (teklif metni) · `sirket-ve-fatura.md` (kararlar) ·
`gonderim-akisi.md` (günlük akış) · `kiraci-yayina-alma.md` (teslim)

---

## Neden bu dosya var

2026-08-19'da ölçüldü: 36 dükkana yazılmış, **2 gerçek cevap** gelmiş, ve
cevaptan sonrasının hiçbir adımı yazılı değilmiş. Teklif metni hazırdı, fatura
kararları verilmişti — ama ikisinin arasındaki yol yoktu: cevap gelince ne
gönderilecek, "evet" deyince para nasıl istenecek, hangi bilgi ne zaman
sorulacak.

⚠️ **Bunun bedeli tam olarak "evet" anında ödenir.** Müşteri kabul ettiğinde
doğaçlama yapılan her dakika, en pahalı dakikadır: karar vermiş bir insanı
bekletmek kararını geri aldırır. Bu yüzden bu dosya müşteri beklerken değil,
**boşken** yazıldı.

---

## Zincir

```
cevap → demo → teklif → VAT ID + notalar → %50 → kurulum → teslim → %50 → yıllık
```

Her halkanın metni aşağıda. Her adımdan sonra deftere yazılıyor:
`node src/cli.ts temas <domain> <sonuc> "<not>" --kanal <kanal>`

---

## 1. Cevap geldi

**Ilk iş deftere yazmak** — sonra değil, hemen. `cevap` yazıldığı an dükkan
takip listesinden düşüyor ve ona soğuk hatırlatma gitme ihtimali kapanıyor.

```bash
node src/cli.ts temas <domain> cevap "<ne dedi>" --kanal <dm|mail|whatsapp>
```

Cevap üç türden biri oluyor:

| Cevap | Ne yapılır |
|---|---|
| **"Görelim / link yolla"** | Demo kurulur (2. adım). En sık ve en iyi cevap. |
| **"Kaça?"** | Fiyat **saklanmaz**, doğrudan söylenir + demo önerilir. Fiyatı geciktirmek güveni düşürüyor. |
| **Kapı bekçisi: "yönetime iletelim"** | Ad + adres bırakılır, sonra yönetime **tek** mail. Ikinci kez kapı bekçisine yazılmaz. |

⚠️ **Otomatik yanıt cevap değil.** `otomatik` yazılıyor — karar kuralının
saydığı sayıyı şişirmemesi için. Ama içinde bir adres veya numara varsa o
kanal gerçek bir kapıdır (ölçüldü: mazzolari.com, parfumgroup.de).

---

## 2. Demo

Kurulum yolu `kiraci-yayina-alma.md`de, altı adım. Kısaca:

```bash
node src/cli.ts kiraci-taslak <domain>     # katalog taslağı + kayıt
# → registry.ts + tenants/<kimlik>/catalog.ts + catalogs.ts
# → yerelde 9 kalemlik ölçüm → Vercel projesi → CNAME → canlıda aynı ölçüm
```

⚠️ **Eşleşmeler gözle doğrulanır, otomatik kabul edilmez.** Nischengold'da
ölçüldü: eşleştirici yalnız parfüm ADINA baktığı için iki yanlış eşleşme
üretmişti ve ikisi de dükkanda yoktu. *"Sizin kataloğunuzdan kurdum"* diyen bir
demo, satmadıkları bir parfümü içeremez — ilk cevapta yakalanır.

⚠️ **Demo `indexable: false` ve demo şeridi açık.** Onayı alınmamış çalışma
arama sonuçlarına girmez; talep edilirse aynı gün kaldırılır.

**Gönderilecek metin** (Almanca örneği `nischengold-mesaj.md`de):

> Ben buradan `<N>` parfümünüzü aldım ve bir koku haritası kurdum: parfümlerin
> listede alt alta değil, kokuya göre yan yana durduğu bir harita. Her yol
> sizin kendi ürün sayfanızda bitiyor.
>
> `<https://<kimlik>.osmos.me>` — bir kez kaydırın, harita kısa girişten sonra
> geliyor.
>
> Beğenmezseniz aynı gün kaldırırım.

---

## 3. Teklif

Tam metin `teklif.md`de. Gönderilmeden önce doldurulacak **iki boşluk**:

- `[X] working days` → kurulum süresi. 20 parfüme kadar gerçekçi rakam yazılır.
- `[company]` → **babanın şirketinin tam unvanı.**

⚠️ **Unvan teklifte açılıyor, faturada değil** (sahibin 2026-08-18 kararı).
Müşteri her yerde OSMOS görüyor; fatura başka bir unvanla gelirse parayı
gönderecek muhasebeci ödemeyi durdurup sorar — tam tahsilat anında güven
sarsılır.

**Teklifle birlikte istenen iki şey** (ikisi de teklif metninde yazılı):

1. **Parfümlerin notaları** — şart, istek değil. Notası olmayan parfüm haritada
   var olamıyor. Fiyat bu yüzden düşmüyor: satılan şey veri girişi değil, harita.
2. **VAT ID** — faturayı keserken aramak gecikme demek.

---

## 4. Para — SWIFT

**Karar (2026-08-18, değişmedi):** babanın şirket döviz hesabı, SWIFT. Wise ve
Payoneer yok.

**Tahsilat:** %50 başlarken, %50 teslimde.

### Ödeme talimatı bloğu

⚠️ **Aşağısı DOLDURULACAK. Uydurulmuş tek bir hane yok — hepsi bankadan
alınacak.** Bir rakamın yanlış olması, paranın gelmemesi ve müşterinin
"bunlar ciddi mi" diye sorması demek.

```
Beneficiary:        [şirketin banka kayıtlarındaki TAM unvanı]
Beneficiary address:[adres]
IBAN:               [TR.. ...]
SWIFT/BIC:          [.....]
Bank:               [banka adı]
Bank address:       [şube adresi]
Currency:           EUR
Reference:          OSMOS <kiracı kimliği> <fatura no>
Charges:            SHA
```

⚠️ **`Reference` alanı boş bırakılmaz.** Gelen havaleyi hangi müşteriye
yazacağını söyleyen tek şey o satır; boşsa hesapta adı bilinmeyen bir tutar
durur.

⚠️ **`Charges: SHA`** — masraf paylaşılıyor: gönderen kendi bankasının,
alıcı kendi bankasının masrafını ödüyor. `OUR` istemek müşteriye ek maliyet
çıkarır ve pazarlık açar; `BEN` ise gelen tutarı beklenenden düşük yapar ve
"eksik gönderdiler" sanılır.

### Ölçülmemiş, ilk tahsilatta ölçülecek

Sahibin kararı: **SWIFT yolu ayrıca denenmeyecek, ilk müşteride görülecek.**
Karar bu; riski açıkça yazılı duruyor:

- Havalenin kaç günde düştüğü **bilinmiyor**.
- Ara banka (correspondent) masraf kesip kesmediği **bilinmiyor** — kesiyorsa
  €245 yerine daha azı düşer ve fark elle takip edilir.
- Alman/Körfez muhasebecisinin ek belge isteyip istemediği **bilinmiyor**.

⚠️ Ilk havale düştüğü gün bu üç satır ölçülmüş rakamlarla değiştirilecek.

---

## 5. Fatura

Kararlar `sirket-ve-fatura.md`de; kapanışta kullanılan hâli:

- **e-Fatura**, **EUR**.
- **KDV %0**, istisna kodu **302 — hizmet ihracatı.**
- **Alman müşteriye ek satır:** *"Steuerschuldnerschaft des
  Leistungsempfängers"* (§13b UStG). Bu satır olmadan Alman muhasebeci
  faturayı geri çevirebilir.
- **Hizmet tanımı yazılım/hizmet dilinde:** harita kurulumu + katalog verisinin
  işlenmesi + yıllık barındırma. ⚠️ "Tasarım" kelimesi öne çıkarılmıyor —
  NACE yalnız **62.01** ve tanım ile faaliyet kodu örtüşmeli.
- Alıcının **VAT ID**'si faturada.

⚠️ **Döviz, beyan tarihine kadar Türkiye'ye getirilmiş olmalı** — istisnanın
şartı. SWIFT seçildiği için bu kendiliğinden sağlanıyor.

---

## 6. Ilk ödeme günü — kontrol listesi

- [ ] Havale hesaba düştü, tutar ve tarih not edildi
- [ ] Fatura kesildi (EUR, KDV %0 / 302, gerekiyorsa §13b satırı)
- [ ] **Vercel Hobby → Pro.** ⚠️ Hobby ticari kullanıma kapalı; ilk ödeme
      alındığı an ticari kullanım başlıyor. Bu madde ertelenirse proje
      askıya alınabilir ve müşterinin sitesi düşer.
- [ ] Kiracı `indexable: true` yapıldı mı? — **müşteri isterse.** Demo şeridi
      (`DemoUyarisi`) kaldırılıyor: çalışma artık resmi.
- [ ] Kiracının Vercel projesinde **`KV_REST_API_URL` / `KV_REST_API_TOKEN`
      var mı?** Yoksa turnike sessizce sıfır sayar ve aylık raporun söyleyecek
      bir şeyi olmaz — satılan yenileme ücretinin karşılığı o rapor.
- [ ] Deftere: `temas <domain> ilgilendi "odeme alindi" --kanal <kanal>`

---

## 7. Teslimden sonra — yıllık ücretin karşılığı

€290/yıl **barındırma değil, rapora abonelik** (bkz. `teklif.md`). Ayda bir:

```bash
NEXT_PUBLIC_TENANT=<kimlik> npx tsx scripts/tiklama-raporu.ts <YYYY-MM>
```

Script müşteriye gidecek metni Ingilizce ve Almanca basıyor.

⚠️ **Rakam "en az" diye gönderiliyor.** Sayım tarayıcıda başlıyor, reklam
engelleyicisi olan ziyaretçi sayılmıyor — gerçek sayı daha yüksek. Olduğundan
büyük söylenen bir rakam ikinci ay düzeltilir; eksik saydığını baştan söyleyen
rakam savunulabilir kalır.

⚠️ **Sıfır iki farklı şey olabilir** ve ayırt edilmeden rapor gönderilmez:
gerçekten kimse tıklamadı, ya da sayaç hiç ulaşmadı (KV değişkenleri eksik).
Ayırmanın yolu: siteye gir, bir satıcı bağlantısına bas, raporu tekrar çalıştır.

---

## Kaldırma

Müşteri isterse **aynı gün.** Prosedür `kiraci-yayina-alma.md`de yazılı ve
teklifte söz verilmiş durumda. Söz verilmiş bir kaldırmayı geciktirmek,
kazanılan her şeyi geri alır.
