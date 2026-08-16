# Kiracıyı yayına alma — adım adım

Bir demo ya da müşteri sitesi nasıl genel bir adrese çıkar. İlk kez
Nischengold için yapıldı; sonraki her kiracı aynı yolu izliyor.

**Model:** tek depo, kiracı başına **ayrı bir Vercel projesi**. Aynı GitHub
deposuna bağlanıyorlar, ayrıldıkları tek yer ortam değişkenleri.

---

## 1. Kiracı kaydı master'da olmalı

`src/data/tenants/registry.ts` + `src/data/tenants/<kimlik>/catalog.ts`.
Kayıt `NEXT_PUBLIC_TENANT` verilmedikçe hiçbir şeyi değiştirmiyor; osmos.me
etkilenmiyor.

Demo ise: **`indexable: false`** ve kendi `locales`i.

## 2. Yerelde ölç (yayından ÖNCE)

```bash
NEXT_PUBLIC_TENANT=<kimlik> NEXT_PUBLIC_SITE_URL=https://<adres> npm run build
NEXT_PUBLIC_TENANT=<kimlik> NEXT_PUBLIC_SITE_URL=https://<adres> npx next start -p 4400
```

Altı ölçüm — Nischengold'da 2026-08-16'da hepsi geçti:

| ölçüm | beklenen | Nischengold |
|---|---|---|
| `/` | 200 | ✅ |
| üretilmeyen diller (`/tr`, `/de`) | **404** | ✅ ikisi de 404 |
| `/robots.txt` | `Disallow: /` | ✅ |
| sekme başlığı | kiracının adı, OSMOS değil | ✅ "Nischengold — scent map" |
| ana sayfada "OSMOS" geçişi | 0 | ✅ 0 |
| her parfümün satıcı bağlantısı | müşterinin kendi alan adı | ✅ **13/13** |

⚠️ Sekme başlığını **gerçek tarayıcı** yakaladı, gözle bulunmamıştı: marka 20+
başlık dizesinin içinde gömülü ve çoğu fonksiyon (`src/i18n/brand.ts`).

## 3. Vercel projesi (panelde)

1. **Add New → Project** → aynı `Sooosii/osmos` deposu.
2. Ortam değişkenleri (Production):
   - `NEXT_PUBLIC_TENANT` = kiracı kimliği
   - `NEXT_PUBLIC_SITE_URL` = kiracının **kendi** adresi
3. Deploy.

⚠️⚠️ **`NEXT_PUBLIC_SITE_URL`i ana projeden KOPYALAMA.** İçine `https://osmos.me`
girerse `src/proxy.ts` (`shouldMoveToCanonical`) kiracının her isteğini **308 ile
osmos.me'ye yollar** — site hiç açılmaz ve hata mesajı çıkmaz. Kural yalnız
`.vercel.app` ana bilgisayarlarına uygulandığı için, adres `osmos.me` altında bir
alt alan adıysa tuzak kurulmuyor bile. **Alt alan adı bu yüzden tercih edilir.**

⚠️ `NEXT_PUBLIC_*` değişkenleri **derleme zamanında** gömülüyor: değeri
değiştirince yeniden dağıtım şart.

⚠️ Bilinmeyen kiracı kimliği **derlemeyi patlatır** (`lib/tenant.ts`) ve bu
bilerek böyle: sessizce OSMOS'a düşmek, müşterinin alan adı altında OSMOS'un
kataloğunu yayınlamak demekti.

## 4. Alan adı

Demo için: `<kimlik>.osmos.me`.
Vercel projesinde **Domains → Add**, sonra DNS'te osmos.me tarafında
Vercel'in verdiği CNAME kaydı.

Müşteri sitesi için: müşterinin kendi alt alan adı (pakete dahil).

## 5. Yayından sonra ölç

2. adımdaki altı ölçümün aynısı, bu kez canlı adreste. Ek olarak: demo şeridi
görünüyor mu, `osmos.me` bağlantısı çalışıyor mu.

---

## Bilinmesi gerekenler

⚠️ **Vercel Hobby ticari kullanıma kapalı.** Demo gelir öncesi olduğu için
bugün sorun değil; **ilk ödeme alındığı gün Pro'ya geçilecek.**

⚠️ **Nota ansiklopedisi kiracıda `noindex`** ve site haritasında yok: 158 nota
sayfası her kiracıda birebir aynı, iki müşteride Google birini kanonik seçip
ötekini elerdi. Parfüm sayfaları gerçekten benzersiz, onlar açık.

⚠️ **Demo kuralları:** noindex · "resmi olmayan çalışma" şeridi (kapatma düğmesi
yok) · **talep edilirse aynı gün kaldırılır.**

**İlgili:** `docs/b2b/gonderim-akisi.md` · `docs/b2b/sirket-ve-fatura.md` ·
`docs/superpowers/specs/2026-08-15-b2b-kiraci-katmani-design.md`
