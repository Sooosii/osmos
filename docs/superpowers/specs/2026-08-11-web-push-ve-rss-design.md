# Web Push + RSS — Tasarım

Tarih: 2026-08-11 · Para yol haritasının ② adımı (yol haritası onaylı;
düğmenin yeri ve sözcükleri ekranda gösterilip seçilecek)

## Sorun

Site yayında ama **geri dönen ziyaretçi üretecek hiçbir kanal yok**: yeni bir
parfüm girdiğinde bunu kimse duymuyor. Yol haritasındaki karar iki kanal:

1. **Web Push** — "notify" düğmesine basan ziyaretçiye, yeni parfüm master'a
   girdiğinde tarayyıcı bildirimi düşer.
2. **RSS** (`/feed.xml`) — beslemeye abone olan okuyucu robotu yeni parfümü
   kendi görür; statik, bedava, sunucusuz.

## Kararlar

### ① RSS: tek besleme, İngilizce, tarihsiz

- **Adres `/feed.xml`**, kök varlık → `ROOT_ASSETS`e satır (yazılmazsa dil
  önekiyle yeniden yazılır ve **sessizce** 404 döner — plandaki uyarı buydu).
- **Statik rota işleyicisi** (`src/app/feed.xml/route.ts`,
  `dynamic = 'force-static'`): besleme derlemede üretilir, yeni parfüm bir
  sonraki yayınla düşer. Saf üretici `src/lib/feed.ts`te — XML kaçışı dahil
  sınanabilir.
- **Tek dil: İngilizce, kanonik öneksiz bağlantılar.** Besleme bir duyuru
  kanalı, belge değil; iki beslemeyi de bakımlı tutmak bugünkü işi ikiye
  katlardı. İstenirse `/tr/feed.xml` sonra eklenir.
- **Madde tarihi YOK.** RSS 2.0'da `pubDate` isteğe bağlı; 52 parfüme tarih
  uydurmak "ölçülmemiş sayıyı yazmak" olurdu (temizlik borçları turunun
  kuralı). Okuyucu robotlar yeniyi `guid` ile ayırt eder — `guid` kanonik
  sayfa adresi (`isPermaLink="true"`). `lastBuildDate` da yok: her derlemede
  değişip yenilik yokken yenilik sinyali verirdi.
- **Sıra: veri dosyasının tersi.** Yeni parfüm `perfumes.ts`in sonuna
  eklenir (bugüne kadarki alışkanlık); besleme ters çevirip en yeniyi en
  üste koyar.
- **Otokeşif**: `[lang]/layout.tsx` metadata'sına
  `alternates.types['application/rss+xml']` — tarayıcı ve okuyucular
  beslemeyi sayfadan bulur.

### ② Web Push: site yalnızca abone tutar, gönderen GitHub Action

Sorumluluk bilerek ikiye bölündü:

- **Site** (ilk sunucu parçası): `/api/push` — `POST` abone kaydeder,
  `DELETE` siler. Başka hiçbir şey yapmaz; statik sayfalar statik kalır.
- **Gönderim GitHub Action'da** (`push-notify.yml`): `src/data/perfumes.ts`
  değişip master'a girince çalışır, yeni parfümleri bulur, abonelere yollar.

⚠️ Bu bölünmenin güvenlik getirisi: **VAPID özel anahtarı sitenin hiçbir
yerinde yok** — ne kodda ne Vercel'de; yalnızca GitHub secrets'ta. Site
tarafında yalnızca açık anahtar var (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`).

- **Depo: Upstash Redis** (Vercel Marketplace, ücretsiz kademe), **SDK'sız**
  — REST API'ye düz `fetch`. Çalışma anına sıfır yeni bağımlılık. Env adının
  iki biçimi de okunur (`KV_REST_API_URL`/`UPSTASH_REDIS_REST_URL`), çünkü
  Vercel entegrasyonu kurulum yaşına göre ikisinden birini basıyor.
  Yapı: `push:subs` (hash, alan = abone endpoint'i, değer = abone JSON'u,
  dili dahil) ve `push:announced` (küme, duyurulmuş parfüm kimlikleri).
- **Yeni parfüm tespiti git'e değil Redis'e bakar:** duyurulmuşlar kümesiyle
  bugünkü veri arasındaki fark. Merge/squash geçmişin şekli ne olursa olsun
  doğru çalışır. İlk çalışma **tohumlar** (52'yi kümeye yazar, göndermez) —
  yoksa ilk gün herkese 52 bildirim düşerdi.
- **Dil abone olurken kaydedilir** (abone olunan sayfanın dili): bildirim
  abonenin dilinde gider, `/tr`den abone olan Türkçe alır ve bağlantısı
  `/tr/...`e açılır.
- **Ölü abone budanır:** gönderim 404/410 dönerse kayıt silinir — push
  servislerinin sözleşmesi bu.
- **İzin asla kendiliğinden istenmez** (plandaki karar): tarayıcı izin
  penceresi yalnızca düğmeye basınca açılır. Desteklemeyen tarayıcıda
  (iOS Safari sekmesi dahil) ve açık anahtar tanımlı değilken düğme **hiç
  çizilmez** — bugünkü site aynen durur.
- **Service worker `public/sw.js`**, kök kapsam; `ROOT_ASSETS`e satır.
  `next.config.ts`ten `Cache-Control: no-cache` — eski çalışanın takılı
  kalmaması için. Kayıt `updateViaCache: 'none'` ile.
- **Düğme (`NotifyControl`)** dil değiştiricinin yanında: belge sayfalarında
  `ScreenFrame` üst şeridi, uzayda `SpaceOverlays`teki köşe kümesi — sitenin
  "meta" kontrolleri tek yerde. Söz dağarı sözlükten; **yeri ve sözcükleri
  ekranda 2-3 adayla gösterilip seçilecek** (künye satırı sürecinin aynısı).
- Bildirim metni `src/lib/push-payload.ts`te sözlükten kurulur — ekran metni
  sayılır: noktalı büyük İ yasağı burada da geçerli ve sınamayla tutulur.

### ③ Sahibin kurulum işleri (kod tek başına yetmez)

| İş | Nerede |
|---|---|
| Upstash for Redis ekle (ücretsiz) | Vercel → Marketplace; env değişkenleri kendiliğinden iner |
| VAPID anahtarı üret: `npx web-push generate-vapid-keys` | kendi makinesi; çıktı iki anahtar |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (açık anahtar) | Vercel env + yeniden deploy |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:...`), `KV_REST_API_URL`, `KV_REST_API_TOKEN` | GitHub → Settings → Secrets → Actions |

⚠️ Vercel'deki açık anahtar ile GitHub'daki açık anahtar **aynı çift**
olmalı; ayrışırsa abonelik başka anahtara açılır ve gönderim sessizce düşer.

## Reddedilenler

- **Server Action yerine rota işleyicisi seçildi** — uç açık bir sözleşme:
  dış araçtan sınanabilir, service worker bağlamından çağrılabilir, `[lang]`
  sayfalarına bağlanmaz. Action uçları ise sayfaya gömülü ve adressiz.
- **OneSignal ve benzeri push servisi** — çalışma anında üçüncü tarafa
  istek + çerez; "dışarı istek atmaz" ilkesine aykırı. (Bildirimin kendisi
  tarayıcının push servisinden geçer — o tarayıcının işleyişi, sitenin
  isteği değil.)
- **Gönderimi siteden yapmak** — özel anahtar Vercel'e girerdi; Action'da
  kalması daha dar yüzey. Ayrıca "yeni parfüm" olayı zaten bir git olayı.
- **Neon'a şimdi geçmek** — Faz 2.5'in işi; bugün iki Redis anahtarı yetiyor.
  Aboneler o gün istenirse taşınır (plan bunu baştan söylüyor).
- **`pubDate`i git geçmişinden türetmek** — merge/squash'ta kayar, ilk
  yanlış tarih beslemeyi "güncellenmiş" gösterir. Tarihsiz besleme dürüst.
- **`vibrate`/`badge` süsleri** — bildirim başlık + cümle + dokunuşta doğru
  sayfa; gerisi gürültü.
- **IP bazlı hız sınırı** — bir istek daha demek (sayaç da depoda durur);
  bugünkü koruma: katı doğrulama + gövde sınırı + endpoint başına tek kayıt
  (aynı endpoint üstüne yazar). Kayıt sunucusu kötüye kullanım görürse
  sınır eklenir — bilinçli erteleme.

## Doğrulama

- `npm test` + `npm run lint` + üretim derlemesi yeşil; ekranda büyük İ yok.
- `/feed.xml` geçerli RSS (W3C doğrulayıcısından geçirilir), 52 madde,
  bağlantılar mutlak ve kanonik.
- Yerelde: dev sunucu + geçici VAPID çifti ile abone ol → DevTools'tan push
  simülasyonu → bildirim düşüyor, dokununca doğru sayfa açılıyor.
- Kurulumdan sonra canlıda: abone ol → Action'ı elle tetikle (deneme
  gönderimi girdisi) → bildirim cihaza düşüyor; iPhone'da ana ekrana
  eklenmiş sitede de düştüğü görülür.
- Yeni parfüm provası: `push:announced` doluyken veriye parfüm ekle →
  Action yalnızca onu duyuruyor.
