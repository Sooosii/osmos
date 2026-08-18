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

## 3. Vercel projesi

**Panelde:** Add New → Project → aynı `Sooosii/osmos` deposu.

**Ya da komut satırından** (Nischengold böyle kuruldu, 2026-08-18):

```bash
npx vercel project add <kimlik>
npx vercel link --project <kimlik> --yes
npx vercel git connect                     # her push'ta kendiliğinden dağıtsın
printf '<kimlik>'          | npx vercel env add NEXT_PUBLIC_TENANT production
printf 'https://<adres>'   | npx vercel env add NEXT_PUBLIC_SITE_URL production
npx vercel domains add <adres> <kimlik>
npx vercel deploy --prod --yes
npx vercel alias set <dagitim-adresi> <adres>
```

⚠️⚠️ **CLI ile kurulan proje çerçeveyi TANIMIYOR — `Framework Preset: Other`.**
Panelden kurulan proje Next'i kendiliğinden seçiyor, `vercel project add`
seçmiyor. Sonucu sessiz ve tam olarak yanıltıcı: **derleme başarıyla
tamamlanıyor**, günlükte Next'in rota tablosu bile basılıyor, dağıtım "Ready"
diyor — ama Vercel o çıktıyı yok sayıp `public/` klasörünü düz statik site gibi
sunuyor. Bütün site 404 (`X-Vercel-Error: NOT_FOUND`), tek istisna
`public/`teki dosyalar. Teşhisi veren ölçüm buydu: `/sw.js` **200** dönerken
`/` 404 dönüyorsa sebep budur.

Çözüm depoda: kökteki **`vercel.json`** çerçeveyi `nextjs` olarak sabitliyor,
yani hangi yoldan kurulursa kurulsun her proje doğru derleniyor. Dosya
silinmemeli.

⚠️ `vercel link` **`.env.local`in sonuna `VERCEL_OIDC_TOKEN` satırı ekliyor.**
Dosya `.gitignore`da, zararsız; ama "ben yazmadım" diye silinmesin.

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

**Nischengold — canlıda ölçüldü (2026-08-18, `nischengold.osmos.me`):**

| ölçüm | beklenen | çıkan |
|---|---|---|
| `/` | 200 | ✅ |
| `/tr`, `/de` | 404 | ✅ ikisi de |
| `/robots.txt` | `Disallow: /` | ✅ |
| sekme başlığı | kiracının adı | ✅ `Nischengold — scent map` |
| ana sayfada "OSMOS" | 0 | ✅ |
| satıcı bağlantıları | müşterinin alan adı | ✅ **13/13** |
| taslak ekranlar (`/evolution`, `/space`) | 404 | ✅ ikisi de |
| hesap dünyası (`/signin`, `/settings`, `/studio`, `/u/…`, `/feed.xml`) | 404 | ✅ beşi de |
| **katalog sızıntısı** | yüklenen parçalarda OSMOS metni yok | ✅ 15 parça tarandı, 0 |

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
