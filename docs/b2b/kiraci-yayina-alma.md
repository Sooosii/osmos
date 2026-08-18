# Kiracıyı yayına alma — adım adım

Bir demo ya da müşteri sitesi nasıl genel bir adrese çıkar. İlk kez
Nischengold için yapıldı; sonraki her kiracı aynı yolu izliyor.

**Model:** tek depo, kiracı başına **ayrı bir Vercel projesi**. Aynı GitHub
deposuna bağlanıyorlar, ayrıldıkları tek yer ortam değişkenleri.

---

## 0. Katalog taslağını ÜRET — elle yazma

```bash
cd leadgen
node src/cli.ts kiraci-taslak <domain>      # data/taslak-<kimlik>/
```

Üretilenler: `catalog.ts` (seçki + aday adresler) ve `kayit.txt`
(`registry.ts` + `catalogs.ts` için yapıştırmalık satırlar).

⚠️ **Bu adım ölçülen 6-8 saatin büyük kısmını siliyor** — o sürenin çoğu veri
girişi değil ARAMAydı: her parfümün dükkândaki ürün adresini elle bulmak.
Eşleşen kimlikler zaten hesaplanıyordu, adres de `products.json`da duruyordu.

⚠️⚠️ **Üretilen adres bir ÖNERİ, karar değil.** Her satır `DOGRULANMADI`
işaretiyle çıkıyor ve `src/data/tenants/dogrulama.test.ts` işaret durduğu
sürece düşüyor — yani doğrulanmamış demo master'a giremez. Adresi tarayıcıda
aç, ürünün gerçekten o parfüm olduğunu **gör**, sonra işareti sil.

⚠️ Komut birden çok adayı olan satırları ayrıca listeliyor; önce onlara bak.
Sebep ölçüldü: dükkânlar çoğu parfümü hem temel hem `Extrait` olarak satıyor
ve bizim kayıtlarımız temel sürüm. **Yanlış bağlantı bağlantısızlıktan
kötüdür** — ziyaretçi başka ürüne düşer, sepete onu atar, kimse fark etmez.

**Ne kadar güveniliyor:** araç Nischengold üzerinde denendi ve elle
doğrulanmış **13 adresin 13'ünü birebir** üretti, beş Extrait tuzağının beşini
de doğru tarafa düşürdü. Yine de kapı duruyor: doğrulama gözle yapılıyor.

---

## 1. Kiracı kaydı master'da olmalı

`src/data/tenants/registry.ts` + `src/data/tenants/<kimlik>/catalog.ts`.
Kayıt `NEXT_PUBLIC_TENANT` verilmedikçe hiçbir şeyi değiştirmiyor; osmos.me
etkilenmiyor.

Demo ise: **`indexable: false`** ve kendi `locales`i.

⚠️⚠️ **`locales` dizisinin SIRASI anlamlı: ilk yazılan dil öneksiz olandır.**
Türk bir dükkân için `['tr', 'en']` yaz — `/` Türkçe açılır, `/en/...` önekli
durur. Ters yazılırsa (`['en', 'tr']`) site Ingilizce açılır ve bu **sessiz**
bir hatadır: derleme geçer, sayfalar çıkar, yalnızca müşteri kendi dilinde
karşılanmaz. Dükkânın dilini **ölç**, varsayma (Nischengold'da `locale":"de"`
ve CHF ölçülmüştü).

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
| kapalı özelliğin uçları (`/api/shelf`, `/api/push`, `/api/compose/nearest`, `/api/auth/...`) | **404** | ✅ dördü de (2026-08-18) |
| `/api/perfume-search` | **200**, yalnız kiracının katalogu | ✅ 13 kayıt, OSMOS kaydı 0 |
| tarayıcı konsolu | 0 hata (Vercel Analytics hariç, o yerelde hep 404) | ✅ |

⚠️ **Uçları GET ile ölçme.** `/api/push` ve `/api/compose/nearest` yalnız POST
tanıyor; GET'te 405 dönüyorlar ve o 405 kapıya HİÇ ulaşmadan çıkıyor —
"kapalı" sanılır, oysa ölçüm hiç yapılmamıştır. Doğru yöntem:
`curl -X POST -H "content-type: application/json" -d '{}' ...`

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

## 6. Kaldırma — "talep edilirse aynı gün"

⚠️ **Söz üç belgede yazılıydı, ADIMI hiçbirinde yoktu.** Talep geldiği an
aranacak şey bu olmamalı: dükkân "kaldırın" dediğinde geçen her saat, verilen
sözün değeri kadar zarar veriyor. Sıra tartışmadan önce gelir — **önce
kaldırılır, sonra konuşulur.**

```bash
npx vercel alias remove <adres> --yes        # adres dağıtımdan kopar — SITE ANINDA DÜŞER
npx vercel project remove <kimlik> --yes     # proje tamamen gider
```

⚠️⚠️ **`vercel domains remove` KULLANILMAYACAK.** O komut alan adının
**sahipliğini** hesaptan düşürüyor; `osmos.me` ile çalıştırılırsa kaldırılan
şey kiracının demosu değil **ana sitenin alan adı** olur. Kiracı bir alt alan
adında duruyor ve alt alan adının kendi "domain" kaydı yok — yukarıdaki iki
komut yeterli.

Sonra DNS: `osmos.me` tarafındaki `<kimlik>` CNAME kaydı silinir (joker kayıt
duruyorsa alt alan adı yine bir yere düşer, o yüzden ölçmeden bitmiş sayılmaz).

**Doğrula — kaldırdım demeden önce:**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -L https://<adres>/   # 200 DÖNMEMELI
```

⚠️ Kiracı kaydını (`registry.ts`) ve katalogu depodan silmek **şart değil** ve
aceleye getirilmemeli: kayıt `NEXT_PUBLIC_TENANT` verilmedikçe hiçbir şeyi
değiştirmiyor, osmos.me etkilenmiyor. Yayından kalkan site kalkmıştır; kod
temizliği ayrı ve sakin bir iş.

⚠️ Aynı gün bir de **cevap yazılır**: kaldırıldığı, kaydın silindiği ve bir
daha yazılmayacağı. Sessizce kaldırmak sözün yarısını tutmaktır.

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
