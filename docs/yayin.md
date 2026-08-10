# Yayına çıkış — adım adım

Bu liste sahibin izleyeceği yol. **Hesap açmak ve alan adı almak yalnızca
sahibin yapabileceği işler**; kod tarafı hazır.

Seçilen yol: **Vercel** + ücretsiz `.vercel.app` alt alanı. Kendi alan adı
sonra, memnun kalınırsa. (Vercel yürümezse yedek Cloudflare Pages, ama orada
`proxy.ts` ve `next/og` ayrı ayar istiyor.)

---

## 1. GitHub'da boş bir depo — **sende**

github.com → yeni depo. Adı `osmos` olabilir. **Hiçbir şey ekleme**: README
yok, `.gitignore` yok, lisans yok. Depo tamamen boş olmalı, yoksa ilk gönderim
çakışır.

Depo **açık (public)** ya da **kapalı (private)** olabilir; Vercel ikisini de
alıyor. Kapalıysa kodu kimse göremez ama site yine yayında olur.

Bittiğinde adresi ver: `https://github.com/<kullanıcı>/osmos.git`

## 2. Kodu gönder — **birlikte**

Adresi verdiğin an bu iki satır çalıştırılıyor:

```bash
git remote add origin https://github.com/<kullanıcı>/osmos.git
git push -u origin master
```

⚠️ Yalnızca `master` gönderiliyor. Depoda on iki kadar birleşmiş özellik dalı
duruyor; hepsini göndermek gürültü olurdu ve hiçbirine ihtiyaç yok.

GitHub kimlik doğrulaması isteyebilir — o pencere sende açılır, şifreyi ben
görmüyorum ve girmiyorum.

## 3. Vercel hesabı — **sende**

vercel.com → **Continue with GitHub**. Ücretsiz plan (Hobby) bu site için
fazlasıyla yeterli.

## 4. Projeyi içeri al — **sende**

Vercel panosunda **Add New → Project** → GitHub deposunu seç → **Import**.

Ayarların hiçbirine dokunma. Vercel Next.js'i kendi tanıyor: derleme komutu,
çıktı klasörü, hepsi doğru geliyor. **Environment Variables kısmını da boş
bırak** — sitenin adresi ilk yayından sonra kendiliğinden doğru olacak
(`site-url.ts` barındırıcının verdiği adresi yedek olarak okuyor).

**Deploy**'a bas. İlk derleme birkaç dakika sürer.

## 5. Adresi al ve birlikte bakalım — **birlikte**

Vercel `https://osmos-xxxx.vercel.app` gibi bir adres verir. Onu bana yaz;
ben şunları denetlerim:

- İki dil de açılıyor mu (`/` ve `/tr`)
- Köşedeki `EN|TR` doğru yere gidiyor mu
- `sitemap.xml` **gerçek adresi** yazıyor mu — `localhost` kalmışsa yedek
  çalışmamış demektir
- `robots.txt` sitemap'i doğru gösteriyor mu
- Paylaşım kartı çıkıyor mu (`/perfume/<bir parfüm>/opengraph-image`)
- Açılış kapısı ve telefon görünümü

Sen de telefonundan aç — artık gerçek bir adres olduğu için ağ sorunu yok, ve
mobil kapı düzeltmesi ilk kez gerçek cihazda sınanmış olur.

## 6. Kendi alan adı — **sonra, istenirse**

Alan adı alıp Vercel'de **Domains** kısmından bağlıyorsun (DNS kaydı Vercel'in
söylediği gibi). Bağlandıktan sonra tek bir kod işi kalıyor:

Vercel → Settings → Environment Variables → `NEXT_PUBLIC_SITE_URL` =
`https://<alan-adı>` → yeniden yayınla.

O değişken sitemap'in, `hreflang` bağlantılarının ve paylaşım görsellerinin
mutlak adresini belirliyor. Tek satır, tek yer.

---

## Bilinmesi gerekenler

**Her `git push` yeni yayın demek.** Vercel `master`a gelen her gönderimi
kendiliğinden yayınlıyor. Bozuk bir şey göndermemek için akış aynı kalıyor:
dal → sınamalar → merge → push.

**Site tamamen statik ve dışarıya hiçbir istek atmıyor.** Veri tabanı yok, API
anahtarı yok, çerez yok. Yani yayına çıkmak bir maliyet ya da sızıntı riski
getirmiyor.

**Sitemap ilk yayında doğru çıkacak.** `NEXT_PUBLIC_SITE_URL` yazılmasa bile
`site-url.ts` barındırıcının kendi adresini okuyor. Bu bir yedek, kural değil:
başka bir yere taşınırsa değişken açıkça yazılır.
