# Teklif — "evet, gönder" diyene gidecek belge

> Bu belge **karar vermiyor**, verilmiş kararları müşteriye gönderilebilir tek
> bir metne çeviriyor. Fiyat ve kapsam `gonderim-akisi.md` §"Satarken
> söylenecekler"de, unvan ve VAT ID kararı `sirket-ve-fatura.md`de.

**Dil: Ingilizce.** Ilk partideki on hedefin dili Ingilizce (GB, AE, EG, PK, DE,
CA). Nischengold cevap verirse Almancası bundan türetilir — sahibin duran kararı
*"Almanca ancak cevap gelirse"*.

⚠️ **Teklif gitmeden önce şu üçü hazır olmalı:** NACE 62.01 · e-Fatura + istisna
302 · şirketin döviz hesabı. Ilk DM için şart değildi, **teklif için şart** —
"evet" diyene fatura kesemezsen o evet çürür.

---

## Doldurulacak yerler

| yer | ne yazılacak |
|---|---|
| `[Shop]` | dükkânın adı, kendi yazdığı gibi |
| `[demo link]` | kurulmuş demo adresi (`<kimlik>.osmos.me`) |
| `[N]` | demoda duran parfüm sayısı |
| `[company]` | faturayı kesen şirketin unvanı |
| `[X]` | teslim süresi, iş günü |

⚠️ **Fiyatı ve kapsamı değiştirme.** Pazarlık gelirse `sirket-ve-fatura.md`ye
bakılır; teklif metni sabit kalır, indirim sözlü konuşulmaz.

---

## Metin

> **A scent map for [Shop]**
>
> Here is what I built from your catalogue: **[demo link]**
>
> **What it is.** Not a redesign, and not a replacement for anything you have.
> It is a discovery layer that sits beside your shop: visitors move through your
> fragrances by how they actually smell — what shares notes with what — instead
> of scrolling one long list. Every path ends on your own product page.
>
> **What you get**
>
> - Up to 20 fragrances placed on the map
> - Your brand: your name throughout, and the map's colour drawn from your own
>   catalogue — no two shops look the same
> - A link from every fragrance straight to your product page
> - Published on your own subdomain
> - One round of revisions
>
> Not included: more than 20 fragrances, additional languages, custom design.
>
> **What I need from you**
>
> - **The notes for each fragrance** (top / heart / base). This one is not
>   optional: a fragrance's position on the map is computed from its notes, so a
>   fragrance without them cannot exist there.
> - **Your VAT ID**, for the invoice.
>
> **Price.** €490 to build, €290 per year after that. The yearly fee covers
> hosting, two catalogue updates a year, and a monthly report: how many
> visitors the map sent to your product pages, and which fragrances they came
> from. The count is a floor — it is measured in the browser, so anyone with an
> ad blocker is not counted and the real number is higher.
>
> This is a founding price for the first three shops, and I would rather say why
> than pretend it is a promotion: I want three references and honest feedback
> more than I want the margin. Payment is 50% to start and 50% on delivery.
>
> **Timeline.** [X] working days from the deposit.
>
> **One honest caveat.** This does not sell anything by itself. It feeds the
> place that sells — your product pages. If you are looking for a checkout or a
> storefront, this is not that.
>
> **Invoicing.** The work is delivered under the name OSMOS; the invoice is
> issued by [company] in Türkiye. For businesses in the EU the VAT is
> reverse-charged (§13b UStG) — no VAT is added to the invoice and you account
> for it in your own return, so there is no net cost to you.
>
> Happy to answer anything before you decide.

---

## Neden bu metin böyle

- **Link ilk satırda.** Teklif okunmadan önce ürün görülüyor. Anlatı değil kanıt.
- ⚠️ **"Not a redesign" ilk cümlede.** Ölçülmüş kural: site değişimi olarak
  sunulan şey ilk cümlede reddediliyor. Satılan şey **kapı**.
- ⚠️ **Notalar bir istek değil şart olarak yazılı** ve gerekçesiyle. Istemek
  satışı güçlendiriyor: işin ciddiyetini gösteriyor. Fiyat bu yüzden düşmüyor —
  satılan şey veri girişi değil, harita.
- ⚠️ **Kurucu fiyatının gerekçesi açık yazıldı.** "Kampanya" demek sonraki zammı
  meşrulaştırmıyor; "üç referans istiyorum" diyor.
- ⚠️ **Dürüst karşı argüman metnin içinde.** Sonradan çıkan bir sınır güveni
  yıkar; baştan söylenen bir sınır güven kurar.
- ⚠️ **Aylık rapor fiyat satırına eklendi, fiyat DEĞİŞMEDİ** (2026-08-19).
  Sebep: yenileme ücretinin arkasında hiçbir argüman yoktu. "Barındırma ve iki
  güncelleme" bir maliyet kalemi; müşteri ikinci yıl "ne aldım" diye sorduğunda
  gösterilecek tek rakam yoktu ve satılan sözün kendisi (*"it feeds the place
  that sells"*) ölçülmüyordu. Turnike (`/api/tiklama`) o rakamı üretiyor:
  €290/yıl artık barındırma değil, **rapora abonelik.**
- ⚠️ **"Floor" kelimesi pazarlık dışı.** Sayım tarayıcıda başlıyor, engelleyicisi
  olan ziyaretçi sayılmıyor. Rakamı olduğundan büyük söylemek, ikinci ay
  düzeltilecek bir iddia demekti; eksik saydığını baştan söylemek ise aynı
  rakamı savunulabilir yapıyor. Aynı cümle raporun kendisinde de var
  (`scripts/tiklama-raporu.ts`).
- ⚠️ **Unvan ve VAT ID teklifte, faturada değil** (sahibin 2026-08-18 kararı).
  Müşteri her yerde OSMOS görüyor; fatura başka unvanla gelince parayı gönderecek
  muhasebeci ödemeyi durdurup sorar — tam tahsilat anında güven sarsılır.
- ⚠️ **Sayfa sayısı iddiası YOK.** Doğru cümle gerekirse: *"[N] ürününüz
  aranabilir sayfalara çıkıyor, üstüne ziyaretçileriniz için 158 notalık
  ansiklopedi."* Ansiklopedi kiracıda `noindex` (her kiracıda birebir aynı), o
  yüzden toplam sayfa sayısı satış cümlesi olarak kullanılmıyor.

## Cevap gelmezse

Teklif bir kez gönderilir. Hatırlatma en erken **bir hafta** sonra ve tek
cümleyle: *"Bir şey sormak isterseniz buradayım; istemezseniz bir daha
yazmam."* Iki hatırlatma yok.

⚠️ **Bu kural artık ARAÇ** (2026-08-19): `cd leadgen && node src/cli.ts takip`
yedi günü dolmuş ve cevapsız kalan dükkanları, her birinin kendi dilindeki tek
cümleyle basıyor. Kural yalnız burada yazılıyken uygulanmıyordu — 36 dükkana
yazılmış, hiçbiri bir daha hatırlanmamıştı. Komut mesaj göndermiyor; deftere
yazıldığı an dükkan listeden düşüyor ve "iki hatırlatma yok" kendiliğinden
uygulanıyor.

**Ilgili:** `docs/b2b/kapanis.md` (cevaptan sonrası) ·
`docs/b2b/gonderim-akisi.md` · `docs/b2b/sirket-ve-fatura.md` ·
`docs/b2b/kiraci-yayina-alma.md` (teslim yolu) ·
`docs/b2b/nischengold-mesaj.md` (ilk temas)
